/**
 * PHÉP KIỂM XOA-MT (chủ SP 06/11): MỘT thao tác "Xoá" MT ở Kế hoạch Test và hồ sơ MT (thay "Xóa lịch" + "Bỏ khỏi đợt" cả lượt) —
 * mọi kỹ năng ra khỏi đợt, tuần giữ; Khôi phục / Hoàn tác đưa lại đúng các kỹ năng đã xoá; chặn có điểm / đã làm bài; quyền như sửa lịch Test
 * (QL · Admin · Quản trị, GVCN khi công tắc #1064 bật); khoá cuối tuần N15. Chữ: "Bỏ khỏi đợt" → "Xoá", môn đã xoá → "Khôi phục".
 */
export async function runXoaMtTests(t: any) {
  const { check, assert } = t;
  const dm: any = await import('../../../shared/domain/index.ts');
  console.log('\nXOA-MT — Xoá MT một kiểu, ô "Đã xoá" + Khôi phục');

  check('XM-0 · chữ + bảng thao tác: "Xoá" (một môn, cả MT); môn đã xoá → "Khôi phục" (QL FT), Dời vẫn có; Admin (không skip_skill) mờ', () => {
    assert(dm.CHU_THAO_TAC['bo-ky-nang'] === 'Xoá' && dm.CHU_MUC_HOP['bo-ky-nang'] === 'Xoá' && dm.CHU_THAO_TAC['khoi-phuc-kn'] === 'Khôi phục', 'chữ');
    const ql = { nhapDiem: true, quanLy: true, gvcn: false, laFt: true, dotHoanTat: false };
    const x = dm.thaoTacKyNang('khong-yeu-cau', ql);
    assert(x.chinh === 'khoi-phuc-kn' && x.menu.join() === 'doi-lich', JSON.stringify(x));
    const m = dm.menuHopKyNang('khong-yeu-cau', ql, false);
    assert(m.find((y: any) => y.muc === 'bo-ky-nang').duoc && m.find((y: any) => y.muc === 'doi-tuan').duoc, `QL: ${JSON.stringify(m)}`);
    const ad = dm.menuHopKyNang('khong-yeu-cau', { ...ql, huy: false }, false).find((y: any) => y.muc === 'bo-ky-nang');
    assert(!ad.duoc && ad.viSao === 'Chỉ Quản lý', `Admin: ${JSON.stringify(ad)}`);
    assert(dm.thaoTacKyNang('khong-yeu-cau', { ...ql, laFt: false }).chinh === null, 'lớp thường không có');
  });
  if (!t.conn) return;

  const { conn, P, classId } = t;
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const kh: any = await import('../keHoach/keHoachTest.ts');
  const ss: any = await import('../fasttrack/skillSchedule.ts');
  const perm: any = await import('../permissions.ts');
  const msl: any = await import('../platform/moSuaLichTest.ts');
  const { setConfig, getConfig } = await import('../demoConfig.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  const { emailThu } = await import('../seed/emailThu.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  /* Ngày dựng ca: T3 16/09/2026 (không khoá cuối tuần); T6 18/09 cho N15. Tuần thi W3 OCT (xa khoá). */
  const T3 = '2026-09-15', T6 = '2026-09-18', XA = '2026-10-19', NAY = '2026-09-14';
  const pid = (w: string) => week.ensurePeriod(w).id as number;
  const datNgay = (n: string) => { setConfig('demo_date', n); xoaNho(); };
  const thu = <T>(fn: () => T): T => {
    const cu = getConfig('demo_date');
    conn.exec('BEGIN IMMEDIATE');
    try { datNgay(T3); return fn(); } finally { conn.exec('ROLLBACK'); datNgay(cu); }
  };
  const loi = (fn: () => unknown): { status: number; message: string } | null => {
    try { fn(); return null; } catch (e: any) { return { status: e?.status ?? -1, message: e?.message ?? String(e) }; }
  };
  const MB_FT = classId('MB FT 101');
  const nguoi = (vai: string, cn: string) => perm.loadPrincipal(get(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
      JOIN branches b ON b.id = ur.branch_id WHERE r.key = ? AND b.code = ? ORDER BY ur.user_id LIMIT 1`, vai, cn).id);
  let seq = 0;
  /** Em mới ở MB FT 101 với MT1 bốn kỹ năng tuần `w`. */
  const luot = (w = XA) => {
    const ten = `XOAMT HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: MB_FT, rows: [{ fullName: ten, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `xoamt-${seq}` });
    const sid = get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", sid).id as number;
    boLichTuTao(conn, cy);
    const id = svc.createAttempt(P.admin, { studentId: sid, cycleId: cy, attemptNo: 1, periodId: pid(w) }).id as number;
    ss.ensureSkillRows(id);
    xoaNho();
    return id;
  };
  const kn = (id: number) => Object.fromEntries(all('SELECT skill, required, planned_period_id FROM attempt_skills WHERE attempt_id = ? ORDER BY skill', id)
    .map((r) => [r.skill, `${r.required}:${r.planned_period_id}`]));

  check('XM-1 · QL Xoá → mọi kỹ năng required = 0, TUẦN GIỮ, nhật ký skill_skipped; xoá lần 2 → 400; Khôi phục → về đúng tuần cũ', () => thu(() => {
    const a = luot();
    const truoc = kn(a);
    const r = svc.xoaLuot(P.mbManager, a);
    assert(r.kyNang.length === 4, JSON.stringify(r));
    const sau = kn(a);
    assert(Object.entries(truoc).every(([k, v]) => sau[k] === `0:${String(v).split(':')[1]}`), `sau xoá: ${JSON.stringify(sau)}`);
    assert(get(`SELECT COUNT(*) n FROM attempt_schedule_history WHERE attempt_id = ? AND action = 'skill_skipped'`, a).n === 4, 'nhật ký 4 dòng');
    assert(loi(() => svc.xoaLuot(P.mbManager, a))?.status === 400, 'xoá lần 2 → 400');
    svc.duaLaiCaLuot(P.mbManager, a);
    assert(JSON.stringify(kn(a)) === JSON.stringify(truoc), `khôi phục: ${JSON.stringify(kn(a))} ≠ ${JSON.stringify(truoc)}`);
  }));

  check('XM-2 · Hoàn tác (`kyNang`) chỉ đưa lại các kỹ năng vừa xoá — S đã xoá từ trước vẫn xoá', () => thu(() => {
    const a = luot();
    svc.setSkillSkip(P.mbManager, a, 'speaking', true, null);
    const r = svc.xoaLuot(P.mbManager, a);
    assert(!r.kyNang.includes('speaking') && r.kyNang.length === 3, JSON.stringify(r));
    svc.duaLaiCaLuot(P.mbManager, a, r.kyNang);
    const k = kn(a);
    assert(k.speaking.startsWith('0:') && ['listening', 'reading', 'writing'].every((s) => k[s].startsWith('1:')), JSON.stringify(k));
  }));

  check('XM-6 · RA-LOI-0711c: Khôi phục (nút ô / hồ sơ, không `kyNang`) cũng chỉ đưa lại môn vừa Xoá MT; môn huỷ vắng 2 lần trước khi xoá GIỮ huỷ (Hoàn tác lẫn Khôi phục)', () => thu(() => {
    const huy = (id: number) => conn.prepare(`UPDATE attempt_skills SET sit_status = 'cancelled', huy_vang = 1 WHERE attempt_id = ? AND skill = 'listening'`).run(id);
    const l = (id: number) => get(`SELECT required, sit_status, huy_vang FROM attempt_skills WHERE attempt_id = ? AND skill = 'listening'`, id);
    for (const hoanTac of [true, false]) {
      const a = luot();
      svc.setSkillSkip(P.mbManager, a, 'speaking', true, null);
      huy(a);
      const r = svc.xoaLuot(P.mbManager, a);
      svc.duaLaiCaLuot(P.mbManager, a, hoanTac ? r.kyNang : null);
      const k = kn(a), x = l(a);
      assert(k.speaking.startsWith('0:'), `${hoanTac ? 'Hoàn tác' : 'Khôi phục'}: S xoá riêng từ trước phải giữ xoá: ${JSON.stringify(k)}`);
      assert(x.required === 1 && x.sit_status === 'cancelled' && x.huy_vang === 1, `${hoanTac ? 'Hoàn tác' : 'Khôi phục'}: L huỷ vắng 2 lần phải giữ huỷ: ${JSON.stringify(x)}`);
      assert(['reading', 'writing'].every((s) => k[s].startsWith('1:')), JSON.stringify(k));
    }
  }));

  /* XEP-MT-NHAC (chủ SP 07/11, đảo phần nhắc của #1158): MT QL chủ động xoá = đã xử lý — vẫn tính "MT đã có", không làm tăng "Chưa đủ MT". */
  check('XM-7 · chủ SP 07/11 (XEP-MT-NHAC): Xoá MT / Khôi phục / huỷ vắng hết KHÔNG đổi "Chưa đủ MT" (chip + cờ hàng lưới) — xoá rồi thì thôi', () => thu(() => {
    const chua = () => { xoaNho(); return kh.danhSachLop(P.mbManager, {}).lop.find((l: any) => l.id === MB_FT).chuaCoLichTiep as number; };
    const a = luot();
    const sid = get('SELECT student_id FROM assessment_attempts WHERE id = ?', a).student_id;
    const thieu = () => { xoaNho(); return kh.luoiFT(P.mbManager, MB_FT).hang.find((h: any) => h.studentId === sid).thieuMt as boolean; };
    const goc = chua(), gocHang = thieu();
    svc.xoaLuot(P.mbManager, a);
    assert(chua() === goc && thieu() === gocHang, `xoá: ${chua()} ≠ ${goc} / hàng ${thieu()}`);
    svc.duaLaiCaLuot(P.mbManager, a);
    assert(chua() === goc && thieu() === gocHang, `khôi phục: ${chua()} ≠ ${goc}`);
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'cancelled', huy_vang = 1 WHERE attempt_id = ?`).run(a);
    assert(chua() === goc && thieu() === gocHang, `huỷ vắng hết: ${chua()} ≠ ${goc}`);
  }));

  check('XM-3 · chặn như "Xóa lịch" cũ: có điểm → 400; đã làm bài → 400; không đổi gì. Lớp thường / lượt không phải MT → 400', () => thu(() => {
    const a = luot();
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'sat' WHERE attempt_id = ? AND skill = 'listening'`).run(a);
    xoaNho();
    const e1 = loi(() => svc.xoaLuot(P.mbManager, a));
    assert(e1?.status === 400 && /đã làm bài/.test(e1.message) && kn(a).listening.startsWith('1:'), JSON.stringify(e1));
    const b = luot();
    conn.prepare(`UPDATE assessment_scores SET band = 6.5 WHERE attempt_id = ? AND skill = 'reading'`).run(b);
    if (!get(`SELECT 1 FROM assessment_scores WHERE attempt_id = ? AND band IS NOT NULL`, b)) {
      conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band) VALUES (?, 'reading', 6.5)`).run(b);
    }
    xoaNho();
    const e2 = loi(() => svc.xoaLuot(P.mbManager, b));
    assert(e2?.status === 400 && /đã có điểm/.test(e2.message) && Object.values(kn(b)).every((v) => String(v).startsWith('1:')), JSON.stringify(e2));
    const thuong = get(`SELECT a.id FROM assessment_attempts a WHERE a.kind != 'mock' AND a.status != 'cancelled' LIMIT 1`)?.id;
    if (thuong) assert(loi(() => svc.xoaLuot(P.admin, thuong))?.status === 400, 'bài lớp thường → 400');
  }));

  check('XM-4 · quyền = sửa lịch Test: Admin MB xoá + khôi phục được; GV bộ môn 403; GVCN 403 khi tắt, được khi công tắc BẬT; QL chi nhánh khác 403', () => thu(() => {
    const a = luot();
    const ad = nguoi('office_admin', 'MB');
    svc.xoaLuot(ad, a);
    svc.duaLaiCaLuot(ad, a);
    assert(kn(a).listening.startsWith('1:'), 'Admin khôi phục');
    assert(loi(() => svc.xoaLuot(P.subjectTeacher, a))?.status === 403, 'GV bộ môn 403');
    assert(loi(() => svc.xoaLuot(P.cpManager, a))?.status === 403, 'QL CP 403');
    assert(loi(() => svc.xoaLuot(P.coreTeacher, a))?.status === 403, 'GVCN 403 khi tắt');
    msl.datMoSua(P.admin, true);
    svc.xoaLuot(P.coreTeacher, a);
    svc.duaLaiCaLuot(P.coreTeacher, a);
    assert(kn(a).listening.startsWith('1:'), 'GVCN khi bật');
  }));

  check('XM-5 · N15: T6 → CN, MT tuần này → QL bị khoá (không đổi gì); Quản trị hệ thống được', () => thu(() => {
    const a = luot(NAY);
    datNgay(T6);
    const e = loi(() => svc.xoaLuot(P.mbManager, a));
    assert(e?.status === 400 && kn(a).listening.startsWith('1:'), `QL T6: ${JSON.stringify(e)}`);
    svc.xoaLuot(P.admin, a);
    assert(kn(a).listening.startsWith('0:'), 'Quản trị được');
  }));
}
