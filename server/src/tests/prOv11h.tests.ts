/**
 * PHÉP KIỂM PR-OV11h — Phân tích · PET / KET: Checkpoint có mặt ở mọi nơi, một tên một số (kế hoạch 2026-10-14-pr-ov11h, phụ lục rà soát
 * phan-tich.md PT-*, ho-so-hv.md HV-5). Gọi ở khối 0 run.ts (so số bộ demo: MB PET 01 có 2 em đã chấm Checkpoint 1); MỌI phép kiểm chạy trong `thu` (cuộn lại).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv11hTests(t: YThucTestKit) {
  const { check, assert, conn, P } = t;
  const ptLop: any = await import('../classes/phanTichLop.ts');
  const tongHop: any = await import('../phanTich/tongHop.ts');
  const xuatMt: any = await import('../phanTich/xuatMt.ts');
  const ptGv: any = await import('../phanTich/giaoVien.ts');
  const phamVi: any = await import('../giaoVien/phamVi.ts');
  const cases: any = await import('../cases/cases.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-OV11h · Phân tích · PET / KET');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } catch (e) {
      if (e instanceof TypeError) e.message += ` @ ${String(e.stack).split('\n').slice(1, 4).map((x) => x.trim()).join(' | ')}`;
      throw e;
    } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const vai = (key: string) => loadPrincipal(one(`SELECT ur.user_id id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = ? AND ur.status = 'active' ORDER BY ur.user_id LIMIT 1`, key).id);
  const loiCua = (fn: () => unknown): string => { try { fn(); } catch (e: any) { return String(e?.message ?? e); } return ''; };
  const pet = one(`SELECT id, branch_id FROM classes WHERE code = 'MB PET 01'`);
  const cp = all(`SELECT a.* FROM assessment_attempts a WHERE a.class_id = ? AND a.kind = 'checkpoint' AND a.status != 'cancelled'
                   AND EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.raw_score IS NOT NULL) ORDER BY a.id`, pet?.id ?? 0);

  check('OV11h-1 · lớp PET: Phân tích lớp cột "Checkpoint 1" (2 bài), hồ sơ GV + Phân tích GV có kết quả L (P13: 4 môn), xuất từng lượt có lượt, Tổng hợp không xếp dưới Progress', () => thu(() => {
    assert(pet && cp.length === 2, `demo phải có MB PET 01 với 2 bài Checkpoint đã chấm (có ${cp.length})`);
    const prog = d.CHUONG_TRINH_LIEN_TUC_CO_SAN.find((x: any) => x.code === 'PET');
    const ev = ptLop.danhGiaMon(cp[0], conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ?').all(cp[0].id), { ...prog, scoringMode: 'ratio', checkpoints: [] });
    assert(ev && ev.mon.length === 4, `danhGiaMon checkpoint phải chấm 4 môn (P13): ${JSON.stringify(ev)}`);

    const lop = ptLop.phanTichLop(P.mbManager, pet.id);
    /* Cột theo số Checkpoint đã có (Checkpoint 2 vừa tự sinh khi Checkpoint 1 đủ điểm) — không Progress / Final. */
    assert(lop.cot[0]?.key === 'checkpoint:1' && lop.cot[0].nhan === 'Checkpoint 1' && lop.cot.every((c: any) => /^checkpoint:\d+$/.test(c.key)), `cột: ${JSON.stringify(lop.cot)}`);
    assert(['listening', 'reading', 'writing', 'speaking'].every((k) => lop.o[`${k}|checkpoint:1`]?.tong === 2), JSON.stringify(lop.o));
    assert(lop.dong.every((x: any) => !/_/.test(x.nhan)), `nhãn dòng: ${lop.dong.map((x: any) => x.nhan)}`);

    const gvId = one(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND skill = 'listening' AND status = 'active' LIMIT 1`, pet.id)?.user_id;
    assert(gvId, 'lớp PET phải có GV môn L');
    const tuan = one(`SELECT rp.week_start FROM report_periods rp WHERE rp.id = ?`, cp[0].planned_period_id).week_start;
    /* UI-HO-SO-GV: hồ sơ GV theo kỳ — hàng lớp PET ở bảng Học thuật (thay "Kết quả gần nhất"). */
    const kq = ptGv.chiSoHoSoGv(P.mbManager, gvId, { tu: d.mondayOfDate(d.addDaysIso(tuan, -14)), den: d.mondayOfDate(d.addDaysIso(tuan, 14)) }).hocThuatTheoLop.find((x: any) => x.classId === pet.id);
    assert(kq?.ketQua.k === 'so' && kq.theoBai.some((b: any) => b.bai === 'Checkpoint 1'), `hồ sơ GV Học thuật: ${JSON.stringify(kq)}`);
    const gv = ptGv.phanTichGiaoVien(P.mbManager, { ct: 'thuong', cn: pet.branch_id, tu: d.mondayOfDate(d.addDaysIso(tuan, -14)), den: d.mondayOfDate(d.addDaysIso(tuan, 14)) })
      .hang.find((h: any) => h.id === gvId);
    assert(gv?.ketQua?.listening?.k === 'so', `Phân tích GV cột L: ${JSON.stringify(gv?.ketQua)}`);

    const x = xuatMt.xemTruoc(P.mbManager, { khung: 'thuong', chiNhanh: [], lop: [pet.id], thoiGian: { kieu: 'tuan', tu: '2026-01-05', den: '2026-12-28' }, chiDuDiem: false, cot: 'gon' });
    assert(x.dem.luot >= 2 && x.dauDong.some((s: string) => /Checkpoint 1/.test(s)), `xuất từng lượt lớp PET: ${JSON.stringify(x.dem)} ${x.dauDong}`);

    const th = tongHop.tongHop(P.mbManager, { ct: 'thuong', soTuan: 26, classId: pet.id, theo: 'lop' });
    const h = th.hang[0];
    assert(h && h.o['luot'] === 2, `Tổng hợp lớp PET: ${JSON.stringify(h?.o)}`);
    assert(['gk-dat', 'gk-1', 'gk-2'].every((k) => !h.o[k]), `PET còn xếp dưới Progress Test: ${JSON.stringify(h.o)}`);
    assert(['cp-dat', 'cp-1', 'cp-2', 'chuaDu'].reduce((s, k) => s + (h.o[k] ?? 0), 0) === 2, `Σ Checkpoint + Thiếu điểm ≠ Bài: ${JSON.stringify(h.o)}`);
    assert(d.NHAN_NHOM_CON.checkpoint === 'Checkpoint (theo môn)', d.NHAN_NHOM_CON.checkpoint);
    const ds = tongHop.oTongHop(P.mbManager, { ct: 'thuong', soTuan: 26, classId: pet.id, theo: 'lop', khoa: `lop:${pet.id}`, cot: 'luot' });
    assert(ds.rows.length === 2 && ds.rows.every((r: any) => /^Checkpoint 1 · /.test(r.title)), `danh sách: ${ds.rows.map((r: any) => r.title)}`);
  }));

  check('OV11h-2 · PET / KET: hạng mục = 4 môn L · R · W · S (P13), bảng kỹ năng hồ sơ HV có điểm Checkpoint; id bài cũ không đổi', () => thu(() => {
    for (const ct of ['PET', 'KET']) assert(JSON.stringify(d.caseCategoriesFor('ratio', ct)) === '["listening","reading","writing","speaking"]', `${ct}: ${d.caseCategoriesFor('ratio', ct)}`);
    assert(JSON.stringify(d.caseCategoriesFor('ratio', 'FOU')) === '["listening","reading","writing","speaking"]', 'FOU đổi bộ');
    assert(d.caseCategoryLabel('listening_speaking') === 'L+S' && d.caseCategoryLabel('reading_writing') === 'R+W', d.caseCategoryLabel('listening_speaking'));
    /* `baiId` đã phát ra (Tổng quan, Phân tích GV, hồ sơ GV) giữ nguyên chỉ số kỹ năng. */
    assert(d.baiId(5, 'tong_hop') === 56 && d.baiId(5, 'listening_speaking') === 57 && d.baiId(5, 'reading_writing') === 58, 'baiId lệch');
    const b = cases.skillSupportBoard(P.mbManager, cp[0].student_id);
    const ds = b.rows as any[];
    assert(JSON.stringify(ds.map((r: any) => r.category)) === '["listening","reading","writing","speaking"]', `bảng kỹ năng: ${ds.map((r: any) => r.category)}`);
    assert(ds.every((r: any) => r.points.some((p: any) => p.attemptKind === 'checkpoint')) && ds[0].short === 'L', JSON.stringify(ds.map((r: any) => [r.short, r.points])));
  }));

  check('OV11h-4 · chữ: đơn vị "lượt MT" / "bài" / "Case" (không "đợt Test"), Thiếu điểm gồm SOS tạm, hồ sơ GV với CX / TVV "dành cho Quản lý"', () => thu(() => {
    assert(!Object.values(d.METRIC_UNIT_LABEL).some((v: any) => /đợt Test/.test(v)), JSON.stringify(d.METRIC_UNIT_LABEL));
    assert(d.METRIC_UNIT_LABEL.case === 'Case' && d.nhanDonVi('dot-test', 'ft') === 'lượt MT' && d.nhanDonVi('dot-test', 'thuong') === 'bài', 'nhãn đơn vị');
    /* PT-9: Fast Track (lớp thường không chữ SOS — T58). */
    const cd = d.cotTongHopFor('ft').find((c: any) => c.khoa === 'chuaDu');
    assert(/SOS tạm \(chưa chốt\)/.test(cd.goiY), cd.goiY);
    const o = tongHop.oTongHop(P.mbManager, { ct: 'thuong', soTuan: 26, classId: pet.id, theo: 'lop', khoa: `lop:${pet.id}`, cot: 'luot' });
    assert(/^\d+ bài — /.test(o.tieuDe), o.tieuDe);
    const gvId = P.coreTeacher.userId;
    for (const k of ['cx', 'consultant']) assert(loiCua(() => phamVi.phamViHoSoGv(vai(k), gvId)) === 'Hồ sơ giáo viên dành cho Quản lý.', `${k}: ${loiCua(() => phamVi.phamViHoSoGv(vai(k), gvId))}`);
    const gvKhac = one(`SELECT ur.user_id id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'teacher' AND ur.status = 'active' AND ur.user_id != ? LIMIT 1`, gvId).id;
    assert(/chính mình/.test(loiCua(() => phamVi.phamViHoSoGv(P.coreTeacher, gvKhac))), 'GV xem hồ sơ GV khác: giữ câu cũ');
  }));

  check('OV11h-5 · ô Lớp Phân tích có lớp đã kết thúc có lượt trong khoảng', () => thu(() => {
    const ds = tongHop.lopKetThucCoLuot(P.mbManager, 26, null) as any[];
    assert(ds.length > 0 && ds.every((c) => c.ket_thuc === true), JSON.stringify(ds));
    for (const c of ds) assert(one('SELECT status FROM classes WHERE id = ?', c.id).status !== 'active', `lớp ${c.code} còn mở`);
    assert(ds.some((c) => c.code === 'MB BE 08'), 'MB BE 08 (đã kết thúc, có bài trong 26 tuần) phải có');
  }));
}
