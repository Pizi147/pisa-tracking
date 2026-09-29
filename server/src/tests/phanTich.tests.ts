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

  check('UX4 · mauOKetQua: 6 cột kết quả × v=0/v>0; cột khác null', () => {
    for (const k of ['dat', 'sos1', 'sos2', 'sos3']) {
      eq(d.mauOKetQua(k, 3), k, `${k} có số → chính nó`);
      eq(d.mauOKetQua(k, 0), 'xam', `${k} bằng 0 → xám`);
    }
    for (const k of ['tamThoi', 'chuaDu']) {
      eq(d.mauOKetQua(k, 2), 'tam', `${k} có số → tam`);
      eq(d.mauOKetQua(k, 0), 'xam', `${k} bằng 0 → xám`);
    }
    for (const k of ['luot', 'kn:listening', 'hvCoCase', 'case', 'dangXuLy', 'thieuPa']) eq(d.mauOKetQua(k, 5), null, `${k} không tô`);
  });

  check('PR-Pb · gocNhinTuThamSo: Q16 — hang-doi/tinh-hinh/ky-nang KHÔNG bị xoá khỏi URL', () => {
    const g = (qs: string) => d.gocNhinTuThamSo(new URLSearchParams(qs));
    eq(g('xem=tuan'), { goc: 'tong-hop', ct: null, boThamSo: ['xem'], gocMoi: null }, '?xem=tuan → Tổng hợp, xoá xem');
    eq(g('goc=danh-sach&hang-doi=due'), { goc: 'danh-sach', ct: null, boThamSo: [], gocMoi: null }, 'goc=danh-sach giữ hang-doi');
    eq(g('hang-doi=review'), { goc: 'danh-sach', ct: null, boThamSo: [], gocMoi: null }, 'chỉ có hang-doi cũng vào Danh sách Case');
    eq(g('tinh-hinh=no_plan'), { goc: 'danh-sach', ct: null, boThamSo: [], gocMoi: null }, 'chỉ có tinh-hinh cũng vào Danh sách Case');
    eq(g('ky-nang=listening'), { goc: 'danh-sach', ct: null, boThamSo: [], gocMoi: null }, 'chỉ có ky-nang cũng vào Danh sách Case');
    eq(g('loai-lop=normal'), { goc: 'tong-hop', ct: 'thuong', boThamSo: ['loai-lop'], gocMoi: null }, 'loai-lop=normal → ct=thuong, xoá loai-lop');
    eq(g('loai-lop=ft'), { goc: 'tong-hop', ct: 'ft', boThamSo: ['loai-lop'], gocMoi: null }, 'loai-lop=ft → ct=ft');
    eq(g('goc=y-thuc'), { goc: 'y-thuc', ct: null, boThamSo: [], gocMoi: null }, 'goc=y-thuc giữ nguyên');
    eq(g(''), { goc: 'tong-hop', ct: null, boThamSo: [], gocMoi: null }, 'không tham số → mặc định Tổng hợp');
  });

  check('UX4 · gocNhinTuThamSo: ket-qua→hieu-qua-pa, chua-ai-nhan→van-de, gocMoi đúng; hang-doi vẫn giữ', () => {
    const g = (qs: string) => d.gocNhinTuThamSo(new URLSearchParams(qs));
    eq(g('goc=ket-qua'), { goc: 'hieu-qua-pa', ct: null, boThamSo: [], gocMoi: 'hieu-qua-pa' }, 'ket-qua → Hiệu quả PA');
    eq(g('goc=chua-ai-nhan'), { goc: 'van-de', ct: null, boThamSo: [], gocMoi: 'van-de' }, 'chua-ai-nhan → Tổng hợp vấn đề HV');
    eq(g('goc=hieu-qua-pa').gocMoi, null, 'khoá mới không cần thay URL');
    eq(g('goc=van-de').goc, 'van-de', 'van-de giữ khoá cũ');
    eq(g('goc=danh-sach&hang-doi=can-ho-tro-2-lan'), { goc: 'danh-sach', ct: null, boThamSo: [], gocMoi: null }, 'hang-doi giữ nguyên');
    eq([...d.GOC_NHIN], ['tong-hop', 'van-de', 'hieu-qua-pa', 'y-thuc', 'danh-sach'], 'đúng thứ tự chủ sản phẩm chốt');
    eq(d.GOC_NHIN_LABEL['van-de'], 'Tổng hợp vấn đề HV', 'nhãn');
    eq(d.GOC_NHIN_LABEL['hieu-qua-pa'], 'Hiệu quả PA', 'nhãn');
  });

  check('UX4 · LOI_CHUNG: mọi mã có trong ISSUE_TAXONOMY; R/L language ở cả Ngữ pháp lẫn Từ vựng', () => {
    const moi = new Set<string>(d.ISSUE_TAXONOMY.flatMap((b: any) => b.items.map((i: any) => i.code)));
    for (const nhom of d.LOI_CHUNG) for (const ma of nhom.ma) assert(moi.has(ma), `${nhom.khoa}: mã "${ma}" không có trong ISSUE_TAXONOMY`);
    const cua = (khoa: string) => d.LOI_CHUNG.find((x: any) => x.khoa === khoa).ma as string[];
    for (const ma of ['student.reading.language', 'student.listening.language']) {
      assert(cua('ngu-phap').includes(ma) && cua('tu-vung').includes(ma), `${ma} phải có ở cả Ngữ pháp và Từ vựng`);
    }
    // PR-MON (K1-22): thêm nhóm Phát âm.
    eq(d.LOI_CHUNG.map((x: any) => x.nhan), ['Ngữ pháp', 'Từ vựng', 'Tổ chức ý / mạch lạc', 'Kỹ năng làm bài', 'Phát âm'], 'năm nhóm');
  });

  check('UX4 · hoKyNang: writing1/writing2/writing → writing; mã lạ → null', () => {
    for (const k of ['writing1', 'writing2', 'writing']) eq(d.hoKyNang(k), 'writing', k);
    for (const k of ['listening', 'reading', 'speaking']) eq(d.hoKyNang(k), k, k);
    eq(d.hoKyNang('prep_writing'), 'writing', 'mã cũ prep_writing');
    eq(d.hoKyNang('pronunciation'), 'speaking', 'mã cũ pronunciation');
    eq(d.hoKyNang('xyz'), null, 'mã lạ');
    eq(d.hoKyNang(null), null, 'null');
  });

  check('UX4 · nenDung: <5 PA false; 70% biên; hoà cùng đỉnh cả hai true', () => {
    eq(d.nenDung({ soPa: 4, caiThien: 4 }, []), false, '4 PA dù 100% → không đủ mẫu');
    eq(d.nenDung({ soPa: 10, caiThien: 7 }, []), true, '7/10 = 70% chạm biên');
    eq(d.nenDung({ soPa: 10, caiThien: 6 }, []), false, '6/10 < 70%');
    eq(d.nenDung({ soPa: 10, caiThien: 8 }, [{ soPa: 10, caiThien: 9 }]), false, 'anh em cao hơn (90%) → không phải cao nhất');
    eq(d.nenDung({ soPa: 10, caiThien: 8 }, [{ soPa: 5, caiThien: 4 }]), true, 'hoà cùng đỉnh (80% = 80%) → cả hai');
    eq(d.nenDung({ soPa: 10, caiThien: 8 }, [{ soPa: 3, caiThien: 3 }]), true, 'anh em dưới 5 PA không được xếp hạng');
  });

  check('UX4 · tuanTrungBinh: [] null, [3] 1, [20,22] 3', () => {
    eq(d.tuanTrungBinh([]), null, 'rỗng');
    eq(d.tuanTrungBinh([3]), 1, 'tối thiểu 1 tuần');
    eq(d.tuanTrungBinh([20, 22]), 3, '21 ngày = 3 tuần');
  });

  check('UX4 · nhanSoVoiTruoc: +3/-1/0/null', () => {
    eq(d.nhanSoVoiTruoc(3), { chu: '↑3', tone: 'bad' }, '+3');
    eq(d.nhanSoVoiTruoc(-1), { chu: '↓1', tone: 'ok' }, '-1');
    eq(d.nhanSoVoiTruoc(0), { chu: '=', tone: 'muted' }, '0');
    eq(d.nhanSoVoiTruoc(null), { chu: '—', tone: 'muted' }, 'null');
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
    const cid = classId('MB FT 101');
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

  // ================================================================== Task 2 — Tổng hợp vấn đề HV (PR-UX4)

  console.log('\nPR-UX4 · Tổng hợp vấn đề HV');
  const vanDeHvSvc: any = await import('../phanTich/vanDeHv.ts');
  const FV = (o: Record<string, unknown> = {}) => ({ branchId: null, ct: 'ca-hai', classId: null, soTuan: 8, chiChinh: false, gop: false, ...o });
  const moiHang = (kq: any): any[] => kq.hang.flatMap((h: any) => [h, ...(h.con ?? [])]);
  const timHang = (kq: any, khoa: string) => moiHang(kq).find((h) => h.khoa === khoa);
  const soHvCua = (kq: any, khoa: string): number => timHang(kq, khoa)?.soHv ?? 0;
  const ISS = {
    wGram: 'student.writing.grammar', wLex: 'student.writing.lexical', wOrg: 'student.writing.organisation', wOther: 'student.writing.other',
    rLang: 'student.reading.language', sGram: 'student.speaking.grammar', sPron: 'student.speaking.pronunciation', rLogic: 'student.reading.logic',
  };
  const baiTapUx4 = () => {
    const tao = { hv: [] as number[], ca: [] as number[], luot: [] as number[], chuKy: [] as number[] };
    const now = new Date().toISOString();
    return {
      /** Một học viên mới đang học lớp `cid` (kèm một lộ trình để gắn lượt Test giả). */
      hv(cid: number, tag: string): number {
        const cls = conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(cid) as any;
        const ma = `UX4-${tag}-${Date.now()}-${tao.hv.length}`;
        const sid = Number(conn.prepare(
          `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
        ).run(`PISA-${ma}`, `Học viên ${ma}`, `hoc vien ${ma.toLowerCase()}`, cls.branch_id, now).lastInsertRowid);
        conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`).run(sid, cid, now);
        tao.hv.push(sid);
        return sid;
      },
      ca(sid: number, category: string, issues: [string, 'primary' | 'secondary'][],
        o: { status?: string; closedAt?: string | null; attemptId?: number | null } = {}): number {
        const id = Number(conn.prepare(
          `INSERT INTO sos_cases (attempt_id, student_id, category, status, sos_level, closed_at, created_at) VALUES (?,?,?,?, 1, ?, ?)`,
        ).run(o.attemptId ?? null, sid, category, o.status ?? 'open', o.closedAt ?? null, now).lastInsertRowid);
        for (const [ma, vai] of issues) {
          conn.prepare(`INSERT INTO case_issues (case_id, role, taxonomy_code, created_at) VALUES (?,?,?,?)`).run(id, vai, ma, now);
        }
        tao.ca.push(id);
        return id;
      },
      /** Một lượt MT có điểm của học viên ở lớp `cid`, xếp vào tuần `weekStart`. */
      luot(sid: number, cid: number, attemptNo: number, weekStart: string): number {
        const cyc = Number(conn.prepare(
          `INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, ?, 'LT1', NULL, '2026-07-27', 'active', ?)`,
        ).run(sid, attemptNo, now).lastInsertRowid);
        tao.chuKy.push(cyc);
        const periodId = week.ensurePeriod(weekStart).id;
        const id = Number(conn.prepare(
          `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, target_at_attempt, status, created_at)
           VALUES (?, ?, ?, 'mock', ?, ?, 6.0, 'planned', ?)`,
        ).run(cyc, sid, attemptNo, cid, periodId, now).lastInsertRowid);
        conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, entered_at) VALUES (?, 'listening', 5.0, ?)`).run(id, now);
        tao.luot.push(id);
        return id;
      },
      don() {
        for (const id of tao.ca) { conn.prepare('DELETE FROM case_issues WHERE case_id = ?').run(id); conn.prepare('DELETE FROM sos_cases WHERE id = ?').run(id); }
        for (const id of tao.luot) { conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ?').run(id); conn.prepare('DELETE FROM assessment_attempts WHERE id = ?').run(id); }
        for (const id of tao.chuKy) conn.prepare('DELETE FROM learning_cycles WHERE id = ?').run(id);
        for (const id of tao.hv) { conn.prepare('DELETE FROM enrollments WHERE student_id = ?').run(id); conn.prepare('DELETE FROM students WHERE id = ?').run(id); }
      },
    };
  };
  const cong = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
  const CID_FT = classId('MB FT 101');

  check('UX4 · Vấn đề HV: ct=ft/thuong/ca-hai chỉ có 4 hàng kỹ năng, không W1/W2 riêng', () => {
    const kit = baiTapUx4();
    try {
      const sid = kit.hv(CID_FT, 'ct');
      kit.ca(sid, 'writing1', [[ISS.wGram, 'primary']]);
      kit.ca(sid, 'writing2', [[ISS.wOrg, 'primary']]);
      for (const ct of ['ft', 'thuong', 'ca-hai']) {
        const kq = vanDeHvSvc.vanDeHv(P.admin, FV({ ct }));
        for (const h of kq.hang) assert(['kn:listening', 'kn:reading', 'kn:writing', 'kn:speaking'].includes(h.khoa), `${ct}: hàng lạ "${h.khoa}"`);
        assert(!JSON.stringify(kq).includes('writing1') && !JSON.stringify(kq).includes('writing2'), `${ct}: không được lộ W1/W2 riêng`);
        if (ct !== 'thuong') assert(soHvCua(kq, 'kn:writing') >= 1, `${ct}: Case W1 + W2 của em phải gộp vào hàng Writing`);
      }
    } finally { kit.don(); }
  });

  check('UX4 · Vấn đề HV: oVanDeHv n === rows.length, bằng soHv/soLop ở hàng lớn, hàng con, chip top3, Chưa phân loại', () => {
    const kit = baiTapUx4();
    try {
      const a = kit.hv(CID_FT, 'o1'), b = kit.hv(CID_FT, 'o2');
      kit.ca(a, 'writing2', [[ISS.wGram, 'primary'], [ISS.wLex, 'secondary']]);
      kit.ca(b, 'writing1', [[ISS.wGram, 'primary']]);
      kit.ca(a, 'speaking', []);   // Case chưa phân loại
      const f = FV();
      const kq = vanDeHvSvc.vanDeHv(P.admin, f);
      let kiem = 0;
      for (const h of moiHang(kq)) {
        const oHv = vanDeHvSvc.oVanDeHv(P.admin, { ...f, dong: h.khoa, cot: 'hv' });
        assert(oHv.n === h.soHv && oHv.rows.length === oHv.n, `"${h.khoa}" · hv: ${oHv.n}/${oHv.rows.length} ≠ soHv ${h.soHv}`);
        const oLop = vanDeHvSvc.oVanDeHv(P.admin, { ...f, dong: h.khoa, cot: 'lop' });
        assert(oLop.n === h.soLop && oLop.rows.length === oLop.n, `"${h.khoa}" · lop: ${oLop.n}/${oLop.rows.length} ≠ soLop ${h.soLop}`);
        for (const chip of h.top3) {
          const oChip = vanDeHvSvc.oVanDeHv(P.admin, { ...f, dong: h.khoa, cot: `lop:${chip.classId}` });
          assert(oChip.n === chip.n && oChip.rows.length === oChip.n, `"${h.khoa}" · chip ${chip.ma}: ${oChip.n} ≠ ${chip.n}`);
        }
        kiem += 1;
      }
      assert(kiem >= 3, 'phải kiểm được ít nhất kn:writing + hai hàng con');
      for (const cot of ['case', 'hv', 'lop']) {
        const o = vanDeHvSvc.oVanDeHv(P.admin, { ...f, dong: 'chua-phan-loai', cot });
        const want = kq.chuaPhanLoai[cot];
        assert(o.n === want && o.rows.length === o.n && want >= 1, `Chưa phân loại · ${cot}: ${o.n}/${o.rows.length} ≠ ${want}`);
      }
      const ca = vanDeHvSvc.oVanDeHv(P.admin, { ...f, dong: 'chua-phan-loai', cot: 'case' });
      assert(ca.rows.every((r: any) => r.href.startsWith('/hoc-thuat/case/')), 'dòng Chưa phân loại mở Case');
      const hv = vanDeHvSvc.oVanDeHv(P.admin, { ...f, dong: 'kn:writing', cot: 'hv' });
      assert(hv.rows.every((r: any) => r.sub.length <= 60 && r.href.startsWith('/hoc-vien/')), 'dòng HV: sub ≤ 60 ký tự, mở hồ sơ');
      assert(/^(Lỗi chính|Lỗi phụ) · /.test(hv.rows[0].sub), `sub phải bắt đầu bằng vai lỗi: ${hv.rows[0].sub}`);
      for (const bad of [{ dong: 'kn:xyz', cot: 'hv' }, { dong: 'kn:writing', cot: 'xyz' }, { dong: 'chua-phan-loai', cot: 'xyz' }]) {
        let s = 0; try { vanDeHvSvc.oVanDeHv(P.admin, { ...f, ...bad }); } catch (e: any) { s = e?.status; }
        assert(s === 400, `khoá lạ ${JSON.stringify(bad)} phải 400, ra ${s}`);
      }
    } finally { kit.don(); }
  });

  check('UX4 · Vấn đề HV: hàng lớn = hợp (≤ tổng con), em hai lỗi cùng kỹ năng đếm 1', () => {
    const kit = baiTapUx4();
    try {
      const truoc = vanDeHvSvc.vanDeHv(P.admin, FV());
      const sid = kit.hv(CID_FT, 'hop');
      kit.ca(sid, 'writing2', [[ISS.wGram, 'primary'], [ISS.wLex, 'secondary']]);
      const sau = vanDeHvSvc.vanDeHv(P.admin, FV());
      eq(soHvCua(sau, 'kn:writing') - soHvCua(truoc, 'kn:writing'), 1, 'hàng Writing chỉ +1 dù em có hai lỗi');
      eq(soHvCua(sau, `kn:writing|${ISS.wGram}`) - soHvCua(truoc, `kn:writing|${ISS.wGram}`), 1, 'con Ngữ pháp +1');
      eq(soHvCua(sau, `kn:writing|${ISS.wLex}`) - soHvCua(truoc, `kn:writing|${ISS.wLex}`), 1, 'con Từ vựng +1');
      for (const h of sau.hang) {
        const tongCon = (h.con ?? []).reduce((s: number, c: any) => s + c.soHv, 0);
        const maxCon = Math.max(0, ...(h.con ?? []).map((c: any) => c.soHv));
        assert(h.soHv <= tongCon && h.soHv >= maxCon, `"${h.khoa}": ${h.soHv} phải nằm trong [${maxCon}, ${tongCon}]`);
      }
    } finally { kit.don(); }
  });

  check('UX4 · Vấn đề HV: gop — Ngữ pháp đếm duy nhất; em có W.grammar + R.language tính 1; R.language có ở cả Ngữ pháp và Từ vựng', () => {
    const kit = baiTapUx4();
    try {
      const truoc = vanDeHvSvc.vanDeHv(P.admin, FV({ gop: true }));
      const sid = kit.hv(CID_FT, 'gop');
      kit.ca(sid, 'writing2', [[ISS.wGram, 'primary']]);
      kit.ca(sid, 'reading', [[ISS.rLang, 'primary']]);
      const sau = vanDeHvSvc.vanDeHv(P.admin, FV({ gop: true }));
      eq(soHvCua(sau, 'chung:ngu-phap') - soHvCua(truoc, 'chung:ngu-phap'), 1, 'Ngữ pháp: em có hai mã ngữ pháp chỉ tính 1');
      eq(soHvCua(sau, 'chung:tu-vung') - soHvCua(truoc, 'chung:tu-vung'), 1, 'R.language cũng nằm ở Từ vựng');
      assert(!!timHang(sau, `chung:ngu-phap|reading|${ISS.rLang}`) && !!timHang(sau, `chung:tu-vung|reading|${ISS.rLang}`), 'R.language có con ở cả hai nhóm');
      const nhomNguPhap = sau.hang.find((h: any) => h.khoa === 'chung:ngu-phap');
      assert(!!nhomNguPhap.goiY && nhomNguPhap.goiY.includes('Từ vựng / ngữ pháp'), 'hàng Ngữ pháp có ⓘ nói rõ mục chung');
      assert(nhomNguPhap.phu !== undefined, 'có cột "Kỹ năng nhiều nhất"');
      for (const h of sau.hang) if (h.loai === 'chung') {
        const tongCon = (h.con ?? []).reduce((s: number, c: any) => s + c.soHv, 0);
        assert(h.soHv <= tongCon, `"${h.khoa}" ≤ tổng con`);
      }
      for (const h of sau.hang) assert(h.khoa.startsWith('chung:') || h.khoa.startsWith('gom:'), `chế độ gộp không còn hàng kỹ năng: ${h.khoa}`);
    } finally { kit.don(); }
  });

  check('UX4 · Vấn đề HV: chiChinh — bỏ lỗi phụ, số ≤ chế độ đủ; Chưa phân loại không đổi', () => {
    const kit = baiTapUx4();
    try {
      const sid = kit.hv(CID_FT, 'chinh');
      kit.ca(sid, 'writing2', [[ISS.wGram, 'primary'], [ISS.wLex, 'secondary']]);
      kit.ca(sid, 'speaking', [[ISS.sPron, 'secondary']]);
      const du = vanDeHvSvc.vanDeHv(P.admin, FV());
      const chinh = vanDeHvSvc.vanDeHv(P.admin, FV({ chiChinh: true }));
      for (const h of moiHang(chinh)) assert(h.soHv <= soHvCua(du, h.khoa), `chiChinh "${h.khoa}": ${h.soHv} > ${soHvCua(du, h.khoa)}`);
      assert(soHvCua(chinh, `kn:writing|${ISS.wLex}`) < soHvCua(du, `kn:writing|${ISS.wLex}`), 'lỗi phụ Từ vựng phải giảm khi chỉ lỗi chính');
      assert(soHvCua(chinh, `kn:speaking|${ISS.sPron}`) < soHvCua(du, `kn:speaking|${ISS.sPron}`), 'lỗi phụ Phát âm phải giảm');
      eq(chinh.chuaPhanLoai, du.chuaPhanLoai, 'Chưa phân loại không đổi theo công tắc');
      eq(chinh.chiChinh, true, 'kết quả ghi lại công tắc');
    } finally { kit.don(); }
  });

  check('UX4 · Vấn đề HV: Case đóng trước khoảng biến mất, đóng trong khoảng còn', () => {
    const kit = baiTapUx4();
    try {
      const cu = kit.hv(CID_FT, 'dongcu'), moi = kit.hv(CID_FT, 'dongmoi'), mo = kit.hv(CID_FT, 'dangmo');
      kit.ca(cu, 'writing2', [[ISS.wOther, 'primary']], { status: 'done', closedAt: cong(TODAY, -200) });
      kit.ca(moi, 'writing2', [[ISS.wOther, 'primary']], { status: 'done', closedAt: TODAY });
      kit.ca(mo, 'writing2', [[ISS.wOther, 'primary']]);
      const o = vanDeHvSvc.oVanDeHv(P.admin, { ...FV(), dong: 'kn:writing', cot: 'hv' });
      const ids = o.rows.map((r: any) => r.id);
      assert(!ids.includes(cu), 'Case đóng cách đây 200 ngày (ngoài 8 tuần) phải biến mất');
      assert(ids.includes(moi) && ids.includes(mo), 'Case đóng trong khoảng và Case đang mở phải còn');
      const oRong = vanDeHvSvc.oVanDeHv(P.admin, { ...FV({ soTuan: 26 }), dong: 'kn:writing', cot: 'hv' });
      assert(!oRong.rows.some((r: any) => r.id === cu), '200 ngày vẫn ngoài khoảng 6 tháng (26 tuần ≈ 182 ngày)');
    } finally { kit.don(); }
  });

  check('UX4 · Vấn đề HV: phu = con lớn nhất trừ Khác', () => {
    const kq = vanDeHvSvc.vanDeHv(P.admin, FV());
    for (const h of kq.hang) {
      const ungVien = (h.con ?? []).filter((c: any) => c.nhan !== 'Khác');
      if (!ungVien.length) { eq(h.phu ?? null, null, `"${h.khoa}" chỉ có Khác → không có Lỗi phổ biến`); continue; }
      const max = Math.max(...ungVien.map((c: any) => c.soHv));
      const cung = ungVien.filter((c: any) => c.soHv === max).map((c: any) => c.nhan).sort((x: string, y: string) => x.localeCompare(y));
      eq(h.phu, cung[0], `"${h.khoa}" Lỗi phổ biến`);
    }
    const kit = baiTapUx4();
    try {
      const sid = kit.hv(CID_FT, 'phu');
      kit.ca(sid, 'writing2', [[ISS.wOther, 'primary']]);
      const truoc = vanDeHvSvc.vanDeHv(P.admin, FV());
      const w = truoc.hang.find((h: any) => h.khoa === 'kn:writing');
      assert(w.phu !== 'Khác', 'Khác không bao giờ là Lỗi phổ biến');
    } finally { kit.don(); }
  });

  check('UX4 · Vấn đề HV: soVoiTruoc — dựng 2 đợt giả một lớp, Case ở đợt mới +1 → +1', () => {
    const kit = baiTapUx4();
    try {
      /* Xếp hai đợt giả SAU mọi tuần đã có — chúng chắc chắn là hai đợt mới nhất của lớp, dù các phép kiểm trước để lại gì. */
      const tuanCuoi = (conn.prepare('SELECT MAX(week_start) AS m FROM report_periods').get() as any).m as string;
      const tuanCu = week.mondayOf(cong(tuanCuoi, 7)), tuanMoi = week.mondayOf(cong(tuanCuoi, 14));
      const sid = kit.hv(CID_FT, 'sosanh');
      const luotCu = kit.luot(sid, CID_FT, 97, tuanCu);
      const luotMoi = kit.luot(sid, CID_FT, 98, tuanMoi);
      const khoa = `kn:writing|${ISS.wGram}`;
      const dv = (kq: any) => timHang(kq, khoa)?.soVoiTruoc ?? 0;
      const goc = vanDeHvSvc.vanDeHv(P.admin, FV());
      kit.ca(sid, 'writing2', [[ISS.wGram, 'primary']], { attemptId: luotMoi });
      const sau = vanDeHvSvc.vanDeHv(P.admin, FV());
      eq(dv(sau) - dv(goc), 1, 'Case sinh từ đợt mới → +1 so với lần Test trước');
      kit.ca(sid, 'writing2', [[ISS.wGram, 'primary']], { attemptId: luotCu });
      const sau2 = vanDeHvSvc.vanDeHv(P.admin, FV());
      eq(dv(sau2), dv(goc), 'thêm Case ở đợt liền trước → hiệu số về lại');
    } finally { kit.don(); }
  });

  check('UX4 · Vấn đề HV — quyền: GVCN 403; QL Monbay branchId=CP 403; lớp ngoài phạm vi 403', () => {
    const boi = (fn: () => unknown): number => { try { fn(); return 200; } catch (e: any) { return e?.status ?? 500; } };
    eq(boi(() => vanDeHvSvc.vanDeHv(P.coreTeacher, FV())), 403, 'GVCN vanDeHv');
    eq(boi(() => vanDeHvSvc.oVanDeHv(P.coreTeacher, { ...FV(), dong: 'chua-phan-loai', cot: 'case' })), 403, 'GVCN oVanDeHv');
    eq(boi(() => vanDeHvSvc.vanDeHv(P.mbManager, FV({ branchId: cpBranch }))), 403, 'QL Monbay hỏi chi nhánh CP');
    const lopCp = (conn.prepare('SELECT id FROM classes WHERE branch_id = ? LIMIT 1').get(cpBranch) as any).id as number;
    eq(boi(() => vanDeHvSvc.vanDeHv(P.mbManager, FV({ classId: lopCp }))), 403, 'QL Monbay hỏi lớp CP');
    eq(boi(() => vanDeHvSvc.vanDeHv(P.mbManager, FV({ branchId: mbBranch }))), 200, 'QL Monbay hỏi chi nhánh mình');
    eq(boi(() => vanDeHvSvc.vanDeHv(P.admin, FV({ branchId: cpBranch }))), 200, 'Quản trị hỏi chi nhánh bất kỳ');
  });

  await checkAsync('UX4 · Vấn đề HV: không N+1 — số câu SQL bằng nhau với tg=4 và tg=26, ≤ 12', async () => {
    const n4 = await demCauHoi(() => vanDeHvSvc.vanDeHv(P.admin, FV({ soTuan: 4 })));
    const n26 = await demCauHoi(() => vanDeHvSvc.vanDeHv(P.admin, FV({ soTuan: 26 })));
    const nGop = await demCauHoi(() => vanDeHvSvc.vanDeHv(P.admin, FV({ soTuan: 26, gop: true })));
    assert(n4 === n26 && n26 === nGop, `số câu SQL đổi: tg=4 → ${n4}, tg=26 → ${n26}, gộp → ${nGop}`);
    assert(n4 <= 12, `quá nhiều câu SQL: ${n4} (tối đa 12)`);
  });

  // ================================================================== Task 3 — Hiệu quả PA (PR-UX4)

  console.log('\nPR-UX4 · Hiệu quả PA');
  const hieuQuaSvc: any = await import('../phanTich/hieuQuaPa.ts');
  const effSvc: any = await import('../cases/effectiveness.ts');
  const FQ = (o: Record<string, unknown> = {}) => ({ branchId: null, ct: 'ca-hai', classId: null, soTuan: 8, ...o });
  const boiHttp = (fn: () => unknown): number => { try { fn(); return 200; } catch (e: any) { return e?.status ?? 500; } };
  const moiDongPa = (kq: any): any[] => [...kq.hang, ...(kq.gom?.hang ?? [])].flatMap((h: any) => [h, ...(h.con ?? [])]);
  const nowPa = new Date().toISOString();
  /** Một PA đã kết thúc của Case `caseId`: bắt đầu `batDau`, ghi kết quả `ketQua` (null = xong nhưng chưa ghi) vào `ngayKq`. */
  const dungPa = (bo: { pa: number[]; fu: number[] }, caseId: number, kind: string, ketQua: string | null, batDau: string, ngayKq: string) => {
    const id = Number(conn.prepare(
      `INSERT INTO case_interventions (case_id, kind, status, started_date, completed_date, created_at) VALUES (?,?, 'completed', ?, ?, ?)`,
    ).run(caseId, kind, batDau, ngayKq, nowPa).lastInsertRowid);
    bo.pa.push(id);
    if (ketQua) {
      bo.fu.push(Number(conn.prepare(
        `INSERT INTO case_followups (case_id, intervention_id, observed_on, outcome, created_at) VALUES (?,?,?,?,?)`,
      ).run(caseId, id, ngayKq, ketQua, nowPa).lastInsertRowid));
    }
    return id;
  };
  const donPa = (bo: { pa: number[]; fu: number[] }) => {
    for (const id of bo.fu) conn.prepare('DELETE FROM case_followups WHERE id = ?').run(id);
    for (const id of bo.pa) conn.prepare('DELETE FROM case_interventions WHERE id = ?').run(id);
  };
  /** Chọn một (kind, mã lỗi) mà bảng hiện có ≤ `toiDa` PA — để phép kiểm biên 4/5 không bị dữ liệu demo làm nhiễu. */
  const chonO = (toiDa: number): { kind: string; ma: string } => {
    const kq = hieuQuaSvc.hieuQuaPa(P.admin, FQ());
    const cur = new Map<string, number>(moiDongPa(kq).map((h: any) => [h.khoa, h.soPa] as [string, number]));
    for (const ma of ['student.speaking.pronunciation', 'student.listening.focus', 'student.reading.time', 'student.reading.logic']) {
      for (const kind of ['tutor', 'self_study', 'teaching_adjust', 'extra_homework']) {
        if ((cur.get(`vd:${ma}|${kind}`) ?? 0) <= toiDa && (cur.get(`vd:${ma}`) ?? 0) <= toiDa) return { kind, ma };
      }
    }
    throw new Error('Không tìm được ô trống để dựng phép kiểm Hiệu quả PA');
  };
  const NGAY_BD = cong(TODAY, -30);

  check('UX4 · Hiệu quả PA: Σ soPa hàng lớn + gom = tomTat.paCoKetQua; con cộng đúng bằng cha; không có cột "không cải thiện"', () => {
    const kit = baiTapUx4(); const bo = { pa: [] as number[], fu: [] as number[] };
    try {
      const { kind, ma } = chonO(0);
      for (let i = 0; i < 6; i++) {
        const sid = kit.hv(CID_FT, `pa${i}`);
        const c = kit.ca(sid, 'speaking', [[ma, 'primary']], { status: 'done', closedAt: TODAY });
        dungPa(bo, c, kind, i < 4 ? 'improved' : 'unchanged', NGAY_BD, cong(TODAY, -2));
      }
      const kq = hieuQuaSvc.hieuQuaPa(P.admin, FQ());
      const tong = [...kq.hang, ...(kq.gom?.hang ?? [])].reduce((s: number, h: any) => s + h.soPa, 0);
      eq(tong, kq.tomTat.paCoKetQua, 'Σ soPa hàng lớn + gom = paCoKetQua');
      eq([...kq.hang, ...(kq.gom?.hang ?? [])].reduce((s: number, h: any) => s + h.caiThien, 0), kq.tomTat.caiThien, 'Σ caiThien = tomTat.caiThien');
      for (const h of [...kq.hang, ...(kq.gom?.hang ?? [])]) {
        eq((h.con ?? []).reduce((s: number, c: any) => s + c.soPa, 0), h.soPa, `"${h.khoa}": con cộng đúng cha (soPa)`);
        eq((h.con ?? []).reduce((s: number, c: any) => s + c.caiThien, 0), h.caiThien, `"${h.khoa}": con cộng đúng cha (caiThien)`);
        assert(h.caiThien <= h.soPa, `"${h.khoa}": caiThien ≤ soPa`);
      }
      const json = JSON.stringify(kq);
      assert(!/khongCaiThien|khong-cai-thien|failure|unchanged/i.test(json), 'không có cột/khoá "không cải thiện"');
      eq(kq.tomTat.vanDeDuDuLieu, kq.hang.filter((h: any) => h.soPa >= 5).length + (kq.gom?.hang ?? []).filter((h: any) => h.soPa >= 5).length, 'vanDeDuDuLieu = số hàng lớn ≥ 5 PA');
      assert(kq.hang.every((h: any) => h.soPa > 2) && (kq.gom?.hang ?? []).every((h: any) => h.soPa <= 2), 'hàng lớn > 2 PA; ≤ 2 PA vào gom');
    } finally { donPa(bo); kit.don(); }
  });

  check('UX4 · Hiệu quả PA: itDuLieu đúng biên 5; tbTuan null khi < 5; nenDung chỉ ở hàng con đủ Q9', () => {
    const kit = baiTapUx4(); const bo = { pa: [] as number[], fu: [] as number[] };
    try {
      const { kind, ma } = chonO(0);
      const them = (n: number, ketQua: string, bd: string, kq: string) => {
        for (let i = 0; i < n; i++) {
          const sid = kit.hv(CID_FT, `bien${i}-${bo.pa.length}`);
          const c = kit.ca(sid, 'speaking', [[ma, 'primary']], { status: 'done', closedAt: TODAY });
          dungPa(bo, c, kind, ketQua, bd, kq);
        }
      };
      const dong = () => moiDongPa(hieuQuaSvc.hieuQuaPa(P.admin, FQ())).find((h: any) => h.khoa === `vd:${ma}|${kind}`);
      them(4, 'improved', cong(TODAY, -30), cong(TODAY, -9));     // 21 ngày → 3 tuần
      const bon = dong();
      eq([bon.soPa, bon.itDuLieu, bon.tbTuan, bon.nenDung], [4, true, null, false], '4 PA: Ít dữ liệu, không thời gian, không Nên dùng');
      them(1, 'improved', cong(TODAY, -30), cong(TODAY, -9));
      const nam = dong();
      eq([nam.soPa, nam.itDuLieu, nam.tbTuan, nam.nenDung], [5, false, 3, true], '5 PA cải thiện 100%: đủ dữ liệu, 3 tuần, Nên dùng');
      const cha = moiDongPa(hieuQuaSvc.hieuQuaPa(P.admin, FQ())).find((h: any) => h.khoa === `vd:${ma}`);
      eq(cha.nenDung, false, 'hàng lớn không bao giờ "Nên dùng"');
      them(3, 'unchanged', cong(TODAY, -30), cong(TODAY, -9));
      const tam = dong();
      eq([tam.soPa, tam.nenDung], [8, false], '5/8 = 62% < 70% → không Nên dùng');
    } finally { donPa(bo); kit.don(); }
  });

  check('UX4 · Hiệu quả PA: oHieuQuaPa n === rows.length cho pa, cai-thien, chua-ghi-ket-qua, case-chua-phan-loai; chuaGhiKetQua = plansNeedingEvaluation', () => {
    const kit = baiTapUx4(); const bo = { pa: [] as number[], fu: [] as number[] };
    try {
      const { kind, ma } = chonO(0);
      for (let i = 0; i < 3; i++) {
        const sid = kit.hv(CID_FT, `o${i}`);
        const c = kit.ca(sid, 'speaking', [[ma, 'primary']], { status: 'done', closedAt: TODAY });
        dungPa(bo, c, kind, i === 0 ? 'unchanged' : 'partial', NGAY_BD, cong(TODAY, -3));
      }
      const sid2 = kit.hv(CID_FT, 'chuaghi');
      const c2 = kit.ca(sid2, 'speaking', [[ma, 'primary']], { status: 'done', closedAt: TODAY });
      dungPa(bo, c2, kind, null, NGAY_BD, cong(TODAY, -3));                       // xong nhưng chưa ghi kết quả
      const sid3 = kit.hv(CID_FT, 'khongloi');
      const c3 = kit.ca(sid3, 'speaking', [], { status: 'done', closedAt: TODAY });  // không có lỗi chính
      dungPa(bo, c3, kind, 'improved', NGAY_BD, cong(TODAY, -3));
      const kq = hieuQuaSvc.hieuQuaPa(P.admin, FQ());
      const f = FQ();
      let dem = 0;
      for (const h of moiDongPa(kq)) {
        for (const [cot, want] of [['pa', h.soPa], ['cai-thien', h.caiThien]] as const) {
          const o = hieuQuaSvc.oHieuQuaPa(P.admin, { ...f, dong: h.khoa, cot });
          assert(o.n === want && o.rows.length === o.n, `"${h.khoa}" · ${cot}: ${o.n}/${o.rows.length} ≠ ${want}`);
          dem += 1;
        }
      }
      assert(dem >= 4, 'phải kiểm được ít nhất hàng lớn + hàng con');
      const oGhi = hieuQuaSvc.oHieuQuaPa(P.admin, { ...f, dong: 'chua-ghi-ket-qua', cot: '' });
      assert(oGhi.n === kq.chuaGhiKetQua && oGhi.rows.length === oGhi.n && oGhi.n >= 1, `chưa ghi kết quả: ${oGhi.n}/${oGhi.rows.length} ≠ ${kq.chuaGhiKetQua}`);
      const oCase = hieuQuaSvc.oHieuQuaPa(P.admin, { ...f, dong: 'case-chua-phan-loai', cot: '' });
      assert(oCase.n === kq.caseChuaPhanLoai && oCase.rows.length === oCase.n && oCase.n >= 1, `Case chưa phân loại: ${oCase.n}/${oCase.rows.length} ≠ ${kq.caseChuaPhanLoai}`);
      assert(oCase.rows.some((r: any) => r.id === c3), 'Case không có lỗi chính phải nằm trong danh sách chưa phân loại');
      const scope = { branchIds: null, ratio: null, classId: null, fromDate: d.tuDauKhoang(TODAY, 8) };
      eq(kq.chuaGhiKetQua, effSvc.plansNeedingEvaluation(scope).count, 'chuaGhiKetQua = plansNeedingEvaluation(cùng scope).count');
      let s = 0; try { hieuQuaSvc.oHieuQuaPa(P.admin, { ...f, dong: 'vd:khong-co', cot: 'pa' }); } catch (e: any) { s = e?.status; }
      eq(s, 400, 'khoá lạ → 400');
    } finally { donPa(bo); kit.don(); }
  });

  check('UX4 · Hiệu quả PA: effectiveness.planOutcomes có startedOn/outcomeOn, phép kiểm hiệu quả cũ vẫn xanh', () => {
    const kit = baiTapUx4(); const bo = { pa: [] as number[], fu: [] as number[] };
    try {
      const sid = kit.hv(CID_FT, 'eff');
      const c = kit.ca(sid, 'speaking', [['student.speaking.fluency', 'primary']], { status: 'done', closedAt: TODAY });
      const id = dungPa(bo, c, 'tutor', 'improved', cong(TODAY, -20), cong(TODAY, -5));
      const r = effSvc.planOutcomes({ studentIds: [sid] }).find((x: any) => x.id === id);
      eq([r.startedOn, r.outcomeOn], [cong(TODAY, -20), cong(TODAY, -5)], 'startedOn / outcomeOn');
      eq(r.group, 'success', 'nhóm kết quả không đổi');
    } finally { donPa(bo); kit.don(); }
  });

  check('UX4 · Hiệu quả PA — quyền: GVCN 403; QL chi nhánh khác 403; lớp ngoài phạm vi 403', () => {
    eq(boiHttp(() => hieuQuaSvc.hieuQuaPa(P.coreTeacher, FQ())), 403, 'GVCN hieuQuaPa');
    eq(boiHttp(() => hieuQuaSvc.oHieuQuaPa(P.coreTeacher, { ...FQ(), dong: 'chua-ghi-ket-qua', cot: '' })), 403, 'GVCN oHieuQuaPa');
    eq(boiHttp(() => hieuQuaSvc.hieuQuaPa(P.mbManager, FQ({ branchId: cpBranch }))), 403, 'QL Monbay hỏi CP');
    const lopCp = (conn.prepare('SELECT id FROM classes WHERE branch_id = ? LIMIT 1').get(cpBranch) as any).id as number;
    eq(boiHttp(() => hieuQuaSvc.hieuQuaPa(P.mbManager, FQ({ classId: lopCp }))), 403, 'QL Monbay hỏi lớp CP');
    eq(boiHttp(() => hieuQuaSvc.hieuQuaPa(P.mbManager, FQ())), 200, 'QL Monbay hỏi phạm vi mình');
  });

  await checkAsync('UX4 · Hiệu quả PA: không N+1 — số câu SQL không đổi theo khoảng và ≤ 12', async () => {
    const n4 = await demCauHoi(() => hieuQuaSvc.hieuQuaPa(P.admin, FQ({ soTuan: 4 })));
    const n26 = await demCauHoi(() => hieuQuaSvc.hieuQuaPa(P.admin, FQ({ soTuan: 26 })));
    assert(n4 === n26, `số câu SQL đổi theo khoảng: ${n4} → ${n26}`);
    assert(n4 <= 12, `quá nhiều câu SQL: ${n4} (tối đa 12)`);
  });

  // ================================================================== Task 4 — Ý thức & Phối hợp gọn (PR-UX4)

  console.log('\nPR-UX4 · Ý thức & Phối hợp gọn');
  const yThucSvc: any = await import('../phanTich/yThucPhanTich.ts');
  const metricsUx4: any = await import('../worklist/metrics.ts');
  const FY = (o: Record<string, unknown> = {}) => ({ branchId: null, ct: 'ca-hai', classId: null, from: d.tuDauKhoang(TODAY, 8), to: TODAY, ...o });
  const dungYThuc = () => {
    const tao = { vp: [] as number[], bp: [] as number[] };
    const now = new Date().toISOString();
    return {
      vp(sid: number, cid: number, ngay: string, cat = 'homework'): number {
        const id = Number(conn.prepare(
          `INSERT INTO violations (student_id, class_id, category, occurred_on, reported_on, reported_by, description, created_at) VALUES (?,?,?,?,?,?,?,?)`,
        ).run(sid, cid, cat, ngay, ngay, P.admin.userId, 'Vi phạm dựng cho phép kiểm UX4', now).lastInsertRowid);
        tao.vp.push(id);
        return id;
      },
      bp(sid: number, cid: number, kind: string, ngay: string, viIds: number[] = [], status = 'done'): number {
        /* PR-YT4: lần xử lý gắn lộ trình đang chạy của em — bậc đếm theo chuỗi thang. */
        const id = Number(conn.prepare(
          `INSERT INTO discipline_measures (student_id, cycle_id, class_id, kind, status, performed_on, created_at, created_by)
           VALUES (?, (SELECT id FROM learning_cycles WHERE student_id = ? ORDER BY (status = 'active') DESC, seq DESC LIMIT 1), ?,?,?,?,?,?)`,
        ).run(sid, sid, cid, kind, status, status === 'done' ? ngay : null, now, P.admin.userId).lastInsertRowid);
        tao.bp.push(id);
        for (const v of viIds) conn.prepare(`INSERT INTO measure_violations (measure_id, violation_id, added_by, added_at) VALUES (?,?,?,?)`).run(id, v, P.admin.userId, now);
        return id;
      },
      don() {
        for (const id of tao.bp) { conn.prepare('DELETE FROM measure_violations WHERE measure_id = ?').run(id); conn.prepare('DELETE FROM discipline_measures WHERE id = ?').run(id); }
        for (const id of tao.vp) { conn.prepare('DELETE FROM measure_violations WHERE violation_id = ?').run(id); conn.prepare('DELETE FROM violations WHERE id = ?').run(id); }
      },
    };
  };
  const mocHv = () => {
    const kit = baiTapUx4(); const yt = dungYThuc();
    const a = kit.hv(CID_FT, 'ya'), b = kit.hv(CID_FT, 'yb'), c = kit.hv(CID_FT, 'yc'), dd = kit.hv(CID_FT, 'yd'), e = kit.hv(CID_FT, 'ye');
    // PR-YT4 (K1-25): nhóm em của CỬA TRẠNG THÁI thay "bước tiếp theo · Thư CC".
    // a: 3 vi phạm trong 2 tuần, chưa xử lý → Bắt buộc xử lý, bậc kế Report 1
    yt.vp(a, CID_FT, cong(TODAY, -3)); yt.vp(a, CID_FT, cong(TODAY, -2)); yt.vp(a, CID_FT, cong(TODAY, -1));
    // b: đã Report 1, rồi một vi phạm Mới quá 5 ngày chưa ai xem → Quá hạn, bậc Report 1, bậc kế Report 2
    const b1 = yt.vp(b, CID_FT, cong(TODAY, -25)); yt.bp(b, CID_FT, 'report_1', cong(TODAY, -20), [b1]); yt.vp(b, CID_FT, cong(TODAY, -10));
    // c: 2 vi phạm mới → Mới, không vào danh sách
    yt.vp(c, CID_FT, cong(TODAY, -3)); yt.vp(c, CID_FT, cong(TODAY, -2));
    // d: 3 vi phạm đã xử lý hết → Đã xử lý, không vào danh sách
    const d1 = yt.vp(dd, CID_FT, cong(TODAY, -4)), d2 = yt.vp(dd, CID_FT, cong(TODAY, -3)), d3 = yt.vp(dd, CID_FT, cong(TODAY, -2));
    yt.bp(dd, CID_FT, 'report_1', cong(TODAY, -1), [d1, d2, d3]);
    // e: một đề xuất Đình chỉ đang chờ QL → Chờ QL duyệt
    const e1 = yt.vp(e, CID_FT, cong(TODAY, -3));
    yt.bp(e, CID_FT, 'suspension', cong(TODAY, -2), [e1], 'cho_duyet');
    return { kit, yt, a, b, c, dd, e, don: () => { yt.don(); kit.don(); } };
  };

  check('UX4 · (PR-YT4 K1-25) Ý thức: HV cần chú ý = Quá hạn · Bắt buộc xử lý · Chờ QL duyệt (cửa trạng thái); cột Bậc hiện tại / Bậc kế; Quá hạn đứng đầu', () => {
    const m = mocHv();
    try {
      const kq = yThucSvc.yThucPhanTich(P.admin, FY());
      const dong = (id: number) => kq.hvCanChuY.find((x: any) => x.studentId === id);
      eq([dong(m.a)?.nhom, dong(m.a)?.bac, dong(m.a)?.bacKe], ['bat_buoc', null, 'Report 1'], 'a: bắt buộc, chưa bậc nào');
      eq([dong(m.a)?.viPham, dong(m.a)?.chuaXuLy], [3, 3], 'a: 3 vi phạm, 3 chưa xử lý');
      eq([dong(m.b)?.nhom, dong(m.b)?.bac, dong(m.b)?.bacKe], ['qua_han', 'Report 1', 'Report 2'], 'b: quá hạn (Mới chưa ai xem)');
      eq([dong(m.b)?.bienPhapGanNhat, dong(m.b)?.ngay], ['Report 1', cong(TODAY, -20)], 'b: xử lý gần nhất');
      eq(dong(m.e)?.nhom, 'cho_duyet', 'e: đề xuất chờ QL');
      assert(!dong(m.c) && !dong(m.dd), 'c (Mới) và d (đã xử lý hết) không vào danh sách');
      for (const r of kq.hvCanChuY) assert(['qua_han', 'bat_buoc', 'cho_duyet'].includes(r.nhom) && !('buocTiep' in r), `"${r.ten}": ${r.nhom}`);
      const vt = (id: number) => kq.hvCanChuY.findIndex((x: any) => x.studentId === id);
      assert(vt(m.b) < vt(m.a) && vt(m.a) < vt(m.e), 'Quá hạn › Bắt buộc › Chờ QL duyệt');
    } finally { m.don(); }
  });

  check("UX4 · Ý thức: tổng vi phạm các lớp + gom = metricSet('vi-pham-tong', cùng from/to/branch).n; con cộng đúng cha; ± kỳ trước", () => {
    const m = mocHv();
    try {
      for (const branchId of [null, mbBranch]) {
        const f = FY({ branchId });
        const kq = yThucSvc.yThucPhanTich(P.admin, f);
        const tong = kq.lop.reduce((s: number, x: any) => s + x.viPham, 0) + (kq.gom?.hang ?? []).reduce((s: number, x: any) => s + x.viPham, 0);
        const so = metricsUx4.metricSet(P.admin, 'vi-pham-tong', { branchId, from: f.from, to: f.to }).n;
        eq(tong, so, `branch=${branchId}: Σ lớp + gom = vi-pham-tong`);
        for (const x of [...kq.lop, ...(kq.gom?.hang ?? [])]) {
          eq((x.con ?? []).reduce((s: number, c: any) => s + c.viPham, 0), x.viPham, `"${x.nhan}": con cộng đúng cha (viPham)`);
          eq((x.con ?? []).reduce((s: number, c: any) => s + c.chuaXuLy, 0), x.chuaXuLy, `"${x.nhan}": con cộng đúng cha (chưa xử lý)`);
        }
        assert((kq.gom?.hang ?? []).every((x: any) => x.viPham <= 2 && x.chuaXuLy === 0), 'gom: chỉ lớp ≤ 2 vi phạm đã xử lý hết');
        assert(kq.lop.every((x: any) => x.viPham >= 3 || x.chuaXuLy > 0), 'hiện rõ: ≥ 3 vi phạm hoặc còn chưa xử lý');
        eq(kq.gom ? kq.gom.soLop : 0, (kq.gom?.hang ?? []).length, 'gom.soLop');
      }
      const dongLop = (kq: any) => kq.lop.find((x: any) => x.classId === CID_FT);
      const truoc = dongLop(yThucSvc.yThucPhanTich(P.admin, FY()));
      assert(!!truoc, 'lớp FT MB FT 101 phải hiện rõ (có vi phạm chưa xử lý)');
      m.yt.vp(m.c, CID_FT, cong(d.tuDauKhoang(TODAY, 8), -3));       // một vi phạm ở KỲ TRƯỚC
      const sau = dongLop(yThucSvc.yThucPhanTich(P.admin, FY()));
      eq(sau.soVoiTruoc, truoc.soVoiTruoc - 1, 'thêm một vi phạm kỳ trước → "± kỳ trước" giảm 1, số vi phạm kỳ này giữ nguyên');
      eq(sau.viPham, truoc.viPham, 'vi phạm kỳ này không đổi');
    } finally { m.don(); }
  });

  check('UX4 · Ý thức: o n === rows.length (hv, lớp, hàng con, gom)', () => {
    const m = mocHv();
    try {
      const f = FY();
      const kq = yThucSvc.yThucPhanTich(P.admin, f);
      let dem = 0;
      const kiem = (dong: string, cot: string, want: number, nhan: string) => {
        const o = yThucSvc.oYThucPhanTich(P.admin, { ...f, dong, cot });
        assert(o.n === want && o.rows.length === o.n, `${nhan} · ${cot}: ${o.n}/${o.rows.length} ≠ ${want}`);
        dem += 1;
      };
      for (const h of kq.hvCanChuY) {
        kiem(`hv:${h.studentId}`, 'vi-pham', h.viPham, h.ten);
        kiem(`hv:${h.studentId}`, 'chua-xu-ly', h.chuaXuLy, h.ten);
      }
      for (const x of kq.lop) {
        kiem(x.khoa, 'vi-pham', x.viPham, x.nhan); kiem(x.khoa, 'chua-xu-ly', x.chuaXuLy, x.nhan); kiem(x.khoa, 'hv-co-vi-pham', x.hvCoViPham, x.nhan);
        for (const c of x.con ?? []) { kiem(c.khoa, 'vi-pham', c.viPham, `${x.nhan}/${c.nhan}`); kiem(c.khoa, 'hv-co-vi-pham', c.hvCoViPham, `${x.nhan}/${c.nhan}`); }
      }
      if (kq.gom) kiem('gom', 'vi-pham', kq.gom.hang.reduce((s: number, x: any) => s + x.viPham, 0), 'gom');
      assert(dem >= 10, `phải kiểm được nhiều ô (chỉ ${dem})`);
      for (const bad of [{ dong: 'hv:999999', cot: 'vi-pham' }, { dong: 'lop:999999', cot: 'vi-pham' }, { dong: 'hv:1', cot: 'xyz' }, { dong: 'xyz', cot: 'vi-pham' }]) {
        let s = 0; try { yThucSvc.oYThucPhanTich(P.admin, { ...f, ...bad }); } catch (e2: any) { s = e2?.status; }
        assert(s === 400, `khoá lạ ${JSON.stringify(bad)} phải 400, ra ${s}`);
      }
    } finally { m.don(); }
  });

  check('UX4 · Ý thức: không còn khoá/trường phối hợp SOS, không bảng 9 loại PA xử lý ở kết quả bảng', () => {
    const kq = yThucSvc.yThucPhanTich(P.admin, FY());
    assert(!/phoiHop|phoi-hop|coordination/i.test(JSON.stringify(Object.keys(kq))), `không được có khoá phối hợp: ${Object.keys(kq)}`);
    eq(Object.keys(kq).sort(), ['bienPhapTheoLoai', 'gom', 'hvCanChuY', 'lop', 'scopeEmpty'], 'đúng các khoá đã chốt');
    for (const k of Object.keys(kq.bienPhapTheoLoai)) assert(d.KHOA_LOAI_XU_LY.includes(k), `bienPhapTheoLoai chỉ có loại xử lý v4 (+ loai-cu, Q2): ${k}`);
  });

  check('UX4 · Ý thức — quyền: GVCN 403; QL chi nhánh khác 403; classId ngoài phạm vi 403', () => {
    eq(boiHttp(() => yThucSvc.yThucPhanTich(P.coreTeacher, FY())), 403, 'GVCN yThucPhanTich');
    eq(boiHttp(() => yThucSvc.oYThucPhanTich(P.coreTeacher, { ...FY(), dong: 'gom', cot: 'vi-pham' })), 403, 'GVCN oYThucPhanTich');
    eq(boiHttp(() => yThucSvc.yThucPhanTich(P.mbManager, FY({ branchId: cpBranch }))), 403, 'QL Monbay hỏi CP');
    const lopCp = (conn.prepare('SELECT id FROM classes WHERE branch_id = ? LIMIT 1').get(cpBranch) as any).id as number;
    eq(boiHttp(() => yThucSvc.yThucPhanTich(P.mbManager, FY({ classId: lopCp }))), 403, 'QL Monbay hỏi lớp CP');
    eq(boiHttp(() => yThucSvc.yThucPhanTich(P.mbManager, FY({ branchId: mbBranch }))), 200, 'QL Monbay hỏi chi nhánh mình');
    eq(boiHttp(() => yThucSvc.yThucPhanTich(P.admin, FY({ classId: lopCp }))), 200, 'Quản trị hỏi lớp bất kỳ');
  });

  await checkAsync('UX4 · Ý thức: không N+1 — số câu SQL không đổi theo khoảng và ≤ 12', async () => {
    const n4 = await demCauHoi(() => yThucSvc.yThucPhanTich(P.admin, FY({ from: d.tuDauKhoang(TODAY, 4) })));
    const n26 = await demCauHoi(() => yThucSvc.yThucPhanTich(P.admin, FY({ from: d.tuDauKhoang(TODAY, 26) })));
    assert(n4 === n26, `số câu SQL đổi theo khoảng: ${n4} → ${n26}`);
    assert(n4 <= 12, `quá nhiều câu SQL: ${n4} (tối đa 12)`);
  });

  // ================================================================== Task 5 — hai dòng "bỏ quên" (PR-UX4)

  console.log('\nPR-UX4 · Bỏ quên: Cần xử lý + bộ lọc Danh sách Case');
  const boQuenSvc: any = await import('../phanTich/boQuen.ts');
  const tongQuanSvc: any = await import('../worklist/tongQuan.ts');
  const CID_THUONG = classId('MB FOU 12');
  const LOAI_BQ = ['can-ho-tro-2-lan', 'bo-qua-van-can-ho-tro'] as const;
  const METRIC_BQ = { 'can-ho-tro-2-lan': 'hv-can-ho-tro-2-lan-chua-case', 'bo-qua-van-can-ho-tro': 'hv-bo-qua-van-can-ho-tro' } as const;
  const taoBoQuen = () => {
    const kit = baiTapUx4();
    const tao = { luot: [] as number[], chuKy: [] as number[], tinHieu: [] as number[] };
    const now = new Date().toISOString();
    const tuanCuoi = (conn.prepare('SELECT MAX(week_start) AS m FROM report_periods').get() as any).m as string;
    const tuan = (k: number) => week.mondayOf(cong(tuanCuoi, 7 * k));
    const luot = (sid: number, cid: number, kind: string, no: number, k: number, diem: Record<string, any>): number => {
      const cyc = Number(conn.prepare(
        `INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, ?, 'LT1', NULL, '2026-07-27', 'active', ?)`,
      ).run(sid, no, now).lastInsertRowid);
      tao.chuKy.push(cyc);
      const id = Number(conn.prepare(
        `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, target_at_attempt, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 6.0, 'planned', ?)`,
      ).run(cyc, sid, no, kind, cid, week.ensurePeriod(tuan(k)).id, now).lastInsertRowid);
      for (const [skill, v] of Object.entries(diem)) {
        conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, raw_score, raw_total, entered_at) VALUES (?,?,?,?,?,?)`)
          .run(id, skill, v.band ?? null, v.raw ?? null, v.tong ?? null, now);
      }
      tao.luot.push(id);
      return id;
    };
    return {
      kit, tuan,
      /** Lượt MT của lớp FT với Writing W1 = W2 = `w` (dưới kỳ vọng nếu thấp). */
      ft: (sid: number, no: number, k: number, w: number) => luot(sid, CID_FT, 'mock', no, k, { writing1: { band: w }, writing2: { band: w } }),
      /** Lượt Giữa/Cuối khoá của lớp thường với Writing `dung/tong`. */
      thuong: (sid: number, kind: 'progress' | 'final', k: number, dung: number, tong = 10) =>
        luot(sid, CID_THUONG, kind, kind === 'progress' ? 1 : 2, k, { writing: { raw: dung, tong } }),
      tinHieu(sid: number, cid: number, attemptId: number, status: string, resolvedAt: string | null): number {
        const id = Number(conn.prepare(
          `INSERT INTO case_signals (student_id, attempt_id, class_id, skill, category, detected_on, raised_on, verify_due, status, resolved_at, created_at)
           VALUES (?,?,?, 'writing', 'writing', ?, ?, ?, ?, ?, ?)`,
        ).run(sid, attemptId, cid, TODAY, TODAY, TODAY, status, resolvedAt, now).lastInsertRowid);
        tao.tinHieu.push(id);
        return id;
      },
      don() {
        for (const id of tao.tinHieu) conn.prepare('DELETE FROM case_signals WHERE id = ?').run(id);
        for (const id of tao.luot) { conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ?').run(id); conn.prepare('DELETE FROM assessment_attempts WHERE id = ?').run(id); }
        for (const id of tao.chuKy) conn.prepare('DELETE FROM learning_cycles WHERE id = ?').run(id);
        kit.don();     // Case + học viên (Case của kit không gắn lượt nên xoá sau lượt được)
      },
    };
  };
  const hangCua = (loai: string, sid: number, p = P.admin) => boQuenSvc.boQuen(p, null, TODAY)[loai].find((r: any) => r.studentId === sid);

  check('UX4 · Bỏ quên: FT hai lượt dưới kỳ vọng cùng Writing, không Case → có; Case mở writing2 → mất; Case đóng → có lại, chiTiet "Case đóng"', () => {
    const b = taoBoQuen();
    try {
      const x = b.kit.hv(CID_FT, 'bq1');
      b.ft(x, 4, 1, 3.0); b.ft(x, 5, 2, 3.0);
      const r = hangCua('can-ho-tro-2-lan', x);
      assert(!!r, 'em có hai lượt Writing dưới kỳ vọng, chưa Case → phải có');
      eq([r.kyNang, r.chiTiet, r.tu], ['W', 'MT4, MT5 dưới kỳ vọng · chưa có Case', d.tuanLich(b.tuan(2), TODAY)], 'dòng chi tiết');
      assert(r.chiTiet.length <= 60 && typeof r.lop === 'string', 'chiTiet ≤ 60 ký tự, có lớp');
      const caId = b.kit.ca(x, 'writing2', [], { status: 'open' });
      assert(!hangCua('can-ho-tro-2-lan', x), 'Case mở writing2 (cùng họ Writing với W1/W2) → mất');
      conn.prepare(`UPDATE sos_cases SET status = 'done', closed_at = ? WHERE id = ?`).run(cong(TODAY, -3), caId);
      const lai = hangCua('can-ho-tro-2-lan', x);
      assert(!!lai, 'Case đã đóng thì không chặn → có lại');
      assert(lai.chiTiet.includes(`Case đóng ${d.ngay(cong(TODAY, -3), TODAY)}`), `chiTiet phải nói Case đóng: ${lai.chiTiet}`);
      assert(!hangCua('bo-qua-van-can-ho-tro', x), 'FT không có bước Bỏ qua → không vào dòng 2');
    } finally { b.don(); }
  });

  check('UX4 · Bỏ quên: em đã lên FT có tín hiệu lớp thường cũ bị Bỏ qua → không vào tập; hai lượt khác chương trình → không tính "2 lần liền"', () => {
    const b = taoBoQuen();
    try {
      // z: đang học FT (không còn ghi danh lớp thường), tín hiệu Bỏ qua từ lớp thường cũ + lượt sau (lớp thường) vẫn chưa đạt
      const z = b.kit.hv(CID_FT, 'bq7z');
      const zCu = b.thuong(z, 'progress', 1, 2); b.thuong(z, 'final', 2, 3);
      b.tinHieu(z, CID_THUONG, zCu, 'noted', cong(TODAY, -10));
      assert(!hangCua('bo-qua-van-can-ho-tro', z), 'em đã chuyển FT: tín hiệu Bỏ qua ở lớp thường cũ không được vào tập');
      for (const ct of ['ca-hai', 'ft', 'thuong']) {
        const dk = boQuenSvc.danhSachBoQuen(P.admin, { branchId: null, ct, loai: 'bo-qua-van-can-ho-tro' }, TODAY);
        assert(!dk.rows.some((r: any) => r.studentId === z), `không hiện ở ct=${ct}`);
      }
      // y: đang học FT, một lượt lớp thường cũ chưa đạt + một lượt FT chưa đạt → không phải "2 lần liền" cùng chương trình
      const y = b.kit.hv(CID_FT, 'bq7y');
      b.thuong(y, 'progress', 1, 2); b.ft(y, 5, 2, 3.0);
      assert(!hangCua('can-ho-tro-2-lan', y), 'lượt lớp thường + lượt FT không tính "2 lần liền"');
      // đối chứng: cùng chương trình thì vẫn có
      const x = b.kit.hv(CID_FT, 'bq7x'); b.ft(x, 4, 1, 3.0); b.ft(x, 5, 2, 3.0);
      assert(!!hangCua('can-ho-tro-2-lan', x), 'đối chứng: hai lượt FT cùng chương trình → có');
    } finally { b.don(); }
  });

  check('UX4 · Bỏ quên: lượt sau đạt → không có; chỉ một lượt → không có; Case mở khác họ kỹ năng không chặn', () => {
    const b = taoBoQuen();
    try {
      const a = b.kit.hv(CID_FT, 'bq2a'), c = b.kit.hv(CID_FT, 'bq2c'), e = b.kit.hv(CID_FT, 'bq2e');
      b.ft(a, 4, 1, 3.0); b.ft(a, 5, 2, 9.0);      // lượt mới nhất đạt
      b.ft(c, 5, 2, 3.0);                          // chỉ một lượt
      b.ft(e, 4, 1, 3.0); b.ft(e, 5, 2, 3.0);
      b.kit.ca(e, 'listening', [], { status: 'open' });   // Case mở của Listening, không phải Writing
      assert(!hangCua('can-ho-tro-2-lan', a), 'lượt mới nhất đạt → không');
      assert(!hangCua('can-ho-tro-2-lan', c), 'một lượt → không');
      assert(!!hangCua('can-ho-tro-2-lan', e), 'Case mở khác họ kỹ năng → vẫn có');
    } finally { b.don(); }
  });

  check('UX4 · Bỏ quên: tín hiệu noted + lượt sau chưa đạt cùng họ → có; lượt sau đạt → không; Case mở → không; lớp thường nói "Giữa khoá, Cuối khoá chưa đạt"', () => {
    const b = taoBoQuen();
    try {
      const z = b.kit.hv(CID_THUONG, 'bq3z'), y = b.kit.hv(CID_THUONG, 'bq3y'), w = b.kit.hv(CID_THUONG, 'bq3w');
      const zCu = b.thuong(z, 'progress', 1, 2); b.thuong(z, 'final', 2, 3);       // 2/10 rồi 3/10: chưa đạt hai lần
      b.tinHieu(z, CID_THUONG, zCu, 'noted', cong(TODAY, -10));
      const yCu = b.thuong(y, 'progress', 1, 2); b.thuong(y, 'final', 2, 9);       // lần sau đạt
      b.tinHieu(y, CID_THUONG, yCu, 'noted', cong(TODAY, -10));
      const wCu = b.thuong(w, 'progress', 1, 2); b.thuong(w, 'final', 2, 3);
      b.tinHieu(w, CID_THUONG, wCu, 'noted', cong(TODAY, -10));
      b.kit.ca(w, 'writing', [], { status: 'open' });
      const r1 = hangCua('can-ho-tro-2-lan', z), r2 = hangCua('bo-qua-van-can-ho-tro', z);
      assert(!!r1 && !!r2, 'z có ở cả hai dòng');
      eq(r1.chiTiet, 'Giữa khoá, Cuối khoá chưa đạt · chưa có Case', 'lớp thường nói "chưa đạt"');
      eq(r2.chiTiet, `Bỏ qua ${d.ngay(cong(TODAY, -10), TODAY)} · Cuối khoá vẫn chưa đạt`, 'chi tiết dòng 2');
      eq(r2.kyNang, 'W', 'kỹ năng');
      assert(!hangCua('bo-qua-van-can-ho-tro', y), 'lượt sau đạt → không');
      assert(!hangCua('bo-qua-van-can-ho-tro', w) && !hangCua('can-ho-tro-2-lan', w), 'Case mở cùng họ → không cả hai');
    } finally { b.don(); }
  });

  check("UX4 · Bỏ quên: n của /phan-tich/bo-quen = metricSet(...).n cho 2 loại × 3 ct; Cần xử lý hiện 2 dòng khi n>0, số = metricSet", () => {
    const b = taoBoQuen();
    try {
      const x = b.kit.hv(CID_FT, 'bq4x'); b.ft(x, 4, 1, 3.0); b.ft(x, 5, 2, 3.0);
      const z = b.kit.hv(CID_THUONG, 'bq4z'); const zCu = b.thuong(z, 'progress', 1, 2); b.thuong(z, 'final', 2, 3);
      b.tinHieu(z, CID_THUONG, zCu, 'noted', cong(TODAY, -10));
      for (const loai of LOAI_BQ) {
        for (const ct of ['ca-hai', 'ft', 'thuong']) {
          const dk = boQuenSvc.danhSachBoQuen(P.admin, { branchId: null, ct, loai }, TODAY);
          const so = metricsUx4.metricSet(P.admin, METRIC_BQ[loai], { program: ct });
          eq([dk.n, dk.rows.length], [so.n, so.ids.length], `${loai} × ${ct}: đường Danh sách Case = sổ chỉ số`);
          eq([...dk.rows.map((r: any) => r.studentId)].sort((p, q) => p - q), so.ids, `${loai} × ${ct}: cùng tập HV`);
        }
      }
      assert(!!hangCua('can-ho-tro-2-lan', x) && !!hangCua('bo-qua-van-can-ho-tro', z), 'dữ liệu dựng phải vào hai danh sách');
      const tq = tongQuanSvc.tongQuanQuanLy(P.admin, { ct: 'ca-hai' });
      for (const loai of LOAI_BQ) {
        const dong = tq.canXuLy.find((r: any) => r.metricId === METRIC_BQ[loai]);
        assert(!!dong, `Cần xử lý phải hiện dòng ${METRIC_BQ[loai]} khi n > 0`);
        eq(dong.n, metricsUx4.metricSet(P.admin, METRIC_BQ[loai], { program: 'ca-hai' }).n, `${loai}: số dòng = metricSet`);
        eq([dong.denLoc, dong.nut, dong.mau], [loai, 'Xem', 'vang'], `${loai}: nút Xem → bộ lọc, màu vàng`);
      }
      assert(tq.canXuLy.length <= 10, 'Cần xử lý tối đa 10 dòng');
      const chiNhanh = boQuenSvc.danhSachBoQuen(P.mbManager, { branchId: mbBranch, ct: 'ca-hai', loai: 'can-ho-tro-2-lan' }, TODAY);
      eq(chiNhanh.n, metricsUx4.metricSet(P.mbManager, METRIC_BQ['can-ho-tro-2-lan'], { branchId: mbBranch, program: 'ca-hai' }).n, 'QL chi nhánh: cùng số với sổ');
    } finally { b.don(); }
  });

  check('UX4 · Bỏ quên — quyền: GVCN 403; QL chi nhánh khác 403', () => {
    eq(boiHttp(() => boQuenSvc.danhSachBoQuen(P.coreTeacher, { branchId: null, ct: 'ca-hai', loai: 'can-ho-tro-2-lan' }, TODAY)), 403, 'GVCN');
    eq(boiHttp(() => boQuenSvc.danhSachBoQuen(P.mbManager, { branchId: cpBranch, ct: 'ca-hai', loai: 'can-ho-tro-2-lan' }, TODAY)), 403, 'QL Monbay hỏi CP');
    eq(boiHttp(() => boQuenSvc.danhSachBoQuen(P.mbManager, { branchId: mbBranch, ct: 'ca-hai', loai: 'bo-qua-van-can-ho-tro' }, TODAY)), 200, 'QL Monbay hỏi mình');
    assert(d.laLoaiBoQuen('can-ho-tro-2-lan') && !d.laLoaiBoQuen('xyz'), 'laLoaiBoQuen');
  });

  await checkAsync('UX4 · Bỏ quên: không N+1 — thêm nhiều HV có lượt thì số câu SQL của boQuen gần như không đổi', async () => {
    const b = taoBoQuen();
    try {
      const n1 = await demCauHoi(() => boQuenSvc.boQuen(P.admin, null, TODAY));
      for (let i = 0; i < 6; i++) {
        const x = b.kit.hv(CID_FT, `bq6-${i}`);
        b.ft(x, 4, 1, 3.0); b.ft(x, 5, 2, 3.0);
      }
      const n2 = await demCauHoi(() => boQuenSvc.boQuen(P.admin, null, TODAY));
      assert(n2 <= n1 + 2, `số câu SQL tăng theo số HV: ${n1} → ${n2}`);
      assert(n2 <= 16, `quá nhiều câu SQL: ${n2} (tối đa 16)`);
    } finally { b.don(); }
  });

  // ================================================================== Bổ sung phép kiểm PR-UX4 (rà nhanh sau khi web xong)

  console.log('\nPR-UX4 · Bổ sung');

  check('UX4 · Vấn đề HV: gop — nhóm "chỉ một kỹ năng" đứng cuối, mọi "Khác" gộp một dòng, mã chỉ ở một kỹ năng có dòng riêng', () => {
    const kit = baiTapUx4();
    try {
      const truoc = vanDeHvSvc.vanDeHv(P.admin, FV({ gop: true }));
      const a = kit.hv(CID_FT, 'gm1'), b = kit.hv(CID_FT, 'gm2');
      // PR-MON (K1-22): Phát âm nay là nhóm chung → mã một kỹ năng dùng Reading · Tư duy logic.
      kit.ca(a, 'reading', [[ISS.rLogic, 'primary']]);
      kit.ca(b, 'writing2', [[ISS.wOther, 'primary']]);
      kit.ca(b, 'speaking', [['student.speaking.other', 'secondary']]);
      const sau = vanDeHvSvc.vanDeHv(P.admin, FV({ gop: true }));
      const gom = sau.hang[sau.hang.length - 1];
      eq(gom.khoa, 'gom:mot', 'nhóm "chỉ một kỹ năng" đứng cuối');
      eq(gom.loai, 'gom', 'loại gom');
      assert(/loại lỗi chỉ có ở một kỹ năng$/.test(gom.nhan), `nhãn nhóm: ${gom.nhan}`);
      const con = (kq: any, k: string) => timHang(kq, k);
      eq(con(sau, `gom:mot|${ISS.rLogic}`).nhan, 'Reading · Tư duy logic', 'mã chỉ ở Reading có dòng riêng kèm tên kỹ năng');
      eq((con(sau, 'gom:mot|khac')?.soHv ?? 0) - (con(truoc, 'gom:mot|khac')?.soHv ?? 0), 1, 'mọi "Khác" gộp MỘT dòng — em b có hai "Khác" (W, S) chỉ đếm 1');
      eq(con(sau, 'gom:mot|khac').nhan, 'Khác', 'nhãn dòng Khác');
      assert(sau.hang.every((h: any) => h.khoa.startsWith('chung:') || h.khoa === 'gom:mot'), 'không còn hàng kỹ năng');
      assert(soHvCua(sau, `gom:mot|${ISS.rLogic}`) - soHvCua(truoc, `gom:mot|${ISS.rLogic}`) === 1, 'Tư duy logic +1');
    } finally { kit.don(); }
  });

  check('UX4 · Vấn đề HV: top3 xếp số HV giảm rồi mã lớp, tối đa 3, mỗi chip > 0 và ≤ soHv; soLop = số lớp có HV', () => {
    const kit = baiTapUx4();
    try {
      kit.ca(kit.hv(CID_FT, 't1'), 'writing2', [[ISS.wGram, 'primary']]);
      kit.ca(kit.hv(CID_FT, 't2'), 'writing2', [[ISS.wGram, 'primary']]);
      kit.ca(kit.hv(CID_THUONG, 't3'), 'writing', [[ISS.wGram, 'primary']]);
      const kq = vanDeHvSvc.vanDeHv(P.admin, FV());
      let dem = 0;
      for (const h of moiHang(kq)) {
        assert(h.top3.length <= 3 && h.top3.length <= h.soLop, `"${h.khoa}": top3 dài ${h.top3.length}, soLop ${h.soLop}`);
        for (let i = 0; i < h.top3.length; i++) {
          assert(h.top3[i].n > 0 && h.top3[i].n <= h.soHv, `"${h.khoa}": chip ${h.top3[i].ma} = ${h.top3[i].n} ngoài (0, ${h.soHv}]`);
          if (i > 0) {
            const t = h.top3[i - 1], s = h.top3[i];
            assert(t.n > s.n || (t.n === s.n && t.ma.localeCompare(s.ma) <= 0), `"${h.khoa}": chip không xếp giảm (${t.ma} ${t.n}, ${s.ma} ${s.n})`);
          }
        }
        dem += 1;
      }
      assert(dem >= 2, 'có hàng để kiểm');
      const w = timHang(kq, `kn:writing|${ISS.wGram}`);
      assert(w.soLop >= 2, 'Ngữ pháp Writing có ở ít nhất hai lớp (FT và lớp thường)');
    } finally { kit.don(); }
  });

  check('UX4 · Hiệu quả PA: vấn đề ≤ 2 PA có kết quả vào gom, không lặp ở hàng chính; soVanDe = số hàng gom', () => {
    const kit = baiTapUx4(); const bo = { pa: [] as number[], fu: [] as number[] };
    try {
      const { kind, ma } = chonO(0);
      for (let i = 0; i < 2; i++) {
        const c = kit.ca(kit.hv(CID_FT, `gomPa${i}`), 'speaking', [[ma, 'primary']], { status: 'done', closedAt: TODAY });
        dungPa(bo, c, kind, 'improved', NGAY_BD, cong(TODAY, -2));
      }
      const kq = hieuQuaSvc.hieuQuaPa(P.admin, FQ());
      assert(!!kq.gom && kq.gom.hang.some((h: any) => h.khoa === `vd:${ma}`), 'vấn đề 2 PA phải nằm trong gom');
      assert(!kq.hang.some((h: any) => h.khoa === `vd:${ma}`), 'không lặp ở hàng chính');
      eq(kq.gom.soVanDe, kq.gom.hang.length, 'soVanDe = số hàng gom');
      assert(kq.gom.hang.every((h: any) => h.soPa <= 2 && h.itDuLieu), 'gom chỉ có vấn đề ≤ 2 PA, đều Ít dữ liệu');
      const h = kq.gom.hang.find((x: any) => x.khoa === `vd:${ma}`);
      eq([h.soPa, h.caiThien, h.tbTuan, h.nenDung], [2, 2, null, false], 'chỉ số hàng gom');
      const o = hieuQuaSvc.oHieuQuaPa(P.admin, { ...FQ(), dong: `vd:${ma}`, cot: 'pa' });
      eq([o.n, o.rows.length], [2, 2], 'ngăn danh sách của hàng gom mở đúng 2 PA');
    } finally { donPa(bo); kit.don(); }
  });

  check("UX4 · Ý thức: bienPhapTheoLoai (cho Excel) = byKind của 'bien-phap-theo-loai' cùng kỳ (cùng bộ lọc với 'bien-phap-da-thuc-hien')", () => {
    const kq = yThucSvc.yThucPhanTich(P.admin, FY());
    const f = FY();
    const so = metricsUx4.metricSet(P.admin, 'bien-phap-theo-loai', { from: f.from, to: f.to });
    for (const k of d.KHOA_LOAI_XU_LY) {
      eq(kq.bienPhapTheoLoai[k] ?? 0, so.byKind?.[k]?.length ?? 0, `loại ${k}`);
    }
    eq(Object.values(kq.bienPhapTheoLoai).reduce((s: number, x: any) => s + x, 0), so.n, 'tổng các loại = tổng chỉ số');
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
    const cid = classId('MB FOU 12');
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
    /* PR-MON (MH3): khung Lớp thường không có cột theo môn. */
    assert(cotThuong === undefined, 'Lớp thường còn cột kn:');
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
}
