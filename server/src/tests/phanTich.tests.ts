/**
 * PHÉP KIỂM PR-Pb — Phân tích (đặc tả 2026-09-22-ux-toan-web-truoc-deploy-design §3.3, kiểm kê §1.3 P7–P15).
 * Harness do `run.ts` sở hữu và truyền vào — file này không tự mở database.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPhanTichTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, TODAY, P, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-Pb · Phân tích');
  const eq = (got: unknown, want: unknown, m: string) =>
    assert(JSON.stringify(got) === JSON.stringify(want), `${m}: ${JSON.stringify(got)} ≠ ${JSON.stringify(want)}`);

  // ================================================================== Task 1 — luật thuần

  check('PR-Pb · tuDauKhoang: thứ Hai của tuần chứa homNay, lùi (soTuan-1) tuần', () => {
    eq(d.tuDauKhoang('2026-09-23', 8), '2026-08-03', '8 tuần từ 23/09 (thứ Hai tuần đó là 21/09)');
    eq(d.tuDauKhoang('2026-09-21', 1), '2026-09-21', '1 tuần = chính thứ Hai của tuần');
    eq(d.tuDauKhoang('2026-09-23', 4), '2026-08-31', '4 tuần');
  });

  check('PR-Pb · kyNangTheoCt: ba bộ đúng Q7 — không gộp W1/W2 vào W ở Cả hai', () => {
    eq(d.kyNangTheoCt('ft'), ['listening', 'reading', 'writing1', 'writing2', 'speaking'], 'FT');
    eq(d.kyNangTheoCt('thuong'), ['listening', 'reading', 'writing', 'speaking'], 'lớp thường');
    eq(d.kyNangTheoCt('ca-hai'), ['listening', 'reading', 'writing1', 'writing2', 'writing', 'speaking'], 'Cả hai — hợp, không gộp');
  });

  check('PR-Pb · mucNhiet: đủ 5 mức Q12 (0, N=0, và ba biên 10%/25%/40%)', () => {
    eq(d.mucNhiet(0, 10), 0, 'n=0');
    eq(d.mucNhiet(3, 0), 0, 'N=0');
    eq(d.mucNhiet(1, 20), 1, '5% < 10% → mức 1');
    eq(d.mucNhiet(2, 20), 2, '10% chạm biên (không còn < 10%) → mức 2');
    eq(d.mucNhiet(5, 20), 3, '25% chạm biên (không còn < 25%) → mức 3');
    eq(d.mucNhiet(8, 20), 4, '40% chạm biên (không còn < 40%) → mức 4');
    eq(d.mucNhiet(15, 20), 4, '75% → vẫn mức 4 (mức cao nhất)');
  });

  check('PR-Pb · gocNhinTuThamSo: Q16 — hang-doi/tinh-hinh/ky-nang KHÔNG bị xoá khỏi URL', () => {
    const g = (qs: string) => d.gocNhinTuThamSo(new URLSearchParams(qs));
    eq(g('xem=tuan'), { goc: 'tong-hop', ct: null, boThamSo: ['xem'] }, '?xem=tuan → Tổng hợp, xoá xem');
    eq(g('goc=danh-sach&hang-doi=due'), { goc: 'danh-sach', ct: null, boThamSo: [] }, 'goc=danh-sach giữ hang-doi');
    eq(g('hang-doi=review'), { goc: 'danh-sach', ct: null, boThamSo: [] }, 'chỉ có hang-doi cũng vào Danh sách Case');
    eq(g('tinh-hinh=no_plan'), { goc: 'danh-sach', ct: null, boThamSo: [] }, 'chỉ có tinh-hinh cũng vào Danh sách Case');
    eq(g('ky-nang=listening'), { goc: 'danh-sach', ct: null, boThamSo: [] }, 'chỉ có ky-nang cũng vào Danh sách Case');
    eq(g('loai-lop=normal'), { goc: 'tong-hop', ct: 'thuong', boThamSo: ['loai-lop'] }, 'loai-lop=normal → ct=thuong, xoá loai-lop');
    eq(g('loai-lop=ft'), { goc: 'tong-hop', ct: 'ft', boThamSo: ['loai-lop'] }, 'loai-lop=ft → ct=ft');
    eq(g('goc=y-thuc'), { goc: 'y-thuc', ct: null, boThamSo: [] }, 'goc=y-thuc giữ nguyên');
    eq(g(''), { goc: 'tong-hop', ct: null, boThamSo: [] }, 'không tham số → mặc định Tổng hợp');
  });

  check('PR-Pb · nhanDot / khoaDot / thuTuDot: MT1…MT5, Giữa khoá, Cuối khoá đúng thứ tự', () => {
    eq(d.nhanDot('mock', 3), 'MT3', 'FT');
    eq(d.nhanDot('progress', null), 'Giữa khoá', 'lớp thường giữa khoá');
    eq(d.nhanDot('final', null), 'Cuối khoá', 'lớp thường cuối khoá');
    eq(d.khoaDot('mock', 2), 'mt:2', 'khoá MT2');
    eq(d.khoaDot('progress', null), 'giua', 'khoá giữa khoá');
    const khoa = ['cuoi', 'mt:2', 'giua', 'mt:1'];
    eq(khoa.slice().sort((a, b) => d.thuTuDot(a) - d.thuTuDot(b)), ['mt:1', 'mt:2', 'giua', 'cuoi'], 'sắp đúng thứ tự MT1, MT2, Giữa khoá, Cuối khoá');
  });

  check('PR-Pb · bangXuatTongHop: bỏ đúng nhóm cột ẩn, dòng con thụt, dòng Tổng cuối, không lộ khoá kỹ thuật, không ISO', () => {
    const kq = {
      theo: 'tuan', ct: 'ft', cot: ['luot', 'dat', 'kn:listening', 'case'],
      hang: [
        { khoa: 'w1', nhan: 'W3 SEP', phu: '21/09–27/09 · tuần này', o: { luot: 10, dat: 6, 'kn:listening': 2, case: 1 },
          con: [{ khoa: 'w1|c1', nhan: 'FT101', o: { luot: 5, dat: 3, 'kn:listening': 1, case: 1 } }] },
      ],
      tong: { luot: 10, dat: 6, 'kn:listening': 2, case: 1 },
      scopeEmpty: false,
    };
    const day = d.bangXuatTongHop(kq, new Set(['ket-qua']), 'Cả trung tâm · Fast Track · 8 tuần');
    const flat = JSON.stringify(day);
    assert(!flat.includes('kn:'), 'ẩn nhóm ky-nang thì không còn khoá kn: nào trong bảng xuất');
    assert(!/\d{4}-\d{2}-\d{2}/.test(flat), 'không có chuỗi ISO nào trong bảng xuất');
    assert(day[0][0].includes('Tổng hợp Test + SOS'), 'dòng 1 là tiêu đề + mô tả bộ lọc');
    const dongChinh = day.find((r: any[]) => r[0] === 'W3 SEP · 21/09–27/09 · tuần này');
    assert(!!dongChinh, 'dòng chính có nhãn + phụ');
    const dongCon = day.find((r: any[]) => typeof r[0] === 'string' && r[0].startsWith('  FT101'));
    assert(!!dongCon, 'dòng con thụt hai dấu cách');
    const dongTong = day[day.length - 1];
    eq(dongTong[0], 'Cộng 1 tuần', 'dòng Tổng cuối cùng, đúng danh từ theo trục tuần');
    const day2 = d.bangXuatTongHop(kq, new Set(['ket-qua', 'ky-nang', 'xu-ly']), 'x');
    const hangCot = day2[3];
    assert(hangCot.some((x: any) => x === 'L'), 'bật nhóm ky-nang thì cột hiện nhãn ngắn L, không phải kn:listening');
  });

  // ================================================================== Task 2 — máy chủ Tổng hợp Test + SOS

  console.log('\nPR-Pb · Tổng hợp Test + SOS');
  const tongHopSvc: any = await import('../phanTich/tongHop.ts');
  const week: any = await import('../platform/week.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const mbBranch = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  const cpBranch = (conn.prepare(`SELECT id FROM branches WHERE code = 'CP'`).get() as any).id as number;
  const KET_QUA_COLS = ['dat', 'sos1', 'sos2', 'sos3', 'tamThoi', 'chuaDu'];
  const demCauHoi = async (fn: () => unknown): Promise<number> => {
    const goc = conn.prepare;
    let n = 0;
    conn.prepare = function (this: unknown, sql: string, ...r: unknown[]) { n += 1; return goc.call(this, sql, ...r); };
    try { await fn(); } finally { conn.prepare = goc; }
    return n;
  };

  const layMoiDong = (hang: any[]): any[] => hang.flatMap((h) => [h, ...layMoiDong(h.con ?? [])]);

  for (const theo of ['tuan', 'lop', 'dot', 'cn'] as const) {
    check(`PR-Pb · Tổng hợp (${theo}): sáu cột Kết quả cộng lại đúng bằng Lượt, ở mọi dòng và dòng con`, () => {
      const kq = tongHopSvc.tongHop(P.admin, { branchId: null, ct: 'ca-hai', soTuan: 52, classId: null, theo });
      for (const dong of layMoiDong(kq.hang)) {
        const tongKetQua = KET_QUA_COLS.reduce((s, c) => s + (dong.o[c] ?? 0), 0);
        assert(tongKetQua === dong.o.luot, `Dòng "${dong.nhan}": ${KET_QUA_COLS.map((c) => dong.o[c]).join('+')} = ${tongKetQua} ≠ luot ${dong.o.luot}`);
      }
      const tongChinh = KET_QUA_COLS.reduce((s, c) => s + (kq.tong[c] ?? 0), 0);
      assert(tongChinh === kq.tong.luot, `Dòng Tổng: ${tongChinh} ≠ luot ${kq.tong.luot}`);
    });
  }

  check('PR-Pb · Tổng hợp: tổng Lượt và tổng Case bằng nhau giữa bốn cách xếp dòng (cùng bộ lọc)', () => {
    const bo = { branchId: null, ct: 'ca-hai', soTuan: 52, classId: null };
    const tongs = (['tuan', 'lop', 'dot', 'cn'] as const).map((theo) => tongHopSvc.tongHop(P.admin, { ...bo, theo }).tong);
    for (const t2 of tongs.slice(1)) {
      assert(t2.luot === tongs[0].luot, `Tổng Lượt lệch giữa các cách xếp: ${JSON.stringify(tongs.map((x: any) => x.luot))}`);
      assert(t2.case === tongs[0].case, `Tổng Case lệch giữa các cách xếp: ${JSON.stringify(tongs.map((x: any) => x.case))}`);
    }
  });

  check('PR-Pb · Tổng hợp: dòng con cộng lại đúng bằng dòng cha (Lượt, Case) ở mọi cách xếp có dòng con', () => {
    for (const theo of ['tuan', 'lop', 'dot', 'cn'] as const) {
      const kq = tongHopSvc.tongHop(P.admin, { branchId: null, ct: 'ca-hai', soTuan: 52, classId: null, theo });
      for (const cha of kq.hang) {
        if (!cha.con?.length) continue;
        const luotCon = cha.con.reduce((s: number, c: any) => s + (c.o.luot ?? 0), 0);
        const caseCon = cha.con.reduce((s: number, c: any) => s + (c.o.case ?? 0), 0);
        assert(luotCon === cha.o.luot, `[${theo}] "${cha.nhan}": con cộng lượt ${luotCon} ≠ cha ${cha.o.luot}`);
        assert(caseCon === cha.o.case, `[${theo}] "${cha.nhan}": con cộng case ${caseCon} ≠ cha ${cha.o.case}`);
      }
    }
  });

  check('PR-Pb · Tổng hợp: cột học viên (hvCoCase) ở dòng Tổng là số DUY NHẤT, và ≤ tổng cộng học sinh của các dòng', () => {
    const kq = tongHopSvc.tongHop(P.admin, { branchId: null, ct: 'ca-hai', soTuan: 52, classId: null, theo: 'lop' });
    const congCacDong = kq.hang.reduce((s: number, h: any) => s + (h.o.hvCoCase ?? 0), 0);
    assert(kq.tong.hvCoCase <= congCacDong, `Tổng duy nhất ${kq.tong.hvCoCase} phải ≤ cộng các dòng ${congCacDong} (một em có thể ở nhiều lớp)`);
  });

  check('PR-Pb · oTongHop: n khớp số trong bảng và rows.length === n, ở ô Tổng, một dòng, và một cột kn:', () => {
    const kq = tongHopSvc.tongHop(P.admin, { branchId: null, ct: 'ft', soTuan: 52, classId: null, theo: 'lop' });
    const oTong = tongHopSvc.oTongHop(P.admin, { branchId: null, ct: 'ft', soTuan: 52, classId: null, theo: 'lop', khoa: 'tong', cot: 'luot' });
    assert(oTong.n === kq.tong.luot && oTong.rows.length === oTong.n, `Ô Tổng · Lượt: ${oTong.n} ≠ ${kq.tong.luot} hoặc rows lệch`);
    const dongCoDuLieu = kq.hang.find((h: any) => h.o.luot > 0);
    if (dongCoDuLieu) {
      const o = tongHopSvc.oTongHop(P.admin, { branchId: null, ct: 'ft', soTuan: 52, classId: null, theo: 'lop', khoa: dongCoDuLieu.khoa, cot: 'luot' });
      assert(o.n === dongCoDuLieu.o.luot && o.rows.length === o.n, `Dòng "${dongCoDuLieu.nhan}" · Lượt: ${o.n} ≠ ${dongCoDuLieu.o.luot} hoặc rows lệch`);
    }
    const dongCoKn = kq.hang.find((h: any) => (h.o['kn:listening'] ?? 0) > 0);
    if (dongCoKn) {
      const o = tongHopSvc.oTongHop(P.admin, { branchId: null, ct: 'ft', soTuan: 52, classId: null, theo: 'lop', khoa: dongCoKn.khoa, cot: 'kn:listening' });
      assert(o.n === dongCoKn.o['kn:listening'] && o.rows.length === o.n, `Dòng "${dongCoKn.nhan}" · kn:listening: ${o.n} ≠ ${dongCoKn.o['kn:listening']} hoặc rows lệch`);
    }
  });

  check('PR-Pb · Cột theo chương trình: ct=thuong không có kn:writing1/kn:writing2; ct=ft không có kn:writing', () => {
    const cotThuong = tongHopSvc.tongHop(P.admin, { branchId: null, ct: 'thuong', soTuan: 52, classId: null, theo: 'lop' }).cot;
    assert(!cotThuong.includes('kn:writing1') && !cotThuong.includes('kn:writing2'), `Lớp thường không được có cột W1/W2: ${cotThuong}`);
    const cotFt = tongHopSvc.tongHop(P.admin, { branchId: null, ct: 'ft', soTuan: 52, classId: null, theo: 'lop' }).cot;
    assert(!cotFt.includes('kn:writing'), `FT không được có cột W (lớp thường): ${cotFt}`);
  });

  check('PR-Pb · oTongHop(...,"luot") với ct đã chọn: mọi lượt trả về thuộc đúng lớp của chương trình đó', () => {
    const o = tongHopSvc.oTongHop(P.admin, { branchId: null, ct: 'ft', soTuan: 52, classId: null, theo: 'tuan', khoa: 'tong', cot: 'luot' });
    for (const id of o.rows.map((r: any) => r.id)) {
      const a = conn.prepare('SELECT c.is_fast_track AS ft FROM assessment_attempts a JOIN classes c ON c.id = a.class_id WHERE a.id = ?').get(id) as any;
      assert(a?.ft === 1, `Lượt #${id} phải thuộc lớp Fast Track khi ct=ft`);
    }
  });

  await checkAsync('PR-Pb · Q8: FT — band Writing tổng hợp đạt kỳ vọng thì KHÔNG sinh kn:writing1 dù riêng W1 dưới kỳ vọng', async () => {
    const cid = classId('MB-FT 101');
    const cls = conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(cid) as any;
    const tag = `PB2Q8-${Date.now()}`;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(
      `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
    ).run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, cls.branch_id, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`).run(sid, cid, now);
    const cycleId = Number(conn.prepare(
      `INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, 1, 'LT1', NULL, '2026-07-27', 'active', ?)`,
    ).run(sid, now).lastInsertRowid);
    const weekStart = week.mondayOf(TODAY);
    const periodId = week.ensurePeriod(weekStart).id;
    const attemptId = Number(conn.prepare(
      `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, target_at_attempt, status, created_at)
       VALUES (?, ?, 3, 'mock', ?, ?, 6.0, 'planned', ?)`,
    ).run(cycleId, sid, cid, periodId, now).lastInsertRowid);
    skillSchedule.ensureSkillRows(attemptId);
    /* W1 = 5.0 (dưới kỳ vọng 6.0 nếu xét riêng), W2 = 6.5 → band Writing tổng hợp = round((5+6.5*2)/3) = 6.0 = ĐẠT kỳ vọng. */
    conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, entered_at) VALUES (?, 'writing1', 5.0, ?)`).run(attemptId, now);
    conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, entered_at) VALUES (?, 'writing2', 6.5, ?)`).run(attemptId, now);
    try {
      const o = tongHopSvc.oTongHop(P.admin, {
        branchId: null, ct: 'ft', soTuan: 4, classId: cid, theo: 'lop', khoa: `lop:${cid}`, cot: 'kn:writing1',
      });
      assert(!o.rows.some((r: any) => r.id === sid), `Em không được vào kn:writing1 vì band Writing tổng hợp đã đạt kỳ vọng: ${JSON.stringify(o.rows)}`);
    } finally {
      conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ?').run(attemptId);
      conn.prepare('DELETE FROM attempt_skills WHERE attempt_id = ?').run(attemptId);
      conn.prepare('DELETE FROM assessment_attempts WHERE id = ?').run(attemptId);
      conn.prepare('DELETE FROM learning_cycles WHERE id = ?').run(cycleId);
      conn.prepare('DELETE FROM enrollments WHERE student_id = ?').run(sid);
      conn.prepare('DELETE FROM students WHERE id = ?').run(sid);
    }
  });

  check('PR-Pb · Quyền: giáo viên (không có meeting.view) bị 403; Quản lý một chi nhánh hỏi chi nhánh khác → rỗng, không phải toàn hệ thống', () => {
    let bi403 = false;
    try { tongHopSvc.tongHop(P.coreTeacher, { branchId: null, ct: 'ca-hai', soTuan: 8, classId: null, theo: 'tuan' }); }
    catch (e: any) { bi403 = e?.status === 403; }
    assert(bi403, 'Giáo viên không có meeting.view phải bị 403');

    const oCp = tongHopSvc.oTongHop(P.admin, { branchId: cpBranch, ct: 'ca-hai', soTuan: 8, classId: null, theo: 'tuan', khoa: 'tong', cot: 'luot' });
    const kqMbHoiCp = tongHopSvc.tongHop(P.mbManager, { branchId: cpBranch, ct: 'ca-hai', soTuan: 8, classId: null, theo: 'tuan' });
    assert(kqMbHoiCp.tong.luot === 0 && kqMbHoiCp.hang.length === 0,
      `QL Monbay hỏi chi nhánh CP phải ra rỗng (0 lượt, 0 dòng), không phải toàn hệ thống (CP có ${oCp.n} lượt thật)`);

    const oTong = tongHopSvc.oTongHop(P.mbManager, { branchId: null, ct: 'ca-hai', soTuan: 8, classId: null, theo: 'tuan', khoa: 'tong', cot: 'luot' });
    for (const id of oTong.rows.map((r: any) => r.id)) {
      const a = conn.prepare('SELECT c.branch_id AS bid FROM assessment_attempts a JOIN classes c ON c.id = a.class_id WHERE a.id = ?').get(id) as any;
      assert(a?.bid === mbBranch, `QL Monbay mặc định chỉ được thấy lượt của lớp chi nhánh Monbay, lượt #${id} thuộc chi nhánh ${a?.bid}`);
    }
  });

  await checkAsync('PR-Pb · Không N+1: số câu SQL của tongHop không đổi khi khoảng thời gian thay đổi (soTuan 4 và 26)', async () => {
    const n4 = await demCauHoi(() => tongHopSvc.tongHop(P.admin, { branchId: null, ct: 'ca-hai', soTuan: 4, classId: null, theo: 'lop' }));
    const n26 = await demCauHoi(() => tongHopSvc.tongHop(P.admin, { branchId: null, ct: 'ca-hai', soTuan: 26, classId: null, theo: 'lop' }));
    assert(n4 === n26, `Số câu SQL đổi theo khoảng thời gian: soTuan=4 → ${n4} câu, soTuan=26 → ${n26} câu`);
    assert(n4 <= 12, `Quá nhiều câu SQL cho một lần tính Tổng hợp: ${n4} (tối đa 12)`);
  });

  // ================================================================== Task 3 — máy chủ Vấn đề học viên (ma trận)

  console.log('\nPR-Pb · Vấn đề học viên (ma trận)');
  const vanDeSvc: any = await import('../phanTich/vanDe.ts');

  check('PR-Pb · Vấn đề học viên: mọi ô n ≤ N (kỹ năng và Tổng), ba giá trị ct, hai cách xếp cột', () => {
    for (const ct of ['ft', 'thuong', 'ca-hai'] as const) {
      for (const cot of ['lop', 'cn'] as const) {
        const kq = vanDeSvc.maTranVanDe(P.admin, { branchId: null, ct, classId: null, cot });
        for (const h of kq.hang) {
          for (const c of kq.cotDs) {
            const cell = h.o[c.khoa];
            if (cell) assert(cell.n <= cell.N, `${ct}/${cot} "${h.nhan}" · ${c.nhan}: n=${cell.n} > N=${cell.N}`);
          }
          assert(h.tong.n <= h.tong.N, `${ct}/${cot} "${h.nhan}" Tổng: n=${h.tong.n} > N=${h.tong.N}`);
        }
      }
    }
  });

  check('PR-Pb · Vấn đề học viên: ct=thuong không có dòng W1/W2; ct=ft không có dòng W (lớp thường)', () => {
    const thuong = vanDeSvc.maTranVanDe(P.admin, { branchId: null, ct: 'thuong', classId: null, cot: 'lop' }).hang.map((h: any) => h.kn);
    assert(!thuong.includes('writing1') && !thuong.includes('writing2'), `Lớp thường không được có dòng W1/W2: ${thuong}`);
    const ft = vanDeSvc.maTranVanDe(P.admin, { branchId: null, ct: 'ft', classId: null, cot: 'lop' }).hang.map((h: any) => h.kn);
    assert(!ft.includes('writing'), `FT không được có dòng W (lớp thường): ${ft}`);
  });

  check('PR-Pb · oVanDe: n khớp đúng số trong bảng và rows.length === n — ô kỹ năng, ô loại lỗi, và cột Tổng', () => {
    const kq = vanDeSvc.maTranVanDe(P.admin, { branchId: null, ct: 'ca-hai', classId: null, cot: 'lop' });
    let kiemDuocGi = false;
    for (const h of kq.hang) {
      for (const c of kq.cotDs) {
        const cell = h.o[c.khoa];
        if (cell && cell.n > 0) {
          const o = vanDeSvc.oVanDe(P.admin, { branchId: null, ct: 'ca-hai', classId: null, cot: 'lop', kn: h.kn, khoaCot: c.khoa });
          assert(o.n === cell.n && o.rows.length === o.n, `Ô kỹ năng "${h.nhan}" · ${c.nhan}: ${o.n} ≠ ${cell.n} hoặc rows lệch`);
          kiemDuocGi = true;
        }
      }
      if (h.tong.n > 0) {
        const oTong = vanDeSvc.oVanDe(P.admin, { branchId: null, ct: 'ca-hai', classId: null, cot: 'lop', kn: h.kn, khoaCot: 'tong' });
        assert(oTong.n === h.tong.n && oTong.rows.length === oTong.n, `Ô Tổng "${h.nhan}": ${oTong.n} ≠ ${h.tong.n} hoặc rows lệch`);
        kiemDuocGi = true;
      }
      for (const con of h.con) {
        if (con.tong > 0) {
          const oMa = vanDeSvc.oVanDe(P.admin, { branchId: null, ct: 'ca-hai', classId: null, cot: 'lop', kn: h.kn, ma: con.ma, khoaCot: 'tong' });
          assert(oMa.n === con.tong && oMa.rows.length === oMa.n, `Ô loại lỗi "${con.nhan}" (Tổng): ${oMa.n} ≠ ${con.tong} hoặc rows lệch`);
          kiemDuocGi = true;
        }
      }
    }
    assert(kiemDuocGi, 'Bộ demo phải có ít nhất một ô khác 0 để kiểm — nếu seed thay đổi, xem lại phép kiểm này');
  });

  check('PR-Pb · Vấn đề học viên: loiNhieuNhat khớp đúng dòng con lớn nhất ở cột Tổng (không tính Chưa phân loại)', () => {
    const kq = vanDeSvc.maTranVanDe(P.admin, { branchId: null, ct: 'ca-hai', classId: null, cot: 'lop' });
    for (const h of kq.hang) {
      const ungVien = h.con.filter((c: any) => c.ma !== '__chua-phan-loai__' && c.tong > 0);
      if (!h.loiNhieuNhat) { assert(ungVien.length === 0, `"${h.nhan}" không có loiNhieuNhat nhưng có ứng viên: ${JSON.stringify(ungVien)}`); continue; }
      const max = Math.max(...ungVien.map((c: any) => c.tong));
      assert(h.loiNhieuNhat.n === max, `"${h.nhan}": loiNhieuNhat.n=${h.loiNhieuNhat.n} ≠ lớn nhất thực ${max}`);
    }
  });

  check('PR-Pb · Vấn đề học viên: Case chưa xong — em có trong ô (kỹ năng, lớp đang học); đóng Case thì em biến mất khỏi ô', () => {
    const ung = conn
      .prepare(
        `SELECT sc.id, sc.status, sc.student_id, sc.category, sc.topic, e.class_id
           FROM sos_cases sc
           JOIN enrollments e ON e.student_id = sc.student_id AND e.status = 'active'
           JOIN classes c ON c.id = e.class_id AND c.status = 'active'
          WHERE sc.status != 'done'`,
      )
      .all() as any[];
    let found: any = null;
    for (const r of ung) {
      const hangMuc = r.category || d.categoryOf(r.topic);
      if (hangMuc) { found = { ...r, hangMuc }; break; }
    }
    assert(found, 'Bộ demo phải có ít nhất một Case chưa xong với hạng mục suy ra được, thuộc em đang học một lớp');
    const khoaCot = `lop:${found.class_id}`;
    const bo = { branchId: null, ct: 'ca-hai' as const, classId: null, cot: 'lop' as const, kn: found.hangMuc, khoaCot };
    const truoc = vanDeSvc.oVanDe(P.admin, bo);
    assert(truoc.rows.some((r: any) => r.id === found.student_id), `Em #${found.student_id} phải có trong ô (${found.hangMuc}, ${khoaCot}) khi Case đang mở`);
    conn.prepare(`UPDATE sos_cases SET status = 'done' WHERE id = ?`).run(found.id);
    try {
      const sau = vanDeSvc.oVanDe(P.admin, bo);
      assert(!sau.rows.some((r: any) => r.id === found.student_id), `Đóng Case xong thì em #${found.student_id} phải biến mất khỏi ô (${found.hangMuc}, ${khoaCot})`);
    } finally {
      conn.prepare(`UPDATE sos_cases SET status = ? WHERE id = ?`).run(found.status, found.id);
    }
  });

  check('PR-Pb · Vấn đề học viên: cột Tổng đếm DUY NHẤT — em học hai lớp cùng lúc không bị đếm hai lần', () => {
    const cid1 = classId('MB-FT 101');
    const khac = conn.prepare(`SELECT id FROM classes WHERE is_fast_track = 1 AND status = 'active' AND id != ?`).get(cid1) as any;
    const enr = conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`).get(cid1) as any;
    if (!khac || !enr) { console.log('  (bỏ qua: seed không có đủ lớp FT thứ hai + học viên để dựng tình huống)'); return; }
    const daHoc = conn.prepare(`SELECT 1 FROM enrollments WHERE student_id = ? AND class_id = ? AND status = 'active'`).get(enr.student_id, khac.id);
    if (daHoc) { console.log('  (bỏ qua: em đã học sẵn cả hai lớp)'); return; }
    const now = new Date().toISOString();
    const info = conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`)
      .run(enr.student_id, khac.id, now);
    try {
      const kq = vanDeSvc.maTranVanDe(P.admin, { branchId: null, ct: 'ft', classId: null, cot: 'lop' });
      const dong = kq.hang.find((h: any) => h.kn === 'listening');
      const congCot = kq.cotDs.reduce((s: number, c: any) => s + (dong.o[c.khoa]?.N ?? 0), 0);
      assert(dong.tong.N <= congCot, `Tổng N (${dong.tong.N}) phải ≤ cộng các cột (${congCot}) — em học hai lớp không được đếm hai lần ở Tổng`);
    } finally {
      conn.prepare(`DELETE FROM enrollments WHERE id = ?`).run(info.lastInsertRowid);
    }
  });

  check('PR-Pb · Vấn đề học viên — Quyền: GV không có meeting.view bị 403; QL Monbay hỏi chi nhánh CP → rỗng (không phải toàn hệ thống)', () => {
    let bi403 = false;
    try { vanDeSvc.maTranVanDe(P.coreTeacher, { branchId: null, ct: 'ca-hai', classId: null, cot: 'lop' }); }
    catch (e: any) { bi403 = e?.status === 403; }
    assert(bi403, 'Giáo viên không có meeting.view phải bị 403');
    const kqCp = vanDeSvc.maTranVanDe(P.mbManager, { branchId: cpBranch, ct: 'ca-hai', classId: null, cot: 'lop' });
    assert(kqCp.cotDs.length === 0 && kqCp.hang.every((h: any) => h.tong.N === 0),
      `QL Monbay hỏi chi nhánh CP phải ra rỗng, đang có ${kqCp.cotDs.length} cột`);
  });

  await checkAsync('PR-Pb · Không N+1: ma trận Vấn đề học viên ≤ 6 câu SQL, không đổi khi đổi cách xếp cột', async () => {
    const nLop = await demCauHoi(() => vanDeSvc.maTranVanDe(P.admin, { branchId: null, ct: 'ca-hai', classId: null, cot: 'lop' }));
    const nCn = await demCauHoi(() => vanDeSvc.maTranVanDe(P.admin, { branchId: null, ct: 'ca-hai', classId: null, cot: 'cn' }));
    assert(nLop <= 6, `Quá nhiều câu SQL cho ma trận Vấn đề học viên: ${nLop} (tối đa 6)`);
    assert(nLop === nCn, `Số câu SQL đổi theo cách xếp cột: theo lớp ${nLop}, theo chi nhánh ${nCn}`);
  });

  // ================================================================== Task 4 — P15: Phối hợp SOS chia SOS 1/2/3, bỏ N+1

  console.log('\nPR-Pb · P15 — Phối hợp SOS chia SOS 1/2/3');
  const metricsSvc: any = await import('../worklist/metrics.ts');
  const phoiHopSvc: any = await import('../yThuc/phoiHop.ts');
  const sapXep = (xs: number[]) => [...xs].sort((a, b) => a - b);

  check('PR-Pb · P15: byKind.sos1 ∪ sos2 ∪ sos3 = ids, rời nhau — cho cả ba chỉ số phối hợp', () => {
    for (const metricId of ['phoi-hop-luot-sos', 'phoi-hop-dang-xu-ly', 'phoi-hop-hoan-thanh']) {
      const r = phoiHopSvc.phoiHopMetric(P.admin, metricId, {});
      eq(sapXep([...r.byKind.sos1, ...r.byKind.sos2, ...r.byKind.sos3]), sapXep(r.ids), `${metricId}: hợp byKind phải bằng ids`);
      const s1 = new Set(r.byKind.sos1), s2 = new Set(r.byKind.sos2), s3 = new Set(r.byKind.sos3);
      assert(![...s1].some((x) => s2.has(x) || s3.has(x)) && ![...s2].some((x) => s3.has(x)), `${metricId}: ba tập phải rời nhau`);
    }
  });

  check("PR-Pb · P15: metricSet(P.admin, 'phoi-hop-luot-sos', {kind:'sos2'}).ids = byKind.sos2", () => {
    const r = phoiHopSvc.phoiHopMetric(P.admin, 'phoi-hop-luot-sos', {});
    const viaMetric = metricsSvc.metricSet(P.admin, 'phoi-hop-luot-sos', { kind: 'sos2' }).ids as number[];
    eq(sapXep(viaMetric), sapXep(r.byKind.sos2), 'metricSet kind=sos2 phải khớp byKind.sos2');
  });

  await checkAsync('PR-Pb · P15: không N+1 — số câu SQL của phoiHopMetric không đổi khi thêm một lượt có phối hợp', async () => {
    const n1 = await demCauHoi(() => phoiHopSvc.phoiHopMetric(P.admin, 'phoi-hop-luot-sos', {}));
    const semLuot = conn
      .prepare(
        `SELECT id, student_id FROM assessment_attempts a
          WHERE a.status != 'cancelled' AND NOT EXISTS (SELECT 1 FROM sos_coordination_actions x WHERE x.attempt_id = a.id)
          LIMIT 1`,
      )
      .get() as any;
    assert(semLuot, 'Bộ demo phải có ít nhất một lượt chưa có việc Phối hợp SOS để dựng tình huống');
    const now = new Date().toISOString();
    const info = conn
      .prepare(
        `INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, custom_name, preset, status, created_at)
         VALUES (?, ?, 'talk_student', NULL, 0, 'pending', ?)`,
      )
      .run(semLuot.id, semLuot.student_id, now);
    try {
      const n2 = await demCauHoi(() => phoiHopSvc.phoiHopMetric(P.admin, 'phoi-hop-luot-sos', {}));
      assert(n1 === n2, `Số câu SQL đổi khi thêm một lượt có phối hợp: ${n1} → ${n2}`);
    } finally {
      conn.prepare('DELETE FROM sos_coordination_actions WHERE id = ?').run(info.lastInsertRowid);
    }
  });

  // ================================================================== Task 5 — khung Phân tích: ánh xạ bộ lọc chung → /cases

  console.log('\nPR-Pb · Khung Phân tích — bộ lọc chung ánh xạ vào Danh sách Case');
  const caseSvc: any = await import('../cases/cases.ts');

  check("PR-Pb · Danh sách Case: listCases({ classKind: 'normal', classId }) chỉ trả Case của đúng lớp đó", () => {
    const cid = classId('MB-FOU 12');
    const r = caseSvc.listCases(P.mbManager, { classKind: 'normal', classId: cid });
    assert(!r.scopeEmpty, 'QL Monbay phải có phạm vi');
    for (const row of r.rows) {
      assert(row.homeClassId === cid, `Case #${row.id} không thuộc lớp ${cid}: homeClassId=${row.homeClassId}`);
    }
  });

  // ================================================================== Sửa sau rà planning (PR #73)

  console.log('\nPR-Pb · Sửa sau rà planning (PR #73)');

  check('PR-Pb · #1: chọn góc nhìn khác Danh sách Case thì xoá hang-doi/tinh-hinh/ky-nang — không kẹt lại ở Danh sách Case', () => {
    // Mô phỏng đúng những gì setGoc('tong-hop') làm khi bấm "Tổng hợp" từ URL ?tinh-hinh=no_plan.
    const p1 = new URLSearchParams('tinh-hinh=no_plan');
    eq(d.gocNhinTuThamSo(p1).goc, 'danh-sach', 'Trước khi bấm: tinh-hinh một mình cũng vào Danh sách Case');
    const next = new URLSearchParams(p1);
    next.delete('goc');
    for (const k of d.thamSoXoaKhiDoiGoc('tong-hop')) next.delete(k);
    eq(d.gocNhinTuThamSo(next).goc, 'tong-hop', 'Sau khi bấm Tổng hợp: phải sang Tổng hợp, không kẹt lại Danh sách Case');
    eq(d.thamSoXoaKhiDoiGoc('danh-sach'), [], 'Ở lại/quay về Danh sách Case thì không xoá gì');
    eq(d.thamSoXoaKhiDoiGoc('van-de'), ['hang-doi', 'tinh-hinh', 'ky-nang'], 'Sang góc nhìn khác cũng xoá y hệt');
    // gocNhinTuThamSo tự nó cũng phải để `goc` tường minh thắng heuristic, không cần chờ dọn tham số.
    eq(d.gocNhinTuThamSo(new URLSearchParams('goc=tong-hop&tinh-hinh=no_plan')).goc, 'tong-hop',
      'goc=tong-hop tường minh phải thắng dù tinh-hinh còn sót trên URL');
  });

  check('PR-Pb · #2: nhãn nhóm cột "Dưới kỳ vọng" theo chương trình — "Chưa đạt" khi ct=thuong', () => {
    eq(d.nhomCotNhanNgan('ky-nang', 'ft'), 'Dưới kỳ vọng', 'FT');
    eq(d.nhomCotNhanNgan('ky-nang', 'thuong'), 'Chưa đạt', 'lớp thường');
    eq(d.nhomCotNhanNgan('ky-nang', 'ca-hai'), 'Dưới kỳ vọng / chưa đạt', 'Cả hai');
    eq(d.nhomCotNhanNgan('ket-qua', 'thuong'), 'Kết quả', 'nhóm Kết quả không đổi theo ct');
    const cotFt = d.cotTongHopFor('ft').find((c: any) => c.khoa === 'kn:listening');
    const cotThuong = d.cotTongHopFor('thuong').find((c: any) => c.khoa === 'kn:listening');
    assert(cotFt.goiY.includes('dưới kỳ vọng') && !cotFt.goiY.includes('chưa đạt'), `Tooltip FT: ${cotFt.goiY}`);
    assert(cotThuong.goiY.includes('chưa đạt') && !cotThuong.goiY.includes('dưới kỳ vọng'), `Tooltip lớp thường: ${cotThuong.goiY}`);
  });

  check("PR-Pb · #3: \"Đang xử lý\" không đếm Case đã status='done' dù từng có hỗ trợ; \"Case\" vẫn đếm", () => {
    const attempt = conn
      .prepare(
        `SELECT a.id, a.student_id FROM assessment_attempts a
           JOIN assessment_scores s ON s.attempt_id = a.id
          WHERE a.status != 'cancelled' LIMIT 1`,
      )
      .get() as any;
    assert(attempt, 'Bộ demo phải có ít nhất một lượt đã chấm');
    const now = new Date().toISOString();
    const caseId = Number(
      conn
        .prepare(`INSERT INTO sos_cases (attempt_id, student_id, category, status, sos_level, created_at) VALUES (?,?, 'listening', 'done', 1, ?)`)
        .run(attempt.id, attempt.student_id, now).lastInsertRowid,
    );
    const ivId = Number(
      conn.prepare(`INSERT INTO case_interventions (case_id, kind, status, completed_date, created_at) VALUES (?, 'self_study', 'completed', ?, ?)`)
        .run(caseId, TODAY, now).lastInsertRowid,
    );
    try {
      const bo = { branchId: null, ct: 'ca-hai' as const, soTuan: 52, classId: null, theo: 'tuan' as const };
      const oCase = tongHopSvc.oTongHop(P.admin, { ...bo, khoa: 'tong', cot: 'case' });
      const oDangXuLy = tongHopSvc.oTongHop(P.admin, { ...bo, khoa: 'tong', cot: 'dangXuLy' });
      assert(oCase.rows.some((r: any) => r.id === caseId), 'Case đã đóng vẫn phải có mặt ở cột "Case" (tập lượt sinh ra)');
      assert(!oDangXuLy.rows.some((r: any) => r.id === caseId), `Case đã status='done' không được tính vào "Đang xử lý": ${JSON.stringify(oDangXuLy.rows.map((r: any) => r.id))}`);
    } finally {
      conn.prepare('DELETE FROM case_interventions WHERE id = ?').run(ivId);
      conn.prepare('DELETE FROM sos_cases WHERE id = ?').run(caseId);
    }
  });

  check('PR-Pb · #5: "Lỗi phổ biến nhất" loại cả "Khác" lẫn "Chưa phân loại"; ma trận xếp cột theo chi nhánh rồi mã lớp', () => {
    const kq = vanDeSvc.maTranVanDe(P.admin, { branchId: null, ct: 'ca-hai', classId: null, cot: 'lop' });
    for (const h of kq.hang) {
      if (h.loiNhieuNhat) {
        assert(h.loiNhieuNhat.nhan !== 'Khác' && h.loiNhieuNhat.nhan !== 'Chưa phân loại',
          `"${h.nhan}": loiNhieuNhat không được là "Khác"/"Chưa phân loại", đang là "${h.loiNhieuNhat.nhan}"`);
      }
    }
    const cotDs = kq.cotDs as { khoa: string; nhan: string }[];
    for (let i = 1; i < cotDs.length; i++) {
      const truoc = conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(Number(cotDs[i - 1].khoa.split(':')[1])) as any;
      const sau = conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(Number(cotDs[i].khoa.split(':')[1])) as any;
      assert(
        truoc.branch_id < sau.branch_id || (truoc.branch_id === sau.branch_id && cotDs[i - 1].nhan.localeCompare(cotDs[i].nhan) <= 0),
        `Cột "${cotDs[i - 1].nhan}" (chi nhánh ${truoc.branch_id}) phải đứng trước "${cotDs[i].nhan}" (chi nhánh ${sau.branch_id}) theo đúng thứ tự chi nhánh rồi mã lớp`,
      );
    }
  });
}
