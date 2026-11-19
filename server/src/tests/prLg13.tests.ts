/**
 * PHÉP KIỂM LG-13 (Overhaul V6 đợt 4): (a) `chuDaGhiLop` — chữ đã ghi theo lớp × kỹ năng × khoảng ngày, quyền, trống không khoá;
 * (b) `sapToiCuaGv` — số PA tới kỳ + đợt Báo cáo PH mở trong 7 ngày KHỚP việc sinh ra 7 ngày sau; (c) `buocCase` — bước của dòng Case.
 */
export async function runPrLg13Tests(t: any) {
  const { check, assert, conn, P } = t;
  const tq: any = await import('../worklist/tongQuan.ts');
  const mw: any = await import('../worklist/mywork.ts');
  const bc: any = await import('../classes/xuatBaoCaoPh.ts');
  const cd: any = await import('../classes/chuDaGhi.ts');
  const { rowsFor }: any = await import('../worklist/metrics.ts');
  const perm: any = await import('../permissions.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { setConfig, getConfig, demoToday } = await import('../demoConfig.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nLG-13 · gợi ý chữ · Sắp tới · Case theo bước');

  const loi = (fn: () => unknown): string | null => { try { fn(); return null; } catch (e: any) { return e?.message ?? String(e); } };
  const datNgay = (n: string | null) => { setConfig('demo_date', n ?? ''); xoaNho(); };
  const sauBay = <T>(fn: () => T): T => {
    const cu = getConfig('demo_date');
    datNgay(d.addDaysIso(demoToday(), 7));
    try { return fn(); } finally { datNgay(cu); }
  };

  // ---------------------------------------------------------------- (a)
  const lopGv = (p: any) => [...new Set(p.assignments.map((a: any) => a.classId as number))] as number[];
  check('LG-13a · GV lớp: chỉ em đang học của lớp, mỗi câu có chữ + ngày trong khoảng (trừ mô tả Case), không em / kỹ năng rỗng', () => {
    /* Lớp có nhiều nhận xét nhất + GV có phân công ở lớp đó. */
    const lop = conn.prepare(`SELECT e.class_id c, (SELECT ta.user_id FROM teacher_assignments ta WHERE ta.class_id = e.class_id AND ta.status = 'active' ORDER BY ta.id LIMIT 1) u
        FROM assessment_scores s JOIN assessment_attempts a ON a.id = s.attempt_id JOIN enrollments e ON e.student_id = a.student_id AND e.status = 'active'
       WHERE NULLIF(TRIM(s.comment), '') IS NOT NULL GROUP BY e.class_id HAVING u IS NOT NULL ORDER BY COUNT(*) DESC, e.class_id LIMIT 1`).get();
    assert(lop, 'demo: phải có lớp có nhận xét');
    const p = perm.loadPrincipal(lop.u), classId = lop.c as number;
    const homNay = demoToday(), tu = d.addDaysIso(homNay, -120);
    const r = cd.chuDaGhiLop(p, classId, { tu, den: homNay });
    const emLop = new Set(conn.prepare(`SELECT student_id s FROM enrollments WHERE class_id = ? AND status = 'active'`).all(classId).map((x: any) => x.s));
    let n = 0;
    for (const e of r.em) {
      assert(emLop.has(e.id), `em ${e.id} không thuộc lớp`);
      assert(Object.keys(e.kyNang).length || e.chung.length, `em ${e.id}: khối rỗng`);
      for (const ds of [...Object.values(e.kyNang), e.chung] as any[]) {
        for (const x of ds) {
          n++;
          assert(x.chu && x.chu.trim() === x.chu, `chữ rỗng / thừa trắng: ${JSON.stringify(x)}`);
          if (x.loai !== 'case') assert(x.ngay >= tu && x.ngay <= homNay, `ngày ngoài khoảng: ${JSON.stringify(x)}`);
        }
        for (let i = 1; i < ds.length; i++) assert(ds[i - 1].ngay >= ds[i].ngay, 'chưa mới nhất trước');
      }
    }
    assert(n > 0, 'demo: lớp của GVCN phải có chữ đã ghi');
    console.log(`    (${r.em.length} em, ${n} câu)`);
  });
  check('LG-13a · khoảng không có gì → em: []; khoảng sai / quá 120 ngày → 400; người ngoài lớp → 403', () => {
    const p = P.coreTeacher, classId = lopGv(p)[0];
    assert(cd.chuDaGhiLop(p, classId, { tu: '2001-01-01', den: '2001-01-31' }).em.every((e: any) => !Object.values(e.kyNang).some((ds: any) => ds.some((x: any) => x.loai !== 'case')) && !e.chung.length),
      'khoảng xưa vẫn có câu ngoài mô tả Case');
    assert(/không hợp lệ/.test(loi(() => cd.chuDaGhiLop(p, classId, { tu: '2026-11-10', den: '2026-11-01' })) ?? ''), 'tu > den phải 400');
    assert(/không hợp lệ/.test(loi(() => cd.chuDaGhiLop(p, classId, { tu: 'x', den: '2026-11-01' })) ?? ''), 'ngày sai phải 400');
    assert(/không hợp lệ/.test(loi(() => cd.chuDaGhiLop(p, classId, { tu: '2026-01-01', den: '2026-11-01' })) ?? ''), 'quá 120 ngày phải 400');
    const khac = conn.prepare(`SELECT id FROM classes WHERE status = 'active' AND id NOT IN (SELECT value FROM json_each(?)) ORDER BY id LIMIT 1`).get(JSON.stringify(lopGv(p)));
    if (khac) assert(/ngoài phạm vi/.test(loi(() => cd.chuDaGhiLop(p, khac.id, { tu: '2026-11-01', den: '2026-11-10' })) ?? ''), 'GV lớp khác phải 403');
  });

  check('GD-20a · ?dot= (đợt Báo cáo PH): FT = từ ngày 1 tháng của đợt tới hạn · mọi câu có nguồn (người ghi, nx-mt có lượt + tuần) · đợt lạ → 404', () => {
    const lop = conn.prepare(`SELECT ta.class_id c, ta.user_id u FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
       WHERE ta.status = 'active' AND c.status = 'active' AND c.is_fast_track = 1 ORDER BY ta.class_id LIMIT 1`).get();
    const p = perm.loadPrincipal(lop.u);
    const r = cd.chuDaGhiLop(p, lop.c, { dot: 'thang:2026-08' });
    assert(r.khoang.tu === '2026-08-01' && r.khoang.den === '2026-08-30', `khoảng FT: ${JSON.stringify(r.khoang)}`);
    for (const e of r.em) for (const x of [...Object.values(e.kyNang).flat(), ...e.chung] as any[]) {
      assert('nguoiId' in x && 'nguoi' in x, `thiếu người ghi: ${JSON.stringify(x)}`);
      if (x.loai === 'nx-mt') assert(x.luot, `nx-mt thiếu lượt: ${JSON.stringify(x)}`);
    }
    assert(/Không tìm thấy|không có/.test(loi(() => cd.chuDaGhiLop(p, lop.c, { dot: 'thang:1999-01' })) ?? ''), 'đợt lạ phải 404');
  });
  check('GD-20a · chuCuaPhan / chenCau / goCau: writing gồm W1 + W2, trùng chữ một dòng; chèn cuối ô không đè; Hoàn tác gỡ đúng đoạn', () => {
    const x = (chu: string, ngay: string) => ({ loai: 'nx-mt', ngay, chu, nguoiId: null, nguoi: null });
    const em = { id: 1, kyNang: { writing1: [x('A', '2026-09-01')], writing2: [x('B', '2026-09-03'), x('A', '2026-08-01')] }, chung: [] };
    assert(JSON.stringify(d.chuCuaPhan(em, 'writing').map((y: any) => y.chu)) === '["B","A"]', 'writing');
    assert(d.chuCuaPhan(em, 'reading').length === 0 && d.chuCuaPhan(null, 'chung').length === 0, 'rỗng');
    assert(d.chenCau('', 'Câu.') === 'Câu.' && d.chenCau('Có chữ', 'Câu.') === 'Có chữ Câu.' && d.chenCau('Có chữ\n', 'Câu.') === 'Có chữ\nCâu.', 'chenCau');
    assert(d.goCau('Có chữ Câu.', 'Câu.') === 'Có chữ' && d.goCau('Câu.', 'Câu.') === '' && d.goCau('Câu. Gõ thêm', 'Câu.') === 'Gõ thêm', 'goCau');
    assert(d.goCau('Đã sửa hết', 'Câu.') === 'Đã sửa hết', 'đã sửa mất đoạn → giữ');
    /* GD-20b: "Chèn cho n em" lấy MT gần nhất, không có thì mô tả Case; phần Chung lấy câu mới nhất. */
    const emBg = { id: 2, kyNang: { reading: [{ ...x('Case R', '2026-09-10'), loai: 'case' }, { ...x('MT cũ', '2026-08-01'), loai: 'kq-pa' }] }, chung: [x('Vi phạm mới', '2026-09-12')] };
    assert(d.cauBanGiao(emBg, 'reading')?.chu === 'Case R', 'không có MT → Case');
    assert(d.cauBanGiao({ ...emBg, kyNang: { reading: [...emBg.kyNang.reading, x('MT2 nx', '2026-09-01')] } }, 'reading')?.chu === 'MT2 nx', 'có MT → MT');
    assert(d.cauBanGiao(emBg, 'chung')?.chu === 'Vi phạm mới' && d.cauBanGiao(emBg, 'listening') === null, 'chung / rỗng');
    const n = d.nguonChuDaGhi({ ...x('A', '2026-09-14'), luot: 'MT2', diem: '5.5', nguoiId: 9, nguoi: 'Lan' }, 7, '2026-09-14', 'reading');
    assert(n.dau === 'MT2' && n.phu.includes('R 5.5') && n.phu.some((s: string) => s.includes('Lan')), `nguồn: ${JSON.stringify(n)}`);
    assert(!d.nguonChuDaGhi({ ...x('A', '2026-09-14'), nguoiId: 7, nguoi: 'Tôi' }, 7, '2026-09-14').phu.some((s: string) => s.includes('Tôi')), 'chính mình ghi → không tên');
  });

  // ---------------------------------------------------------------- (b)
  check('LG-13b · mọi GV có phân công: số PA tới kỳ = việc "Ghi kết quả PA" của chính GV 7 ngày sau có hạn trong cửa sổ; đợt BC PH mở = việc BC PH 7 ngày sau', () => {
    const ids = conn.prepare(`SELECT DISTINCT user_id u FROM teacher_assignments WHERE status = 'active' ORDER BY u`).all().map((r: any) => r.u as number);
    let coPa = 0, coBc = 0;
    for (const id of ids) {
      const p = perm.loadPrincipal(id);
      const homNay = demoToday();
      xoaNho();
      const st = tq.sapToiCuaGv(p).sapToi;
      const tu = mw.hanGhiKetQuaToi(homNay), den = mw.hanGhiKetQuaToi(d.addDaysIso(homNay, 7));
      const viecSau = sauBay(() => mw.myWork(p).items);
      const sau = viecSau.filter((i: any) => i.group === 'ghi_ket_qua_pa' && i.mine && i.due > tu && i.due <= den);
      /* Lần ghi cuối của nhóm Bổ trợ có Mini Test chờ thành "Ghi Mini Test" — Sắp tới vẫn đếm (ponytail ở `sapToiCuaGv`). */
      const mini = viecSau.filter((i: any) => i.group === 'mini_test' && i.mine).length;
      const so = st?.paToiKy?.so ?? 0;
      assert(so >= sau.length && so - sau.length <= mini, `GV ${id}: Sắp tới ${so} PA ≠ ${sau.length} việc 7 ngày sau (+ ${mini} Mini Test)`);
      if (sau.length) { coPa++; assert(st.paToiKy.han <= sau.map((i: any) => i.due).sort()[0], `GV ${id}: hạn sớm nhất lệch`); }
      const nguoi = [{ userId: id, assignments: p.assignments }];
      const khoa = (v: any) => `${v.classId}|${v.dot}`;
      const bcNay = new Set(bc.viecBaoCaoPhGv(nguoi, homNay).map(khoa));
      const bcSau = new Set(sauBay(() => bc.viecBaoCaoPhGv(nguoi, demoToday())).map(khoa));
      const sapMo = new Set((st?.baoCaoPh ?? []).map(khoa));
      for (const x of st?.baoCaoPh ?? []) {
        coBc++;
        assert(x.mo > homNay && x.mo <= d.addDaysIso(homNay, 7), `GV ${id}: ngày mở ngoài 7 ngày ${JSON.stringify(x)}`);
        assert(bcSau.has(khoa(x)), `GV ${id}: đợt ${khoa(x)} ở Sắp tới mà 7 ngày sau không thành việc`);
      }
      for (const k of bcSau) if (!bcNay.has(k)) assert(sapMo.has(k), `GV ${id}: việc BC PH ${k} 7 ngày sau không có ở Sắp tới`);
      if (st) assert(st.paToiKy || st.baoCaoPh.length, `GV ${id}: khối rỗng phải null`);
    }
    console.log(`    (${ids.length} GV, ${coPa} GV có PA tới kỳ, ${coBc} đợt BC PH sắp mở)`);
  });
  check('LG-13b · đợt tháng FT: hôm nay ngày 15 → Sắp tới có đợt mở ngày 20 cho GV có phần ở lớp FT', () => {
    const cu = getConfig('demo_date');
    const ngay = `${demoToday().slice(0, 7)}-15`;
    try {
      datNgay(ngay);
      const p = P.coreTeacher;
      const ds = bc.dotBcSapMoGv({ userId: p.userId, assignments: p.assignments }, ngay);
      assert(ds.some((x: any) => x.dot === `thang:${ngay.slice(0, 7)}` && x.mo === `${ngay.slice(0, 7)}-20`), `thiếu đợt tháng: ${JSON.stringify(ds)}`);
      assert(!ds.length || ds.every((x: any) => x.mo > ngay), 'đợt đã mở không phải Sắp tới');
    } finally { datNgay(cu); }
  });
  check('LG-13b · QL không phân công → null', () => {
    assert(tq.sapToiCuaGv(P.mbManager).sapToi === null, `QL: ${JSON.stringify(tq.sapToiCuaGv(P.mbManager))}`);
  });

  // ---------------------------------------------------------------- (c)
  check('LG-13c · buocCase: bốn bước + null cho Case xong / tạm', () => {
    const v = (x: any) => ({ chu: 'x', loaiHan: null, han: null, ...x });
    assert(d.buocCase('cho-nhan-xet', v({ loaiHan: 'xac-minh-sos' })) === 'cho-mo-ta', 'mô tả');
    assert(d.buocCase('cho-nguyen-nhan', v({ loaiHan: 'xac-minh-sos' })) === 'cho-mo-ta', 'xác nhận Case');
    assert(d.buocCase('cho-xac-nhan-pa', v({})) === 'cho-chon-pa', 'chờ xác nhận PA');
    assert(d.buocCase('cho-duyet-doi-pa', v({})) === 'cho-chon-pa', 'chờ duyệt đổi PA');
    assert(d.buocCase('dang-lam', v({ loaiHan: 'lap-pa' })) === 'cho-chon-pa', 'chưa có PA');
    assert(d.buocCase('dang-lam', null) === 'cho-chon-pa', 'PA chờ QL duyệt');
    assert(d.buocCase('dang-lam', v({ loaiHan: 'cap-nhat-pa' })) === 'dang-chay', 'đang chạy');
    assert(d.buocCase('dang-lam', v({ loaiHan: 'cap-nhat-pa', cuoi: true })) === 'cho-ket-qua-cuoi', 'kết quả cuối');
    assert(d.buocCase('dang-lam', v({ chu: 'Hoàn thành Case' })) === 'cho-ket-qua-cuoi', 'hoàn thành');
    assert(d.buocCase('xong', null) === null && d.buocCase('tam', null) === null, 'xong / tạm');
  });
  check('LG-13c · dòng Case (rowsFor) có `buoc`; Case đang mở trong demo có ≥ 2 bước khác nhau', () => {
    const ids = conn.prepare(`SELECT id FROM sos_cases WHERE status != 'done' AND tam = 0 ORDER BY id LIMIT 300`).all().map((r: any) => r.id);
    const rows = rowsFor('case', ids);
    assert(rows.every((r: any) => 'buoc' in r && (r.buoc === null || d.BUOC_CASE.includes(r.buoc))), 'thiếu / sai buoc');
    assert(new Set(rows.map((r: any) => r.buoc).filter(Boolean)).size >= 2, `demo: chỉ ${[...new Set(rows.map((r: any) => r.buoc))]}`);
  });
}
