/**
 * PHÉP KIỂM RÀ 25/11 PR 2 `sua-so-lieu` — một số liệu một nguồn. Mỗi phép so HAI nơi hiện cùng một số (chạy câu thật; ghi trong BEGIN … ROLLBACK):
 *  S1  hồ sơ lớp: "n việc" đầu dải = Σ việc các chip; cột Việc "Lớp của tôi" cộng VIỆC (không cộng bài của chip Nhập điểm)
 *  S2  hạn Báo PH (em Tạm dừng hai lần): Công việc TVV = việc được giao = tab Ý thức lớp = panel (`khoangTamDung`)
 *  S3  tab Ý thức: TVV "Bỏ việc" không còn mở / quá hạn · việc cũ còn mở không bị việc mới đã xong giấu · người được giao có nút Ghi
 *  S4  ngày "đã báo" = lần ĐẦU (như sổ đúng hạn) · Tổng quan TVV đếm việc giao cho TVV như sổ (`phu_trach_id`)
 *  S5  Họp tuần: việc "Dừng hẳn" đã khép (không Quá hạn)
 *  S6  Tổng quan chế độ chi nhánh: tổng các hàng = ô tổng (Đạt MT, Thi tháng này, Đạt Target thi thật)
 *  S7  "Chọn bước tiếp" hạn hôm nay → `today` (vào badge)
 *  S8  (điểm 13, xác minh) Case "quá hạn chốt PA" (sosState) ⊆ Case "việc tiếp quá hạn" (caseLop) — hai số khác nghĩa, không mâu thuẫn
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function runPrSoLieu2511Tests(t: any) {
  const { check, assert, conn, P, TODAY, classId } = t;
  console.log('\nRÀ 25/11 PR 2 · một số liệu một nguồn');
  const thu = (fn: () => void) => { conn.exec('BEGIN IMMEDIATE'); try { fn(); } finally { conn.exec('ROLLBACK'); } };
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const d: any = await import('../../../shared/domain/index.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { viecTheoEmCuaLop } = await import('../classes/viecTheoEm.ts');
  const { khoangTamDung } = await import('../students/tamDung.ts');
  const baoPh: any = await import('../yThuc/baoPhTvv.ts');
  const gv: any = await import('../worklist/giaoViec.ts');
  const board: any = await import('../yThuc/board.ts');
  const tinhHinh: any = await import('../yThuc/tinhHinh.ts');
  const meeting: any = await import('../worklist/meeting.ts');
  const tq: any = await import('../worklist/tongQuanV5.ts');
  const buocTiep: any = await import('../loTrinh/buocTiep.ts');
  const REPO = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
  const cases: any = await import('../cases/cases.ts');
  const { chiTietCaseMo } = await import('../cases/caseLop.ts');
  const { xuLyCaseMany } = await import('../cases/sosState.ts');
  const doc = (f: string) => fs.readFileSync(path.join(REPO, f), 'utf8');
  const lop = classId('MB FT 101');

  check('S1 · hồ sơ lớp GVCN: "n việc" đầu dải = Σ việc các chip (cùng `dongTab`); cột Việc cộng `viec`, không cộng bài', () => {
    xoaNho();
    const v = viecTheoEmCuaLop(P.coreTeacher, lop, { chiToi: true }) as any;
    const dong = (v.dongToi as any[]).filter((x) => !d.laViecChamCheo(x));
    const cuaLop = (x: any) => x.classId === lop || !!x.con?.some((c: any) => c.classId === lop);
    let tong = 0, bai = 0;
    for (const tab of ['cham-diem', 'case-hoc-thuat', 'y-thuc', 'van-hanh']) {
      tong += d.dongTab(dong.filter((x) => d.tabCuaViec(x) === tab)).filter(cuaLop).length;
      if (tab === 'cham-diem') bai = dong.flatMap((x) => (x.con?.length ? x.con : [x])).filter((x) => x.classId === lop && d.tabCuaViec(x) === tab).reduce((n, x) => n + (x.soBai ?? x.count ?? 1), 0);
    }
    assert(dong.length > 0 && tong === dong.length, `đầu dải ${dong.length} việc ↔ Σ chip ${tong} việc`);
    assert(bai > tong - 1, `seed: chip Nhập điểm phải đếm bài (${bai}) khác việc — phép kiểm mới có nghĩa`);
    const src = doc('web/src/modules/congViec/LopCuaToi.tsx');
    assert(/viec: soViec/.test(src) && /d\.chip\.reduce\(\(n, c\) => n \+ c\.viec, 0\)/.test(src), 'LopCuaToi: chip mang `viec`, cột Việc cộng `c.viec`');
    assert(!/viecNd/.test(doc('web/src/modules/classes/ThanhViecLop.tsx')), 'ThanhViecLop: không đếm lại việc Nhập điểm (lấy từ chipViecLop)');
  });

  /* Em đang học có lớp; hai khoảng Tạm dừng chồng hạn. */
  const emHoc = () => one(`SELECT s.id, s.consultant_user_id AS tvv, e.class_id AS lop FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
     WHERE s.status = 'active' AND s.archived_at IS NULL AND e.class_id = ? AND s.consultant_user_id IS NOT NULL ORDER BY s.id LIMIT 1`, lop);
  const tamDung = (sid: number, ds: [string, string][]) => { for (const [loai, ngay] of ds) conn.prepare(`INSERT INTO journey_events (student_id, event_type, event_date, title, created_at) VALUES (?, ?, ?, 'thử PR2', ?)`).run(sid, loai, ngay, `${ngay}T03:00:00.000Z`); };
  const viec = (sid: number, o: { han?: string; tt?: string; phuTrach?: number | null; tao?: string; tinhHinh?: number | null }) => Number(conn.prepare(
    `INSERT INTO viec_bao_ph (student_id, nhan, han, trang_thai, tao_luc, phu_trach_id, tinh_hinh_id) VALUES (?, 'Thử PR2', ?, ?, ?, ?, ?)`)
    .run(sid, o.han ?? '2026-11-10', o.tt ?? 'mo', o.tao ?? '2026-11-06T03:00:00.000Z', o.phuTrach ?? null, o.tinhHinh ?? null).lastInsertRowid);
  const dongBang = (p: any, sid: number, homNay: string) => {
    xoaNho();
    const b = board.bangYThucLop(p, lop, homNay);
    return [...Object.values(b.nhom).flat(), ...b.choBaoPh, ...b.choThuHoi].find((x: any) => x.studentId === sid) as any;
  };

  check('S2 · hạn Báo PH em Tạm dừng hai lần: Công việc TVV = việc được giao = tab Ý thức lớp = panel (đủ khoảng)', () => thu(() => {
    const em = emHoc();
    assert(em, 'seed thiếu em có TVV ở MB FT 101');
    conn.prepare(`UPDATE viec_bao_ph SET trang_thai = 'xong' WHERE student_id = ? AND trang_thai = 'mo'`).run(em.id);
    tamDung(em.id, [['pause', '2026-11-07'], ['resume', '2026-11-08'], ['pause', '2026-11-11'], ['resume', '2026-11-13']]);
    const id = viec(em.id, {});
    const mong = d.hanBaoPhHieuLuc('2026-11-10', khoangTamDung([em.id])[em.id] ?? [], null);
    assert(mong > '2026-11-10', `Tạm dừng không dời hạn (${mong})`);
    const tvv = loadPrincipal(em.tvv);
    xoaNho();
    const cv = baoPh.viecBaoPhCuaToi(tvv, { today: '2026-11-25', tatCa: false, branchId: null }).find((x: any) => x.key === `bao-ph:${id}`);
    assert(cv?.due === mong, `Công việc TVV: hạn ${cv?.due}, panel ${mong}`);
    const bang = dongBang(P.admin, em.id, '2026-11-25');
    assert(bang?.baoPh?.id === id && bang.baoPh.han === mong, `tab Ý thức: ${JSON.stringify(bang?.baoPh && { id: bang.baoPh.id, han: bang.baoPh.han })}, panel ${mong}`);
    conn.prepare('UPDATE viec_bao_ph SET phu_trach_id = ? WHERE id = ?').run(P.coreTeacher.userId, id);
    xoaNho();
    const giao = gv.viecGiaoChoToi(P.coreTeacher, { today: '2026-11-25' }).find((x: any) => x.key === `bao-ph:${id}`);
    assert(giao?.due === mong, `việc được giao: hạn ${giao?.due}, panel ${mong}`);
  }));

  check('S3 · tab Ý thức: "Bỏ việc" khép · việc cũ còn mở không bị giấu · người được giao có nút Ghi', () => thu(() => {
    const em = emHoc();
    conn.prepare(`UPDATE viec_bao_ph SET trang_thai = 'xong' WHERE student_id = ? AND trang_thai = 'mo'`).run(em.id);
    /* (b) việc cũ còn mở + việc mới đã xong → bảng lớp hiện việc cũ (mở, quá hạn). */
    const cu = viec(em.id, { han: '2026-11-10' });
    viec(em.id, { han: '2026-11-20', tt: 'xong', tao: '2026-11-15T03:00:00.000Z' });
    let dong = dongBang(P.admin, em.id, '2026-11-25');
    assert(dong?.baoPh?.id === cu && dong.baoPh.trangThai === 'mo' && dong.baoPh.quaHan, `bảng lớp: ${JSON.stringify(dong?.baoPh && { id: dong.baoPh.id, tt: dong.baoPh.trangThai })} (mong việc mở ${cu})`);
    /* (c) giao cho GVCN → GVCN có nút Ghi như ở Công việc. */
    dong = dongBang(P.coreTeacher, em.id, '2026-11-25');
    assert(dong?.baoPh && !dong.baoPh.coTheGhi, 'GVCN chưa được giao: không có nút Ghi');
    conn.prepare('UPDATE viec_bao_ph SET phu_trach_id = ? WHERE id = ?').run(P.coreTeacher.userId, cu);
    dong = dongBang(P.coreTeacher, em.id, '2026-11-25');
    assert(dong?.baoPh?.coTheGhi === true, 'người được giao (N58) không có nút Ghi ở tab Ý thức');
    /* (a) Tình hình GV → TVV, TVV "Bỏ việc": dòng tình hình khép, không quá hạn. */
    const th = Number(conn.prepare(`INSERT INTO tinh_hinh_hoc_tap (student_id, class_id, chieu, noi_dung, nguoi_gui, tao_luc) VALUES (?, ?, 'gv_tvv', 'Thử PR2', ?, '2026-11-06T03:00:00.000Z')`)
      .run(em.id, lop, P.coreTeacher.userId).lastInsertRowid);
    const vth = viec(em.id, { tinhHinh: th });
    const xem = () => tinhHinh.tinhHinhCuaEm(P.admin, [em.id], '2026-11-25').find((x: any) => x.id === th);
    assert(xem()?.trangThai === 'mo' && xem()?.quaHan, `tình hình mở phải quá hạn (${JSON.stringify(xem())})`);
    conn.prepare(`UPDATE viec_bao_ph SET trang_thai = 'bo' WHERE id = ?`).run(vth);
    xoaNho();
    const sau = xem();
    assert(sau?.trangThai !== 'mo' && !sau?.quaHan && !sau?.baoPh?.coTheGhi, `TVV bỏ việc vẫn mở / quá hạn: ${JSON.stringify({ tt: sau?.trangThai, qh: sau?.quaHan })}`);
    xoaNho();
    assert(!baoPh.viecBaoPhCuaToi(loadPrincipal(em.tvv), { today: '2026-11-25', tatCa: false, branchId: null }).some((x: any) => x.key === `bao-ph:${vth}`), 'Công việc còn việc đã bỏ');
  }));

  check('S4 · ngày "đã báo" = lần ĐẦU ở bảng lớp (như sổ đúng hạn); Tổng quan TVV đếm việc giao cho TVV (`phu_trach_id`) như sổ', () => thu(() => {
    const em = emHoc();
    conn.prepare(`UPDATE viec_bao_ph SET trang_thai = 'xong' WHERE student_id = ?`).run(em.id);
    const id = viec(em.id, { tao: '2026-11-24T03:00:00.000Z' });   // để `mo`: bảng lớp chỉ có hàng em khi còn việc (ngày báo đọc như nhau)
    for (const ngay of ['2026-11-18', '2026-11-20']) conn.prepare(`INSERT INTO viec_bao_ph_lan (viec_id, ket_qua, ngay, ghi_luc) VALUES (?, 'da_bao', ?, ?)`).run(id, ngay, `${ngay}T03:00:00.000Z`);
    const dong = dongBang(P.admin, em.id, '2026-11-25');
    assert(dong?.baoPh?.id === id && dong.baoPh.ngayXong === '2026-11-18', `bảng lớp ngày báo ${dong?.baoPh?.ngayXong} (mong lần đầu 18/11)`);
    /* TVV khác được giao việc Báo PH của em này → Tổng quan TVV của người đó đếm (người giữ như `viecDaXong`). */
    const khac = one(`SELECT DISTINCT consultant_user_id AS id FROM students WHERE consultant_user_id IS NOT NULL AND consultant_user_id != ? LIMIT 1`, em.tvv);
    assert(khac, 'seed thiếu TVV thứ hai');
    const ky = d.khoangMacDinh(TODAY);
    const tong = () => { xoaNho(); return tq.tongQuanTvv(loadPrincipal(khac.id)).baoPh.tong as number; };
    const truoc = tong();
    viec(em.id, { phuTrach: khac.id, tao: `${ky.tu}T05:00:00.000Z` });
    assert(tong() === truoc + 1, `Tổng quan TVV không đếm việc giao cho TVV (${truoc} → ${tong()})`);
  }));

  check('S5 · Họp tuần: "Dừng hẳn" đã khép (không Quá hạn), như `TASK_PROGRESS_CLOSED`', () => {
    for (const progress of d.TASK_PROGRESS_CLOSED) assert(meeting.dueState({ progress, due_date: '2020-01-01' }, TODAY) === 'closed', `${progress} quá hạn`);
    assert(meeting.dueState({ progress: 'paused', due_date: '2020-01-01' }, TODAY) === 'overdue', 'Tạm ngưng vẫn là việc còn mở');
  });

  check('S6 · Tổng quan chế độ chi nhánh: Σ hàng chi nhánh = ô tổng (Đạt MT, Thi tháng này, Đạt Target thi thật) — chia theo id lớp, gồm lớp đã kết thúc', () => {
    for (const ct of ['ft', 'thuong']) {
      xoaNho();
      const r = tq.tongQuanV5(P.admin, { ct });
      assert(r.chiNhanh, `${ct}: Admin phải ở chế độ chi nhánh`);
      const cong = (f: (h: any) => number) => r.chiNhanh.reduce((n: number, h: any) => n + f(h), 0);
      assert(cong((h) => h.thiThangNay) === r.thiThangNay, `${ct} Thi tháng này: Σ hàng ${cong((h) => h.thiThangNay)} ≠ ô ${r.thiThangNay}`);
      if (r.datMt) assert(cong((h) => h.datMt?.mau ?? 0) === r.datMt.mau && cong((h) => h.datMt?.dat ?? 0) === r.datMt.dat, `${ct} Đạt MT: Σ hàng ≠ ô ${JSON.stringify(r.datMt)}`);
      if (r.thiThat) assert(cong((h) => h.thiThat?.mau ?? 0) === r.thiThat.mau && cong((h) => h.thiThat?.dat ?? 0) === r.thiThat.dat, `${ct} Đạt Target thi thật: Σ hàng ≠ ô ${JSON.stringify(r.thiThat)}`);
    }
  });

  check('S7 · "Chọn bước tiếp" hạn hôm nay → today (vào badge như mọi việc)', () => {
    xoaNho();
    const ds = buocTiep.viecBuocTiep(P.admin, { today: TODAY, branchId: null, tatCa: true }) as any[];
    const it = ds.find((x) => x.due && x.due !== TODAY);
    assert(it, 'seed thiếu việc Chọn bước tiếp có hạn');
    xoaNho();
    const hom = (buocTiep.viecBuocTiep(P.admin, { today: it.due, branchId: null, tatCa: true }) as any[]).find((x) => x.key === it.key);
    assert(hom?.urgency === 'today', `hạn ${it.due} = hôm nay mà urgency ${hom?.urgency}`);
  });

  check('S8 · (điểm 13) Case "quá hạn chốt PA" (sosState) ⊆ Case "việc tiếp quá hạn" (caseLop) — cùng hạn ở bước chung', () => {
    xoaNho();
    const mo = (cases.listCases(P.admin, {}).rows as any[]).filter((c) => c.state !== 'done' && c.studentId !== null);
    const ct = chiTietCaseMo(mo);
    const xl = xuLyCaseMany(mo.map((c) => c.id), TODAY);
    const lech = mo.filter((c) => xl.get(c.id)?.quaHan && ct.get(c.id) && !ct.get(c.id)!.quaHan).map((c) => c.id);
    assert(mo.length > 0 && !lech.length, `Case quá hạn chốt PA nhưng thẻ Case không quá hạn: ${lech.join(', ')}`);
  });
}
