/**
 * PHÉP KIỂM V5 · UI-CON-LAI (nợ #528 — `08` bảng nợ): badge "việc của tôi" (`/my-work` → `summary.viec`) không đếm việc `mine:false`
 * (vd "Thêm PA" Case người khác phụ trách); `viecQuaHan` chỉ đếm kỹ năng THẬT SỰ quá hạn của dòng Nhập điểm (`knsQuaHan`).
 */
export async function runPrUiConLaiTests(t: any) {
  const { check, assert, P } = t;
  const mw: any = await import('../worklist/mywork.ts');
  const pv: any = await import('../giaoVien/phamVi.ts');
  console.log('\nV5 · UI-CON-LAI — badge việc của tôi (nợ #528)');

  const viec = (o: any) => ({ key: o.key, group: o.group ?? 'cause', urgency: o.urgency ?? 'normal', studentId: o.studentId ?? 1, mine: o.mine ?? true,
    kns: o.kns, knsQuaHan: o.knsQuaHan, soBai: o.soBai });

  check('UICL-1 (#528) · demSo: việc mine:false (Thêm PA Case người khác) không vào viec / viecQuaHan', () => {
    const ds = [viec({ key: 'cause:1' }), viec({ key: 'support:2', group: 'no_plan', mine: false, urgency: 'overdue' })];
    const s = mw.demSo(ds, ds);
    assert(s.viec === 1 && s.viecQuaHan === 0, JSON.stringify(s));
  });

  check('UICL-2 (#528) · demSo: dòng Nhập điểm L + R quá hạn chỉ ở L → viec 2, viecQuaHan 1 (không đếm R chưa quá hạn)', () => {
    const ds = [viec({ key: 'score:1', group: 'score', studentId: null, urgency: 'overdue', kns: ['listening', 'reading'], knsQuaHan: ['listening'], soBai: 4 })];
    const s = mw.demSo(ds, ds);
    assert(s.viec === 2 && s.viecQuaHan === 1, JSON.stringify(s));
  });

  check('UICL-3 (#528) · /my-work GV seed: summary.viec = số việc mine; mọi dòng Nhập điểm quá hạn có knsQuaHan ⊆ kns, không rỗng', () => {
    for (const p of [P.lrTeacher, P.w1Teacher, P.sTeacher, P.coreTeacher]) {
      const w = mw.myWork(p, {});
      const s = mw.demSo([], w.items.filter((i: any) => i.mine), () => true);
      assert(w.summary.viec === s.viec, `${p.userId}: ${w.summary.viec} ≠ ${s.viec}`);
      for (const i of w.items.filter((x: any) => x.group === 'score' && x.urgency === 'overdue')) {
        assert(i.knsQuaHan?.length && i.knsQuaHan.every((k: string) => i.kns.includes(k)), `${i.key}: ${JSON.stringify(i.knsQuaHan)}`);
      }
    }
  });

  check('UICL-4 (k1) · tìm GV ở thanh trên: QL chỉ GV mở được hồ sơ (phamViHoSoGv không ném); GV / TVV rỗng; < 2 ký tự rỗng', () => {
    const ql = P.mbManager;
    const ds = pv.timGiaoVien(ql, 'ng');
    assert(ds.length > 0, 'QL Monbay phải thấy GV có chữ "ng"');
    for (const g of ds) pv.phamViHoSoGv(ql, g.id);   // ném 403 / 404 nếu lọt ngoài phạm vi
    assert(!pv.timGiaoVien(P.coreTeacher, 'ng').length, 'GV không có nhóm Giáo viên');
    assert(!pv.timGiaoVien(ql, 'n').length, '1 ký tự → rỗng');
  });
}
