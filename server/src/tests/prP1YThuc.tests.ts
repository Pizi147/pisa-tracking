/**
 * P1-Y-THUC (rà toàn bộ 11/11, chủ SP "sửa lỗi P1 luôn"):
 * G3-1 em chỉ quá hạn "xem" (không vi phạm bắt buộc) → tab Ý thức xếp nhóm Mới, giữ "Đã xem" — cùng phân loại Công việc (`yt_xem`) + máy chủ (`ghiNhan` cho phép).
 * G3-2 việc Báo PH của TVV khi lần xử lý còn chờ QL duyệt → panel ô ② "Chờ QL duyệt" (`choQlDuyet`), không "✓ WL 3" như đã xong.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function runPrP1YThucTests(t: any) {
  const { check, assert, conn } = t;
  console.log('\nP1-Y-THUC · quá hạn "xem" về nhóm Mới · Báo PH chờ QL duyệt');
  const d: any = await import('../../../shared/domain/index.ts');
  const { trangThaiYThuc } = await import('../yThuc/trangThai.ts');
  const { bangYThucLop } = await import('../yThuc/board.ts');
  const { ghiNhan } = await import('../yThuc/xuLy.ts');
  const { xemViecBaoPh } = await import('../yThuc/baoPhTvv.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
  const nguon = (f: string) => fs.readFileSync(path.join(ROOT, f), 'utf8');

  check('G3-1 · quaHanChiXem: chỉ quá hạn xem → true; có bắt buộc / đề xuất / nhóm khác → false', () => {
    assert(typeof d.quaHanChiXem === 'function', 'có hàm chung quaHanChiXem');
    assert(d.quaHanChiXem('qua_han', { soBatBuoc: 0, deXuat: null }), 'chỉ xem');
    assert(!d.quaHanChiXem('qua_han', { soBatBuoc: 1, deXuat: null }), 'có bắt buộc');
    assert(!d.quaHanChiXem('qua_han', { soBatBuoc: 0, deXuat: { id: 1 } }), 'đề xuất quá hạn');
    assert(!d.quaHanChiXem('bat_buoc', { soBatBuoc: 0, deXuat: null }) && !d.quaHanChiXem('moi', { soBatBuoc: 0, deXuat: null }), 'nhóm khác');
  });

  check('G3-1 · seed: em chỉ quá hạn xem = việc "Xem vi phạm mới" ở Công việc (không Xác nhận xử lý), Đã xem được; tab lớp + hồ sơ HV dùng quaHanChiXem', () => {
    const lop = all(`SELECT DISTINCT e.class_id, e.student_id FROM enrollments e JOIN violations v ON v.student_id = e.student_id WHERE e.status = 'active'`);
    xoaNho();
    const tt = trangThaiYThuc([...new Set(lop.map((r) => r.student_id as number))]);
    const em = [...tt.values()].filter((x: any) => x.nhom === 'qua_han' && x.soBatBuoc === 0 && !x.deXuat && x.gvcnId && !x.tamDung);
    assert(em.length > 0, 'seed: có em chỉ quá hạn xem (vd Vũ Hải Đăng)');
    for (const x of em as any[]) {
      const gvcn = loadPrincipal(x.gvcnId);
      xoaNho();
      const keys = new Set<string>((myWork(gvcn, {}) as any).items.map((i: any) => String(i.key)));
      assert(keys.has(`yt_xem:${x.studentId}`) && !keys.has(`yt_xu_ly:${x.studentId}`), `em ${x.studentId}: Công việc ${[...keys].filter((k) => k.endsWith(`:${x.studentId}`)).join(', ')}`);
      const lopId = lop.find((r) => r.student_id === x.studentId).class_id;
      xoaNho();
      const b: any = bangYThucLop(gvcn, lopId);
      assert(b.nhom.qua_han.some((r: any) => r.studentId === x.studentId && d.quaHanChiXem('qua_han', r)), `em ${x.studentId}: dòng lớp mang đủ trường cho quaHanChiXem`);
      const ids = [...x.viPham].filter(([, v]: any) => v.lyDoQuaHan === 'xem').map(([id]: any) => id);
      conn.exec('BEGIN IMMEDIATE');
      try { xoaNho(); assert(ghiNhan(gvcn, x.studentId, ids).soGhiNhan === ids.length, 'Đã xem được'); } finally { conn.exec('ROLLBACK'); xoaNho(); }
    }
    for (const f of ['web/src/modules/yThuc/ClassYThucCard.tsx', 'web/src/modules/yThuc/StudentYThucSection.tsx']) {
      assert(/quaHanChiXem\(/.test(nguon(f)), `${f} dùng quaHanChiXem`);
    }
  });

  check('G3-2 · Báo PH TVV: lần xử lý chờ QL duyệt → choQlDuyet (hạn QL trả lời); đã xử lý → null; panel ô ② dùng choQlDuyet', () => {
    const cho = all(`SELECT v.id, s.consultant_user_id AS tvv, y.han_duyet FROM viec_bao_ph v JOIN discipline_measures m ON m.id = v.measure_id JOIN students s ON s.id = v.student_id
      LEFT JOIN yeu_cau_duyet y ON y.loai = 'y_thuc' AND y.doi_tuong_loai = 'discipline_measure' AND y.doi_tuong_id = m.id AND y.trang_thai = 'cho'
      WHERE m.status = 'cho_duyet' AND s.consultant_user_id IS NOT NULL`);
    assert(cho.length > 0, 'seed: có việc Báo PH của lần chờ QL duyệt (vd WL 3 Lương Gia Bảo)');
    for (const r of cho) {
      xoaNho();
      const v: any = xemViecBaoPh(loadPrincipal(r.tvv), r.id);
      assert(v.choQlDuyet && v.choQlDuyet.han === (r.han_duyet ?? null), `việc ${r.id}: ${JSON.stringify(v.choQlDuyet)}`);
    }
    const xong = all(`SELECT v.id, s.consultant_user_id AS tvv FROM viec_bao_ph v JOIN discipline_measures m ON m.id = v.measure_id JOIN students s ON s.id = v.student_id
      WHERE m.status = 'done' AND s.consultant_user_id IS NOT NULL LIMIT 3`);
    assert(xong.length > 0, 'seed: có việc Báo PH của lần đã xử lý');
    for (const r of xong) { xoaNho(); assert((xemViecBaoPh(loadPrincipal(r.tvv), r.id) as any).choQlDuyet === null, `việc ${r.id}: đã xử lý → null`); }
    assert(/choQlDuyet/.test(nguon('web/src/modules/congViec/PanelBaoPhTvv.tsx')), 'PanelBaoPhTvv đọc choQlDuyet');
  });
}
