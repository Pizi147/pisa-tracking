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
  const nv: any = await import('../worklist/nhacViec.ts');
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

  check('NV-1 (a) · nhắc thẻ Mini Test chưa đạt không 404 — chuông khoá nhac:minitest:{id}:{ngày}', () => {
    const the = theCho().find((r) => r.loai === 'bao_len_mini_test');
    assert(the, 'seed cần một thẻ Mini Test chưa đạt có người nhận');
    xoaNhac();
    const r = yc.nhacNhieu(P.admin, [the.id]);
    assert(r.ok.length === 1 && r.loi.length === 0, JSON.stringify(r));
    const tb = conn.prepare(`SELECT * FROM notifications WHERE user_id = ? AND dedup_key = ?`).get(the.du.ownerId, `nhac:minitest:${the.doi_tuong_id}:${TODAY}`) as any;
    assert(tb && tb.duong, `chuông: ${JSON.stringify(tb)}`);
  });

  check('NV-1 (b) · nhắc thẻ Cuối khoá dời quá hạn tới đúng GVCN; đổi GVCN → 404', () => {
    const a = conn.prepare(
      `SELECT a.id, a.student_id, a.class_id, ta.user_id AS gv FROM assessment_attempts a
         JOIN classes c ON c.id = a.class_id
         JOIN teacher_assignments ta ON ta.class_id = a.class_id AND ta.is_core = 1 AND ta.status = 'active'
        WHERE a.status = 'planned' AND ta.user_id != ? ORDER BY a.id LIMIT 1`,
    ).get(P.admin.userId) as any;
    assert(a, 'cần một bài đang lên lịch của lớp có GVCN');
    tx(() => ck.baoLenCuoiKhoaDoiQuaHan(conn, a));
    const the = theCho().find((r) => r.loai === 'bao_len_cuoi_khoa' && r.doi_tuong_id === a.id);
    assert(the && typeof the.du.ownerId === 'number', `thẻ: ${JSON.stringify(the)}`);
    a.gv = the.du.ownerId;
    xoaNhac();
    const r = yc.nhacNhieu(P.admin, [the.id]);
    assert(r.ok.length === 1 && r.ok[0].moi, JSON.stringify(r));
    const tb = conn.prepare(`SELECT * FROM notifications WHERE user_id = ? AND dedup_key = ?`).get(a.gv, `nhac:cuoi_khoa:${a.id}:${TODAY}`) as any;
    assert(tb && tb.duong === d.duongHoSoHocVien(a.student_id) && tb.title.startsWith('Cuối khoá dời quá hạn · ') && tb.title.endsWith(`· ${P.admin.fullName} nhắc`),
      `chuông: ${JSON.stringify(tb)}`);
    xoaNhac();
    conn.prepare(`UPDATE teacher_assignments SET status = 'ended' WHERE class_id = ? AND user_id = ? AND is_core = 1 AND status = 'active'`).run(a.class_id, a.gv);
    try {
      const r2 = yc.nhacNhieu(P.admin, [the.id]);
      assert(r2.ok.length === 0 && r2.loi.length === 1 && r2.loi[0].ma === 404, JSON.stringify(r2));
      assert(nhacHomNay().length === 0, 'GVCN cũ vẫn nhận chuông');
    } finally {
      conn.prepare(`UPDATE teacher_assignments SET status = 'active' WHERE class_id = ? AND user_id = ? AND is_core = 1 AND status = 'ended'`).run(a.class_id, a.gv);
    }
  });

  check('NV-1 (c) · gom = gọi lẻ: nhắc cả lô và nhắc từng thẻ ra cùng tập (người, khoá, tiêu đề, đường)', () => {
    const ds = theCho();
    assert(new Set(ds.map((r) => r.du.ownerId)).size >= 2, `cần thẻ của ít nhất hai người: ${ds.length}`);
    const ids = ds.slice(0, d.TRAN_HANG_LOAT).map((r) => r.id);
    xoaNhac();
    const lo = yc.nhacNhieu(P.admin, ids);
    const a = nhacHomNay();
    xoaNhac();
    const le = ids.map((id) => yc.nhacNhieu(P.admin, [id]));
    const b = nhacHomNay();
    assert(a.length > 0 && a.join('\n') === b.join('\n'), `lô:\n${a.join('\n')}\nlẻ:\n${b.join('\n')}`);
    const loLe = le.flatMap((r) => r.loi.map((l) => `${l.id}:${l.ma}`)).sort().join();
    assert(lo.loi.map((l) => `${l.id}:${l.ma}`).sort().join() === loLe, `lỗi lô ${JSON.stringify(lo.loi)} ≠ lẻ ${loLe}`);
  });

  check('NV-1 (d) · số câu không tăng theo số thẻ của cùng một người; thẻ hai người ≤ 2 × một người', () => {
    const ds = theCho();
    xoaNhac();
    const thu = yc.nhacNhieu(P.admin, ds.slice(0, d.TRAN_HANG_LOAT).map((r) => r.id));
    const duoc = new Set(thu.ok.map((x) => x.id));
    /* Thẻ có dòng `myWork` (Cuối khoá / Mini Test nạp riêng một lô cố định — không theo số thẻ, nhưng làm lệch phép so). */
    const tot = ds.filter((r) => duoc.has(r.id) && r.loai !== 'bao_len_cuoi_khoa' && r.loai !== 'bao_len_mini_test');
    /* NV-2: `myWork` chỉ dựng nhóm của khoá được nhắc → so thẻ CÙNG người CÙNG nhóm (tiền tố khoá); số nhóm mới làm tăng câu. */
    const theoNguoi = new Map<string, number[]>();
    for (const r of tot) {
      const k = `${r.du.ownerId}|${r.du.viecKey.split(':')[0]}`;
      theoNguoi.set(k, [...(theoNguoi.get(k) ?? []), r.id]);
    }
    const nhieu = [...theoNguoi.entries()].sort((x, y) => y[1].length - x[1].length);
    const khac = nhieu.find(([k]) => k.split('|')[0] !== nhieu[0][0].split('|')[0]);
    assert(nhieu[0][1].length >= 2 && khac, `cần một người ≥ 2 thẻ cùng nhóm và người thứ hai: ${JSON.stringify(nhieu)}`);
    const do_ = (ids: number[]) => { xoaNhac(); return dem(() => yc.nhacNhieu(P.admin, ids)); };
    const mot = do_([nhieu[0][1][0]]);
    const m = do_(nhieu[0][1]);
    const hai = do_([nhieu[0][1][0], khac![1][0]]);
    const lo50 = ds.slice(0, d.TRAN_HANG_LOAT);
    const lon = do_(lo50.map((r) => r.id));
    /* Lô 5 người / 15 thẻ: một thẻ mỗi người đầu, rồi thêm thẻ của chính 5 người đó tới 15. */
    const nam = [...new Set(lo50.map((r) => r.du.ownerId))].slice(0, 5);
    const dau = nam.map((u) => lo50.find((r) => r.du.ownerId === u)!.id);
    const lo15 = [...dau, ...lo50.filter((r) => nam.includes(r.du.ownerId) && !dau.includes(r.id)).map((r) => r.id)].slice(0, 15);
    const muoiLam = do_(lo15);
    const soNguoiLon = new Set(lo50.map((r) => r.du.ownerId)).size;
    console.log('NV-1 số câu', JSON.stringify({ mot, m, soTheM: nhieu[0][1].length, hai, lon, soTheLon: lo50.length, soNguoiLon, muoiLam, soThe15: lo15.length }));
    assert(m === mot, `1 thẻ ${mot} câu ≠ ${nhieu[0][1].length} thẻ cùng người cùng nhóm ${m} câu`);
    assert(hai <= 2 * mot, `thẻ 2 người ${hai} câu > 2 × ${mot}`);
    /* Trần tuyệt đối (NV-1 Step 5, đạt nhờ NV-2): ≈ 7 s ở 35 ms/câu, còn ≥ 2,5 s cho `tx`. */
    assert(soNguoiLon >= 5 && nam.length === 5, `cần thẻ của ≥ 5 người: ${soNguoiLon}`);
    assert(lon <= 200, `${lo50.length} thẻ / ${soNguoiLon} người: ${lon} câu > 200`);
    assert(muoiLam <= 200, `${lo15.length} thẻ / 5 người: ${muoiLam} câu > 200`);
  });

  check('NV-2 · myWork(người, { chiNhom: G }) = đúng các dòng của myWork(người) có nhóm ∈ G (mọi GV/QL seed, từng nhóm + tập gộp)', () => {
    const NHOM = ['cause', 'xac_nhan_pa', 'ke_hoach_bo_tro', 'phoi_hop', 'phoi_hop_sos', 'mini_test', 'score', 'no_plan', 'ghi_ket_qua_pa',
      'yt_xu_ly', 'yt_xem', 'yt_thuc_hien', 'khai_bac', 'placement', 'ky_vong_dau_ra', 'ban_giao', 'no_owner', 'mgmt', 'missing_data'];
    const tap = [...NHOM.map((g) => [g]), ['cause', 'score', 'yt_xem', 'ban_giao', 'missing_data', 'no_plan', 'mgmt']];
    const nguoi = conn.prepare(
      `SELECT DISTINCT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users u ON u.id = ur.user_id
        WHERE ur.status = 'active' AND u.status = 'active' AND u.deleted_at IS NULL AND r.key IN ('teacher', 'manager') ORDER BY ur.user_id`,
    ).all() as any[];
    const dong = (items: any[]) => items.map((i) => `${i.group}|${i.key}|${i.tieuDe}`).sort().join('\n');
    const coNhom = new Set<string>();
    for (const { id } of nguoi) {
      const p = loadPrincipal(id);
      const du = mw.myWork(p).items as any[];
      for (const i of du) coNhom.add(i.group);
      for (const G of tap) {
        const loc = mw.myWork(p, { chiNhom: new Set(G) }).items as any[];
        const can_ = dong(du.filter((i) => G.includes(i.group)));
        assert(dong(loc) === can_, `người ${id}, nhóm ${G.join('+')}:\nlọc:\n${dong(loc)}\ncần:\n${can_}`);
      }
    }
    assert(nguoi.length >= 5 && coNhom.size >= 6, `mẫu quá nhỏ: ${nguoi.length} người, nhóm ${[...coNhom].join(',')}`);
  });

  check('NV-1 (e) · nhắc lần hai trong ngày: 0 chuông mới, mọi ok.moi = false, không dựng myWork (≤ 6 câu sau quét)', () => {
    xoaNhac();
    /* Chỉ thẻ đã nhắc được lần một — thẻ lỗi (việc đã hết…) lần hai vẫn phải kiểm lại dòng. */
    const ids = yc.nhacNhieu(P.admin, theCho().slice(0, d.TRAN_HANG_LOAT).map((r) => r.id)).ok.map((x) => x.id);
    const truoc = nhacHomNay().length;
    let r: any;
    const n = trongBoNho(() => { yc.quetYeuCau(TODAY); return dem(() => { r = yc.nhacNhieu(P.admin, ids); }); });
    assert(nhacHomNay().length === truoc && r.ok.length > 0 && r.ok.every((x: any) => !x.moi), JSON.stringify(r));
    assert(n <= 6, `nhắc lại ${n} câu`);
  });

  check('NV-1 (f) · sắp hết giờ: mọi thẻ lỗi 503 "Chưa kịp nhắc", không chuông nào được ghi', () => {
    const ids = theCho().slice(0, d.TRAN_HANG_LOAT).map((r) => r.id);
    xoaNhac();
    const r = chayVoiHan(Date.now() + 3000, () => yc.nhacNhieu(P.admin, ids));
    assert(r.ok.length === 0 && r.loi.length === ids.length && r.loi.every((l) => l.ma === 503 && /Chưa kịp nhắc/.test(l.loi)), JSON.stringify(r));
    assert(nhacHomNay().length === 0, 'đã ghi chuông khi sắp hết giờ');
  });

  check('NV-1 (g) · quyền không nới: QL MB thẻ chi nhánh khác 403; GV 403; khoá bịa 404; tự nhắc 403 trước khi tra khoá', () => {
    const mb = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id;
    const ngoai = theCho().find((r) => r.chi_nhanh_id !== mb && r.chi_nhanh_id != null);
    assert(ngoai, 'cần thẻ Báo QL ngoài Monbay');
    xoaNhac();
    const r = yc.nhacNhieu(P.mbManager, [ngoai.id]);
    assert(r.ok.length === 0 && r.loi[0]?.ma === 403, JSON.stringify(r));
    assert(maLoi(() => yc.nhacNhieu(P.coreTeacher, [ngoai.id])) === 403, 'GV');
    assert(maLoi(() => nv.nhacViec(P.mbManager, { key: 'score:bia-khong-ton-tai', ownerId: P.coreTeacher.userId })) === 404, 'khoá bịa');
    let loi: any = null;
    try { nv.nhacViec(P.mbManager, { key: 'score:bia-khong-ton-tai', ownerId: P.mbManager.userId }); } catch (e) { loi = e; }
    assert(loi?.status === 403 && /chính mình/.test(loi.message), `tự nhắc: ${loi?.status} ${loi?.message}`);
    assert(nhacHomNay().length === 0, 'có chuông bị ghi');
  });

  for (const [id, h] of hanCu) conn.prepare('UPDATE sos_cases SET han_xac_nhan = ? WHERE id = ?').run(h, id);
}
