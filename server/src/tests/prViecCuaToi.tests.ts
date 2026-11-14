/**
 * VIEC-CUA-TOI (rà toàn bộ 11/11, đề xuất #1 "Một hàm việc của tôi cho mọi nơi" — chủ SP duyệt top 10):
 * G5-04 / G1-05 ô "Mọi hạn · Quá hạn n" đếm cùng tập với đầu trang Công việc (bộ lọc hạn áp mọi tab), ẩn ở tab Chờ bạn duyệt (lọc không tác dụng) ·
 * G5-05 chuông: tín hiệu `pending` (không còn việc nào đọc) không còn ở "Cần làm" · G5-11 Admin: "Xuất báo cáo PH" quá hạn có dòng "Cần làm" ở chuông ·
 * G1-13 / G4-18 dòng vừa xong ở Công việc giữ tên việc lúc mở · G4-23 chip việc ẩn của hồ sơ lớp không ghi sai đơn vị ·
 * hồ sơ HV: lần ghi cuối PA bổ trợ khi Mini Test chờ → chỉ "Ghi Mini Test" (như Công việc, `boKetQuaChoMiniTest`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function runPrViecCuaToiTests(t: any) {
  const { check, assert, conn } = t;
  console.log('\nVIEC-CUA-TOI · một hàm việc của tôi cho mọi nơi');
  const { thongBaoCua } = await import('../platform/thongBao.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { demoToday } = await import('../demoConfig.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
  const nguon = (f: string) => fs.readFileSync(path.join(ROOT, f), 'utf8');
  const { viecNhapDiemCuaEm } = await import('../worklist/mywork.ts');
  const { viecCuaHocVien } = await import('../students/viecHocVien.ts');
  const casesMod: any = await import('../cases/cases.ts');
  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };

  check('G5-05 · chuông: thông báo gắn tín hiệu `pending` → Để biết (không việc nào đọc tín hiệu chờ)', () => thu(() => {
    const cs = get(`SELECT id, owner_user_id FROM case_signals WHERE owner_user_id IS NOT NULL ORDER BY id LIMIT 1`);
    assert(cs, 'seed có tín hiệu');
    conn.prepare(`UPDATE case_signals SET status = 'pending' WHERE id = ?`).run(cs.id);
    const nid = Number(conn.prepare(`INSERT INTO notifications (user_id, kind, title, body, entity_type, entity_id, created_at, dedup_key) VALUES (?, 'sos', 'Case chờ xác nhận nguyên nhân · thử', '', 'case_signal', ?, ?, 'thu-g5-05')`)
      .run(cs.owner_user_id, cs.id, new Date().toISOString()).lastInsertRowid);
    const r = (thongBaoCua(cs.owner_user_id) as any[]).find((x) => x.id === nid);
    assert(r && r.con_viec === 0 && d.nhomThongBao(r) === 'de-biet', `dòng tín hiệu pending: ${JSON.stringify(r && { con_viec: r.con_viec })}`);
  }));

  check('G5-04 / G1-05 · Công việc: ô lọc hạn đếm cùng tập với đầu trang ("n việc · m quá hạn"), ẩn ở tab Chờ bạn duyệt', () => {
    const s = nguon('web/src/modules/congViec/HoTroHocVienTab.tsx');
    assert(/demLocNhanh\(items, 'tat-ca', homNay\)/.test(s), 'demLocNhanh trên items (mọi tab)');
    assert(/tab !== 'duyet' && \(\s*<ChonDangNut/.test(s), 'ẩn ô lọc hạn ở tab duyệt');
  });

  check('G1-13 / G4-18 · dòng vừa xong giữ bản dòng lúc lưu LẦN ĐẦU (tên việc gốc), không bản sau lần lưu cuối', () => {
    assert(/setGiu\(\(m\) => \(m\.has\(it\.key\) \? m : new Map\(m\)\.set\(it\.key, it\)\)\)/.test(nguon('web/src/modules/congViec/HoTroHocVienTab.tsx')), 'daLam giữ bản đầu');
    assert(/daXong && \(it\.group === 'ban_giao' \|\| viecCaLop\)\) \? null/.test(nguon('web/src/modules/congViec/DanhSachViec.tsx')), 'dòng xong bỏ tiến độ cũ (bàn giao, việc cả lớp)');
  });

  check('G4-23 · hồ sơ lớp: một badge ẩn thì hiện thẳng; chip "+n" không ghi đơn vị "việc"', () => {
    const s = nguon('web/src/modules/classes/DauTrangLop.tsx');
    assert(!/'\+\{n\} việc'/.test(s) && /b\.an\.length === 1/.test(s), 'không "+n việc"; một badge ẩn → hiện thẳng');
  });

  check('Hồ sơ HV · lần ghi cuối PA bổ trợ khi Mini Test chờ → không có "Ghi kết quả" (cùng `boKetQuaChoMiniTest` của Công việc)', () => {
    const s = nguon('server/src/students/viecHocVien.ts');
    assert(/choMini = n\.miniTest && n\.miniTest\.tyLe === null/.test(s) && /!\(pl\.lanCuoi && choMini && pl\.nhom === choMini\)/.test(s), 'viecHocVien bỏ KQ PA lần cuối khi Mini Test chờ');
  });

  /* GD-7a (XM-10): hồ sơ HV có thêm Nhập điểm + Trả lời tình hình của người xem — MỘT hàm với Công việc (cùng khoá), xong thì hết ở cả hai nơi. */
  check('GD-7a · Nhập điểm: mọi dòng score của Công việc cũng có ở hồ sơ từng em của dòng (cùng khoá), và ngược lại; viecCuaHocVien trả đủ trường + gap, không ⚠', () => {
    const homNay = demoToday();
    const users = (conn.prepare(`SELECT DISTINCT user_id FROM teacher_assignments WHERE status = 'active' ORDER BY user_id LIMIT 12`).all() as any[]).map((r) => r.user_id as number);
    let soSo = 0, daThuHoSo = false;
    for (const u of users) {
      const p = loadPrincipal(u);
      const dongs = ((myWork(p) as any).items as any[]).filter((it) => it.group === 'score' && (it.studentId || it.emIds?.length));
      const theoEm = new Map<number, Set<string>>();
      for (const it of dongs) for (const sid of it.studentId ? [it.studentId as number] : it.emIds as number[]) (theoEm.get(sid) ?? theoEm.set(sid, new Set()).get(sid)!).add(it.key);
      for (const [sid, keys] of [...theoEm].slice(0, 6)) {
        const lopEm = (conn.prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1`).get(sid) as any)?.class_id ?? null;
        const hs = viecNhapDiemCuaEm(p, sid, homNay, lopEm).map((x) => x.key);
        assert(hs.length === keys.size && hs.every((k) => keys.has(k)), `GV ${u} · em ${sid}: Công việc ${[...keys]} ≠ hồ sơ ${hs}`);
        soSo++;
      }
      /* Em có ở Công việc thì hồ sơ phải trả; em KHÔNG có ở Công việc thì hồ sơ không trả dòng score nào ngoài tập của người đó. */
      const ngoai = (conn.prepare(`SELECT DISTINCT student_id FROM assessment_attempts ORDER BY student_id DESC LIMIT 5`).all() as any[]).map((r) => r.student_id as number).filter((x) => !theoEm.has(x));
      for (const sid of ngoai) assert(viecNhapDiemCuaEm(p, sid, homNay, (conn.prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active' LIMIT 1`).get(sid) as any)?.class_id ?? null).length === 0, `GV ${u} · em ${sid} không có ở Công việc nhưng hồ sơ trả việc`);
      if (!daThuHoSo && theoEm.size) {
        const sid = [...theoEm.keys()][0];
        const board = casesMod.skillSupportBoard(p, sid) as any;
        const lop = (conn.prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active' LIMIT 1`).get(sid) as any)?.class_id ?? null;
        const v = viecCuaHocVien(p, sid, board, { trangThaiEm: 'active', lopId: lop, chuongTrinh: board.chuongTrinh, yThuc: null, miniTest: null, dai: null });
        const nd = v.cuaBan.filter((x) => x.loai === 'nhap-diem');
        assert(nd.length === theoEm.get(sid)!.size && nd.every((x) => theoEm.get(sid)!.has(x.key)), `viecCuaHocVien nhap-diem: ${nd.map((x) => x.key)}`);
        for (const x of nd) {
          assert(x.mo?.loai === 'nhap-diem' && x.nut === 'Nhập điểm' && x.cuaBan && x.nguoi.id === u, `dòng Nhập điểm thiếu trường: ${JSON.stringify(x)}`);
          /* GD-7: panel việc ở hồ sơ mở CÙNG lưới tuần như Công việc — `periodId` / `kind` trùng dòng score cùng khoá. */
          const cv = dongs.find((it) => it.key === x.key);
          const mo = x.mo as any;
          assert(mo.periodId === (cv?.periodId ?? null) && mo.kind === (cv?.kind ?? null), `GD-7 periodId / kind lệch Công việc: ${JSON.stringify(mo)} ≠ ${cv?.periodId} / ${cv?.kind}`);
          assert((x.han === null) === (x.gap === null) && (x.gap === null || ['qua-han', 'gan', 'chua'].includes(x.gap)) && !JSON.stringify(x).includes('⚠'), `gap / ⚠: ${JSON.stringify(x)}`);
        }
        daThuHoSo = true;
      }
    }
    assert(soSo > 0 && daThuHoSo, 'seed không có em nào còn việc Nhập điểm để so');
  });

  check('GD-7a · Trả lời tình hình: GVCN lớp em thấy ở Công việc VÀ hồ sơ (cùng khoá); người không giữ không thấy; xong thì hết cả hai', () => thu(() => {
    const homNay = demoToday();
    const r = get(`SELECT e.student_id AS sid, e.class_id AS lop, ta.user_id AS gvcn FROM enrollments e JOIN teacher_assignments ta ON ta.class_id = e.class_id AND ta.is_core = 1 AND ta.status = 'active'
        WHERE e.status = 'active' ORDER BY e.id LIMIT 1`);
    assert(r, 'seed có em + GVCN');
    const tvv = get(`SELECT id FROM users WHERE id <> ? ORDER BY id LIMIT 1`, r.gvcn).id;
    const id = Number(conn.prepare(`INSERT INTO tinh_hinh_hoc_tap (student_id, class_id, chieu, noi_dung, nguoi_gui, tao_luc, han, trang_thai) VALUES (?,?, 'tvv_gvcn', 'Em vắng nhiều buổi gần đây?', ?, ?, ?, 'mo')`)
      .run(r.sid, r.lop, tvv, new Date().toISOString(), d.addDaysIso(homNay, 2)).lastInsertRowid);
    const khoa = `yt_hoi_tinh_hinh:${id}`;
    const trongCv = (u: number) => ((myWork(loadPrincipal(u)) as any).items as any[]).some((it) => it.key === khoa);
    const trongHs = (u: number) => {
      const p = loadPrincipal(u);
      const v = viecCuaHocVien(p, r.sid, { rows: [] }, { trangThaiEm: 'active', lopId: r.lop, chuongTrinh: null, yThuc: null, miniTest: null, dai: null });
      return v.cuaBan.find((x: any) => x.key === khoa) ?? null;
    };
    const x = trongHs(r.gvcn);
    assert(trongCv(r.gvcn) && x && x.loai === 'tinh-hinh' && (x.mo as any)?.viecId === id && (x.mo as any)?.cauHoi === 'Em vắng nhiều buổi gần đây?' && x.nut === 'Trả lời' && x.cuaBan && x.han === d.addDaysIso(homNay, 2) && x.gap === 'gan' && !JSON.stringify(x).includes('⚠'),
      `GVCN: Công việc ${trongCv(r.gvcn)} · hồ sơ ${JSON.stringify(x)}`);
    const khac = get(`SELECT DISTINCT ta.user_id AS u FROM teacher_assignments ta WHERE ta.user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1) AND ta.status = 'active' LIMIT 1`, r.lop).u;
    assert(!trongCv(khac) && !trongHs(khac), `người không giữ vẫn thấy: Công việc ${trongCv(khac)} · hồ sơ ${!!trongHs(khac)}`);
    conn.prepare(`UPDATE tinh_hinh_hoc_tap SET trang_thai = 'xong' WHERE id = ?`).run(id);
    assert(!trongCv(r.gvcn) && !trongHs(r.gvcn), 'xong rồi mà còn ở Công việc / hồ sơ');
  }));
}
