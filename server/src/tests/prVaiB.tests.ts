/** PHÉP KIỂM PR-VAI-b — hồ sơ học viên "hiểu trong 30 giây" (kế hoạch 2026-10-01-pr-vai-b-ho-so-hoc-vien). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

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

  // ------------------------------------------------------------------ khối 1 · tuần học n + khoảng Tạm dừng + dòng thông tin
  check('VAI-b (1) · chuTuanHoc: lớp thường "tuần học 3/8", FT "tuần học 9" (không mẫu số)', () => {
    assert(d.chuTuanHoc(3, 8) === 'tuần học 3/8', d.chuTuanHoc(3, 8));
    assert(d.chuTuanHoc(9, null) === 'tuần học 9', d.chuTuanHoc(9, null));
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

  check('VAI-b (1) · studentProfile: FT "tuần học n" = tuanHocFt (tuần bắt đầu lộ trình, bỏ tuần dừng); lớp thường tong = số tuần khoá; không FT nào tong 16', () => {
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
    assert(tt2.thiDuKien?.nhan === 'Final Test' && /^W\d [A-Z]{3}/.test(tt2.thiDuKien.gt), `Final Test mã tuần: ${JSON.stringify(tt2.thiDuKien)}`);
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
  const NHOM_HOC_VIEN = new Set(['cause', 'xac_nhan_pa', 'ghi_ket_qua_pa', 'ke_hoach_bo_tro', 'phoi_hop', 'mini_test', 'yt_xu_ly']);
  const LOAI_HOC_VIEN = new Set(['nguyen-nhan', 'xac-nhan-pa', 'ghi-ket-qua', 'ke-hoach', 'bao-ph', 'mini-test', 'y-thuc']);

  check('VAI-b (2) · nguoiLam của Case (Q3): chờ nguyên nhân → người phụ trách; PA chạy chờ ghi kết quả → người thực hiện PA (thiếu thì người phụ trách Case — PR-Dọn Task 6); không ai phụ trách → null; có tên', () => {
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
            const iv = get('SELECT COALESCE(ci.performer_user_id, sc2.owner_user_id) u FROM case_interventions ci JOIN sos_cases sc2 ON sc2.id = ci.case_id WHERE ci.id = ?', c.viecTiep.paId);
            assert((c.nguoiLam?.id ?? null) === (iv.u ?? null), `Case ${c.id}: nguoiLam ${JSON.stringify(c.nguoiLam)} ≠ người thực hiện PA / phụ trách Case ${iv.u}`);
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

  // ------------------------------------------------------------------ khối 3 · câu tóm tắt + bốn ô (T72, K3-03, Q31-7, Q31-8)
  const HN = '2026-10-01';
  const KQ_FT = { dau: 'MT1', ratio: false, sos: 2, dat: false, overall: 5.5, kck: false, soDat: 0, soMon: 5, monTruot: [], phanTram: null };
  const cau = (o: Record<string, unknown>) => d.cauTomTat({ dacBiet: null, ketQua: KQ_FT, hoTro: [], viec: [], yThuc: null, homNay: HN, ...o }) as { chu: string; tone: string | null }[];
  const chu = (ds: { chu: string }[]) => ds.map((m) => m.chu);

  check('VAI-b (3) · cauTomTat theo bảng luật mockup 24: FT SOS 2 · PA quá hạn của người khác · Ý thức bắt buộc → 3 mảnh đúng chữ, đúng màu', () => {
    const r = cau({
      hoTro: ['Writing Task 2', 'Speaking'],
      viec: [{ loai: 'nguyen-nhan', chu: 'Xác nhận nguyên nhân Speaking', kyNangTen: 'Speaking', quaHanNgay: null },
        { loai: 'ghi-ket-qua', chu: 'Kết quả tuần W4 SEP · PA …', kyNangTen: 'Writing Task 2', quaHanNgay: 3 }],
      yThuc: { nhom: 'bat_buoc', keTiep: 'Report 2', han: '2026-10-04', quaHanNgay: null, deXuat: null },
    });
    assert(JSON.stringify(chu(r)) === JSON.stringify(['MT1 SOS 2: đang hỗ trợ Writing Task 2 và Speaking', 'PA Writing Task 2 quá hạn Kết quả 3 ngày', 'Ý thức: bắt buộc Report 2, hạn hết 04/10']), JSON.stringify(r));
    assert(r.map((m) => m.tone).join() === 'sos2,danger,warn', `màu: ${r.map((m) => m.tone)}`);
  });

  check('VAI-b (3) · cauTomTat: Tạm dừng / KCK / Sắp chuyển / Đã kết thúc đứng đầu, bỏ mệnh đề cuối; không bao giờ quá 3 mảnh', () => {
    const day = { hoTro: ['Reading'], viec: [{ loai: 'ghi-ket-qua', chu: 'Kết quả', kyNangTen: 'Reading', quaHanNgay: 2 }],
      yThuc: { nhom: 'bat_buoc', keTiep: 'Report 1', han: '2026-10-04', quaHanNgay: null, deXuat: null } };
    const td = cau({ ...day, dacBiet: { loai: 'tam-dung', tu: '2026-09-07' } });
    assert(td[0].chu === 'Tạm dừng từ 07/09' && td[0].tone === 'warn' && td.length === 3 && !td.some((m) => m.chu.startsWith('Ý thức')), JSON.stringify(td));
    const kck = cau({ dacBiet: { loai: 'kck' }, ketQua: { ...KQ_FT, kck: true, sos: null }, hoTro: ['Reading'] });
    assert(chu(kck).join(' · ') === 'KCK · không đặt kỳ vọng MT, không SOS · MT1 OVR 5.5: đang hỗ trợ Reading', JSON.stringify(kck));
    const sc = cau({ dacBiet: { loai: 'sap-chuyen', lop: 'MB FT 103', tuan: '2026-10-05' } });
    assert(sc[0].chu === 'Sắp chuyển MB FT 103 từ W2 OCT' && sc[0].tone === 'accent', JSON.stringify(sc));
    const kt = cau({ ...day, dacBiet: { loai: 'ket-thuc' } });
    assert(kt[0].chu === 'Đã kết thúc' && kt.length <= 3, JSON.stringify(kt));
    for (const r of [td, kck, sc, kt]) assert(r.length <= 3 && !r.some((m) => /_|cho_duyet|inactive/.test(m.chu)), `quá 3 mảnh / mã thô: ${JSON.stringify(r)}`);
  });

  check('VAI-b (3) · cauTomTat lớp thường: "Progress Test 2/4 môn đạt: không đạt G+V và P" + việc chờ Quản lý duyệt (tím) — KHÔNG chữ SOS; đạt hết → "· không có việc đang mở"', () => {
    const r = cau({
      ketQua: { dau: 'Progress Test', ratio: true, sos: 2, dat: false, overall: null, kck: false, soDat: 2, soMon: 4, monTruot: ['G+V', 'P'], phanTram: null },
      hoTro: ['Grammar + Vocabulary', 'Pronunciation'],
      viec: [{ loai: 'cho-duyet', chu: 'PA Bổ trợ chung chờ Quản lý duyệt kế hoạch', kyNangTen: null, quaHanNgay: null }],
    });
    assert(chu(r).join(' · ') === 'Progress Test 2/4 môn đạt: không đạt G+V và P · PA Bổ trợ chung chờ Quản lý duyệt kế hoạch', JSON.stringify(r));
    assert(r[1].tone === 'wait' && !JSON.stringify(r).includes('SOS'), JSON.stringify(r));
    const dat = cau({ ketQua: { ...KQ_FT, dau: 'MT2', sos: 0, dat: true } });
    assert(chu(dat).join(' · ') === 'MT2 đạt kỳ vọng · không có việc đang mở', JSON.stringify(dat));
  });

  check('VAI-b (3) · oHocThuat / oYThuc / oSapToi: số = số Case mở; nhãn §7.3 + việc; Ý thức bậc + bắt buộc; mốc FT/KCK/lớp thường/sau Final Test', () => {
    const c = (o: Record<string, unknown>) => ({ status: 'in_progress', trangThaiV4: { t: 'dang-lam' }, viecTiep: null, plans: [], boTro: null, ...o });
    const h = d.oHocThuat([
      { short: 'L', label: 'Listening', category: 'listening', missed: false, cases: [] },
      { short: 'W2', label: 'Writing Task 2', category: 'writing2', missed: true, cases: [c({ viecTiep: { chu: 'Kết quả PA x' }, plans: [{ actionOverdue: true }] }), c({ status: 'done' })] },
      { short: 'S', label: 'Speaking', category: 'speaking', missed: true, cases: [c({ trangThaiV4: { t: 'can-lam' }, viecTiep: { chu: 'Xác nhận nguyên nhân' } })] },
    ]);
    assert(h.so === 2 && h.dong[0].kn === 'W2' && h.dong[0].nhan === 'Quá hạn' && h.dong[0].viec === 'kết quả'
      && h.dong[1].kn === 'S' && h.dong[1].nhan === 'Cần làm' && h.dong[1].viec === 'nguyên nhân', JSON.stringify(h));
    const bt = d.oHocThuat([{ short: 'G+V', label: 'G+V', category: 'grammar_vocab', missed: true, cases: [c({ trangThaiV4: { t: 'cho-duyet' },
      boTro: { nhom: 'n1', chung: true, buoiMoiTuan: 2, keHoach: { trangThai: 'cho' } } })] }]);
    assert(bt.phu === 'PA Bổ trợ chung · 2 buổi/tuần · kế hoạch chờ Quản lý' && bt.dong[0].nhan === 'Chờ duyệt', JSON.stringify(bt));
    assert(d.oHocThuat([{ short: 'L', label: 'L', category: 'listening', missed: false, cases: [] }]).phu === 'mọi kỹ năng đạt', 'không Case');
    const y = d.oYThuc({ bacTen: 'Report 1', nhom: 'bat_buoc', soBatBuoc: 3, keTiep: 'Report 2', han: '2026-10-04', quaHanNgay: null, deXuat: null, soMo: 3, tamDung: false }, '2026-09-14');
    assert(y.gt === 'Report 1' && y.tren === 'bậc đã xử lý' && y.phu === '3 vi phạm / 2 tuần → bắt buộc Report 2 · hạn hết 04/10' && y.tone === 'warn', JSON.stringify(y));
    const y0 = d.oYThuc(null);
    assert(y0.gt === 'Không có vi phạm' && y0.phu === '', JSON.stringify(y0));
    const st = (o: Record<string, unknown>) => d.oSapToi({ ketLuan: null, sauCuoiKhoa: null, ratio: false, kck: false, bacKe: null, homNay: HN,
      next: { dau: 'MT2', attemptNo: 2, tuan: '2026-10-19', kyVong: 6, soPhan: 5, final: false }, ...o });
    let s = st({});
    assert(s.gt === 'MT2 · W4 OCT' && s.phu === 'kỳ vọng 6.0 · 5 phần', JSON.stringify(s));
    s = st({ kck: true });
    assert(s.phu === 'so với MT1, không kỳ vọng' && !s.phu.includes('kỳ vọng 6'), JSON.stringify(s));
    s = st({ ratio: true, bacKe: 'BE', next: { dau: 'Final Test', attemptNo: 2, tuan: '2026-10-19', kyVong: null, soPhan: 4, final: true } });
    assert(s.gt === 'Final Test · W4 OCT' && s.phu === '4 môn · xét lên BE', JSON.stringify(s));
    s = st({ sauCuoiKhoa: { tuanKetThuc: '2026-10-19' } });
    assert(s.gt === 'Chuyển lớp' && s.phu === 'chờ Quản lý quyết định · lớp kết thúc W4 OCT', JSON.stringify(s));
    assert(st({ ketLuan: 'Đạt Target' }).gt === 'Kết luận: Đạt Target', 'kết luận');
  });

  check('VAI-b (3) · HAI ĐƯỜNG: ô Học thuật = số hàng Case mở của /skill-board (bốn vai); câu tóm tắt nêu việc quá hạn của NGƯỜI KHÁC cho mọi người xem (Q31-8)', () => {
    const vai = [P.mbManager, P.admin, P.coreTeacher, P.w2Teacher];
    let coQuaHan = 0;
    for (const sid of emLop('MB FT 101')) {
      let cauTruoc: string | null = null;
      for (const p of vai) {
        const pr = studentProfile(p, sid) as any;
        const mo = (skillSupportBoard(p, sid, pr.cycle?.id ?? null) as any).rows.reduce((n: number, r: any) => n + r.cases.filter((c: any) => c.status !== 'done').length, 0);
        assert(pr.dauHoSo.o.hocThuat.so === mo, `em ${sid}: ô Học thuật ${pr.dauHoSo.o.hocThuat.so} ≠ ${mo} Case mở của bảng kỹ năng`);
        const cauNay = JSON.stringify(pr.dauHoSo.tomTat);
        assert(cauTruoc === null || cauTruoc === cauNay, `em ${sid}: câu tóm tắt khác theo người xem`);
        cauTruoc = cauNay;
        const tatCa = [...pr.dauHoSo.viec.cuaBan, ...pr.dauHoSo.viec.nguoiKhac];
        if (tatCa.some((v: any) => v.quaHanNgay !== null && ['ghi-ket-qua', 'nguyen-nhan', 'xac-nhan-pa', 'ke-hoach', 'mini-test'].includes(v.loai))) {
          assert(pr.dauHoSo.tomTat.some((m: any) => m.tone === 'danger' && /quá hạn/.test(m.chu)),`em ${sid}: có việc quá hạn mà câu không nêu: ${cauNay}`);
          coQuaHan++;
        }
      }
    }
    assert(coQuaHan > 0, 'bộ demo MB FT 101 phải có em có việc học thuật quá hạn');
  });

  // ------------------------------------------------------------------ khối 4 · Tạm dừng, KCK (T65/K3-41 phần giao diện, Q31-7)
  const { caseDetail } = await import('../cases/cases.ts');
  check('VAI-b (4) · tamDungTu ở bảng kỹ năng + chi tiết Case: em Tạm dừng = ngày dừng; em đang học / đã Quay lại → null; đầu hồ sơ: không việc, câu mở đầu "Tạm dừng từ", ô Học thuật đổi "Quá hạn"', () => {
    const sid = emLop('MB FT 101').find((x) => (skillSupportBoard(P.admin, x) as any).rows.some((r: any) => r.cases.some((c: any) => c.status !== 'done')))!;
    assert(sid, 'bộ demo MB FT 101 phải có em có Case mở');
    const caseId = (skillSupportBoard(P.admin, sid) as any).rows.flatMap((r: any) => r.cases).find((c: any) => c.status !== 'done').id as number;
    assert((skillSupportBoard(P.admin, sid) as any).tamDungTu === null && (caseDetail(P.admin, caseId) as any).tamDungTu === null, 'em đang học → null');
    const tu = addDays(thu2, -7);
    conn.prepare(`UPDATE students SET status = 'inactive' WHERE id = ?`).run(sid);
    try {
      voiNhatKy(sid, [['pause', tu]], () => {
        assert((skillSupportBoard(P.admin, sid) as any).tamDungTu === tu, 'bảng kỹ năng: tamDungTu = ngày dừng');
        assert((caseDetail(P.admin, caseId) as any).tamDungTu === tu, 'chi tiết Case: tamDungTu = ngày dừng');
        const dh = (studentProfile(P.admin, sid) as any).dauHoSo;
        assert(dh.viec.cuaBan.length === 0 && dh.viec.nguoiKhac.length === 0, 'em Tạm dừng không có việc');
        assert(dh.tomTat[0].chu === `Tạm dừng từ ${tu.slice(8, 10)}/${tu.slice(5, 7)}` && dh.tomTat[0].tone === 'warn', JSON.stringify(dh.tomTat));
        assert(!dh.o.hocThuat.dong.some((x: any) => x.t === 'qua-han'), `ô Học thuật còn "Quá hạn": ${JSON.stringify(dh.o.hocThuat.dong)}`);
      });
    } finally { conn.prepare(`UPDATE students SET status = 'active' WHERE id = ?`).run(sid); }
    voiNhatKy(sid, [['pause', addDays(tu, -14)], ['resume', addDays(tu, -7)]], () => {
      assert((skillSupportBoard(P.admin, sid) as any).tamDungTu === null, 'đã Quay lại → null');
    });
    const web = fs.readFileSync(path.join(REPO, 'web/src/modules/cases/SkillBoard.tsx'), 'utf8');
    assert(/tamDung && tt\.t === 'qua-han' \? <NhanTamDung/.test(web) && /tamDung && \(v\.quaHan \|\| v\.homNay \|\| v\.han\)\) \{[\s\S]{0,160}<NhanTamDung/.test(web), 'SkillBoard thay "Quá hạn" bằng NhanTamDung');
    assert(/data\.tamDungTu \? <NhanTamDung/.test(fs.readFileSync(path.join(REPO, 'web/src/modules/cases/CasePanel.tsx'), 'utf8')), 'Ngăn Case thay quá hạn bằng NhanTamDung');
  });

  check('VAI-b (4) · KCK (Q31-7): câu mở đầu "KCK · không đặt kỳ vọng MT, không SOS"; ô Kết quả cờ KCK; ô Sắp tới không có số kỳ vọng; bảng kỹ năng không kỳ vọng', () => {
    const em = all(`SELECT s.id FROM students s JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active' AND cy.khong_cam_ket = 1
      WHERE s.status = 'active' AND s.id <= ? ORDER BY s.id`, seedMax.students).map((r) => r.id as number)[0];
    assert(em, 'bộ demo phải có em KCK (Hồ Gia Hân, sosV3Seed)');
    const dh = (studentProfile(P.admin, em) as any).dauHoSo;
    assert(dh.tomTat[0].chu === 'KCK · không đặt kỳ vọng MT, không SOS', JSON.stringify(dh.tomTat));
    assert(dh.o.ketQua.kck === true && !/kỳ vọng \d/.test(dh.o.sapToi.phu ?? ''), JSON.stringify(dh.o));
    assert(dh.thongTin.target === 'KCK', `dòng thông tin: target ${dh.thongTin.target}`);
    assert((skillSupportBoard(P.admin, em) as any).rows.every((r: any) => r.kck && r.expectation === null), 'bảng kỹ năng KCK: không kỳ vọng');
  });

  // ------------------------------------------------------------------ khối 5 · Quản lý duyệt trong hồ sơ (V1/K3-47) + menu ⋮ chia nhóm (K3-48)
  const yeuCau = await import('../duyet/yeuCau.ts');
  check('VAI-b (5) · viewer.coTheDuyet: Quản lý MB có; GVCN, GVBM không (PHỦ ĐỊNH) — và GVCN gọi /yeu-cau?studentId= bị chặn; thẻ quá hạn lên đầu', () => {
    const sid = emCuaLop('MB FT 101');
    assert((studentProfile(P.mbManager, sid) as any).viewer.coTheDuyet === true, 'Quản lý MB phải duyệt được');
    for (const [ten, p] of [['GVCN', P.coreTeacher], ['GVBM', P.w2Teacher]] as const) {
      assert((studentProfile(p, sid) as any).viewer.coTheDuyet === false, `${ten} không được có dải chờ duyệt`);
      assertThrows(() => yeuCau.hopChoDuyet(p, { studentId: sid }), /Quản lý|quyền|403/i, `${ten} gọi /yeu-cau?studentId= phải bị chặn`);
    }
    const em = get(`SELECT hoc_vien_id id FROM yeu_cau_duyet WHERE trang_thai = 'cho' AND hoc_vien_id IS NOT NULL GROUP BY hoc_vien_id ORDER BY COUNT(*) DESC LIMIT 1`);
    if (em) {
      const the = (yeuCau.hopChoDuyet(P.admin, { studentId: em.id }) as any).the as { hanDuyet: string | null }[];
      const han = the.map((x) => x.hanDuyet ?? '9999');
      assert(han.every((h, i) => i === 0 || han[i - 1] <= h), `thẻ của em phải xếp quá hạn / hạn sớm lên đầu: ${han}`);
    }
  });

  check('VAI-b (5) · mucQuanLyHocVien: chia nhóm Thông tin · Lộ trình · Lớp, dòng hệ quả, vạch đậm trước Tạm dừng/Kết thúc, vạch đỏ trước Xoá — TẬP MỤC theo quyền KHÔNG ĐỔI ở cả 5 vai', () => {
    /* Bản tham chiếu: đúng luật chọn mục của bản cũ (trước PR-VAI-b) — chỉ thứ tự trong menu đổi theo nhóm. */
    const cu = (i: any): string[] => {
      const q = i.lopHoc?.quyen; const ratio = !!i.cycle?.ratio; const hoc = i.status === 'active'; const ds: string[] = [];
      if (i.canEdit) ds.push('info'); if (q?.ghiLoTrinhTiep) ds.push('lo-trinh-tiep'); if (i.canEdit && i.cycle && !ratio) ds.push('lo-trinh');
      if (i.deXuatSua && hoc) ds.push('de-xuat-sua'); if (q?.chuyenLop) ds.push('chuyen-lop'); if (q?.deXuatChuyenLop && hoc) ds.push('de-xuat-chuyen-lop');
      if (i.canEdit && i.cycle && !ratio) ds.push('outcome'); if (q?.tamDung && hoc) ds.push('tam-dung'); if (q?.quayLai && !hoc && i.status === 'inactive') ds.push('quay-lai');
      if (q?.ketThuc && i.status !== 'finished') ds.push('ket-thuc'); if (q?.luuTru) ds.push('luu-tru'); if (q?.boLuuTru) ds.push('bo-luu-tru'); if (i.coTheXoa) ds.push('xoa-hoc-vien');
      return ds;
    };
    const ql = { ghiLoTrinhTiep: false, chuyenLop: true, tamDung: true, quayLai: true, ketThuc: true, luuTru: false, boLuuTru: false };
    const vai = [
      { ten: 'QT', canEdit: true, lopHoc: { quyen: ql }, cycle: { ratio: false }, status: 'active', coTheXoa: true },
      { ten: 'QL', canEdit: true, lopHoc: { quyen: ql }, cycle: { ratio: false }, status: 'active' },
      { ten: 'GVCN', canEdit: true, lopHoc: { quyen: { ...ql, chuyenLop: false, deXuatChuyenLop: true, tamDung: false, quayLai: false, ketThuc: false } }, cycle: { ratio: false }, status: 'active', deXuatSua: true },
      { ten: 'GVBM', canEdit: false, lopHoc: null, cycle: { ratio: false }, status: 'active', deXuatSua: true },
      { ten: 'GVCN thường', canEdit: true, lopHoc: { quyen: { ...ql, ghiLoTrinhTiep: true, chuyenLop: false, tamDung: false, quayLai: false, ketThuc: false } }, cycle: { ratio: true }, status: 'active' },
    ];
    for (const v of vai) {
      const moi = d.mucQuanLyHocVien(v) as any[];
      assert(JSON.stringify(moi.map((m) => m.key).sort()) === JSON.stringify(cu(v).sort()), `${v.ten}: tập mục đổi ${moi.map((m) => m.key)} ≠ ${cu(v)}`);
      const nhom = moi.map((m) => ['thong-tin', 'lo-trinh', 'lop'].indexOf(m.nhom));
      assert(nhom.every((x, i) => x >= 0 && (i === 0 || nhom[i - 1] <= x)), `${v.ten}: nhóm không liền: ${moi.map((m) => m.nhom)}`);
    }
    const qt = d.mucQuanLyHocVien(vai[0]) as any[];
    const m = (k: string) => qt.find((x) => x.key === k);
    assert(m('chuyen-lop').phu === 'chọn lớp chuyển đến và tuần bắt đầu' && m('tam-dung').phu === 'mọi hạn của em dừng · giữ lớp, lộ trình'
      && m('ket-thuc').phu === 'đóng lộ trình · hồ sơ chỉ xem' && m('xoa-hoc-vien').phu === 'chỉ Quản trị hệ thống thấy dòng này', JSON.stringify(qt));
    assert(m('tam-dung').keTruoc === 'dam' && !m('ket-thuc').keTruoc && m('xoa-hoc-vien').keTruoc === 'do' && m('xoa-hoc-vien').nguyHiem, 'vạch đậm / đỏ');
    assert(!/▾/.test(fs.readFileSync(path.join(REPO, 'web/src/ui/Menu.tsx'), 'utf8')), 'Menu còn ký tự ▾ (phải SVG)');
  });

  // ------------------------------------------------------------------ khối 6 · bảng kỹ năng: Case khung rỗng / PA khối đặc, người làm, 12 px, mã tuần
  check('VAI-b (6) · viecTiepHang: việc + "hạn … · người" (chữ hạn theo deadlineView); quá hạn nói "quá hạn n ngày"; chữ PA nói mã tuần (từ W3 SEP · đến MT2 · W4 OCT; Tiến bộ một phần · W3 SEP)', () => {
    const v = d.viecTiepHang([
      { status: 'in_progress', viecTiep: { chu: 'Kết quả PA x', loaiHan: 'cap-nhat-pa', han: '2026-10-05' }, nguoiLam: { id: 1, ten: 'Phạm Quốc Bảo' } },
      { status: 'open', viecTiep: { chu: 'Xác nhận nguyên nhân', loaiHan: 'xac-minh-sos', han: '2026-10-02' }, nguoiLam: { id: 2, ten: 'Đỗ Thanh Tùng' } },
      { status: 'done', viecTiep: null, nguoiLam: null },
    ], '2026-10-01');
    assert(v.viec === 'Xác nhận nguyên nhân' && v.han === 'hạn 02/10' && v.nguoi === 'Đỗ Thanh Tùng' && !v.quaHan, JSON.stringify(v));
    const q = d.viecTiepHang([{ status: 'open', viecTiep: { chu: 'Kết quả PA x', loaiHan: 'cap-nhat-pa', han: '2026-09-28' }, nguoiLam: { id: 1, ten: 'A' } }], '2026-10-01');
    assert(q.quaHan === 'quá hạn 3 ngày' && q.nguoi === 'A', JSON.stringify(q));
    assert(d.viecTiepHang([{ status: 'done', viecTiep: null }], '2026-10-01') === null, 'không việc → null');
    const k = d.chuKhoangPa({ startedOn: '2026-09-16', completedOn: null, mocChu: 'đến MT2 · W4 OCT' }, '2026-10-01');
    assert(k === 'từ W3 SEP · đến MT2 · W4 OCT' && !/\d{2}\/\d{2}/.test(k), k);
    assert(d.chuKhoangPa({ startedOn: '2026-09-16', completedOn: '2026-09-30', mocChu: null }, '2026-10-01') === 'W3 SEP → W1 OCT', 'đã xong');
    assert(d.chuKetQuaPa('Tiến bộ một phần', '2026-09-18', '2026-10-01') === 'Tiến bộ một phần · W3 SEP', 'kết quả mã tuần');
  });

  check('VAI-b (6) · Quét SkillBoard.tsx: 11 px chỉ còn ở nhãn (chip MT, nhãn Case/PA) — hạn, kết quả, người 12 px (Q22); nhãn Case viền / PA nền; không ngày dd/mm ở khoảng PA', () => {
    const web = fs.readFileSync(path.join(REPO, 'web/src/modules/cases/SkillBoard.tsx'), 'utf8');
    const dong11 = web.split('\n').filter((l) => l.includes('text-[11px]'));
    assert(dong11.every((l) => /rounded/.test(l)), `còn chữ 11 px không phải nhãn: ${dong11.map((l) => l.trim().slice(0, 90)).join(' | ')}`);
    assert(/loai === 'Case' \? 'border-current/.test(web) && /bg-\[color:var\(--line-strong\)\]/.test(web), 'Case khung rỗng / PA khối đặc');
    assert(/<NhanLoai loai="Case" \/>/.test(web) && /<NhanLoai loai="PA" cho=\{choDuyetKh\} \/>/.test(web), 'hàng Case / hàng PA dùng NhanLoai');
    assert(!/ngan\(p\.startedOn\)|ngan\(p\.lastOutcomeOn\)/.test(web), 'khoảng PA / kết quả còn dd/mm');
  });

  // ------------------------------------------------------------------ khối 7 · điện thoại 375 px: bảng kỹ năng thành thẻ (UX-D3)
  check('VAI-b (7) · xepTheKyNang: Case quá hạn → Case mở → còn lại; kỹ năng đạt / không Case → thẻ gọn; giữ thứ tự bảng trong nhóm; < 640 px chỉ vẽ thẻ', () => {
    const r = (ten: string, missed: boolean | null, cases: any[]) => ({ ten, missed, cases });
    const ds = d.xepTheKyNang([
      r('L', false, []), r('R', true, [{ status: 'in_progress', trangThaiV4: { t: 'dang-lam' }, plans: [] }]),
      r('W1', null, []), r('W2', true, [{ status: 'in_progress', trangThaiV4: { t: 'dang-lam' }, plans: [{ actionOverdue: true }] }]),
      r('S', true, [{ status: 'open', trangThaiV4: { t: 'qua-han' }, plans: [] }]), r('X', true, [{ status: 'done', plans: [] }]),
    ]) as { row: { ten: string }; gon: boolean }[];
    assert(ds.map((x) => x.row.ten).join() === 'W2,S,R,L,W1,X', ds.map((x) => x.row.ten).join());
    assert(ds.map((x) => x.gon).join() === 'false,false,false,true,true,false', `gọn: ${ds.map((x) => x.gon)}`);
    const web = fs.readFileSync(path.join(REPO, 'web/src/modules/cases/SkillBoard.tsx'), 'utf8');
    assert(/if \(dienThoai\) return <TamDungCtx\.Provider[^]*?<TheKyNangDs/.test(web), 'SkillBoard chọn thẻ trên điện thoại, không vẽ bảng rồi ẩn');
    const the = fs.readFileSync(path.join(REPO, 'web/src/modules/cases/TheKyNang.tsx'), 'utf8');
    assert(/xepTheKyNang\(rows/.test(the) && /min-h-\[44px\]/.test(the) && !/text-\[11px\]/.test(the), 'thẻ: xếp theo luật, vùng bấm 44 px, không chữ 11 px');
  });

  // ------------------------------------------------------------------ khối 8 · đường dẫn sâu "MT · kỹ năng" → hồ sơ Mock (E.4 / G5)
  const attemptsSvc = await import('../fasttrack/attempts.ts');
  check('VAI-b (8) · duongDotTest / docKnMock: FT → /mock-test/{id}?kn=; kn lạ bỏ; lớp thường → bảng điểm lớp thường (bỏ kn); attemptHref web chỉ gọi duongDotTest', () => {
    assert(d.duongDotTest({ id: 5, kind: 'mock' }, 'speaking') === '/mock-test/5?kn=speaking', 'FT + kn');
    assert(d.duongDotTest({ id: 5, kind: 'mock' }) === '/mock-test/5' && d.duongDotTest({ id: 5 }) === '/mock-test/5', 'không kn');
    assert(d.duongDotTest({ id: 5, kind: 'mock' }, 'abc') === '/mock-test/5', 'kn lạ → bỏ');
    assert(d.duongDotTest({ id: 7, kind: 'progress', classId: 3 }, 'speaking') === '/bang-diem-thuong/3?kind=progress', 'lớp thường bỏ kn');
    /* Không đổi đường cũ của attemptHref (mọi mẫu): mock · thiếu kind · lớp thường · lớp thường thiếu lớp. */
    const cu = (a: any) => (!a.kind || a.kind === 'mock' ? `/mock-test/${a.id}` : a.classId ? `/bang-diem-thuong/${a.classId}?kind=${a.kind}` : `/mock-test/${a.id}`);
    for (const a of [{ id: 1, kind: 'mock' }, { id: 2 }, { id: 3, kind: 'final', classId: 9 }, { id: 4, kind: 'progress', classId: null }]) {
      assert(d.duongDotTest(a) === cu(a), `attemptHref đổi đường cũ: ${JSON.stringify(a)} → ${d.duongDotTest(a)}`);
    }
    assert(d.docKnMock('writing2') === 'writing' && d.docKnMock('writing1') === 'writing' && d.docKnMock('listening') === 'listening', 'docKnMock');
    assert(d.docKnMock('abc') === null && d.docKnMock(null) === null, 'docKnMock lạ → null');
    const f = fs.readFileSync(path.join(REPO, 'web/src/lib/format.ts'), 'utf8');
    assert(/return duongDotTest\(a\);/.test(f), 'attemptHref web phải gọi duongDotTest');
    for (const tep of ['cases/SkillBoard.tsx', 'cases/TheKyNang.tsx', 'students/StudentDetailPage.tsx', 'students/DauHoSo.tsx']) {
      assert(!/`\/mock-test\//.test(fs.readFileSync(path.join(REPO, 'web/src/modules', tep), 'utf8')), `${tep} tự ghép /mock-test/`);
    }
    assert(/docKnMock\(thamSo\.get\('kn'\)\)/.test(fs.readFileSync(path.join(REPO, 'web/src/modules/fasttrack/MockDetailPage.tsx'), 'utf8')), 'hồ sơ Mock đọc ?kn=');
  });

  check('VAI-b (8) · skillSupportBoard: bandAttemptId cùng lượt với bandAttemptNo ở mọi hàng FT; PHỦ ĐỊNH: người ngoài phạm vi mở hồ sơ Mock vẫn bị chặn (kn không đổi quyền)', () => {
    const { attemptDetail } = attemptsSvc;
    let so = 0;
    for (const sid of emLop('MB FT 101').slice(0, 6)) {
      for (const r of (skillSupportBoard(P.admin, sid) as any).rows.filter((x: any) => x.bandAttemptNo)) {
        const a = get('SELECT attempt_no, student_id FROM assessment_attempts WHERE id = ?', r.bandAttemptId);
        assert(a && a.attempt_no === r.bandAttemptNo && a.student_id === sid, `em ${sid} ${r.category}: lượt ${r.bandAttemptId} ≠ MT${r.bandAttemptNo}`);
        so++;
        if (so === 1) assertThrows(() => attemptDetail(P.cpManager, r.bandAttemptId), /phạm vi|quyền/, 'QL chi nhánh CP mở hồ sơ Mock em MB');
      }
    }
    assert(so > 0, 'bộ demo MB FT 101 phải có hàng có điểm');
  });

  // ------------------------------------------------------------------ khối 9 · Hành trình máy chủ: chương theo lớp (Q14, Q20, K3-32)
  const { hanhTrinhHocVien } = await import('../students/hanhTrinh.ts');
  check('VAI-b (9) · chiaChuong: Case mở ở chương 3 còn mở sang chương 4 → chương 3 ghi "đi theo em sang", chương 4 có Case; PA theo ngày bắt đầu; ghim theo lớp; chương không Case rỗng', () => {
    const l = (k: number, tu: string, den: string | null, o: Record<string, unknown> = {}) => ({
      enrollmentId: k, classId: 100 + k, code: `MB L${k}`, ngan: `L${k}`, nhan: 'x', ct: 'FOU', ft: false, tu, den, dangHoc: den === null,
      soTuan: null, tuanHoc: null, gvcn: 'GV', endKind: den ? 'len_lop' : null, status: den ? 'transferred' : 'active', endReason: null, lenh: null, ...o,
    });
    const lop = [l(1, '2026-01-05', '2026-03-09'), l(2, '2026-03-09', '2026-06-01'), l(3, '2026-06-01', '2026-08-10', { ft: true, endKind: 'chuyen_lop', lenh: { id: 9, xacNhan: true } }),
      l(4, '2026-08-10', null, { ft: true })];
    const ch = d.chiaChuong({
      lop, homNay: '2026-10-01', tamDung: [{ tu: '2026-07-20', den: '2026-08-03' }],
      ghim: [{ classId: 103, tuan: '2026-07-13', nhanNgan: 'MT1' }, { classId: 104, tuan: '2026-09-07', nhanNgan: 'MT2' }],
      cases: [{ caseId: 7, ten: 'Reading', kyNang: 'Reading', sos: 1, mo: '2026-07-14', dong: '2026-09-10',
        pa: [{ id: 70, ten: 'Tự học', tu: '2026-07-27', tone: 'bad' }, { id: 71, ten: 'Tutor', tu: '2026-08-31', tone: 'ok' }] }],
    }) as any[];
    assert(ch.length === 4 && ch[0].caseDong.length === 0 && ch[1].caseDong.length === 0, 'chương không Case → rỗng');
    assert(ch[2].caseDong[0].diTheoSang === 'MB L4' && ch[2].caseDong[0].pa.map((p: any) => p.id).join() === '70', JSON.stringify(ch[2].caseDong));
    assert(ch[3].caseDong[0].caseId === 7 && ch[3].caseDong[0].pa.map((p: any) => p.id).join() === '71' && ch[3].caseDong[0].xongO === 'MT2', JSON.stringify(ch[3].caseDong));
    assert(ch[2].ghim.length === 1 && ch[3].ghim[0].nhanNgan === 'MT2', 'ghim theo lớp');
    assert(ch[2].tamDung.length === 1 && ch[3].tamDung.length === 0, 'Tạm dừng nằm đúng chương');
    assert(ch[0].ra.chu === 'Lên FOU' && ch[0].ra.how === 'theo Final Test' && ch[0].ra.tu === '2026-03-09', JSON.stringify(ch[0].ra));
    assert(ch[2].ra.loai === 'chuyen' && ch[2].ra.how === 'Quản lý quyết định' && ch[2].ra.docBanGiao?.lenhId === 9, JSON.stringify(ch[2].ra));
    assert(ch[3].ra === null, 'chương đang học không có "ra"');
    assert(!/"(han|nguoi|ownerId|endKind|lenh)"/.test(JSON.stringify(ch)), 'chương không kể việc / hạn / người giữ việc');
  });

  check('VAI-b (9) · lapLaiQuaLop: kỹ năng có Case ở ≥ 2 lớp → một dòng; một lớp → không; Case bàn giao sang lớp mới không tính lặp', () => {
    const c = (code: string, ds: [number, string][]) => ({ code, caseDong: ds.map(([caseId, kyNang]) => ({ caseId, kyNang })) });
    const r = d.lapLaiQuaLop([c('BE 06', [[1, 'Speaking']]), c('FT 104', [[2, 'Reading']]), c('FT 101', [[2, 'Reading'], [3, 'Speaking']])]);
    assert(r.length === 1 && r[0].kyNang === 'Speaking' && r[0].lop.join() === 'BE 06,FT 101', JSON.stringify(r));
    assert(d.lapLaiQuaLop([c('FT 101', [[1, 'Speaking'], [2, 'Speaking']])]).length === 0, 'một lớp → không');
  });

  check('VAI-b (9) · HV 1 (FOU → BE → FT): mỗi ghi danh một chương, cũ → mới, có GVCN; lớp thường không chữ SOS; chương FT đang học = tuần học ở đầu hồ sơ (hai đường)', () => {
    const r = hanhTrinhHocVien(P.admin, 1, null) as any;
    const soGhiDanh = get('SELECT COUNT(*) n FROM enrollments WHERE student_id = 1').n;
    assert(r.chuong.length === soGhiDanh && r.chuong.every((c: any, i: number) => i === 0 || r.chuong[i - 1].tu <= c.tu), `chương: ${r.chuong.map((c: any) => c.code)}`);
    /* Chương của lớp CÓ GVCN (phân công is_core, kể cả đã thôi) phải ghi tên — lớp các khối trước tạo thêm có thể không có GVCN. */
    const coGvcn = new Set(all('SELECT DISTINCT class_id FROM teacher_assignments WHERE is_core = 1').map((x) => x.class_id));
    assert(r.chuong.every((c: any) => !coGvcn.has(c.classId) || c.gvcn), `mỗi chương có GVCN: ${r.chuong.map((c: any) => `${c.code}:${c.gvcn}`)}`);
    assert(r.chuong.slice(0, 3).every((c: any) => c.gvcn), 'ba chương demo FOU → BE → FT có GVCN');
    for (const c of r.chuong.filter((x: any) => !x.ft)) {
      const chu = JSON.stringify(c.ghim.map((g: any) => d.nhanGhim(g))) + JSON.stringify(c.caseDong.map((x: any) => x.ten)) + c.nhan;
      assert(!/SOS/.test(chu), `chương lớp thường có chữ SOS: ${chu}`);
    }
    const hv = emCuaLop('MB FT 101');
    const dang = (hanhTrinhHocVien(P.admin, hv, null) as any).chuong.find((c: any) => c.dangHoc && c.ft);
    const dau = (studentProfile(P.admin, hv) as any).dauHoSo.thongTin.tuanHoc;
    assert(dang && dau && dang.tuanHoc?.tu === dau.tuan && dang.tuanHoc.den === null, `tuần học chương ${JSON.stringify(dang?.tuanHoc)} ≠ đầu hồ sơ ${dau?.tuan}`);
    assert(!('episodes' in (studentProfile(P.admin, 1) as any)), 'hồ sơ còn episodes');
  });

  check('VAI-b (9) · Chân chương có quyết định chuyển lớp đã xác nhận bàn giao → "Đọc bàn giao" (PR-CT Q17 không mất); số câu cố định khi thêm lớp cũ (Q20)', () => {
    const sid = emCuaLop('MB FT 101');
    const lop = get(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active'`, sid).class_id;
    const n1 = demTruyVan(() => { hanhTrinhHocVien(P.admin, sid, null); });
    const ids: number[] = [];
    try {
      const cu = classId('MB FOU 12');
      ids.push(Number(conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, ended_at, end_kind, created_at) VALUES (?, ?, 'transferred', '2026-01-05', '2026-03-02', 'chuyen_lop', ?)`)
        .run(sid, cu, `${TODAY}T00:00:00Z`).lastInsertRowid));
      const lenh = Number(conn.prepare(`INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, lop_dich_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, trang_thai, xac_nhan_boi, xac_nhan_luc, tao_luc)
        VALUES (?, ?, ?, 'chuyen_lop', 'giua-khoa', '2026-03-02', ?, '2026-02-25', 'da_chuyen', ?, '2026-02-27', ?)`)
        .run(sid, cu, lop, P.mbManager.userId, P.mbManager.userId, `${TODAY}T00:00:00Z`).lastInsertRowid);
      const n2 = demTruyVan(() => { hanhTrinhHocVien(P.admin, sid, null); });
      const ch = (hanhTrinhHocVien(P.admin, sid, null) as any).chuong.find((c: any) => c.classId === cu);
      conn.prepare('DELETE FROM lenh_chuyen_lop WHERE id = ?').run(lenh);
      assert(ch?.ra?.docBanGiao?.lenhId === lenh && ch.ra.how === 'Quản lý quyết định', JSON.stringify(ch?.ra));
      assert(n2 - n1 <= 1, `thêm lớp cũ tăng câu SQL: ${n1} → ${n2}`);
    } finally { conn.prepare(`DELETE FROM enrollments WHERE id IN (${ids.map(() => '?').join(',')})`).run(...ids); }
  });

  check('VAI-b (9) · PHỦ ĐỊNH: Quản lý chi nhánh CP mở Hành trình em MB → bị chặn', () => {
    assertThrows(() => hanhTrinhHocVien(P.cpManager, emCuaLop('MB FT 101'), null), /phạm vi/, 'QL CP xem Hành trình em MB');
  });

  // ------------------------------------------------------------------ khối 10 · Hành trình web: thẻ chương thay Lịch sử lớp (mockup 26 bản 2)
  check('VAI-b (10) · Quét mã: HanhTrinh.tsx không còn "Mốc học tập", nút "Giai đoạn"; StudentDetailPage không còn LichSuLop / Episode; LichSuLop.tsx, lichSuLop.ts đã xoá; chương dùng duongDotTest', () => {
    const doc = (f: string) => fs.readFileSync(path.join(REPO, f), 'utf8');
    const ht = doc('web/src/modules/students/HanhTrinh.tsx');
    assert(!/Mốc học tập/.test(ht) && !/BoLocDoan ariaLabel="Giai đoạn"/.test(ht) && !/nhanGiaiDoan/.test(ht), 'HanhTrinh còn Mốc học tập / nút giai đoạn');
    assert(/<ChuongLop /.test(ht) && /scrollIntoView/.test(ht), 'HanhTrinh chưa vẽ chương / bấm chương chưa cuộn tới trục');
    const sd = doc('web/src/modules/students/StudentDetailPage.tsx');
    assert(!/LichSuLop|function Episode|episodes=/.test(sd), 'StudentDetailPage còn LichSuLop / Episode');
    for (const f of ['web/src/modules/students/LichSuLop.tsx', 'server/src/classes/lichSuLop.ts']) assert(!fs.existsSync(path.join(REPO, f)), `${f} chưa xoá`);
    const ch = doc('web/src/modules/students/ChuongLop.tsx');
    assert(!/`\/mock-test\//.test(ch) && /duongDotTest\(/.test(ch) && /e\.stopPropagation\(\)/.test(ch), 'ghim chương phải qua duongDotTest, bấm ghim không kích hoạt thẻ');
    assert(/Đọc bàn giao/.test(ch) && /Lặp lại qua các lớp/.test(ch) && /Case bàn giao sang/.test(ch), 'thẻ chương thiếu Đọc bàn giao / Lặp lại / đi theo');
    assert(!/text-\[11px\][^"]*"[^>]*>\s*\{?(c\.gvcn|khiChuong)/.test(ch), 'người / thời gian 12 px');
  });
  // ------------------------------------------------------------------ khối 11 · Trục tuần nâng cấp (mockup 26 bản 1; Q18, Q19, R5-2, Q31-11)
  check('VAI-b (11) · nhanGhim hai dòng: FT [MT1, 5.5] / chưa điểm [MT3, ""]; lớp thường [Giữa, 3/4] / [Cuối, 80%], không chữ MT/SOS', () => {
    const g = (x: any) => d.nhanGhim({ soDat: null, soYeuCau: 4, soCoDiem: 4, overall: null, sosLevel: null, kind: 'mid', ...x }).hai;
    assert(JSON.stringify(g({ cheDo: 'ielts', attemptNo: 1, overall: 5.5, sosLevel: 1 })) === '["MT1","5.5"]', 'FT có điểm');
    assert(JSON.stringify(g({ cheDo: 'ielts', attemptNo: 3, soCoDiem: 0 })) === '["MT3",""]', 'FT chưa điểm');
    const giua = g({ cheDo: 'ratio', attemptNo: 1, soDat: 3 });
    const cuoi = g({ cheDo: 'ratio', attemptNo: 2, kind: 'final', soDat: 3, tyLe: 0.8 });
    assert(JSON.stringify(giua) === '["Progress","3/4"]' && JSON.stringify(cuoi) === '["Final","80%"]', `lớp thường: ${giua} · ${cuoi}`);
    assert(!/MT|SOS/.test(JSON.stringify([giua, cuoi])), 'lớp thường có chữ MT/SOS');
  });

  check('VAI-b (11) · Mã tuần thay dd/mm: badge "Xong W.."; dòng phụ vấn đề; tooltip khối PA', () => {
    const h = '2026-09-22';
    const xong = d.trangThaiHop({ caseMo: [], coTungCase: true, diemCuoiChuaDat: null, xongGanNhat: '2026-08-30' }, h);
    assert(xong?.chu === `Xong ${d.tuanLich('2026-08-30', h)}` && !/\d\d\/\d\d/.test(xong.chu), JSON.stringify(xong));
    assert(d.dongPhuVanDe({ mo: '2026-09-14', dong: null, soPa: 1 }, h) === `từ ${d.tuanLich('2026-09-14', h)} · 1 PA`, 'dòng phụ');
    const pa = d.nhanKhoiPa({ ten: 'Luyện nghe', status: 'active', lastOutcome: null, followupOverdue: false, tu: '2026-09-07', den: null }, h);
    assert(pa.day.endsWith(`từ ${d.tuanLich('2026-09-07', h)}`) && !/\d\d\/\d\d/.test(pa.day), pa.day);
  });

  check('VAI-b (11) · khoiCho (R5-2): chờ nguyên nhân / chờ duyệt kế hoạch (không còn "Chưa có PA") / chưa có PA / chờ xác nhận PA / có PA → null', () => {
    assert(d.khoiCho({ cho: 'nguyen-nhan', soPa: 0, pa: [] }) === 'Chờ nguyên nhân', 'nguyên nhân');
    assert(d.khoiCho({ cho: 'ke-hoach', soPa: 0, pa: [] }) === 'Chờ duyệt kế hoạch', 'Bổ trợ chờ kế hoạch');
    assert(d.khoiCho({ cho: null, soPa: 0, pa: [] }) === 'Chưa có PA', 'chưa PA');
    assert(d.khoiCho({ soPa: 1, pa: [] }) === 'Chờ xác nhận PA', 'PA chưa vẽ được');
    assert(d.khoiCho({ soPa: 1, pa: [{}] }) === null, 'có khối PA');
  });

  check('VAI-b (11) · soTuanCot: FT tuần Tạm dừng → null, tuần sau dừng không đếm; khoá 1…n, ngoài khoá → null; tuần này của em FT = tuần học ở đầu hồ sơ (hai đường)', () => {
    const ft = { loai: 'ft' as const, ds: [{ batDau: '2026-09-07', tu: '2026-09-07', den: null }] };
    const dung = [{ tu: '2026-09-21', den: '2026-09-28' }];   // den = ngày Quay lại
    assert(d.soTuanCot(ft, dung, '2026-09-14') === 2 && d.soTuanCot(ft, dung, '2026-09-21') === null && d.soTuanCot(ft, dung, '2026-09-28') === 3, 'FT bỏ tuần dừng');
    const khoa = { loai: 'khoa' as const, ds: [{ batDau: '2026-09-07', tong: 3, tu: '2026-09-07', den: null }] };
    assert(d.soTuanCot(khoa, [], '2026-09-07') === 1 && d.soTuanCot(khoa, [], '2026-09-21') === 3 && d.soTuanCot(khoa, [], '2026-09-28') === null, 'khoá 1…n');
    assert(d.soTuanCot(null, [], '2026-09-07') === null, 'không có giai đoạn');
    /* Em FT "sạch" (HV 1 bị các khối trước thêm ghi danh / đổi lộ trình trong lượt chạy đầy đủ). */
    const hv = emCuaLop('MB FT 101');
    const r = hanhTrinhHocVien(P.admin, hv, 'ft') as any;
    const dau = (studentProfile(P.admin, hv) as any).dauHoSo.thongTin.tuanHoc;
    assert(dau && d.soTuanCot(r.tuanHoc, r.tamDung, thu2) === dau.tuan, `trục ${d.soTuanCot(r.tuanHoc, r.tamDung, thu2)} ≠ đầu hồ sơ ${dau?.tuan}`);
  });

  check('VAI-b (11) · chuKhoangDung: chữ dừng ở tuần TRƯỚC tuần quay lại (khớp dải trên trục + tuanHocFt); cùng tuần → một tuần; chưa quay lại → "từ"', () => {
    const h = '2026-09-14';
    assert(d.chuKhoangDung({ tu: '2026-07-20', den: '2026-08-03' }, h) === 'W4 JUL – W5 JUL', d.chuKhoangDung({ tu: '2026-07-20', den: '2026-08-03' }, h));
    assert(d.chuKhoangDung({ tu: '2026-07-20', den: '2026-07-27' }, h) === 'W4 JUL' && d.chuKhoangDung({ tu: '2026-07-21', den: '2026-07-23' }, h) === 'W4 JUL', 'một tuần');
    assert(d.chuKhoangDung({ tu: '2026-07-20', den: null }, h) === 'từ W4 JUL', 'đang dừng');
  });

  check('VAI-b (11) · Quét mã HanhTrinh: không "n/16", không "Overall", không <svg> viết tay; chú giải ≤ 9 mục; điểm chuỗi qua duongDotTest', () => {
    const ht = fs.readFileSync(path.join(REPO, 'web/src/modules/students/HanhTrinh.tsx'), 'utf8');
    assert(!/\/16\b|Overall|<svg/.test(ht), 'HanhTrinh còn n/16 / Overall / svg viết tay');
    const cg = ht.slice(ht.indexOf('function ChuGiai'));
    const muc = (cg.slice(cg.indexOf('const muc'), cg.indexOf('\n  ];')).match(/^ {4}\[/gm) ?? []).length;
    assert(muc > 0 && muc <= 9, `chú giải ${muc} mục`);
    assert(/duongDotTest\(/.test(ht), 'điểm chuỗi chưa qua duongDotTest');
  });

  // ------------------------------------------------------------------ khối 12 · bấm thử (Task 12)
  check('VAI-b (12) · uocRongChuoi: mốc phần trăm (lớp thường) rộng hơn mốc cùng số ký tự không "%" — chuỗi 5 mốc % không tràn cột tên', () => {
    const pt = d.chuoiDiem([{ gt: 6, tong: 10, chuaDat: false }], 'ratio', false);
    assert(pt[0].chu.endsWith('%') && d.uocRongChuoi(pt) === Math.ceil(pt[0].chu.length * 7.6 + 5), `ước ${d.uocRongChuoi(pt)} cho ${pt[0].chu}`);
  });

  // em Tạm dừng THẬT — ghi danh chuyển `paused`
  check('VAI-b (12) · Em Tạm dừng thật (ghi danh `paused`): đầu hồ sơ vẫn ghi lớp · GVCN (không "Chưa xếp lớp"); Việc tiếp thay MỌI hạn bằng nhãn Tạm dừng', () => {
    const sid = emCuaLop('MB FT 101');
    const e = get(`SELECT id, class_id FROM enrollments WHERE student_id = ? AND status = 'active'`, sid);
    conn.prepare(`UPDATE students SET status = 'inactive' WHERE id = ?`).run(sid);
    conn.prepare(`UPDATE enrollments SET status = 'paused' WHERE id = ?`).run(e.id);
    try {
      voiNhatKy(sid, [['pause', TODAY]], () => {
        const tt = (studentProfile(P.admin, sid) as any).dauHoSo.thongTin;
        assert(tt.lopId === e.class_id && !!tt.gvcn && tt.tamDung?.tu === TODAY, `thông tin em Tạm dừng: ${JSON.stringify(tt)}`);
      });
    } finally {
      conn.prepare(`UPDATE enrollments SET status = 'active' WHERE id = ?`).run(e.id);
      conn.prepare(`UPDATE students SET status = 'active' WHERE id = ?`).run(sid);
    }
    const sb = fs.readFileSync(path.join(REPO, 'web/src/modules/cases/SkillBoard.tsx'), 'utf8');
    const the = fs.readFileSync(path.join(REPO, 'web/src/modules/cases/TheKyNang.tsx'), 'utf8');
    assert(/tamDung && \(v\.quaHan \|\| v\.homNay \|\| v\.han\)/.test(sb) && /tamDung && han \?/.test(the), 'Việc tiếp của em Tạm dừng còn hiện hạn');
  });
}
