/** PHÉP KIỂM PR-LM — lịch MT linh hoạt: dời vượt lượt sau thì huỷ lịch lượt bị vượt (chủ sản phẩm 03/10, Q-0310-1/2). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const nguon = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

export async function runPrLmTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-LM · Lịch MT linh hoạt');
  const L = (attemptNo: number, tuanDau: string | null, o: Partial<{ coDiem: boolean; daThi: boolean; huy: boolean }> = {}) =>
    ({ attemptId: 100 + attemptNo, attemptNo, kind: 'mock', tuanDau, coDiem: false, daThi: false, huy: false, ...o });

  check('PR-LM (1) · luotBiVuot: MT1 sang sau MT2 → vượt MT2; sau cả MT3 → vượt MT2+MT3; trùng tuần cũng là vượt (D1)', () => {
    const ds = [L(2, '2026-07-13'), L(3, '2026-08-10')];
    const a = d.luotBiVuot(ds, { attemptNo: 1, tuanCuoiMoi: '2026-07-20' });
    assert(a.biVuot.map((x) => x.attemptNo).join() === '2', JSON.stringify(a));
    const b = d.luotBiVuot(ds, { attemptNo: 1, tuanCuoiMoi: '2026-08-17' });
    assert(b.biVuot.map((x) => x.attemptNo).join() === '2,3', JSON.stringify(b));
    const c = d.luotBiVuot(ds, { attemptNo: 1, tuanCuoiMoi: '2026-07-13' });
    assert(c.biVuot.map((x) => x.attemptNo).join() === '2', `trùng tuần: ${JSON.stringify(c)}`);
    const e = d.luotBiVuot(ds, { attemptNo: 1, tuanCuoiMoi: '2026-07-06' });
    assert(e.biVuot.length === 0, `không vượt: ${JSON.stringify(e)}`);
  });

  check('PR-LM (1) · luotBiVuot: bỏ qua lượt trước, lượt đã huỷ, lượt chưa xếp tuần', () => {
    const ds = [L(1, '2026-06-01'), L(3, '2026-07-13', { huy: true }), L(4, null)];
    const a = d.luotBiVuot(ds, { attemptNo: 2, tuanCuoiMoi: '2026-09-07' });
    assert(a.biVuot.length === 0, JSON.stringify(a));
  });

  // PR-MTa T2 thay Q-0310-2: lượt bị vượt đã có điểm / đã thi KHÔNG còn chặn — vẫn là "bị vượt" (huỷ kết quả, khôi phục được).
  check('PR-LM (1) · luotBiVuot: lượt bị vượt đã có điểm hoặc đã thi vẫn bị vượt, không còn `chan` (PR-MTa T2)', () => {
    const a = d.luotBiVuot([L(2, '2026-07-13', { coDiem: true }), L(3, '2026-08-10')], { attemptNo: 1, tuanCuoiMoi: '2026-08-17' });
    assert(!('chan' in a) && a.biVuot.map((x) => x.attemptNo).join() === '2,3', JSON.stringify(a));
    const b = d.luotBiVuot([L(2, '2026-07-13', { daThi: true })], { attemptNo: 1, tuanCuoiMoi: '2026-08-17' });
    assert(b.biVuot.length === 1, JSON.stringify(b));
  });

  check('PR-LM (2) · panel Lộ trình không còn ô Dự kiến thi (OV-11d: chỉ ở Sửa thông tin), không còn WeekPicker tuần thi / examPeriodId', () => {
    const s = nguon('web/src/modules/students/StudentPlanPanel.tsx');
    assert(!/Dự kiến thi/.test(s) && /nhan="Dự kiến thi"/.test(nguon('web/src/modules/students/StudentManagePanel.tsx')), 'Dự kiến thi chỉ ở Sửa thông tin');
    assert(!/examPeriodId/.test(s) && !/hienTuanThi/.test(s), 'bỏ examPeriodId và hienTuanThi');
  });

  // PR-MTGON bỏ PR-LM (3) cauSeHuyLich: dời vượt bị chặn, không còn câu "Lưu sẽ huỷ lịch …".

  check('PR-LM (3) · hộp xếp lịch rộng hơn, một thanh chọn tuần (popover lịch), tuần tối thiểu; PR-MTGON: không còn xác nhận huỷ lịch', () => {
    const hop = nguon('web/src/modules/test/keHoach/HopKyNang.tsx');
    const tn = nguon('web/src/modules/test/keHoach/TuanNho.tsx');
    const wp = nguon('web/src/ui/Filters.tsx');
    assert(!/w-\[372px\]/.test(hop) && /min\(520px/.test(hop), 'hộp còn w-[372px]');
    /* Rà #212 (T4/T20) thay "tuần tối thiểu": hộp chỉ Quản lý / Quản trị mở — chọn được cả tuần đã qua. */
    assert(!/<TuanNho[^>]*toiThieu=/.test(hop), 'TuanNho trong HopKyNang còn chặn tuần đã qua');
    assert(!/<WeekPicker/.test(tn) && /<LichNho/.test(tn), 'TuanNho còn render WeekPicker thứ hai');
    assert(/toiThieu\?: string/.test(wp), 'WeekPicker thiếu toiThieu');
    assert(!/seHuyLich|xacNhanHuyLich|HopXacNhanHuyLich/.test(hop), 'còn xác nhận huỷ lịch (PR-MTGON bỏ)');
  });

  /* PR-HOP1: WeekModal bỏ — "Dời lịch thi cả đợt" mở hộp một đợt `HopKyNang` (kiểm trước `/dot/kiem`, lưu `/dot`). */
  check('PR-LM (4) · Dời lịch thi cả đợt: mở HopKyNang (kiểm trước /dot/kiem), không còn WeekModal', () => {
    const s = nguon('web/src/modules/fasttrack/MockDetailPage.tsx');
    assert(!/WeekModal/.test(s) && /<HopKyNang\b/.test(s), 'Hồ sơ MT còn WeekModal / chưa mở HopKyNang');
    assert(/\/ke-hoach-test\/dot\/kiem/.test(nguon('web/src/modules/test/keHoach/HopKyNang.tsx')), 'HopKyNang thiếu kiểm trước');
  });

  check('PR-LM (6) · chuDoiVang: thi bù đúng tuần đang xem → "Thi bù tuần này (lần 1)"; tuần khác → mã tuần, không ngày; chữ mẫu nhận xét "Ví dụ:"', () => {
    const a = d.chuDoiVang({ weekStart: '2026-09-28', doiTu: 'W3 SEP', absenceMoveCount: 1 }, '2026-10-01');
    assert(a.chu === 'Thi bù tuần này (lần 1)' && /Dời từ W3 SEP sang W1 OCT/.test(a.title), JSON.stringify(a));
    const b = d.chuDoiVang({ weekStart: '2026-09-21', doiTu: 'W2 SEP', absenceMoveCount: 2 }, '2026-10-01');
    assert(b.chu === 'vắng · dời sang W4 SEP · lần 2', JSON.stringify(b));
    const nx = nguon('web/src/modules/fasttrack/NhanXet.tsx');
    assert(!/"Không bắt buộc"/.test(nx) && /placeholder=\{viDuNhanXet\(kyNang\)\}/.test(nx) && /t\('Ví dụ:/.test(nx), 'chữ mẫu nhận xét (OV-14b: theo kỹ năng)');
    assert(/chuDoiVang\(/.test(nguon('web/src/modules/fasttrack/ODiemLon.tsx')), 'ODiemLon chưa dùng chuDoiVang');
  });

  check('PR-LM (7) · hồ sơ MT + HopThaoTacMt: Modal → KhungPanel (chỉ còn ConfirmDialog), chân luật S3, không nút "Huỷ" trần', () => {
    const md = nguon('web/src/modules/fasttrack/MockDetailPage.tsx');
    const tt = nguon('web/src/modules/fasttrack/HopThaoTacMt.tsx');
    /* PR-HOP1: hộp Huỷ MT{n} (ConfirmDialog) tách ra `HopHuyMt.tsx` để ⋯ đầu `HopKyNang` dùng chung. */
    assert(/import \{ ConfirmDialog \} from '..\/..\/ui\/Drawer.tsx'/.test(nguon('web/src/modules/fasttrack/HopHuyMt.tsx')) && !/<Modal\b/.test(md), 'MockDetailPage còn Modal');
    assert(!/from '..\/..\/ui\/Drawer.tsx'/.test(tt) && !/<Modal\b/.test(tt), 'HopThaoTacMt còn Modal');
    /* PR-HOP1: WeekModal (một KhungPanel) bỏ → còn 3: hạn chấm, vắng, trả lời đề nghị. */
    assert((md.match(/<KhungPanel\b/g) ?? []).length >= 3 && /<KhungPanel\b/.test(tt), 'thiếu KhungPanel');
    for (const [ten, src] of [['MockDetailPage', md], ['HopThaoTacMt', tt]]) {
      assert(!/>Huỷ</.test(src), `${ten}: nút "Huỷ" trần`);
      assert(/\bdaSua: daSua\b/.test(src), `${ten}: chân S3 Đóng / Huỷ thay đổi (chan.daSua, PR-SL I1)`);
    }
  });
}

/** Máy chủ: kiểm trước / lưu đợt / dời cả đợt / dời một kỹ năng / Huỷ lịch (bỏ tuần, giữ lượt) — Q-0310-1/2, D1–D4. */
export async function runPrLmMayChu(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P, TODAY, classId } = t;
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const skillSch: any = await import('../fasttrack/skillSchedule.ts');
  const attemptsSvc: any = await import('../fasttrack/attempts.ts');
  const keHoach: any = await import('../keHoach/keHoachTest.ts');
  const standing: any = await import('../students/standing.ts');
  const QL = P.mbManager;
  const LOP = classId('MB FT 101');
  const tuanNay = week.mondayOf(TODAY);
  const tuan = (n: number) => week.ensurePeriod(t.addDays(tuanNay, 7 * n));
  const KN = ['listening', 'reading', 'writing', 'speaking'];
  const bonKyNang = (n: number) => KN.map((skill) => ({ skill, periodId: tuan(n).id }));

  let dem = 0;
  /** Em mới ở MB FT 101 có MT1 (T+1), MT2 (T+4), MT3 (T+8), chưa điểm, lịch do Quản lý chốt. */
  const emMoi = () => {
    const r = intake.commitIntake(P.admin, { classId: LOP, rows: [{ fullName: `PRLM Em ${++dem}`, target: 6.5, startWeek: tuanNay, email: emailThu(), dob: '2010-01-01' }] });
    assert(r.added === 1, `thêm em: ${JSON.stringify(r.failed)}`);
    const sid = r.studentIds[0] as number;
    const ds = conn.prepare(`SELECT a.id FROM assessment_attempts a WHERE a.student_id = ? AND a.status != 'cancelled' ORDER BY a.attempt_no`).all(sid) as any[];
    [1, 4, 8].forEach((w, i) => {
      skillSch.ensureSkillRows(ds[i].id);
      conn.prepare(`UPDATE assessment_attempts SET planned_period_id = ?, plan_source = 'manual' WHERE id = ?`).run(tuan(w).id, ds[i].id);
      conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, plan_source = 'manual' WHERE attempt_id = ?`).run(tuan(w).id, ds[i].id);
    });
    return { sid, m1: ds[0].id as number, m2: ds[1].id as number, m3: ds[2].id as number };
  };
  const tuanCua = (attemptId: number) => (conn.prepare(
    `SELECT GROUP_CONCAT(COALESCE(p.week_start, '-'), ',') AS t FROM attempt_skills k LEFT JOIN report_periods p ON p.id = k.planned_period_id
      WHERE k.attempt_id = ? ORDER BY k.skill`).get(attemptId) as any).t as string;
  const luot = (attemptId: number) => conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  const diem = (attemptId: number, skill: string) => conn.prepare(
    `INSERT INTO assessment_scores (attempt_id, skill, band, raw_score) VALUES (?,?,?,?)`).run(attemptId, skill, 6, 30);
  /** Bắt lỗi HTTP: trả lỗi đã ném (status, message, details) — không ném thì phép kiểm đỏ. */
  const loiCua = (fn: () => unknown): any => {
    try { fn(); } catch (e) { return e; }
    assert(false, 'mong có lỗi mà không có');
  };

  /* PR-MTGON (luật 1, 08/10) thay PR-LM 2.1–2.6b: dời vượt lượt sau bị CHẶN ở mọi cổng, không bỏ lịch / huỷ kết quả lượt bị vượt
   * (MTG-1a, MTG-1b trong prMtGon.tests.ts). Một phép đại diện ở đây. */
  check('PR-LM (2.1) · dời cả 4 kỹ năng MT1 sang T+5 (vượt MT2 ở T+4) → kiểm trước chặn, lưu 400, MT2 giữ lịch', () => {
    const a = emMoi();
    const k = keHoach.kiemDot(QL, { attemptId: a.m1, kyNang: bonKyNang(5) });
    assert(k.bai.every((b: any) => b.ghiChu === 'chan' && /^MT2 thi /.test(b.cau)) && !('seHuyLich' in k), JSON.stringify(k));
    const t2 = tuanCua(a.m2);
    const e = loiCua(() => keHoach.luuDot(QL, { attemptId: a.m1, kyNang: bonKyNang(5) }));
    assert(e.status === 400 && /Chọn tuần trước/.test(e.message) && tuanCua(a.m2) === t2, `${e.status} ${e.message}`);
  });

  check('PR-LM (2.7) · D2: dời MT2 về trước MT1 vẫn 400 như cũ', () => {
    const b = emMoi();
    assertThrows(() => skillSch.setSkillWeek(QL, b.m2, 'listening', tuan(0).id, {}),
      /Phần thi của lượt sau không được xếp trước phần cuối của lượt trước/, 'D2');
  });

  // PR-MTa T7 thay "D3 luôn cần lý do"; T1 thay "sau ngày vào web → 400": MT cũ đổi tuần không lý do, không xét ngày vào web.
  check('PR-LM (2.8) · D3: MT cũ có điểm đổi sang tuần đã qua khác → được, điểm giữ; về tuần trước → thành MT thường (PR-MTa)', () => {
    const b = emMoi();
    for (const id of [b.m1, b.m2, b.m3]) conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled' WHERE id = ?`).run(id);
    conn.prepare('UPDATE students SET created_at = ? WHERE id = ?').run(`${t.addDays(tuanNay, -14)}T08:00:00.000Z`, b.sid);
    const tuanQua = (n: number) => ({ listening: tuan(n).id, reading: tuan(n).id, writing: tuan(n).id, speaking: tuan(n).id });
    const mt = keHoach.xepMoi(QL, { studentId: b.sid, tuan: tuanQua(-6) });
    assert(luot(mt.id).lich_su === 1, 'chưa là MT lịch sử');
    diem(mt.id, 'listening');
    skillSch.setSkillWeek(QL, mt.id, 'listening', tuan(-7).id, {});
    const l = conn.prepare(`SELECT p.week_start AS w FROM attempt_skills k JOIN report_periods p ON p.id = k.planned_period_id WHERE k.attempt_id = ? AND k.skill = 'listening'`).get(mt.id) as any;
    assert(l.w === t.addDays(tuanNay, -49), JSON.stringify(l));
    const s = conn.prepare(`SELECT band FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`).get(mt.id) as any;
    assert(s?.band === 6, 'mất điểm');
    assert(luot(mt.id).lich_su === 1, 'cờ MT cũ phải giữ');
    for (const k of ['listening', 'reading', 'writing', 'speaking']) skillSch.setSkillWeek(QL, mt.id, k, tuan(-1).id, {});
    assert(luot(mt.id).lich_su === 0, 'về tuần trước → MT thường (tính lại lúc dời)');
  });

  // PR-MTa T4 thay K2-33 / D4: Quản lý dời MT chưa thi vào tuần đã qua được; GV/GVCN không có đường dời MT (PLAN_WEEK).
  check('PR-LM (2.9) · D4: MT đang chạy, Quản lý dời vào tuần đã qua → được (PR-MTa T4); GVCN → 403', () => {
    const b = emMoi();
    skillSch.setSkillWeek(QL, b.m1, 'listening', tuan(-1).id, {});
    assert(luot(b.m1).lich_su === 0, 'tuần cuối vẫn là T+1 → MT thường');
    assert(loiCua(() => skillSch.setSkillWeek(P.coreTeacher, b.m1, 'reading', tuan(-1).id, {})).status === 403, 'GVCN');
  });

  // PR-MTa T7 thay "lý do ngắn → 400": Huỷ lịch — lý do tuỳ chọn.
  check('PR-LM (2.10) · Huỷ lịch (bo-tuan): chưa điểm → bỏ tuần (lý do tuỳ chọn); có điểm → 400; GV → 403', () => {
    const b = emMoi();
    const e403 = loiCua(() => skillSch.boTuanLuot(P.coreTeacher, b.m2, { lyDo: 'Em xin lùi lịch' }));
    assert(e403.status === 403, `${e403.status} ${e403.message}`);
    const r = skillSch.boTuanLuot(QL, b.m2, { lyDo: 'ab' });
    assert(r.daBo.length === 4 && luot(b.m2).planned_period_id === null, JSON.stringify(r));
    diem(b.m3, 'reading');
    const eDiem = loiCua(() => skillSch.boTuanLuot(QL, b.m3, { lyDo: 'Em xin lùi lịch' }));
    assert(eDiem.status === 400 && /MT3 đã có điểm/.test(eDiem.message), eDiem.message);
    const src = nguon('server/src/routes/index.ts');
    assert(/api\.post\('\/attempts\/:id\/bo-tuan'/.test(src) && !/xacNhanHuyLich/.test(src), 'route bo-tuan; không còn xacNhanHuyLich (PR-MTGON)');
  });

  check('PR-LM (2.11) · MT2 đã bỏ tuần: "Sắp tới" không lấy MT2, lưới Kế hoạch Test hiện MT2 "chua-xep", không lỗi', () => {
    const b = emMoi();
    skillSch.boTuanLuot(QL, b.m2, { lyDo: 'Em xin lùi lịch' });
    const st = standing.standingFor([b.sid]).get(b.sid);
    assert(st && st.nextAttemptNo !== 2, JSON.stringify(st && { n: st.nextAttemptNo, w: st.nextWeekStart }));
    const h = keHoach.luoiFT(QL, LOP, TODAY).hang.find((x: any) => x.studentId === b.sid);
    assert(h?.dot[2]?.kn?.listening?.trangThai === 'chua-xep', JSON.stringify(h?.dot[2]));
  });

  check('PR-LM (5) · bảng lịch MT của panel: trạng thái co-diem / da-xep / chua-xep, 4 kỹ năng mỗi lượt, kỳ vọng theo lượt, số MT kế tiếp', () => {
    const b = emMoi();
    diem(b.m1, 'listening');
    skillSch.boTuanLuot(QL, b.m3, { lyDo: 'Em xin lùi lịch' });
    const cy = luot(b.m1).cycle_id;
    const r = keHoach.lichMtLoTrinh(cy, TODAY);
    const tt = r.hang.map((h: any) => h.luot?.trangThai).join(',');
    assert(tt === 'co-diem,da-xep,chua-xep', tt);
    assert(r.hang.every((h: any) => h.luot.kyNang.length === 4 && Object.keys(h.luot.kn).length === 4), 'thiếu kỹ năng');
    assert(r.hang[0].luot.kyVong === 5.5 && r.hang[1].luot.kyVong === 6 && r.hang[2].luot.kyVong === 6.5, r.hang.map((h: any) => h.luot.kyVong).join());
    assert(r.soKeTiep === 4 && r.studentId === b.sid && r.classId === LOP, JSON.stringify({ k: r.soKeTiep, c: r.classId }));
    const hl = nguon('web/src/modules/students/HangLichMt.tsx');
    const pn = nguon('web/src/modules/students/StudentPlanPanel.tsx');
    assert(/Dời lịch/.test(hl) && /t\('Xóa'\)/.test(hl) &&   // OV-15c: "Huỷ lịch" → "Xóa"
       /Nhập điểm/.test(hl) && /Xếp lịch/.test(hl), 'HangLichMt thiếu thao tác');
    assert(/Thêm MT/.test(pn) && /<HangLichMt/.test(pn), 'panel thiếu "+ Thêm MT" / HangLichMt');
  });
}

