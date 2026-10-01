/** PHÉP KIỂM PR-VAI-b — hồ sơ học viên "hiểu trong 30 giây" (kế hoạch 2026-10-01-pr-vai-b-ho-so-hoc-vien). */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrVaiBTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const { studentProfile } = await import('../students/profile.ts');
  const { khoangTamDung } = await import('../students/tamDung.ts');
  console.log('\nPR-VAI-b · Hồ sơ học viên 30 giây');

  const demTruyVan = (fn: () => void): number => {
    let n = 0;
    const goc = conn.prepare.bind(conn);
    (conn as any).prepare = (sql: string) => { n += 1; return goc(sql); };
    try { fn(); } finally { (conn as any).prepare = goc; }
    return n;
  };
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const thu2 = d.mondayOfDate(TODAY) as string;
  /**
   * Em CỦA BỘ DEMO đang học lớp `ma`, "sạch": lớp này là ghi danh đang học MỚI NHẤT (`activeClassOf`), lộ trình đang chạy có tuần bắt đầu,
   * chưa từng Tạm dừng — các phép kiểm chạy trước có thể đã chuyển lớp / tạm dừng / thêm ghi danh lệch cho em demo.
   */
  const SACH = `FROM enrollments e JOIN students s ON s.id = e.student_id
    WHERE e.class_id = ? AND e.status = 'active' AND s.status = 'active' AND s.id <= ?
      AND e.id = (SELECT MAX(e2.id) FROM enrollments e2 WHERE e2.student_id = s.id AND e2.status = 'active')
      AND EXISTS (SELECT 1 FROM learning_cycles cy WHERE cy.student_id = s.id AND cy.status = 'active' AND cy.start_period_id IS NOT NULL)
      AND NOT EXISTS (SELECT 1 FROM journey_events j WHERE j.student_id = s.id AND j.event_type IN ('pause', 'resume'))`;
  const emCuaLop = (ma: string) => (get(`SELECT e.student_id id ${SACH} ORDER BY e.student_id LIMIT 1`, classId(ma), seedMax.students)).id as number;
  /** Ghi nhật ký Tạm dừng / Quay lại tạm cho phép kiểm, xoá sau khi chạy. */
  const voiNhatKy = (sid: number, ev: [string, string][], fn: () => void) => {
    const ids = ev.map(([loai, ngay]) => Number(conn.prepare(
      `INSERT INTO journey_events (student_id, event_type, event_date, title, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(sid, loai, ngay, loai === 'pause' ? 'Tạm dừng học' : 'Quay lại học', P.mbManager.userId, `${TODAY}T00:00:00Z`).lastInsertRowid));
    try { fn(); } finally { conn.prepare(`DELETE FROM journey_events WHERE id IN (${ids.map(() => '?').join(',')})`).run(...ids); }
  };

  // ------------------------------------------------------------------ khối 1 · tuần học thứ n + khoảng Tạm dừng + dòng thông tin
  check('VAI-b (1) · chuTuanHoc: lớp thường "tuần học 3/8", FT "tuần học thứ 9" (không mẫu số)', () => {
    assert(d.chuTuanHoc(3, 8) === 'tuần học 3/8', d.chuTuanHoc(3, 8));
    assert(d.chuTuanHoc(9, null) === 'tuần học thứ 9', d.chuTuanHoc(9, null));
  });

  check('VAI-b (1) · tuanHocFt: bỏ tuần Tạm dừng; tuần đang dừng / trước tuần bắt đầu → null; dừng và quay lại cùng tuần → không trừ', () => {
    const w = (n: number) => addDays(thu2, n * 7);
    assert(d.tuanHocFt(w(-10), thu2, []) === 11, 'không dừng: 10 tuần trước → tuần thứ 11');
    /* Bắt đầu 10 tuần trước, dừng 2 tuần (Thứ Tư tuần −6 → Thứ Năm tuần −4) → 9. */
    const hai = [{ tu: addDays(w(-6), 2), den: addDays(w(-4), 3) }];
    assert(d.tuanHocFt(w(-10), thu2, hai) === 9, `dừng 2 tuần: ${d.tuanHocFt(w(-10), thu2, hai)}`);
    assert(d.tuanHocFt(w(-10), w(-5), hai) === null, 'tuần nằm trong khoảng dừng → null');
    assert(d.tuanHocFt(w(-10), w(-4), hai) === 5, `tuần Quay lại được đếm: ${d.tuanHocFt(w(-10), w(-4), hai)}`);
    const dang = [{ tu: w(-3), den: null }];
    assert(d.tuanHocFt(w(-10), w(-4), dang) === 7, 'dừng chưa quay lại: đếm tới tuần trước tuần dừng');
    assert(d.tuanHocFt(w(-10), thu2, dang) === null, 'dừng chưa quay lại: tuần này → null');
    assert(d.tuanHocFt(w(-10), w(-11), []) === null, 'trước tuần bắt đầu → null');
    assert(d.tuanHocFt(w(-10), thu2, [{ tu: addDays(w(-5), 1), den: addDays(w(-5), 4) }]) === 11, 'dừng và quay lại cùng tuần → không trừ');
    assert(d.tuanHocFt(addDays(w(-10), 3), addDays(thu2, 4), []) === 11, 'ngày giữa tuần quy về Thứ Hai');
  });

  check('VAI-b (1) · khoangTamDung: MỘT câu SQL cho nhiều em; ghép cặp theo ngày; đang dừng → den null; em không dừng → không có khoá', () => {
    const [a, b, c] = all(`SELECT id FROM students WHERE id NOT IN (SELECT student_id FROM journey_events WHERE event_type IN ('pause', 'resume'))
      ORDER BY id LIMIT 3`).map((r) => r.id as number);
    voiNhatKy(a, [['pause', '2026-08-31'], ['resume', '2026-09-14']], () => voiNhatKy(b, [['pause', '2026-09-07']], () => {
      let kq: any;
      const n = demTruyVan(() => { kq = khoangTamDung([a, b, c]); });
      assert(n === 1, `một câu SQL (${n})`);
      assert(kq[a]?.length === 1 && kq[a][0].tu === '2026-08-31' && kq[a][0].den === '2026-09-14', JSON.stringify(kq[a]));
      assert(kq[a][0].boiId === P.mbManager.userId, 'boiId = người ghi');
      assert(kq[b]?.length === 1 && kq[b][0].den === null, JSON.stringify(kq[b]));
      assert(!(c in kq), 'em không dừng → không có khoá');
    }));
  });

  check('VAI-b (1) · studentProfile: FT "tuần học thứ n" = tuanHocFt (tuần bắt đầu lộ trình, bỏ tuần dừng); lớp thường tong = số tuần khoá; không FT nào tong 16', () => {
    const ft = emCuaLop('MB FT 101');
    const cy = get(`SELECT cy.*, rp.week_start FROM learning_cycles cy LEFT JOIN report_periods rp ON rp.id = cy.start_period_id
      WHERE cy.student_id = ? AND cy.status = 'active'`, ft);
    const batDau = cy.week_start ?? cy.started_at;
    const tt = (studentProfile(P.admin, ft) as any).dauHoSo.thongTin;
    const mong = d.tuanHocFt(batDau, thu2, khoangTamDung([ft])[ft] ?? []);
    assert(tt.tuanHoc && tt.tuanHoc.tong === null && tt.tuanHoc.tuan === mong, `FT: ${JSON.stringify(tt.tuanHoc)} ≠ ${mong}`);
    assert(tt.lop === 'MB FT 101' && tt.loTrinh === cy.route && tt.gvcn, `dòng thông tin FT: ${JSON.stringify(tt)}`);
    /* Dừng 2 tuần rồi quay lại → số giảm đúng 2 (một luật đếm với PR-UXF-a). */
    voiNhatKy(ft, [['pause', addDays(thu2, -21)], ['resume', addDays(thu2, -7)]], () => {
      const t2 = (studentProfile(P.admin, ft) as any).dauHoSo.thongTin.tuanHoc;
      assert(t2.tuan === mong - 2, `dừng 2 tuần: ${t2.tuan} ≠ ${mong - 2}`);
    });
    for (const r of all(`SELECT e.student_id id FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE e.status = 'active' AND c.is_fast_track = 1 LIMIT 12`)) {
      const x = (studentProfile(P.admin, r.id) as any).dauHoSo.thongTin;
      assert(x.tuanHoc === null || x.tuanHoc.tong === null, `em ${r.id} FT có tong ${x.tuanHoc?.tong}`);
      assert(!JSON.stringify(x).includes('/16'), `em ${r.id}: có "/16"`);
    }
    /* Lớp thường: em demo đang học một lớp thường bất kỳ có khoá đang chạy (các phép kiểm trước có thể đã chuyển em MB FOU 12). */
    const th = all(`SELECT e.student_id id FROM enrollments e JOIN students s ON s.id = e.student_id JOIN classes c ON c.id = e.class_id
      WHERE e.status = 'active' AND s.status = 'active' AND s.id <= ? AND c.is_fast_track = 0 AND c.start_period_id IS NOT NULL
        AND e.id = (SELECT MAX(e2.id) FROM enrollments e2 WHERE e2.student_id = s.id AND e2.status = 'active')
      ORDER BY s.id`, seedMax.students).map((r) => r.id as number)
      .find((id) => (studentProfile(P.admin, id) as any).currentClass?.khoa?.tuanHienTai >= 1);
    assert(th, 'bộ demo phải còn em lớp thường đang học khoá đã khai giảng');
    const x = (studentProfile(P.admin, th!) as any);
    const tt2 = x.dauHoSo.thongTin;
    assert(tt2.tuanHoc && tt2.tuanHoc.tong === x.currentClass.khoa.tongTuan && tt2.target === null, `lớp thường: ${JSON.stringify(tt2)}`);
    assert(tt2.thiDuKien?.nhan === 'Cuối khoá' && /^W\d [A-Z]{3}/.test(tt2.thiDuKien.gt), `Cuối khoá mã tuần: ${JSON.stringify(tt2.thiDuKien)}`);
  });

  check('VAI-b (1) · em Tạm dừng: tamDung { tu, lyDo, boi }, tuần học đứng ở tuần trước ngày dừng ("đang dừng")', () => {
    const ft = emCuaLop('MB FT 101');
    const truoc = (studentProfile(P.admin, ft) as any).dauHoSo.thongTin.tuanHoc.tuan as number;
    conn.prepare(`UPDATE students SET status = 'inactive' WHERE id = ?`).run(ft);
    try {
      voiNhatKy(ft, [['pause', thu2]], () => {
        conn.prepare(`UPDATE journey_events SET detail = 'gia đình đi xa' WHERE student_id = ? AND event_type = 'pause' AND event_date = ?`).run(ft, thu2);
        const tt = (studentProfile(P.admin, ft) as any).dauHoSo.thongTin;
        assert(tt.tamDung?.tu === thu2 && tt.tamDung.lyDo === 'gia đình đi xa' && tt.tamDung.boi, JSON.stringify(tt.tamDung));
        assert(tt.tuanHoc?.dangDung === true && tt.tuanHoc.tuan === truoc - 1, `đang dừng: ${JSON.stringify(tt.tuanHoc)} (trước ${truoc})`);
      });
    } finally { conn.prepare(`UPDATE students SET status = 'active' WHERE id = ?`).run(ft); }
  });

  check('VAI-b (1) · PHỦ ĐỊNH: Quản lý chi nhánh CP mở hồ sơ em MB → bị chặn', () => {
    assertThrows(() => studentProfile(P.cpManager, emCuaLop('MB FT 101')), /phạm vi/, 'QL CP xem em MB');
  });

  // ------------------------------------------------------------------ khối 2 · việc của em theo người (K3-01, Q2, Q3)
  const { myWork } = await import('../worklist/mywork.ts');
  const { skillSupportBoard } = await import('../cases/cases.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const viecCua = (p: any, sid: number) => (studentProfile(p, sid) as any).dauHoSo.viec as { cuaBan: any[]; nguoiKhac: any[] };
  const emLop = (ma: string) => all(`SELECT e.student_id id ${SACH} ORDER BY e.student_id`, classId(ma), seedMax.students).map((r) => r.id as number);
  const NHOM_HOC_VIEN = new Set(['cause', 'xac_nhan_pa', 'result', 'ke_hoach_bo_tro', 'phoi_hop', 'mini_test', 'yt_xu_ly']);
  const LOAI_HOC_VIEN = new Set(['nguyen-nhan', 'xac-nhan-pa', 'ghi-ket-qua', 'ke-hoach', 'bao-ph', 'mini-test', 'y-thuc']);

  check('VAI-b (2) · nguoiLam của Case (Q3): chờ nguyên nhân → người phụ trách; PA chạy chờ ghi kết quả → người ghi PA (thiếu thì recorded_by); không ai phụ trách → null; có tên', () => {
    let chu = 0, ghi = 0, rong = 0;
    for (const sid of emLop('MB FT 101')) {
      for (const r of (skillSupportBoard(P.admin, sid) as any).rows) {
        for (const c of r.cases.filter((x: any) => x.status !== 'done' && x.viecTiep)) {
          const sc = get('SELECT owner_user_id FROM sos_cases WHERE id = ?', c.id);
          if (c.viecTiep.chu === 'Xác nhận nguyên nhân') {
            chu++;
            assert((c.nguoiLam?.id ?? null) === (sc.owner_user_id ?? null), `Case ${c.id}: nguoiLam ${JSON.stringify(c.nguoiLam)} ≠ owner ${sc.owner_user_id}`);
            if (!sc.owner_user_id) rong++;
          } else if (c.viecTiep.paId) {
            ghi++;
            const iv = get('SELECT COALESCE(performer_user_id, recorded_by) u FROM case_interventions WHERE id = ?', c.viecTiep.paId);
            assert((c.nguoiLam?.id ?? null) === (iv.u ?? null), `Case ${c.id}: nguoiLam ${JSON.stringify(c.nguoiLam)} ≠ người ghi PA ${iv.u}`);
          }
          if (c.nguoiLam?.id) assert(typeof c.nguoiLam.ten === 'string' && c.nguoiLam.ten.length > 0, `Case ${c.id}: thiếu tên người làm`);
        }
      }
    }
    assert(chu + ghi > 0, `bộ demo MB FT 101 phải có Case chờ nguyên nhân hoặc PA chạy (${chu}/${ghi})`);
  });

  check('VAI-b (2) · HAI ĐƯỜNG: việc "của tôi" ở Công việc (myWork) của em = việc cuaBan ở đầu hồ sơ (cùng khoá, cùng người làm) — GVBM W2, GVCN FT 101, GVCN FOU 12', () => {
    let so = 0;
    for (const [ten, p, lop] of [['GVBM W2', P.w2Teacher, 'MB FT 101'], ['GVCN FT', P.coreTeacher, 'MB FT 101'], ['GVCN FOU', P.normalCoreTeacher, 'MB FOU 12']] as const) {
      const ems = new Set(emLop(lop));
      const cuaToi = (myWork(p, {}) as any).items.filter((it: any) => it.mine && NHOM_HOC_VIEN.has(it.group) && ems.has(it.studentId));
      const theoEm = new Map<number, { cuaBan: any[]; nguoiKhac: any[] }>();
      const v = (sid: number) => theoEm.get(sid) ?? theoEm.set(sid, viecCua(p, sid)).get(sid)!;
      for (const it of cuaToi) {
        const x = v(it.studentId).cuaBan.find((y) => y.key === it.key);
        assert(x, `${ten}: ${it.key} (${it.tieuDe}) có ở Công việc mà không có ở đầu hồ sơ em ${it.studentId}: ${JSON.stringify(v(it.studentId).cuaBan.map((y) => y.key))}`);
        assert(x.nguoi.id === (it.ownerId ?? p.userId), `${ten}: ${it.key} người làm ${x.nguoi.id} ≠ ${it.ownerId}`);
        so++;
      }
      /* Ngược lại: việc cuaBan có hạn ≤ ngày mai (Công việc chỉ hiện Ghi kết quả từ Chủ nhật) phải có ở Công việc. */
      const khoa = new Set(cuaToi.map((it: any) => it.key));
      for (const sid of ems) {
        for (const x of v(sid).cuaBan.filter((y) => LOAI_HOC_VIEN.has(y.loai) && (y.han === null || y.han <= addDays(TODAY, 1)))) {
          assert(khoa.has(x.key), `${ten}: ${x.key} (${x.chu}) là việc của bạn ở đầu hồ sơ em ${sid} mà Công việc không có`);
        }
      }
    }
    assert(so > 0, 'phép kiểm không rỗng: có ít nhất một việc ở Công việc để so');
  });

  check('VAI-b (2) · PHỦ ĐỊNH: giáo viên khác của lớp KHÔNG có việc Xác nhận nguyên nhân của GVBM môn đó ở "Việc của bạn" — nằm ở "việc của người khác" kèm tên', () => {
    let so = 0;
    for (const sid of [...emLop('MB FT 101'), ...emLop('MB FOU 12')]) {
      const x = [...viecCua(P.admin, sid).nguoiKhac].find((y) => y.loai === 'nguyen-nhan' && y.nguoi.id);
      if (!x) continue;
      const lop = get(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active'`, sid).class_id;
      const khac = get(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active' AND user_id != ? AND is_core = 0 AND skill IS NOT NULL LIMIT 1`, lop, x.nguoi.id);
      if (!khac) continue;
      const v = viecCua(loadPrincipal(khac.user_id), sid);
      assert(!v.cuaBan.some((y) => y.key === x.key), `GV ${khac.user_id} thấy ${x.key} là việc của mình`);
      const o = v.nguoiKhac.find((y) => y.key === x.key);
      assert(o && o.nguoi.id === x.nguoi.id && o.nguoi.ten && o.nguoi.ten !== '—', `việc của người khác thiếu ${x.key} hoặc sai tên: ${JSON.stringify(o)}`);
      so++;
    }
    assert(so > 0, 'bộ demo phải có Case chờ nguyên nhân có người phụ trách');
  });

  check('VAI-b (2) · Quản lý không có việc học thuật nào với em (không thanh việc); em Tạm dừng → không việc nào (mọi hạn dừng, T65)', () => {
    for (const sid of emLop('MB FT 101')) {
      const v = viecCua(P.mbManager, sid);
      assert(v.cuaBan.length === 0, `QL có việc với em ${sid}: ${JSON.stringify(v.cuaBan.map((x) => x.key))}`);
    }
    const coViec = emLop('MB FT 101').find((sid) => { const v = viecCua(P.admin, sid); return v.cuaBan.length + v.nguoiKhac.length > 0; })!;
    assert(coViec, 'bộ demo MB FT 101 phải có em có việc');
    conn.prepare(`UPDATE students SET status = 'inactive' WHERE id = ?`).run(coViec);
    try {
      const v = viecCua(P.admin, coViec);
      assert(v.cuaBan.length === 0 && v.nguoiKhac.length === 0, `em Tạm dừng vẫn có việc: ${JSON.stringify(v)}`);
    } finally { conn.prepare(`UPDATE students SET status = 'active' WHERE id = ?`).run(coViec); }
  });
}
