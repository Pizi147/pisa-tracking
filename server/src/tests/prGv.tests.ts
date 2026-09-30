/** PHÉP KIỂM PR-GV — Hồ sơ giáo viên + số liệu theo giáo viên (không KPI, không xếp hạng). */
import type { YThucTestKit } from './yThuc.tests.ts';
import { can } from '../permissions.ts';
import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { COT_O_GV, demViecTheoNhom, duongViecCuaGv, laCotOGv } from '../../../shared/domain/hoSoGiaoVien.ts';

export async function runPrGvTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P, classId, TODAY, addDays } = t;
  const { phamViHoSoGv } = await import('../giaoVien/phamVi.ts');
  const { viecCuaGv } = await import('../giaoVien/hoSo.ts');
  const { viecCuaNguoi, myWork } = await import('../worklist/mywork.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const gvcn = (ma: string) => get(`SELECT user_id AS id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 LIMIT 1`, classId(ma)).id as number;
  console.log('\nPR-GV · Hồ sơ giáo viên');

  check('PR-GV (1) · demViecTheoNhom: luôn đủ 4 nhóm đúng thứ tự, loại lạ rơi vào Vận hành', () => {
    const r = demViecTheoNhom([{ group: 'score', urgency: 'overdue' }, { group: 'result', urgency: 'normal' },
      { group: 'yt_xem', urgency: 'today' }, { group: 'la', urgency: 'overdue' }]);
    assert(JSON.stringify(r.map((x) => x.nhom)) === JSON.stringify(['cham-diem', 'case-hoc-thuat', 'y-thuc', 'van-hanh']), 'thứ tự NHOM_VIEC');
    assert(JSON.stringify(r.map((x) => [x.n, x.quaHan])) === JSON.stringify([[1, 1], [1, 0], [1, 0], [1, 1]]), 'n / quá hạn từng nhóm');
    assert(demViecTheoNhom([]).length === 4, 'rỗng vẫn đủ 4 dòng');
  });

  check('PR-GV (1) · duongViecCuaGv: QL có nguoi=id, tự xem có nguoi=toi, GV không có nguoi; có khung=tat-ca', () => {
    assert(duongViecCuaGv(7, { userId: 2, laQuanLy: true }, 'cham-diem', true) === '/cong-viec/ho-tro?nguoi=7&nhom=cham-diem&khung=tat-ca&loc=qua-han', 'QL xem GV');
    assert(duongViecCuaGv(7, { userId: 7, laQuanLy: false }, null) === '/cong-viec/ho-tro?khung=tat-ca', 'GV tự xem không có nguoi');
    assert(duongViecCuaGv(2, { userId: 2, laQuanLy: true }, 'y-thuc') === '/cong-viec/ho-tro?nguoi=toi&nhom=y-thuc&khung=tat-ca', 'QL tự xem = toi');
  });

  check('PR-GV (1) · laCotOGv: chỉ nhận cột trong COT_O_GV, KPI đã bỏ', () => {
    assert(COT_O_GV.every(laCotOGv), 'mọi cột hợp lệ');
    assert(!laCotOGv('kpi-bai') && !laCotOGv(undefined) && !laCotOGv(''), 'cột lạ bị chặn');
  });

  // ------------------------------------------------------------------ Task 2 · quyền xem hồ sơ (phủ định) + việc của một người
  /** Dựng tạm một GV; `vaiChiNhanh` = chi nhánh của vai (null = không vai), `phanCong` = lớp + ngày kết thúc. Trả id, dọn bằng `don`. */
  function dungGv(ma: string, vaiChiNhanh: string | null, phanCong: { lop: string; den: string | null } | null) {
    const id = Number(conn.prepare(`INSERT INTO users (code, full_name, created_at) VALUES (?, ?, ?)`).run(ma, `GV tạm ${ma}`, TODAY).lastInsertRowid);
    if (vaiChiNhanh) {
      conn.prepare(`INSERT INTO user_roles (user_id, role_id, branch_id, status, created_at)
        VALUES (?, (SELECT id FROM roles WHERE key = 'teacher'), (SELECT id FROM branches WHERE code = ?), 'active', ?)`).run(id, vaiChiNhanh, TODAY);
    }
    if (phanCong) {
      conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, effective_to, status, created_at)
        VALUES (?, ?, 'listening', 0, ?, ?, 'active', ?)`).run(id, classId(phanCong.lop), addDays(TODAY, -30), phanCong.den, TODAY);
    }
    return id;
  }
  const don = (id: number) => {
    conn.prepare(`DELETE FROM teacher_assignments WHERE user_id = ?`).run(id);
    conn.prepare(`DELETE FROM user_roles WHERE user_id = ?`).run(id);
    conn.prepare(`DELETE FROM users WHERE id = ?`).run(id);
  };

  check('PR-GV (2) · phamViHoSoGv phủ định: GVBM→GVCN, QL CP→GV MB, id lạ, tài khoản đã xoá đều bị chặn', () => {
    const gv = gvcn('MB FT 101');
    assertThrows(() => phamViHoSoGv(P.subjectTeacher, gv), /chính mình/, 'GVBM xem GVCN');
    /* GVCN 7 ở seed còn dạy một lớp CP nên QL CP xem được — dùng GV tạm chỉ ở MB. */
    const chiMb = dungGv('TMP-GV-MB', 'MB', { lop: 'MB FT 101', den: null });
    try { assertThrows(() => phamViHoSoGv(P.cpManager, chiMb), /chi nhánh bạn quản lý/, 'QL CP xem GV chỉ ở MB'); } finally { don(chiMb); }
    assertThrows(() => phamViHoSoGv(P.admin, 999999), /Không tìm thấy/, 'id lạ → 404');
    const xoa = dungGv('TMP-GV-XOA', 'MB', null);
    try {
      conn.prepare(`UPDATE users SET status = 'deleted' WHERE id = ?`).run(xoa);
      assertThrows(() => phamViHoSoGv(P.admin, xoa), /Không tìm thấy/, 'tài khoản đã xoá → 404');
    } finally { don(xoa); }
  });

  check('PR-GV (2) · phamViHoSoGv: chính mình / QL MB / Quản trị được xem; QL theo phân công đang hiệu lực, hết hạn thì chặn', () => {
    const gv = gvcn('MB FT 101');
    assert(phamViHoSoGv(P.coreTeacher, gv).laChinhMinh === true, 'GVCN xem chính mình');
    const ql = phamViHoSoGv(P.mbManager, gv);
    assert(ql.branchIds!.length === 1 && !ql.laChinhMinh, 'QL MB khoanh đúng chi nhánh MB');
    assert(phamViHoSoGv(P.admin, gv).branchIds === null, 'Quản trị: mọi chi nhánh');
    const dangDay = dungGv('TMP-GV-DAY', 'CP', { lop: 'MB FT 101', den: null });
    const hetHan = dungGv('TMP-GV-HET', 'CP', { lop: 'MB FT 101', den: addDays(TODAY, -1) });
    try {
      assert(phamViHoSoGv(P.mbManager, dangDay).branchIds !== undefined, 'vai CP nhưng đang dạy lớp MB → QL MB xem được');
      assertThrows(() => phamViHoSoGv(P.mbManager, hetHan), /chi nhánh bạn quản lý/, 'phân công đã kết thúc hôm qua → 403');
    } finally { don(dangDay); don(hetHan); }
  });

  check('PR-GV (2) · viecCuaNguoi giữ hành vi cũ: đúng tập việc của GV đã lọc quyền; GV gọi nguoi= → 403', () => {
    const gv = gvcn('MB FT 101');
    const goc = new Set((myWork(loadPrincipal(gv)) as any).items.map((i: any) => i.key));
    const r = viecCuaNguoi(P.mbManager, gv) as any;
    assert(r.xemNguoiKhac === true && r.items.every((i: any) => goc.has(i.key)), 'mọi dòng thuộc việc của GV');
    assert(r.items.every((i: any) => (i.classId !== null || i.studentId !== null) && can(P.mbManager, PERMISSIONS.ATTEMPT_VIEW, { classId: i.classId, studentId: i.studentId })),
      'bỏ dòng không lớp/HV, lọc theo quyền người xem');
    assertThrows(() => viecCuaNguoi(P.subjectTeacher, gv), /chỉ xem được việc của mình/, 'GV gửi nguoi= → 403');
    const chiMb = dungGv('TMP-GV-MB2', 'MB', { lop: 'MB FT 101', den: null });
    try { assertThrows(() => viecCuaNguoi(P.cpManager, chiMb), /chi nhánh bạn quản lý/, 'QL CP xem GV chỉ ở MB → 403'); } finally { don(chiMb); }
  });

  check('PR-GV (2) · số = số dòng: tổng 4 nhóm của viecCuaGv = items của /my-work?nguoi=, chính mình = myWork', () => {
    const gv = gvcn('MB FT 101');
    const ql = viecCuaGv(P.mbManager, gv);
    const dong = (viecCuaNguoi(P.mbManager, gv) as any).items.length;
    assert(ql.length === 4 && ql.reduce((a, x) => a + x.n, 0) === dong, `tổng nhóm ${ql.reduce((a, x) => a + x.n, 0)} = ${dong} dòng`);
    const tuMinh = viecCuaGv(P.coreTeacher, gv);
    assert(tuMinh.reduce((a, x) => a + x.n, 0) === (myWork(P.coreTeacher) as any).items.length, 'GV tự xem = myWork(p)');
  });
}
