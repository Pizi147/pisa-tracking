/**
 * PHÉP KIỂM TIM-HV-LOP-TOI (GD-4a [XM-A], PTA Plan 15/11; ⑤ [XM-3], luat/3 Y-01, Y-17): hộp chọn em của "+ Task" (`/tim/hoc-vien?lop=toi`) —
 * GV chỉ thấy em các lớp mình được phân công, kể cả khi GV còn vai khác xem cả chi nhánh; QL / Quản trị vẫn thấy đủ. Không cờ = như cũ.
 */
export async function runPrTimHvLopToiTests(t: { check: any; assert: any; P: any }) {
  const { check, assert, P } = t;
  const { timHocVien } = await import('../students/students.ts');
  const { PERMISSIONS } = await import('../../../shared/domain/index.ts');
  console.log('\nTIM-HV-LOP-TOI · "+ Task" chỉ em lớp của tôi');
  check('THL-1 · GV có thêm vai xem cả chi nhánh: không cờ thấy em lớp khác, cờ lop=toi chỉ em lớp phân công; QL / QT cờ không đổi kết quả', () => {
    const gv = P.coreTeacher;
    const lopToi = new Set<number>(gv.assignments.map((a: any) => a.classId));
    const mb = P.mbManager.grants.find((g: any) => g.branchId !== null)!.branchId;
    /* Vai giả "consultant" xem học viên cả chi nhánh MB — tình huống GV kiêm vai khác. */
    const gvKiem = { ...gv, roleKeys: [...gv.roleKeys, 'consultant'], grants: [...gv.grants, { id: -1, roleKey: 'consultant', roleName: 'TVV', branchId: mb, branchName: 'MB', permissions: new Set([PERMISSIONS.STUDENT_VIEW]) }] };
    const rong = timHocVien(gvKiem, 'ng');
    assert(rong.some((x) => !lopToi.has(x.lopId)), 'dữ liệu thử: không cờ phải có em lớp khác');
    const hep = timHocVien(gvKiem, 'ng', true);
    assert(hep.length > 0 && hep.every((x) => lopToi.has(x.lopId)), 'cờ lop=toi: GV thấy em ngoài lớp mình');
    for (const [ten, p] of [['QL', P.mbManager], ['QT', P.admin]] as const) {
      const a = timHocVien(p, 'ng').map((x) => x.id).join(), b = timHocVien(p, 'ng', true).map((x) => x.id).join();
      assert(a === b && a.length > 0, `${ten}: cờ lop=toi làm đổi kết quả`);
    }
  });
}
