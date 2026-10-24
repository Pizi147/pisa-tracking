/** PHÉP KIỂM PR-GV — Hồ sơ giáo viên + số liệu theo giáo viên (không KPI, không xếp hạng). */
import type { YThucTestKit } from './yThuc.tests.ts';
import { can } from '../permissions.ts';
import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { COT_O_GV, demViecTheoNhom, duongViecCuaGv, laCotOGv } from '../../../shared/domain/hoSoGiaoVien.ts';

export async function runPrGvTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P, classId, TODAY, addDays } = t;
  const { phamViHoSoGv } = await import('../giaoVien/phamVi.ts');
  const { viecCuaGv, hoSoGiaoVien, viecHoSoGv, oHoSoGv, bangGvChiNhanh } = await import('../giaoVien/hoSo.ts');
  const { chiSoHoSoGv, oChiSoHoSoGv } = await import('../phanTich/giaoVien.ts');
  const { mondayOfDate: mondayOf } = await import('../../../shared/domain/index.ts');
  const { createApp } = await import('../app.ts');
  const { viecCuaNguoi, myWork } = await import('../worklist/mywork.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const gvcn = (ma: string) => get(`SELECT user_id AS id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 LIMIT 1`, classId(ma)).id as number;
  console.log('\nPR-GV · Hồ sơ giáo viên');

  check('PR-GV (1) · demViecTheoNhom: luôn đủ 4 nhóm đúng thứ tự, loại lạ rơi vào Vận hành', () => {
    const v = (key: string, group: string, urgency: string, kns?: string[]) => ({ key, group, urgency, studentId: null, kns });
    const r = demViecTheoNhom([v('a', 'score', 'overdue'), v('b', 'ghi_ket_qua_pa', 'normal'),
      v('c', 'yt_xem', 'today'), v('d', 'la', 'overdue')]);
    assert(JSON.stringify(r.map((x) => x.nhom)) === JSON.stringify(['cham-diem', 'case-hoc-thuat', 'y-thuc', 'van-hanh']), 'thứ tự NHOM_VIEC');
    assert(JSON.stringify(r.map((x) => [x.n, x.quaHan])) === JSON.stringify([[1, 1], [1, 0], [1, 0], [1, 1]]), 'n / quá hạn từng nhóm');
    assert(demViecTheoNhom([]).length === 4, 'rỗng vẫn đủ 4 dòng');
    /* CHAM-LAI: cùng đơn vị "việc" với Công việc — Nhập điểm L + R = 2 việc; S chấm chéo (`|cc`) không là việc. */
    const c = demViecTheoNhom([v('e', 'score', 'overdue', ['listening', 'reading']), v('f|cc', 'score', 'normal', ['speaking'])]);
    assert(c[0].n === 2 && c[0].quaHan === 2, `đơn vị việc: ${JSON.stringify(c[0])}`);
  });

  check('PR-GV (1) · duongViecCuaGv: QL có nguoi=id, tự xem có nguoi=toi, GV không có nguoi; có khung=tat-ca', () => {
    assert(duongViecCuaGv(7, { userId: 2, laQuanLy: true }, 'cham-diem', true) === '/cong-viec?nguoi=7&nhom=cham-diem&khung=tat-ca&loc=qua-han', 'QL xem GV');
    assert(duongViecCuaGv(7, { userId: 7, laQuanLy: false }, null) === '/cong-viec?khung=tat-ca', 'GV tự xem không có nguoi');
    assert(duongViecCuaGv(2, { userId: 2, laQuanLy: true }, 'y-thuc') === '/cong-viec?nguoi=toi&nhom=y-thuc&khung=tat-ca', 'QL tự xem = toi');
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
    /* OV-11c (PT-7): việc Vận hành giao cho GV (không lớp / HV) nay được tính; dòng khác vẫn lọc theo quyền người xem. */
    assert(r.items.every((i: any) => (i.group === 'mgmt' && i.classId === null && i.studentId === null)
      || ((i.classId !== null || i.studentId !== null) && can(P.mbManager, PERMISSIONS.ATTEMPT_VIEW, { classId: i.classId, studentId: i.studentId }))),
      'dòng không lớp/HV chỉ là việc Vận hành; lọc theo quyền người xem');
    assertThrows(() => viecCuaNguoi(P.subjectTeacher, gv), /chỉ xem được việc của mình/, 'GV gửi nguoi= → 403');
    const chiMb = dungGv('TMP-GV-MB2', 'MB', { lop: 'MB FT 101', den: null });
    try { assertThrows(() => viecCuaNguoi(P.cpManager, chiMb), /chi nhánh bạn quản lý/, 'QL CP xem GV chỉ ở MB → 403'); } finally { don(chiMb); }
  });

  check('PR-GV (2) · số = số dòng: tổng 4 nhóm của viecCuaGv = dong của /my-work?nguoi=, chính mình = myWork', () => {
    const gv = gvcn('MB FT 101');
    const ql = viecCuaGv(P.mbManager, gv);
    const dong = (viecCuaNguoi(P.mbManager, gv) as any).dong.length;
    assert(ql.length === 4 && ql.reduce((a, x) => a + x.n, 0) === dong, `tổng nhóm ${ql.reduce((a, x) => a + x.n, 0)} = ${dong} dòng`);
    const tuMinh = viecCuaGv(P.coreTeacher, gv);
    assert(tuMinh.reduce((a, x) => a + x.n, 0) === (myWork(P.coreTeacher) as any).dong.length, 'GV tự xem = myWork(p)');
  });

  // ------------------------------------------------------------------ Task 3 · hồ sơ GV + ô danh sách
  const vaoO = (ql: any, id: number, q: Record<string, unknown>) => oHoSoGv(ql, id, { cot: '', ...q } as any);
  const nhanDat = /(Đạt|Đạt kỳ vọng)$/;

  check('PR-GV (3) · quyền ô = quyền số tổng: GVBM/QL CP bị 403, cột lạ / ô lạ bị 400, ô kết quả của lớp không thuộc hồ sơ bị 403', () => {
    const gv = gvcn('MB FT 101');
    assertThrows(() => vaoO(P.subjectTeacher, gv, { cot: 'case-mo' }), /chính mình/, 'GVBM gọi ô của GVCN');
    assertThrows(() => hoSoGiaoVien(P.subjectTeacher, gv), /chính mình/, 'GVBM xem hồ sơ GVCN');
    assertThrows(() => viecHoSoGv(P.subjectTeacher, gv), /chính mình/, 'GVBM xem việc của GVCN');
    assert(viecHoSoGv(P.mbManager, gv).viec.length === 4, 'QL MB xem việc → đủ 4 nhóm');
    const chiMb = dungGv('TMP-GV-O', 'MB', { lop: 'MB FT 101', den: null });
    try { assertThrows(() => vaoO(P.cpManager, chiMb, { cot: 'case-mo' }), /chi nhánh bạn quản lý/, 'QL CP gọi ô của GV chỉ ở MB'); } finally { don(chiMb); }
    assertThrows(() => vaoO(P.mbManager, gv, { cot: 'kpi-bai' }), /Cột không hợp lệ/, 'cột KPI đã bỏ → 400');
    assertThrows(() => vaoO(P.mbManager, gv, { cot: 'ket-qua' }), /Cột không hợp lệ/, 'UI-HO-SO-GV: ô "mốc gần nhất của lớp" đã bỏ (P8) → 400');
    assertThrows(() => vaoO(P.mbManager, gv, { cot: 'chua-nhap', lop: 99999999 }), /không nằm trong danh sách lớp/, 'lớp ngoài hồ sơ → 403');
    assertThrows(() => vaoO(P.mbManager, gv, { cot: 'case-mo', cn: 999999 }), /ngoài phạm vi/, 'cn ngoài phạm vi → 403');
  });

  check('PR-GV (3) · phạm vi QL: QL MB chỉ thấy lớp/Case MB, Quản trị thấy thêm lớp CP của cùng GV (GV tạm có vai MB, dạy lớp MB và lớp CP)', () => {
    const gv = dungGv('TMP-GV-2CN', 'MB', { lop: 'MB FT 101', den: null });
    try {
      const lopCp = get(`SELECT c.id FROM classes c JOIN branches b ON b.id = c.branch_id WHERE b.code = 'CP' AND c.status = 'active' ORDER BY c.id LIMIT 1`).id as number;
      conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, effective_to, status, created_at)
        VALUES (?, ?, 'reading', 0, ?, NULL, 'active', ?)`).run(gv, lopCp, addDays(TODAY, -30), TODAY);
      const mb = hoSoGiaoVien(P.mbManager, gv);
      const qt = hoSoGiaoVien(P.admin, gv);
      assert(mb.lop.length === 1 && mb.lop[0].id === classId('MB FT 101'), 'QL MB: chỉ lớp MB');
      assert(qt.lop.length === 2 && qt.lop.some((l) => l.id === lopCp), 'Quản trị thấy thêm lớp CP');
      assert(mb.phamVi.chiNhanh?.length === 1 && qt.phamVi.chiNhanh === null, 'phạm vi ghi đúng: QL một chi nhánh, Quản trị mọi chi nhánh');
      assert(vaoO(P.mbManager, gv, { cot: 'lop' }).n === 1 && vaoO(P.admin, gv, { cot: 'lop' }).n === 2, 'ô "Lớp" cùng phạm vi với số');
      assertThrows(() => vaoO(P.mbManager, gv, { cot: 'chua-nhap', lop: lopCp }), /không nằm trong danh sách lớp/, 'QL MB không mở được ô của lớp CP');
    } finally { don(gv); }
  });

  check('PR-GV (3) · số ở ô = số dòng khi bấm — QL MB và Quản trị xem GVCN (lớp, ô nợ, quá hạn, Case, yêu cầu, kết quả)', () => {
    const gv = gvcn('MB FT 101');
    let coKetQua = 0;
    for (const nguoiXem of [P.mbManager, P.admin]) {
      const h = hoSoGiaoVien(nguoiXem, gv);
      const chuaNhap = h.lop.reduce((a, l) => a + l.chuaNhap, 0);
      const quaHan = h.lop.reduce((a, l) => a + l.quaHan, 0);
      assert(vaoO(nguoiXem, gv, { cot: 'chua-nhap' }).rows.length === chuaNhap, `ô chưa nhập ${chuaNhap}`);
      assert(vaoO(nguoiXem, gv, { cot: 'qua-han' }).rows.length === quaHan, `ô quá hạn ${quaHan}`);
      for (const l of h.lop) {
        assert(vaoO(nguoiXem, gv, { cot: 'chua-nhap', lop: l.id }).n === l.chuaNhap, `${l.ma}: chưa nhập theo lớp`);
        assert(vaoO(nguoiXem, gv, { cot: 'qua-han', lop: l.id }).n === l.quaHan, `${l.ma}: quá hạn theo lớp`);
      }
      assert(vaoO(nguoiXem, gv, { cot: 'lop' }).n === h.lop.length, 'số lớp');
      assert(vaoO(nguoiXem, gv, { cot: 'hoc-vien' }).n === h.tongHocVien, 'học viên khác nhau');
      const ids = new Set(vaoO(nguoiXem, gv, { cot: 'chua-nhap' }).rows.map((r: any) => r.id));
      assert(ids.size === chuaNhap, 'id dòng ô nợ duy nhất');
      assert(vaoO(nguoiXem, gv, { cot: 'case-mo' }).n === h.caseMo.length, 'Case mở');
      assert(vaoO(nguoiXem, gv, { cot: 'case-qua-han' }).n === h.caseMo.filter((c) => c.quaHan).length, 'Case quá hạn');
      assert(vaoO(nguoiXem, gv, { cot: 'yc-cho' }).n === h.yeuCau.cho, 'yêu cầu chờ duyệt');
      assert(vaoO(nguoiXem, gv, { cot: 'yc-tu-choi' }).n === h.yeuCau.tuChoi, 'yêu cầu bị từ chối');
      /* UI-HO-SO-GV (P8): kết quả theo lượt từng HV trong kỳ — `hocThuatTheoLop`, ô lớp = panel `ket-qua-lop:<lớp>` / `tien-bo-lop:<lớp>`. */
      const ky = { tu: addDays(mondayOf(TODAY), -7 * 12), den: mondayOf(TODAY) };
      for (const h2 of chiSoHoSoGv(nguoiXem, gv, ky).hocThuatTheoLop) {
        for (const [cot, o] of [['ket-qua-lop', h2.ketQua], ['tien-bo-lop', h2.tienBo]] as const) {
          if (o.k !== 'so') continue;
          const r = oChiSoHoSoGv(nguoiXem, gv, { ...ky, cot: `${cot}:${h2.classId}` });
          /* Panel gộp các mục cùng một lượt thành một dòng (chủ SP 23/10) — tiêu đề giữ đúng tử / mẫu của ô; Đạt + Chưa đạt = mọi dòng. */
          assert(r.tieuDe.includes(`${o.dung}/${o.tong}`) && r.n >= 1 && r.n <= o.tong, `${h2.ma} ${cot}: ${r.tieuDe} · ${r.n} dòng ≠ ${o.dung}/${o.tong}`);
          const dat = oChiSoHoSoGv(nguoiXem, gv, { ...ky, cot: `${cot}:${h2.classId}`, loc: 'dat' }).n, chua = oChiSoHoSoGv(nguoiXem, gv, { ...ky, cot: `${cot}:${h2.classId}`, loc: 'chua' }).n;
          assert(dat + chua === r.n, `${h2.ma} ${cot}: lọc Đạt ${dat} + Chưa đạt ${chua} ≠ ${r.n}`);
          coKetQua += 1;
        }
      }
    }
    assert(coKetQua > 0, 'phép kiểm không rỗng: có ít nhất một ô kết quả có điểm');
  });

  check('PR-GV (3) · kyNang chỉ mã trong ENTRY_SKILLS (L R W1 W2 S), đúng thứ tự', () => {
    const h = hoSoGiaoVien(P.admin, P.w2Teacher.userId);
    const thuTu = ['L', 'R', 'W1', 'W2', 'S'];
    assert(h.gv.kyNang.join() === thuTu.filter((k) => h.gv.kyNang.includes(k)).join(), `kyNang ${h.gv.kyNang.join(',')}`);
  });

  await t.checkAsync('PR-GV (3) · qua HTTP: :id/lop/cn sai → 400, id lạ → 404, GVBM → 403, chính mình / QL → 200', async () => {
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    const phien = new Map<number, string>();
    const goi = async (userId: number, url: string) => {
      if (!phien.has(userId)) {
        const r = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
        phien.set(userId, (r.headers.get('set-cookie') ?? '').split(';')[0]);
      }
      const r = await fetch(`http://127.0.0.1:${cong}/api${url}`, { headers: { cookie: phien.get(userId)! } });
      if (r.status >= 500) throw new Error(`${url} → ${r.status} ${(await r.text()).slice(0, 300)}`);
      return r.status;
    };
    try {
      const gv = gvcn('MB FT 101');
      const ql = P.mbManager.userId;
      assert(await goi(ql, '/giao-vien/abc') === 400, ':id chữ → 400');
      assert(await goi(ql, '/giao-vien/0') === 400, ':id 0 → 400');
      assert(await goi(ql, '/giao-vien/999999') === 404, 'id lạ → 404');
      assert(await goi(P.subjectTeacher.userId, `/giao-vien/${gv}`) === 403, 'GVBM xem GVCN → 403');
      assert(await goi(gv, `/giao-vien/${gv}`) === 200, 'GVCN xem mình → 200');
      assert(await goi(ql, `/giao-vien/${gv}`) === 200, 'QL MB xem GV chi nhánh mình → 200');
      for (const khoi of ['viec', 'chi-so']) {
        assert(await goi(gv, `/giao-vien/${gv}/${khoi}`) === 200 && await goi(ql, `/giao-vien/${gv}/${khoi}`) === 200, `${khoi}: chính mình / QL → 200`);
        assert(await goi(P.subjectTeacher.userId, `/giao-vien/${gv}/${khoi}`) === 403 && await goi(ql, `/giao-vien/999999/${khoi}`) === 404, `${khoi}: GVBM → 403, id lạ → 404`);
      }
      assert(await goi(ql, `/giao-vien/${gv}/o?cot=kpi-bai`) === 400, 'cột lạ → 400');
      assert(await goi(ql, `/giao-vien/${gv}/o?cot=lop&lop=x`) === 400, 'lop chữ → 400');
      assert(await goi(ql, `/giao-vien/${gv}/o?cot=chua-nhap&cn=-1`) === 400, 'cn âm → 400');
      assert(await goi(P.subjectTeacher.userId, `/giao-vien/${gv}/o?cot=case-mo`) === 403, 'ô: GVBM → 403');
    } finally { may.close(); }
  });

  // ------------------------------------------------------------------ Task 4 · bảng giáo viên của chi nhánh
  const mbId = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const cpId = get(`SELECT id FROM branches WHERE code = 'CP'`).id as number;
  const KHUNG = ['ft', 'thuong'] as const;

  check('PR-GV (4) · phủ định: GV → 403, QL CP xem cn MB → 403, Quản trị thiếu cn → 400, QL một chi nhánh tự lấy chi nhánh mình', () => {
    assertThrows(() => bangGvChiNhanh(P.normalCoreTeacher, { cn: mbId }), /Chỉ Quản lý và Quản trị/, 'GVCN → 403');
    assertThrows(() => bangGvChiNhanh(P.subjectTeacher, { cn: mbId }), /Chỉ Quản lý và Quản trị/, 'GVBM → 403');
    assertThrows(() => bangGvChiNhanh(P.cpManager, { cn: mbId }), /ngoài phạm vi/, 'QL CP xem MB → 403');
    assertThrows(() => bangGvChiNhanh(P.admin, {}), /Chọn một chi nhánh/, 'Quản trị thiếu cn → 400');
    assertThrows(() => bangGvChiNhanh(P.admin, { cn: 999999 }), /Không tìm thấy chi nhánh/, 'cn lạ → 404');
    assert(bangGvChiNhanh(P.mbManager, {}).cn === mbId, 'QL MB không gửi cn → dùng MB');
  });

  check('PR-GV (4) · không xếp hạng: hàng sắp theo tên, không hàng/trường tổng hay trung bình; mỗi người một hàng', () => {
    const b = bangGvChiNhanh(P.mbManager, { cn: mbId, ct: 'ft' });
    assert(b.hang.length > 0, 'có hàng');
    const ten = b.hang.map((h) => h.ten);
    assert(JSON.stringify(ten) === JSON.stringify([...ten].sort((x, y) => x.localeCompare(y, 'vi'))), 'sắp theo tên');
    assert(new Set(b.hang.map((h) => h.id)).size === b.hang.length, 'mỗi người một hàng');
    /* PR-UXF-a Q8: `chuaPhanCong` = bài môn chưa phân công (không phải người, không phải tổng). */
    assert(Object.keys(b).join() === 'cn,tenChiNhanh,ct,hang,chuaPhanCong' && b.hang.every((h) => Object.keys(h).join() === 'id,ten,lop,hocVien,chuaNhap,quaHan,caseMo,caseQuaHan'), 'không trường tổng/trung bình/xếp hạng');
    assert(b.hang.every((h) => h.lop || h.chuaNhap || h.caseMo), 'bỏ hàng toàn 0');
  });

  check('PR-GV (4) · số ở bảng = số dòng khi bấm (ô danh sách cùng cn/ct) và = hồ sơ của người đó — mọi khung', () => {
    let coSo = 0;
    /* PR-Pb2-a: bảng theo từng khung, hồ sơ GV gộp → cộng hai khung của một người = hồ sơ người đó. */
    const cong = new Map<number, { ten: string; lop: number; chuaNhap: number; quaHan: number; caseMo: number; caseQuaHan: number }>();
    for (const ct of KHUNG) {
      const b = bangGvChiNhanh(P.mbManager, { cn: mbId, ct });
      for (const h of b.hang) {
        const o = (cot: string) => vaoO(P.mbManager, h.id, { cot, cn: mbId, ct }).n;
        assert(o('lop') === h.lop, `${h.ten}/${ct}: lớp`);
        assert(o('hoc-vien') === h.hocVien, `${h.ten}/${ct}: học viên`);
        assert(o('chua-nhap') === h.chuaNhap && o('qua-han') === h.quaHan, `${h.ten}/${ct}: ô nợ`);
        assert(o('case-mo') === h.caseMo && o('case-qua-han') === h.caseQuaHan, `${h.ten}/${ct}: Case`);
        coSo += h.chuaNhap + h.caseMo + h.hocVien;
        const x = cong.get(h.id) ?? { ten: h.ten, lop: 0, chuaNhap: 0, quaHan: 0, caseMo: 0, caseQuaHan: 0 };
        for (const k of ['lop', 'chuaNhap', 'quaHan', 'caseMo', 'caseQuaHan'] as const) x[k] += h[k];
        cong.set(h.id, x);
      }
    }
    for (const [id, h] of cong) {
      const ho = hoSoGiaoVien(P.mbManager, id);
      assert(ho.lop.length === h.lop && ho.lop.reduce((a, l) => a + l.chuaNhap, 0) === h.chuaNhap && ho.lop.reduce((a, l) => a + l.quaHan, 0) === h.quaHan, `${h.ten}: hồ sơ (gộp) khớp FT + Lớp thường của bảng (lớp, ô nợ)`);
      assert(ho.caseMo.length === h.caseMo && ho.caseMo.filter((c) => c.quaHan).length === h.caseQuaHan, `${h.ten}: hồ sơ (gộp) khớp FT + Lớp thường của bảng (Case)`);
    }
    assert(coSo > 0, 'phép kiểm không rỗng');
  });

  await t.checkAsync('PR-GV (4) · không N+1: thêm 3 GV + 2 lớp + phân công + 3 Case mở có người phụ trách → số câu SQL của bảng KHÔNG đổi', async () => {
    const cotCua = (bang: string) => (conn.prepare(`PRAGMA table_info(${bang})`).all() as any[]).map((c) => c.name as string).filter((c) => c !== 'id');
    const chep = (bang: string, goc: any, ghiDe: Record<string, unknown>) => {
      const cot = cotCua(bang);
      return Number(conn.prepare(`INSERT INTO ${bang} (${cot.join(',')}) VALUES (${cot.map(() => '?').join(',')})`).run(...cot.map((c) => (c in ghiDe ? ghiDe[c] : goc[c]))).lastInsertRowid);
    };
    const dem = () => {
      let n = 0;
      const goc = conn.prepare;
      const co = Object.prototype.hasOwnProperty.call(conn, 'prepare');
      conn.prepare = function (this: unknown, sql: string, ...r: unknown[]) { n += 1; return goc.call(this, sql, ...r); };
      try { bangGvChiNhanh(P.admin, { cn: mbId, ct: 'ft' }); } finally { if (co) conn.prepare = goc; else delete (conn as any).prepare; }
      return n;
    };
    const truoc = dem();
    const gvs: number[] = [], lops: number[] = [], cases: number[] = [];
    try {
      for (let i = 0; i < 3; i++) gvs.push(dungGv(`TMP-NP1-${i}`, 'MB', null));
      const lopGoc = get(`SELECT * FROM classes WHERE id = ?`, classId('MB FT 101'));
      for (let i = 0; i < 2; i++) lops.push(chep('classes', lopGoc, { code: `TMP-NP1-LOP-${i}` }));
      for (const [i, gv] of gvs.entries()) conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, effective_to, status, created_at) VALUES (?, ?, 'listening', 0, ?, NULL, 'active', ?)`).run(gv, lops[i % 2], addDays(TODAY, -30), TODAY);
      const caseGoc = get(`SELECT * FROM sos_cases WHERE status != 'done' ORDER BY id LIMIT 1`);
      for (const [i, gv] of gvs.entries()) cases.push(chep('sos_cases', caseGoc, { owner_user_id: gv, dedup_key: `TMP-NP1-${i}` }));
      const sau = dem();
      assert(sau === truoc, `số câu SQL đổi khi thêm dữ liệu: ${truoc} → ${sau} (N+1)`);
      const b = bangGvChiNhanh(P.admin, { cn: mbId, ct: 'ft' });
      assert(gvs.every((id) => b.hang.some((h) => h.id === id)), 'GV mới có mặt ở bảng (phép kiểm không rỗng)');
    } finally {
      for (const id of cases) conn.prepare(`DELETE FROM sos_cases WHERE id = ?`).run(id);
      for (const gv of gvs) don(gv);
      for (const id of lops) conn.prepare(`DELETE FROM classes WHERE id = ?`).run(id);
    }
  });

  await t.checkAsync('PR-GV (4) · qua HTTP: GVBM → 403, QL MB → 200, cn chữ → 400, đường /giao-vien không đụng /giao-vien/:id', async () => {
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    const phien = new Map<number, string>();
    const goi = async (userId: number, url: string) => {
      if (!phien.has(userId)) {
        const r = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
        phien.set(userId, (r.headers.get('set-cookie') ?? '').split(';')[0]);
      }
      const r = await fetch(`http://127.0.0.1:${cong}/api${url}`, { headers: { cookie: phien.get(userId)! } });
      return { status: r.status, body: await r.json().catch(() => null) as any };
    };
    try {
      assert((await goi(P.subjectTeacher.userId, `/giao-vien?cn=${mbId}`)).status === 403, 'GVBM → 403');
      assert((await goi(P.cpManager.userId, `/giao-vien?cn=${mbId}`)).status === 403, 'QL CP xem MB → 403');
      assert((await goi(P.mbManager.userId, '/giao-vien?cn=abc')).status === 400, 'cn chữ → 400');
      assert((await goi(P.admin.userId, '/giao-vien')).status === 400, 'Quản trị thiếu cn → 400');
      const ok = await goi(P.mbManager.userId, `/giao-vien?cn=${mbId}&ct=ft`);
      assert(ok.status === 200 && Array.isArray(ok.body.hang) && ok.body.ct === 'ft', 'QL MB → 200, đúng khung');
      assert((await goi(P.admin.userId, `/giao-vien?cn=${cpId}`)).status === 200, 'Quản trị xem chi nhánh khác → 200');
    } finally { may.close(); }
  });

  // ------------------------------------------------------------------ Task 5–6 · giao diện (quét mã nguồn — web không có bộ kiểm riêng)
  await t.checkAsync('PR-GV (5) · HoSoGiaoVienPage: không KPI / không nút sắp xếp / không màu viết cứng / chữ >= 12 px / tuần viết mã; OSo nhận nhan', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const REPO = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
    const doc = (f: string) => fs.readFileSync(path.join(REPO, 'web/src', f), 'utf-8');
    const trang = doc('modules/giaoVien/HoSoGiaoVienPage.tsx');
    assert(!/kpi/i.test(trang), 'không KPI (Q30-5)');
    assert(!/\bsort=|onSort/.test(trang), 'không nút sắp xếp — không xếp hạng');
    assert(!/#[0-9a-fA-F]{3,8}\b|\bwhite\b|color-mix|rgb\(\d/.test(trang), 'chỉ token màu, không màu viết cứng');
    assert(!/text-\[(?:[0-9]|1[01])(?:\.\d+)?px\]/.test(trang), 'chữ >= 12 px');
    assert(/tuanLich\(/.test(trang), 'tuần hiện mã (W2 OCT)');
    assert(!/'progress'|writing1|attempt_no/.test(trang), 'không lộ mã kỹ thuật');
    assert(/nhan\?: string/.test(doc('ui/OSo.tsx')), 'OSo có prop nhan');
    assert(/path="\/giao-vien\/:id"/.test(doc('App.tsx')), 'route /giao-vien/:id');
  });
  await t.checkAsync('PR-GV (6) · bảng GV chi nhánh không xếp hạng; BranchPulse dùng BangGiaoVienChiNhanh; menu tài khoản có Hồ sơ giáo viên; bảng quyền ghi quyền dẫn xuất', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const REPO = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
    const doc = (f: string) => fs.readFileSync(path.join(REPO, 'web/src', f), 'utf-8');
    const bang = doc('modules/giaoVien/BangGiaoVienChiNhanh.tsx');
    assert(!/\bsort=|onSort|kpi/i.test(bang), 'bảng không nút sắp xếp, không KPI');
    assert(!/#[0-9a-fA-F]{3,8}\b|\bwhite\b|color-mix|text-bad|text-ok/.test(bang), 'không màu viết cứng, không màu tốt/xấu cho người');
    /* UI-TONG-QUAN: BranchPulse (Tổng quan CX cũ) đã gỡ — bảng GV chi nhánh còn ở Phân tích. */
    const header = doc('modules/platform/Header.tsx');
    assert(/roles\?\.includes\('teacher'\)/.test(header) && header.includes('/giao-vien/'), 'menu tài khoản: Hồ sơ giáo viên cho vai Giáo viên');
    assert(doc('modules/platform/AdminPage.tsx').includes('Quyền dẫn xuất'), 'bảng quyền ghi quyền dẫn xuất (K1-53)');
  });
}
