/**
 * PHÉP KIỂM XM-VIEC-DUNG-HAN b (chủ SP 07/11 "làm hết theo đề xuất", plan.md mục 4 "07/11 đêm" mục 6): việc trong "Việc đúng hạn" ĐÃ XONG có ngày xong
 * vẫn được tính — xong sau hạn = không đúng hạn (vào mẫu, không vào tử), xong trước / đúng hạn = đúng hạn — thay vì biến khỏi số liệu.
 * Ngày xong: dữ liệu sẵn có (PA đầu của Case, …) hoặc cột mới `sos_cases.mo_ta_luc` (migrate `prNgayXong0711`) ghi khi Case có mô tả / nguyên nhân chính.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrNgayXongTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, addDays } = t as any;
  const pt: any = await import('../phanTich/giaoVien.ts');
  const week: any = await import('../platform/week.ts');
  const cases: any = await import('../cases/cases.ts');
  const tax: any = await import('../../../shared/domain/index.ts');
  const { migratePrNgayXong0711, capNhatMoTaLuc } = await import('../migrate/prNgayXong0711.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nXM-VIEC-DUNG-HAN b — việc đã xong có ngày xong vẫn vào "Việc đúng hạn" (trễ → mẫu, đúng hạn → tử + mẫu)');
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const ky = { ct: 'ft', tu: week.mondayOf(addDays(TODAY, -7 * 12)), den: week.mondayOf(TODAY) };
  const o = (gv: number) => { xoaNho(); return pt.phanTichGiaoVien(P.mbManager, ky).hang.find((h: any) => h.id === gv)?.viecDungHan ?? { k: 'rong' }; };
  const so = (x: any) => ({ dung: x.k === 'so' ? x.dung : 0, tong: x.k === 'so' ? x.tong : 0 });
  const viecMo = (group: string) => {
    xoaNho();
    const it = [...pt.viecQuaHanMo(pt.nguCanhPtGv(P.mbManager, ky)).values()].flat().find((x: any) => x.group === group);
    assert(it, `seed phải có việc ${group} quá hạn`);
    return it;
  };

  check('XM-VIEC b · Thêm PA làm SAU hạn: việc không biến khỏi số — vẫn trong mẫu, không vào tử; panel dòng "Đã làm" có ngày làm, Quá hạn', () => thu(() => {
    const it = viecMo('no_plan');
    const caseId = Number(it.key.split(':')[1]);
    const truoc = so(o(it.ownerId));
    conn.prepare(`INSERT INTO case_interventions (case_id, kind, status, recorded_by, created_at) VALUES (?, 'tutor', 'planned', ?, ?)`).run(caseId, it.ownerId, `${TODAY}T03:00:00.000Z`);
    const sau = so(o(it.ownerId));
    assert(sau.tong === truoc.tong && sau.dung === truoc.dung, `trước ${JSON.stringify(truoc)} → sau ${JSON.stringify(sau)} (việc làm trễ phải còn trong mẫu)`);
    const p = pt.oChiSoGv(P.mbManager, { ...ky, gv: it.ownerId, cot: 'viec-dung-han' });
    const v = p.rows.map((r: any) => r.dongViec).find((x: any) => !x.mo && x.em?.id === it.studentId && x.tab === 'case' && x.han === it.due);   // sổ: mỗi việc một dòng (Kết quả PA cùng em cũng tab Case)
    assert(v && v.ngayXong === TODAY && !v.dung && v.treNgay > 0 && v.han === it.due, `panel thiếu dòng đã làm trễ: ${JSON.stringify(p.rows.map((r: any) => r.dongViec))}`);
  }));

  check('XM-VIEC b · Mô tả Case trước / đúng hạn: mo_ta_luc = ngày nghiệp vụ; vào TỬ và mẫu', () => thu(() => {
    const it = viecMo('ghi_nhan_xet');
    const caseId = Number(it.key.split(':')[1]);
    conn.prepare('UPDATE sos_cases SET han_xac_nhan = ? WHERE id = ?').run(TODAY, caseId);   // hạn hôm nay: chưa quá hạn → chưa tính
    const truoc = so(o(it.ownerId));
    const topic = (conn.prepare('SELECT topic FROM sos_cases WHERE id = ?').get(caseId) as any).topic;
    cases.addIssues(caseId, it.ownerId, { primaryCode: tax.issuesForTopic(topic)[0].code, observation: 'Mô tả thử', topic });
    assert((conn.prepare('SELECT mo_ta_luc FROM sos_cases WHERE id = ?').get(caseId) as any).mo_ta_luc === TODAY, 'mo_ta_luc phải = ngày nghiệp vụ');
    const sau = so(o(it.ownerId));
    assert(sau.tong === truoc.tong + 1 && sau.dung === truoc.dung + 1, `trước ${JSON.stringify(truoc)} → sau ${JSON.stringify(sau)} (làm đúng hạn phải vào tử + mẫu)`);
    /* Bỏ mô tả (hoàn tác) → ngày xong về NULL; có lại → ngày mới. */
    conn.prepare('DELETE FROM case_issues WHERE case_id = ?').run(caseId);
    capNhatMoTaLuc(conn, caseId);
    assert((conn.prepare('SELECT mo_ta_luc FROM sos_cases WHERE id = ?').get(caseId) as any).mo_ta_luc === null, 'mất mô tả → mo_ta_luc NULL');
  }));

  check('XM-VIEC b · Bàn giao đổi GV xong đúng hạn: vào tử + mẫu của người làm; xong sau hạn: chỉ mẫu', () => thu(() => {
    const it = viecMo('no_plan');   // một GV có hàng ở bảng FT + lớp FT của chi nhánh
    const truoc = so(o(it.ownerId));
    const gvBg = (han: string, xong: string) => conn.prepare(`INSERT INTO ban_giao_gv (class_id, nguoi_cu, nguoi_lam, hieu_luc, han, trang_thai, tao_luc, tao_boi, xong_luc, xong_boi)
      VALUES (?, ?, ?, ?, ?, 'xong', ?, ?, ?, ?)`).run(it.classId, it.ownerId, it.ownerId, han, han, `${han}T03:00:00.000Z`, it.ownerId, `${xong}T03:00:00.000Z`, it.ownerId);
    gvBg(addDays(TODAY, -3), addDays(TODAY, -4));
    const dung = so(o(it.ownerId));
    assert(dung.dung === truoc.dung + 1 && dung.tong >= truoc.tong + 1, `đúng hạn: ${JSON.stringify(truoc)} → ${JSON.stringify(dung)}`);
    conn.prepare('DELETE FROM ban_giao_gv WHERE class_id = ? AND nguoi_lam = ? AND xong_luc IS NOT NULL').run(it.classId, it.ownerId);
    gvBg(addDays(TODAY, -5), addDays(TODAY, -1));
    const tre = so(o(it.ownerId));
    assert(tre.dung === truoc.dung && tre.tong >= truoc.tong + 1, `trễ: ${JSON.stringify(truoc)} → ${JSON.stringify(tre)}`);
  }));

  check('BO-CHU-THICH · Bàn giao GVBM dữ liệu cũ mon = writing: tính cho người thực sự ghi (nguoi_ghi), không phải GV W phân công cuối', () => thu(() => {
    const it = viecMo('no_plan');
    const gvA = it.ownerId as number;
    const gvB = (conn.prepare('SELECT id FROM users WHERE id != ? ORDER BY id LIMIT 1').get(gvA) as any).id as number;
    const nay = new Date().toISOString();
    const pc = conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, effective_from, status, created_at) VALUES (?, ?, ?, ?, 'active', ?)`);
    pc.run(gvA, it.classId, 'writing1', addDays(TODAY, -60), nay);
    pc.run(gvB, it.classId, 'writing2', addDays(TODAY, -60), nay);   // phân công W sau cùng = B
    const truoc = so(o(gvA)), truocB = so(o(gvB));
    const han = addDays(TODAY, -3);
    const lenhId = Number(conn.prepare(`INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, trang_thai, tao_luc, han_gvbm, xac_nhan_luc)
      VALUES (?, ?, 'len-ft', 'cuoi-khoa', ?, ?, ?, 'cho', ?, ?, ?)`).run(it.studentId, it.classId, week.mondayOf(TODAY), gvA, addDays(TODAY, -10), nay, han, nay).lastInsertRowid);
    conn.prepare(`INSERT INTO ban_giao_mon (lenh_id, mon, noi_dung, nguoi_ghi, dien_thay, ghi_luc) VALUES (?, 'writing', 'Câu chung cũ', ?, 0, ?)`).run(lenhId, gvA, `${addDays(TODAY, -4)}T03:00:00.000Z`);
    /* Phiếu đã xác nhận chỉ có câu Writing chung → không mở lại W1 / W2 (prBanGiaoGv): dòng xong duy nhất của lớp. */
    const sau = so(o(gvA)), sauB = so(o(gvB));
    assert(sau.dung === truoc.dung + 1 && sau.tong === truoc.tong + 1 && sauB.tong === truocB.tong, `người ghi A ${JSON.stringify(truoc)} → ${JSON.stringify(sau)} · GV W cuối B ${JSON.stringify(truocB)} → ${JSON.stringify(sauB)}`);
  }));

  check('XM-VIEC b · migrate prNgayXong0711 chạy lại an toàn; dữ liệu cũ không có ngày xong giữ NULL', () => thu(() => {
    const ap: string[] = [];
    migratePrNgayXong0711(conn, ap);
    migratePrNgayXong0711(conn, ap);
    assert((conn.prepare(`SELECT COUNT(*) AS n FROM pragma_table_info('sos_cases') WHERE name = 'mo_ta_luc'`).get() as any).n === 1, 'thiếu cột mo_ta_luc');
  }));
}
