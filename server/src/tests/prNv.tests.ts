/**
 * PHÉP KIỂM PR-NV (Task NV-1) — "Nhắc tất cả" gom theo người, một lần ghi, dừng trước hạn 10 s; khoá Mini Test / Cuối khoá.
 * Harness do `run.ts` truyền vào.
 *
 * SỐ GỐC (đo trước khi sửa, 05/10, seed + lùi hạn Case chờ nguyên nhân, `nhacNhieu` của Quản trị):
 *   1 thẻ 632 câu · 9 thẻ cùng một người 5 680 · thẻ của 2 người 5 589 · 36 thẻ / 9 người 92 882.
 * SAU NV-1: 65 · 65 · 105 · 377 (5 người / 15 thẻ: 228 — trần 200 câu chưa đạt, việc của NV-2). Số mới in ở `NV-1 số câu`.
 * Trong `npm test` (DB cuối `run.ts`): 1 thẻ 81 · 17 thẻ cùng người 81 · 2 người 119 · 50 thẻ / 10 người 434.
 * SAU NV-2 (`myWork` chỉ dựng nhóm của khoá): 30 · 30 · 38 · 106 (36 thẻ / 9 người); 5 người / 15 thẻ: 72 — trần 200 đạt.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrNvTests(t: YThucTestKit) {
  const { check, assert, conn, TODAY, P } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const yc = await import('../duyet/yeuCau.ts');
  const ck = await import('../normal/cuoiKhoa.ts');
  const { tx } = await import('../db.ts');
  const { soCauSql, trongBoNho } = await import('../platform/nguCanhRequest.ts');
  const { chayVoiHan } = await import('../platform/hanGio.ts');
  const { awaitingCauseCaseIds } = await import('../cases/sosState.ts');
  const mw: any = await import('../worklist/mywork.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  console.log('\nPR-NV · Nhắc việc gom theo người');

  const maLoi = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e?.status ?? 500; } };
  const homNay = `nhac:%:${TODAY}`;
  const xoaNhac = () => conn.prepare(`DELETE FROM notifications WHERE kind = 'nhac_viec' AND dedup_key LIKE ?`).run(homNay);
  const nhacHomNay = () => (conn.prepare(
    `SELECT user_id, dedup_key, title, duong FROM notifications WHERE kind = 'nhac_viec' AND dedup_key LIKE ? ORDER BY user_id, dedup_key`,
  ).all(homNay) as any[]).map((r) => `${r.user_id}|${r.dedup_key}|${r.title}|${r.duong}`);
  const loaiNhac = Object.entries(d.LOAI_YC_META as Record<string, any>).filter(([, m]) => m.kieuNut === 'nhac').map(([k]) => k);
  /** Thẻ Báo QL đang chờ, có người nhận. */
  const theCho = () => {
    yc.quetYeuCau(TODAY);
    return (conn.prepare(`SELECT * FROM yeu_cau_duyet WHERE trang_thai = 'cho' AND loai IN (${loaiNhac.map(() => '?').join(',')}) ORDER BY id`)
      .all(...loaiNhac) as any[])
      .map((r) => ({ ...r, du: JSON.parse(r.du_lieu ?? '{}') }))
      .filter((r) => typeof r.du.ownerId === 'number' && typeof r.du.viecKey === 'string');
  };
  const dem = (fn: () => unknown) => { const a = soCauSql(); fn(); return soCauSql() - a; };

  /* Nhiều thẻ của nhiều người: Case chờ nguyên nhân có chủ → lùi hạn xác nhận → quét sinh thẻ Báo QL (seed chỉ có vài thẻ). */
  const ung = conn.prepare(`SELECT id FROM sos_cases WHERE status != 'done' AND owner_user_id IS NOT NULL AND owner_user_id != ?`).all(P.admin.userId) as any[];
  const cho = awaitingCauseCaseIds(ung.map((r) => r.id));
  const hanCu = cho.map((id) => [id, (conn.prepare('SELECT han_xac_nhan h FROM sos_cases WHERE id = ?').get(id) as any).h]);
  for (const id of cho) conn.prepare('UPDATE sos_cases SET han_xac_nhan = ? WHERE id = ?').run(t.addDays(TODAY, -2), id);
  yc.quetYeuCau(TODAY);

  check('NV-2 · myWork(người, { chiNhom: G }) = đúng các dòng của myWork(người) có nhóm ∈ G (mọi GV/QL seed, từng nhóm + tập gộp)', () => {
    const NHOM = ['cause', 'xac_nhan_pa', 'phoi_hop', 'phoi_hop_sos', 'mini_test', 'score', 'no_plan', 'ghi_ket_qua_pa',
      'yt_xu_ly', 'yt_xem', 'yt_thuc_hien', 'khai_bac', 'chot_len_ft', 'ky_vong_dau_ra', 'ban_giao', 'no_owner', 'mgmt', 'missing_data'];
    const tap = [...NHOM.map((g) => [g]), ['cause', 'score', 'yt_xem', 'ban_giao', 'missing_data', 'no_plan', 'mgmt']];
    const nguoi = conn.prepare(
      `SELECT DISTINCT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users u ON u.id = ur.user_id
        WHERE ur.status = 'active' AND u.status = 'active' AND u.deleted_at IS NULL AND r.key IN ('teacher', 'manager') ORDER BY ur.user_id`,
    ).all() as any[];
    const dong = (items: any[]) => items.map((i) => `${i.group}|${i.key}|${i.tieuDe}`).sort().join('\n');
    const coNhom = new Set<string>();
    for (const { id } of nguoi) {
      const p = loadPrincipal(id);
      const du = (mw.myWork(p).items ?? []) as any[];
      for (const i of du) coNhom.add(i.group);
      for (const G of tap) {
        const loc = (mw.myWork(p, { chiNhom: new Set(G) }).items ?? []) as any[];
        const can_ = dong(du.filter((i) => G.includes(i.group)));
        assert(dong(loc) === can_, `người ${id}, nhóm ${G.join('+')}:\nlọc:\n${dong(loc)}\ncần:\n${can_}`);
      }
    }
    assert(nguoi.length >= 5 && coNhom.size >= 6, `mẫu quá nhỏ: ${nguoi.length} người, nhóm ${[...coNhom].join(',')}`);
  });

  for (const [id, h] of hanCu) conn.prepare('UPDATE sos_cases SET han_xac_nhan = ? WHERE id = ?').run(h, id);

  // ---------------------------------------------------------------- NV-3: Nhắc việc không nổi ở Tổng quan, bỏ câu giải thích
  check('NV-3 · chipChoDuyet không còn chip Nhắc việc; chỉ có việc nhắc → không chip nào (dải ẩn)', () => {
    const goc = { quaHan: 0, baoLen: 3, deBiet: 3, deBietQuaHan: 1, cuaToiCho: 0, cuaToiTuChoi: 0 };
    assert(d.chipChoDuyet({ ...goc, cho: 0, chip: { 'tat-ca': 0 } }).length === 0, 'cho = 0 vẫn có chip');
    const c = d.chipChoDuyet({ ...goc, cho: 2, quaHan: 1, chip: { 'tat-ca': 2, 'lich-thi': 2 } });
    assert(!c.some((x: any) => x.key === 'de-biet') && c.some((x: any) => x.key === 'qua-han'), JSON.stringify(c));
  });

  check('NV-3 · dem.cho chỉ thẻ phải quyết = chip Tất cả; thẻ Nhắc việc không còn câu "để QL biết / không cần duyệt"', () => {
    const dem = yc.demYeuCau(P.mbManager);
    assert(dem.cho === yc.hopChoDuyet(P.mbManager, {}).dem['tat-ca'], `cho ${dem.cho}`);
    const biet = yc.hopChoDuyet(P.admin, { xem: 'de-biet' }).the;
    assert(biet.length > 0, 'seed cần thẻ Nhắc việc');
    const sai = biet.filter((x: any) => x.dong.some((s: string) => /để QL biết|không cần duyệt/i.test(s)));
    assert(!sai.length, JSON.stringify(sai.map((x: any) => [x.loai, x.dong])));
  });

  // ---------------------------------------------------------------- NV-4: chi nhánh mặc định
  check('NV-4 · chiNhanhMacDinh: lần chọn trước → vai Quản lý → lớp mình dạy → cuối; hoà → id nhỏ', () => {
    const m = (o: any) => d.chiNhanhMacDinh({ daChon: null, quanLy: [], lopDay: [], cuoi: null, ...o });
    assert(m({ daChon: 3, quanLy: [1] }) === 3 && m({ daChon: 'tat-ca', quanLy: [1] }) === null, 'luật 1 thắng');
    assert(m({ quanLy: [2], lopDay: [1, 1] }) === 2, 'luật 2 trước luật 3');
    assert(m({ quanLy: [1, 2], lopDay: [2, 2, 1] }) === 2 && m({ quanLy: [2, 1] }) === 1, 'QL hai chi nhánh: nhiều lớp hơn, hoà → id nhỏ');
    assert(m({ lopDay: [3, 2, 3] }) === 3 && m({ lopDay: [3, 2] }) === 2, 'luật 3');
    assert(m({}) === null && m({ cuoi: 1 }) === 1, 'luật 4');
  });

  const hvl = await import('../classes/hocVienLop.ts');
  const lopTheoCn = new Map<number, number[]>();
  for (const r of conn.prepare(`SELECT id, branch_id FROM classes WHERE status = 'active' AND branch_id IS NOT NULL ORDER BY id`).all() as any[]) {
    lopTheoCn.set(r.branch_id, [...(lopTheoCn.get(r.branch_id) ?? []), r.id]);
  }
  const cnCoLop = [...lopTheoCn.keys()].sort((a, b) => a - b);

  check('NV-4 · goiYChiNhanh: QL theo vai, QL hai chi nhánh theo lớp dạy, Quản trị theo lớp dạy, không dạy → null, GV → null', () => {
    assert(cnCoLop.length >= 2, 'seed cần ≥ 2 chi nhánh có lớp');
    const [c1, c2] = [cnCoLop[0], cnCoLop[cnCoLop.length - 1]];
    const gan = (cls: number[]) => cls.map((classId, i) => ({ id: -1 - i, classId, skill: null, isCore: true, effectiveFrom: '2000-01-01', effectiveTo: null }));
    const nguoi = (roleKeys: string[], grants: { roleKey: string; branchId: number | null }[], assignments: any[] = []) =>
      ({ userId: -1, code: 'X', fullName: 'X', title: null, roleKeys, assignments,
        grants: grants.map((g) => ({ ...g, branchName: null, permissions: new Set<string>() })) }) as any;
    const g = (p: any) => trongBoNho(() => hvl.goiYChiNhanh(p, TODAY));
    assert(g(nguoi(['manager'], [{ roleKey: 'manager', branchId: c2 }])) === c2, 'QL một chi nhánh');
    const day2 = gan((lopTheoCn.get(c2) ?? []).slice(0, 2));
    assert(g(nguoi(['manager'], [{ roleKey: 'manager', branchId: c1 }, { roleKey: 'manager', branchId: c2 }], day2)) === c2, 'QL hai chi nhánh dạy ở c2');
    assert(g(nguoi(['system_admin'], [{ roleKey: 'system_admin', branchId: null }], day2)) === c2, 'Quản trị dạy lớp c2');
    assert(g(nguoi(['system_admin'], [{ roleKey: 'system_admin', branchId: null }])) === null, 'Quản trị không dạy → Tất cả');
    const hai = gan([lopTheoCn.get(c1)![0], lopTheoCn.get(c2)![0]]);
    assert(g(nguoi(['teacher'], [{ roleKey: 'teacher', branchId: c1 }, { roleKey: 'teacher', branchId: c2 }], hai)) === null, 'GV dạy hai chi nhánh');
    const het = [{ ...day2[0], effectiveTo: t.addDays(TODAY, -1) }];
    assert(g(nguoi(['system_admin'], [{ roleKey: 'system_admin', branchId: null }], het)) === null, 'phân công đã hết hiệu lực không tính');
  });

  check('NV-4 · Học viên & Lớp: Quản trị dạy lớp chi nhánh khác không còn mặc định chi nhánh id nhỏ nhất; cnNho ngoài phạm vi bỏ qua; cnNho không đổi Phạm vi', () => {
    const c2 = cnCoLop[cnCoLop.length - 1];
    const lop = lopTheoCn.get(c2)![0];
    const r = conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at)
      VALUES (?, ?, NULL, 0, '2000-01-01', 'active', ?)`).run(P.admin.userId, lop, TODAY);
    try {
      const admin = loadPrincipal(P.admin.userId);
      const tr = trongBoNho(() => hvl.danhSachHocVienLop(admin, { phamVi: 'chi-nhanh' }));
      assert(tr.phamVi.chiNhanh === c2, `Quản trị dạy ở ${c2}: ${tr.phamVi.chiNhanh}`);
      const nho = trongBoNho(() => hvl.danhSachHocVienLop(admin, { phamVi: 'chi-nhanh', cnNho: cnCoLop[0] }));
      assert(nho.phamVi.chiNhanh === cnCoLop[0], 'cnNho thắng gợi ý');
      const pv0 = trongBoNho(() => hvl.danhSachHocVienLop(admin, {})).phamVi.dangDung;
      assert(trongBoNho(() => hvl.danhSachHocVienLop(admin, { cnNho: c2 })).phamVi.dangDung === pv0, 'cnNho đổi Phạm vi');
    } finally {
      conn.prepare('DELETE FROM teacher_assignments WHERE id = ?').run(r.lastInsertRowid);
    }
    const mb = P.mbManager.grants.find((x: any) => x.roleKey === 'manager')!.branchId;
    const ngoai = cnCoLop.find((b) => b !== mb)!;
    const q = trongBoNho(() => hvl.danhSachHocVienLop(P.mbManager, { phamVi: 'chi-nhanh', cnNho: ngoai }));
    assert(q.phamVi.chiNhanh !== ngoai, `QL MB nhận chi nhánh ngoài phạm vi ${ngoai}`);
  });

  // ---------------------------------------------------------------- Sau rà PR #205 (06/10)
  const fsNv = await import('node:fs');
  const pathNv = await import('node:path');
  const { fileURLToPath: fuNv } = await import('node:url');
  const REPO_NV = pathNv.resolve(pathNv.dirname(fuNv(import.meta.url)), '../../../..');
  const docNguon = (f: string) => fsNv.readFileSync(pathNv.join(REPO_NV, f), 'utf8');

  check('NV-5 (rà) · link trỏ một thẻ / lớp / việc (the, lop, classId, mo-viec, open) KHÔNG áp chi nhánh mặc định', () => {
    for (const q of ['the=21', 'lop=3', 'classId=3', 'mo-viec=9', 'open=4', 'xem=de-biet&the=5']) {
      assert(d.coDichLienKet(new URLSearchParams(q)) === true, q);
    }
    for (const q of ['', 'cn=2', 'xem=de-biet', 'periodId=4']) assert(d.coDichLienKet(new URLSearchParams(q)) === false, q);
    assert(/coDichLienKet\(/.test(docNguon('web/src/ui/Filters.tsx')), 'useChiNhanhMacDinh chưa dùng coDichLienKet');
    assert(/coDichLienKet\(/.test(docNguon('web/src/modules/students/StudentsPage.tsx')), 'Học viên & Lớp gửi cnNho cả khi link trỏ lớp');
  });

  check('NV-5 (rà) · hộp Chờ duyệt LUÔN mở Tất cả chi nhánh (chủ sản phẩm 06/10): không dùng chi nhánh mặc định; chip Tất cả = badge', () => {
    assert(!/useChiNhanhMacDinh/.test(docNguon('web/src/modules/duyet/HopChoDuyet.tsx')), 'HopChoDuyet còn áp chi nhánh mặc định');
    for (const p of [P.admin, P.mbManager]) assert(yc.hopChoDuyet(p, {}).dem['tat-ca'] === yc.demYeuCau(p).cho, `badge ≠ chip Tất cả (${p.userId})`);
  });
}
