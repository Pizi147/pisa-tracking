/**
 * PHÉP KIỂM M6 · 6b-4 PILOT-GV-TRE (kế hoạch `docs/superpowers/plans/2026-10-27-m6-code.md` mục 6b-4, mockup `thiet-ke/v7/panel-pilot.html` khu ③):
 *  · Q8: Admin đọc CHÍNH tập `tongQuanMt.gvQuaHan`, QL đọc CHÍNH `treCham` — mỗi vai một hàm, không đổi số;
 *  · số trên ô = số dòng panel (Admin: số GV = số nhóm GV; QL: số bài của GV = Σ bài các dòng);
 *  · mỗi dòng lớp · lượt · kỹ năng đủ để mở view "em còn trống" và lưới Nhập hộ (lớp, mã lượt, kỹ năng, em) — Q5: QL / Admin nhập hộ được;
 *  · quyền: khối Admin chỉ Admin; panel QL cần quyền phân tích (GV → 403).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrPilotGvTreTests(t: YThucTestKit) {
  const { check, assert, conn, P } = t as any;
  const { gvTre } = await import('../worklist/gvTre.ts');
  const { tongQuanMt } = await import('../worklist/tongQuanMt.ts');
  const { treCham } = await import('../worklist/tongQuanQl.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  console.log('\nM6 · 6b-4 PILOT-GV-TRE — panel GV chấm quá hạn (Admin gvQuaHan · QL treCham), em còn trống, Nhập hộ');

  const mb = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  const idAd = (conn.prepare(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN branches b ON b.id = ur.branch_id
      WHERE r.key = 'office_admin' AND b.code = 'MB' ORDER BY ur.user_id LIMIT 1`).get() as any)?.id;
  const loi = (f: () => unknown) => { try { f(); return null; } catch (e: any) { return e; } };

  check('6b-4 · dữ liệu thử: có Admin MB', () => { assert(idAd, 'seed thiếu Admin MB'); });
  if (!idAd) return;
  const ad = loadPrincipal(idAd);

  check('6b-4 · Admin (Q8): nhóm GV = số GV của khối; dòng = đúng dòng gvQuaHan; Σ bài = ô "n quá hạn"; chờ chấm S chéo tách riêng', () => {
    let coDong = false;
    for (const cn of [mb, null]) {
      const k = tongQuanMt(ad, { branchId: cn });
      const r = gvTre(ad, { branchId: cn });
      const soGv = new Set(k.gvQuaHan.filter((g) => g.ownerId > 0).map((g) => g.ownerId)).size;
      const coGv = r.nhom.filter((g) => g.gvId > 0);
      assert(coGv.length === soGv && r.soGv === soGv, `cn ${cn}: ${coGv.length} nhóm · soGv ${r.soGv} ≠ ô ${soGv} GV`);
      const dong = r.nhom.flatMap((g) => g.dong);
      const mong = k.gvQuaHan.filter((g) => g.ownerId > 0);
      for (const g of mong) {
        const d = dong.find((x) => x.key === g.key);
        assert(d && d.soBai === g.soBai && d.han === g.han, `dòng ${g.key} lệch: ${JSON.stringify(d)}`);
      }
      const tong = dong.reduce((n, d) => n + d.soBai, 0);
      assert(tong === k.oChuaNhap.quaHan, `cn ${cn}: Σ bài panel ${tong} ≠ ô "${k.oChuaNhap.quaHan} quá hạn"`);
      assert(r.soBai + r.soBaiChuaCoGv === tong, 'đầu panel: bài có GV + bài chưa có GV ≠ Σ dòng');
      for (const g of r.nhom) assert(g.soBai === g.dong.reduce((n, d) => n + d.soBai, 0), `chip nhóm ${g.ten} ≠ Σ dòng`);
      const cc = k.gvQuaHan.find((g) => g.choCham);
      assert(r.choCham === (cc?.soBai ?? 0), `chờ chấm ${r.choCham} ≠ ${cc?.soBai ?? 0}`);
      if (dong.length) coDong = true;
    }
    assert(coDong, 'bộ demo không có bài quá hạn nào — phép kiểm không soi được gì');
  });

  check('6b-4 · QL (Q8): mỗi GV của Trễ chấm — Σ bài các dòng = số ô "⚠ n" (treCham); dòng đủ lớp · lượt · kỹ năng · em để mở lưới', () => {
    const { dong } = treCham(P.mbManager, mb, 'ft');
    assert(dong.length > 0, 'bộ demo không có GV trễ chấm ở MB');
    for (const g of dong) {
      const r = gvTre(P.mbManager, { branchId: mb, ct: 'ft', gv: g.khoa });
      assert(r.nhom.length === 1 && r.nhom[0].gvId === g.khoa && r.nhom[0].ten === g.ten, `GV ${g.khoa}: nhóm ${JSON.stringify(r.nhom.map((x) => x.gvId))}`);
      const tong = r.nhom[0].dong.reduce((n, d) => n + d.soBai, 0);
      assert(tong === g.bai && r.nhom[0].soBai === g.bai, `GV ${g.ten}: Σ dòng ${tong} ≠ ô ${g.bai}`);
      for (const d of r.nhom[0].dong) {
        assert(d.classId && d.lop && d.luot && d.kns.length && d.em.length && d.han, `dòng thiếu dữ liệu mở lưới: ${JSON.stringify(d)}`);
        assert(d.em.length <= d.soBai, `dòng ${d.key}: ${d.em.length} em > ${d.soBai} bài`);
      }
    }
    /* GV không còn bài (vừa nhập đủ) → panel rỗng, không 400 (dòng "✓ Đã đủ" giữ chỗ ở web). */
    assert(gvTre(P.mbManager, { branchId: mb, ct: 'ft', gv: 999_999 }).nhom.length === 0, 'GV không còn bài phải trả panel rỗng');
  });

  check('6b-4 · Q5 Nhập hộ: QL / Admin trong phạm vi nhập hộ được (nhapHo) mọi dòng có lớp', () => {
    for (const d of gvTre(ad, { branchId: mb }).nhom.flatMap((g) => g.dong)) assert(!d.classId || d.nhapHo, `Admin không nhập hộ được ${d.key}`);
    const g = treCham(P.mbManager, mb, 'ft').dong[0];
    for (const d of gvTre(P.mbManager, { branchId: mb, ct: 'ft', gv: g.khoa }).nhom.flatMap((x) => x.dong)) assert(d.nhapHo, `QL không nhập hộ được ${d.key}`);
  });

  check('6b-4 · quyền: khối Admin chỉ Admin (QL → 403); panel QL cần quyền phân tích (GV → 403)', () => {
    assert(loi(() => gvTre(P.mbManager, { branchId: mb }))?.status === 403, 'QL đọc được khối Admin');
    assert(loi(() => gvTre(P.w1Teacher, { branchId: mb, ct: 'ft', gv: 1 }))?.status === 403, 'GV đọc được panel trễ chấm');
  });
}
