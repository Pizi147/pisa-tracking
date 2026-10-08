/** PHÉP KIỂM PR-MTGON — chống kẹt Mock Test trước deploy (luật chủ sản phẩm 08/10, kế hoạch 2026-10-09 Task 1–4). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const nguon = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

export async function runPrMtGonTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId } = t;
  const d = await import('../../../shared/domain/index.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const skillSch: any = await import('../fasttrack/skillSchedule.ts');
  const attemptsSvc: any = await import('../fasttrack/attempts.ts');
  const keHoach: any = await import('../keHoach/keHoachTest.ts');
  console.log('\nPR-MTGON · Chống kẹt Mock Test');
  const QL = P.mbManager;
  const LOP = classId('MB FT 101');
  const tuanNay = week.mondayOf(TODAY);
  const tuan = (n: number) => week.ensurePeriod(t.addDays(tuanNay, 7 * n));
  const KN = ['listening', 'reading', 'writing', 'speaking'];
  const bonKyNang = (n: number) => KN.map((skill) => ({ skill, periodId: tuan(n).id }));
  const bonTuan = (n: number) => Object.fromEntries(KN.map((k) => [k, tuan(n).id]));

  let dem = 0;
  /** Em mới ở MB FT 101: MT1 (T+1), MT2 (T+4), MT3 (T+8), chưa điểm, lịch Quản lý chốt. */
  const emMoi = () => {
    const r = intake.commitIntake(P.admin, { classId: LOP, rows: [{ fullName: `PRMTG Em ${++dem}`, target: 6.5, startWeek: tuanNay, email: 'hv@demo.test' }] });
    assert(r.added === 1, `thêm em: ${JSON.stringify(r.failed)}`);
    const sid = r.studentIds[0] as number;
    const ds = conn.prepare(`SELECT a.id FROM assessment_attempts a WHERE a.student_id = ? AND a.status != 'cancelled' ORDER BY a.attempt_no`).all(sid) as any[];
    [1, 4, 8].forEach((w, i) => datTuan(ds[i].id, w));
    return { sid, m1: ds[0].id as number, m2: ds[1].id as number, m3: ds[2].id as number };
  };
  const datTuan = (attemptId: number, w: number) => {
    skillSch.ensureSkillRows(attemptId);
    conn.prepare(`UPDATE assessment_attempts SET planned_period_id = ?, plan_source = 'manual' WHERE id = ?`).run(tuan(w).id, attemptId);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, plan_source = 'manual' WHERE attempt_id = ?`).run(tuan(w).id, attemptId);
  };
  const tuanCua = (attemptId: number) => (conn.prepare(
    `SELECT GROUP_CONCAT(COALESCE(p.week_start, '-'), ',') AS t FROM attempt_skills k LEFT JOIN report_periods p ON p.id = k.planned_period_id
      WHERE k.attempt_id = ? ORDER BY k.skill`).get(attemptId) as any).t as string;
  const kn = (attemptId: number, skill: string) => conn.prepare(
    `SELECT k.*, p.week_start FROM attempt_skills k LEFT JOIN report_periods p ON p.id = k.planned_period_id WHERE k.attempt_id = ? AND k.skill = ?`).get(attemptId, skill) as any;
  const luot = (attemptId: number) => conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  const diem = (attemptId: number, skill: string) => conn.prepare(
    `INSERT INTO assessment_scores (attempt_id, skill, band, raw_score) VALUES (?,?,?,?)`).run(attemptId, skill, 6, 30);
  const band = (attemptId: number, skill: string) => (conn.prepare(
    'SELECT band FROM assessment_scores WHERE attempt_id = ? AND skill = ?').get(attemptId, skill) as any)?.band ?? null;
  const soKqHuy = () => (conn.prepare('SELECT COUNT(*) n FROM ket_qua_huy').get() as any).n as number;
  const loiCua = (fn: () => unknown): any => {
    try { fn(); } catch (e) { return e; }
    assert(false, 'mong có lỗi mà không có');
  };
  const CAU_VUOT = (n: number, w: number) => {
    const tw = d.tuanLich(t.addDays(tuanNay, 7 * w));
    return `MT${n} thi ${tw}. Chọn tuần trước ${tw}, hoặc dời MT${n} trước.`;
  };

  // ---------------------------------------------------------------- Task 1: dời lịch — chỉ dời khi hợp lệ, giữ điểm
  check('MTG-1a · MT2 có điểm, dời sang tuần hợp lệ (trước MT3): hộp một đợt và "Dời cả đợt" đều giữ điểm, đổi tuần', () => {
    const a = emMoi();
    diem(a.m2, 'listening');
    keHoach.luuDot(QL, { attemptId: a.m2, kyNang: bonKyNang(6) });
    assert(tuanCua(a.m2).split(',').every((x) => x === t.addDays(tuanNay, 42)), tuanCua(a.m2));
    assert(band(a.m2, 'listening') === 6, 'mất điểm');
    attemptsSvc.setPlanningWeek(QL, a.m2, tuan(5).id);
    assert(tuanCua(a.m2).split(',').every((x) => x === t.addDays(tuanNay, 35)), `Dời cả đợt phải dời cả kỹ năng có điểm: ${tuanCua(a.m2)}`);
    assert(band(a.m2, 'listening') === 6, 'mất điểm sau Dời cả đợt');
  });

  check('MTG-1b · dời MT2 vượt MT3 (có / không có điểm): mọi cổng 400 "MT3 thi … Chọn tuần trước …", không ket_qua_huy, MT3 giữ nguyên', () => {
    for (const coDiem of [true, false]) {
      const a = emMoi();
      if (coDiem) diem(a.m3, 'reading');
      const truoc = [tuanCua(a.m2), tuanCua(a.m3)].join('|');
      const kq = soKqHuy();
      const cau = CAU_VUOT(3, 8);
      for (const [ten, fn] of [
        ['luuDot', () => keHoach.luuDot(QL, { attemptId: a.m2, kyNang: bonKyNang(9), xacNhanHuyLich: true, reason: 'x' })],
        ['setSkillWeek', () => skillSch.setSkillWeek(QL, a.m2, 'speaking', tuan(9).id, { huyLichVuot: true, reason: 'x' })],
        ['setPlanningWeek', () => attemptsSvc.setPlanningWeek(QL, a.m2, tuan(9).id, 'x', { huyLichVuot: true })],
      ] as const) {
        const e = loiCua(fn);
        assert(e.status === 400 && e.message.includes(cau), `${ten} (${coDiem}): ${e.status} ${e.message}`);
      }
      const h = keHoach.xepHangLoat(QL, { classId: LOP, attemptNo: 2, studentIds: [a.sid], tuan: bonTuan(9), xacNhanHuyLich: true, lyDo: 'x' });
      assert(h.daLuu === 0 && h.dong[0].hanhDong === 'loi' && h.dong[0].loi.includes(cau), JSON.stringify(h.dong[0]));
      assert(!h.dong[0].seHuyLich, 'hàng loạt còn seHuyLich');
      assert(soKqHuy() === kq, 'có ket_qua_huy mới');
      assert([tuanCua(a.m2), tuanCua(a.m3)].join('|') === truoc, 'lịch đã đổi');
      if (coDiem) assert(band(a.m3, 'reading') === 6, 'MT3 mất điểm');
      const k = keHoach.kiemDot(QL, { attemptId: a.m2, kyNang: bonKyNang(9) });
      assert(!('seHuyLich' in k) && k.bai.every((b: any) => b.ghiChu === 'chan' && b.cau === cau), JSON.stringify(k));
    }
  });

  check('MTG-1c · dời trùng tuần MT khác → 400 như cũ', () => {
    const a = emMoi();
    const e = loiCua(() => skillSch.setSkillWeek(QL, a.m2, 'listening', tuan(1).id, {}));
    assert(e.status === 400 && /Trùng tuần/.test(e.message), `${e.status} ${e.message}`);
  });

  check('MTG-1d · web: không còn cờ xacNhanHuyLich / popup huỷ kết quả do dời vượt', () => {
    for (const f of ['web/src/modules/fasttrack/HopThaoTacMt.tsx', 'web/src/modules/fasttrack/MockDetailPage.tsx',
      'web/src/modules/test/keHoach/HopKyNang.tsx', 'web/src/modules/test/keHoach/NganXepLichMt.tsx']) {
      const s = nguon(f);
      assert(!/xacNhanHuyLich|HopXacNhanHuyLich/.test(s), f);
    }
    assert(!fs.existsSync(path.join(ROOT, 'web/src/modules/test/keHoach/HopXacNhanHuyLich.tsx')), 'HopXacNhanHuyLich.tsx còn');
  });

  // ---------------------------------------------------------------- Task 2: Huỷ kỹ năng lúc nào cũng được + Đưa lại
  check('MTG-2a · QL huỷ Speaking của MT đang trong tuần thi → required = 0', () => {
    const a = emMoi();
    datTuan(a.m1, 0);
    attemptsSvc.setSkillSkip(QL, a.m1, 'speaking', true, 'Em ốm');
    assert(kn(a.m1, 'speaking').required === 0, 'chưa huỷ');
  });

  check('MTG-2b · MT cũ: QL huỷ kỹ năng → được', () => {
    const a = emMoi();
    datTuan(a.m1, -6);
    conn.prepare('UPDATE assessment_attempts SET lich_su = 1 WHERE id = ?').run(a.m1);
    attemptsSvc.setSkillSkip(QL, a.m1, 'reading', true, null);
    assert(kn(a.m1, 'reading').required === 0, 'chưa huỷ');
  });

  check('MTG-2c · kỹ năng có điểm: thiếu cờ → 409 "Xoá điểm và huỷ kỹ năng?"; có xoaDiem → xoá điểm (nhật ký giữ) + bỏ khỏi lượt', () => {
    const a = emMoi();
    diem(a.m1, 'listening');
    const e = loiCua(() => attemptsSvc.setSkillSkip(QL, a.m1, 'listening', true, null));
    assert(e.status === 409 && /Kỹ năng đã có điểm — Xoá điểm và huỷ kỹ năng\?/.test(e.message), `${e.status} ${e.message}`);
    assert(band(a.m1, 'listening') === 6 && kn(a.m1, 'listening').required === 1, 'đã đổi khi chưa xác nhận');
    attemptsSvc.setSkillSkip(QL, a.m1, 'listening', true, null, { xoaDiem: true });
    assert(band(a.m1, 'listening') === null && kn(a.m1, 'listening').required === 0, 'chưa xoá / chưa huỷ');
    const au = conn.prepare(`SELECT COUNT(*) n FROM audit_logs WHERE entity_id = ? AND action LIKE 'score.%' AND entity_label = 'listening'`).get(a.m1) as any;
    assert(au.n >= 1, 'thiếu nhật ký xoá điểm');
  });

  check('MTG-2d · kỹ năng "cancelled" (dữ liệu cũ, kể cả MT cũ): menu có "Đưa lại vào đợt"; đưa lại → chờ thi, tuần không hợp lệ thì Chưa xếp', () => {
    const tt = d.trangThaiTT({ batBuoc: true, tuanBatDau: '2026-01-05', coDiem: false, sit: 'cancelled', choDuyet: false, lichSu: true, homNay: TODAY });
    assert(tt === 'da-huy', tt);
    const q = { nhapDiem: true, quanLy: true, gvcn: false, laFt: true, dotHoanTat: false };
    assert(d.thaoTacKyNang('da-huy', q).chinh === 'dua-lai', JSON.stringify(d.thaoTacKyNang('da-huy', q)));
    assert(d.thaoTacKyNang('khong-yeu-cau', q).chinh === 'dua-lai', 'khong-yeu-cau');
    assert(d.CHU_THAO_TAC['dua-lai'] === 'Đưa lại vào đợt' && d.CHU_THAO_TAC['bo-ky-nang'] === 'Huỷ kỹ năng', 'chữ');
    for (const s of ['chua-xep', 'chua-toi-tuan', 'dang-thi', 'co-diem', 'vang', 'lich-su'] as const) {
      assert(d.thaoTacKyNang(s, q).menu.includes('bo-ky-nang'), `thiếu Huỷ kỹ năng ở ${s}`);
      assert(!d.thaoTacKyNang(s, { ...q, quanLy: false }).menu.includes('bo-ky-nang'), `GV có Huỷ kỹ năng ở ${s}`);
    }
    const a = emMoi();
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'cancelled' WHERE attempt_id = ? AND skill IN ('speaking', 'reading')`).run(a.m1);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ? AND skill = 'speaking'`).run(tuan(5).id, a.m1);
    conn.prepare('UPDATE assessment_attempts SET lich_su = 1 WHERE id = ?').run(a.m1);
    conn.prepare(`INSERT INTO skill_move_requests (attempt_id, skill, move_no, from_period_id, to_period_id, requested_on, decide_by, status, created_at)
      VALUES (?, 'speaking', 2, ?, ?, ?, ?, 'pending', ?)`).run(a.m1, tuan(5).id, tuan(6).id, TODAY, t.addDays(TODAY, 6), TODAY);
    attemptsSvc.setSkillSkip(QL, a.m1, 'speaking', false, null);
    assert(!conn.prepare(`SELECT 1 FROM skill_move_requests WHERE attempt_id = ? AND status = 'pending'`).get(a.m1), 'đưa lại phải rút đề nghị dời đang chờ');
    attemptsSvc.setSkillSkip(QL, a.m1, 'reading', false, null);
    const s = kn(a.m1, 'speaking'), r = kn(a.m1, 'reading');
    assert(s.sit_status === 'scheduled' && s.required === 1 && s.planned_period_id === null, `speaking vượt MT2 phải về Chưa xếp: ${JSON.stringify(s)}`);
    assert(r.sit_status === 'scheduled' && r.planned_period_id === tuan(1).id, `reading giữ tuần hợp lệ: ${JSON.stringify(r)}`);
  });

  check('MTG-2e · GV gọi huỷ kỹ năng → 403', () => {
    const a = emMoi();
    const e = loiCua(() => attemptsSvc.setSkillSkip(P.coreTeacher, a.m1, 'speaking', true, null));
    assert(e.status === 403, `${e.status} ${e.message}`);
  });

  // ---------------------------------------------------------------- Task 3: Huỷ MT bất kỳ + xếp lại dùng lại số
  check('MTG-3a · QL huỷ MT2 (có điểm) khi có MT3 → MT2 huỷ, điểm xoá (nhật ký giữ), MT3 giữ nguyên', () => {
    const a = emMoi();
    diem(a.m2, 'listening');
    diem(a.m3, 'reading');
    const t3 = tuanCua(a.m3);
    assert(d.cachHuyLuot({ attempt_no: 2, status: 'planned', coDiem: true, daThi: true },
      [{ attempt_no: 2, status: 'planned', coDiem: true }, { attempt_no: 3, status: 'planned', coDiem: true }]) === 'ca-luot', 'cachHuyLuot');
    attemptsSvc.huyLuot(QL, a.m2, { lyDo: 'Em nghỉ đợt này' });
    assert(luot(a.m2).status === 'cancelled' && band(a.m2, 'listening') === null, JSON.stringify(luot(a.m2)));
    const au = conn.prepare(`SELECT COUNT(*) n FROM audit_logs WHERE entity_id = ? AND action LIKE 'score.%' AND entity_label = 'listening'`).get(a.m2) as any;
    assert(au.n >= 1, 'thiếu nhật ký xoá điểm');
    assert(luot(a.m3).status === 'planned' && tuanCua(a.m3) === t3 && band(a.m3, 'reading') === 6, 'MT3 đổi');
    const e = loiCua(() => attemptsSvc.huyLuot(P.coreTeacher, a.m3, { lyDo: 'x' }));
    assert(e.status === 403, `GV: ${e.status}`);
  });

  check('MTG-3b · xếp lại MT2 → hồi sinh đúng dòng MT2, không mang điểm / ket_qua_huy cũ; tuần phải hợp lệ', () => {
    const a = emMoi();
    diem(a.m2, 'listening');
    attemptsSvc.huyLuot(QL, a.m2, { lyDo: 'Em nghỉ đợt này' });
    conn.prepare(`INSERT INTO ket_qua_huy (attempt_id, vuot_boi_attempt_id, diem_json, lich_json, so_diem, ly_do, huy_boi, huy_luc)
      VALUES (?, ?, '[]', '[]', 1, 'cũ', NULL, '2026-01-01')`).run(a.m2, a.m1);
    const e = loiCua(() => keHoach.xepMoi(QL, { studentId: a.sid, attemptNo: 2, tuan: bonTuan(9) }));
    assert(e.status === 400, `vượt MT3: ${e.status} ${e.message}`);
    const mt = keHoach.xepMoi(QL, { studentId: a.sid, attemptNo: 2, tuan: bonTuan(5) });
    assert(mt.id === a.m2 && mt.status === 'planned', JSON.stringify(mt));
    assert(band(a.m2, 'listening') === null, 'mang điểm cũ');
    const kq = conn.prepare('SELECT COUNT(*) n FROM ket_qua_huy WHERE attempt_id = ? AND khoi_phuc_luc IS NULL').get(a.m2) as any;
    assert(kq.n === 0, 'ket_qua_huy cũ còn');
  });

  check('MTG-3c · "Mở lại lượt" vào tuần vượt MT sau → mở lại ở Chưa xếp', () => {
    const a = emMoi();
    attemptsSvc.huyLuot(QL, a.m2, { lyDo: 'Em nghỉ đợt này' });
    keHoach.luuDot(QL, { attemptId: a.m1, kyNang: bonKyNang(5) });   // MT2 huỷ → MT1 dời qua tuần cũ của MT2 được
    attemptsSvc.reopenAttempt(QL, a.m2);
    assert(luot(a.m2).status === 'planned' && tuanCua(a.m2) === '-,-,-,-', tuanCua(a.m2));
  });

  check('MTG-3d · lượt mọi kỹ năng "cancelled": hàng loạt chọn được; "Đưa lại cả 4 kỹ năng" một lần', () => {
    const a = emMoi();
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'cancelled' WHERE attempt_id = ?`).run(a.m2);
    const h = keHoach.xepHangLoat(QL, { classId: LOP, attemptNo: 2, studentIds: [a.sid], tuan: bonTuan(5), xemTruoc: true });
    assert(h.dong[0].hanhDong === 'doi', JSON.stringify(h.dong[0]));
    attemptsSvc.duaLaiCaLuot(QL, a.m2);
    assert(KN.every((k) => kn(a.m2, k).sit_status === 'scheduled' && kn(a.m2, k).required === 1), tuanCua(a.m2));
    assert(loiCua(() => attemptsSvc.duaLaiCaLuot(P.coreTeacher, a.m2)).status === 403, 'GV');
  });

  check('MTG-3e · web: "Huỷ MT{n}" một câu xác nhận; mọi kỹ năng huỷ → "Đưa lại cả 4 kỹ năng", ẩn "Dời lịch thi cả đợt"', () => {
    const s = nguon('web/src/modules/fasttrack/MockDetailPage.tsx') + nguon('web/src/modules/fasttrack/HopThaoTacMt.tsx');
    assert(/Lịch và điểm của lượt này sẽ bỏ\. Xếp lại thì vẫn là MT/.test(s) && /Không huỷ/.test(s), 'câu xác nhận');
    assert(/Đưa lại cả 4 kỹ năng/.test(s) && /dua-lai-ca-luot/.test(s), 'Đưa lại cả 4 kỹ năng');
    assert(!/Huỷ phần còn lại/.test(s) && !/Huỷ cả lượt/.test(s), 'chữ cũ');
  });

  // ---------------------------------------------------------------- Task 4: xếp đè kể cả MT cũ, kỹ năng đã huỷ
  check('MTG-4a · hàng loạt chọn MT1 là MT cũ → ghi đè tuần kỹ năng chưa điểm; kỹ năng có điểm giữ điểm', () => {
    const a = emMoi();
    datTuan(a.m1, -6);
    conn.prepare('UPDATE assessment_attempts SET lich_su = 1 WHERE id = ?').run(a.m1);
    diem(a.m1, 'listening');
    const h = keHoach.xepHangLoat(QL, { classId: LOP, attemptNo: 1, studentIds: [a.sid], tuan: bonTuan(-5) });
    assert(h.daLuu === 1, JSON.stringify(h.dong[0]));
    assert(kn(a.m1, 'reading').week_start === t.addDays(tuanNay, -35), tuanCua(a.m1));
    assert(band(a.m1, 'listening') === 6, 'mất điểm');
  });

  check('MTG-4b · hàng loạt / hộp với kỹ năng "cancelled" → đưa lại + đặt tuần', () => {
    const a = emMoi();
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'cancelled' WHERE attempt_id = ? AND skill = 'speaking'`).run(a.m2);
    const h = keHoach.xepHangLoat(QL, { classId: LOP, attemptNo: 2, studentIds: [a.sid], tuan: bonTuan(5) });
    assert(h.daLuu === 1, JSON.stringify(h.dong[0]));
    const s = kn(a.m2, 'speaking');
    assert(s.sit_status === 'scheduled' && s.planned_period_id === tuan(5).id, JSON.stringify(s));
    const b = emMoi();
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'cancelled' WHERE attempt_id = ? AND skill = 'speaking'`).run(b.m2);
    keHoach.luuDot(QL, { attemptId: b.m2, kyNang: [{ skill: 'speaking', periodId: tuan(4).id }] });   // cùng tuần cũ vẫn đưa lại
    assert(kn(b.m2, 'speaking').sit_status === 'scheduled' && kn(b.m2, 'speaking').planned_period_id === tuan(4).id, JSON.stringify(kn(b.m2, 'speaking')));
  });

  check('MTG-4c · setSkillWeek thẳng trên kỹ năng "cancelled" → 400 rõ, không đổi tuần', () => {
    const a = emMoi();
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'cancelled' WHERE attempt_id = ? AND skill = 'speaking'`).run(a.m2);
    const e = loiCua(() => skillSch.setSkillWeek(QL, a.m2, 'speaking', tuan(5).id, {}));
    assert(e.status === 400 && /Đưa lại vào đợt/.test(e.message), `${e.status} ${e.message}`);
    assert(kn(a.m2, 'speaking').planned_period_id === tuan(4).id, 'tuần đổi lặng lẽ');
  });
}
