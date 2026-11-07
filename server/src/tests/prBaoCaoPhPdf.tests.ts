/**
 * PHÉP KIỂM BCPH-PDF (chủ SP 07/11, plan.md mục 4 "BÁO CÁO PH XUẤT PDF Y HỆT MẪU"):
 *  · điểm FT sửa tay thành CHỮ tự do ("6.5 - 7.0") — lưu / đọc lại, Excel + PDF in nguyên chữ; lớp thường vẫn chỉ số;
 *  · chữ điểm PDF: FT band / chữ sửa; lớp thường "29/40 - ĐẠT" / "CHƯA ĐẠT" theo `kqDiemBc`;
 *  · nội dung PDF = cùng nguồn Excel (một hàm dựng), đầu trang lấy địa chỉ / SĐT chi nhánh lớp; GVCN theo phân công LÚC HẠN đợt;
 *  · dựng PDF (pdf-lib, phông Quicksand trong repo) ở Node: FT / lớp thường / FOU (P không tiêu chí) / chữ rất dài → tệp PDF hợp lệ, nhiều trang khi cần.
 */
import fs from 'node:fs';
import path from 'node:path';

export async function runPrBaoCaoPhPdfTests(t: { check: any; checkAsync: any; assert: any; assertThrows: any; conn: any; P: any; classId: (c: string) => number }) {
  const { check, checkAsync, assert, assertThrows, conn, P, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const bc: any = await import('../classes/baoCaoPh.ts');
  const xbc: any = await import('../classes/xuatBaoCaoPh.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nBCPH-PDF — Báo cáo PH xuất PDF như mẫu: điểm chữ, nội dung chung Excel / PDF, dựng PDF');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const lop = classId('MB FT 101');

  check('PDF-1 · chữ điểm PDF: FT band / chữ sửa giữ nguyên; lớp thường "29/40 - ĐẠT" / "CHƯA ĐẠT"; không điểm → null', () => {
    const ft = { so: 6.5, tong: null, kyVong: 6, nguong: null, luot: 'MT4', tuan: null };
    assert(d.chuDiemPdf(null, ft) === '6.5' && d.chuDiemPdf('6.5 - 7.0', ft) === '6.5 - 7.0' && d.chuDiemPdf(7, ft) === '7.0', 'FT');
    const th = { so: 29, tong: 40, kyVong: null, nguong: 0.7, luot: 'Progress', tuan: null };
    assert(d.chuDiemPdf(null, th) === '29/40 - ĐẠT' && d.chuDiemPdf(20, th) === '20/40 - CHƯA ĐẠT', `${d.chuDiemPdf(null, th)} · ${d.chuDiemPdf(20, th)}`);
    assert(d.chuDiemPdf(null, null) === null, 'không điểm');
  });

  check('PDF-2 · điểm FT sửa thành chữ tự do: lưu + đọc lại nguyên chữ; số vẫn kiểm band; quá 20 ký tự / lớp thường chữ → lỗi', () => thu(() => {
    const tr = bc.trangBaoCaoPh(P.mbManager, lop, null);
    const sid = tr.em[0].id;
    bc.luuBaoCaoPh(P.mbManager, lop, { dot: tr.dot, phan: 'listening', studentId: sid, muc: {}, chu: '', diemSua: ' 6.5 - 7.0 ' });
    const pn = bc.phanBaoCaoPh(P.mbManager, lop, tr.dot, 'listening').em.find((e: any) => e.id === sid);
    assert(pn.banGhi.diemSua === '6.5 - 7.0', JSON.stringify(pn.banGhi));
    bc.luuBaoCaoPh(P.mbManager, lop, { dot: tr.dot, phan: 'listening', studentId: sid, muc: {}, chu: '', diemSua: '6,5' });
    assert(bc.phanBaoCaoPh(P.mbManager, lop, tr.dot, 'listening').em.find((e: any) => e.id === sid).banGhi.diemSua === 6.5, 'chữ số → số');
    assertThrows(() => bc.luuBaoCaoPh(P.mbManager, lop, { dot: tr.dot, phan: 'listening', studentId: sid, muc: {}, chu: '', diemSua: '6.3' }), /Band/, 'band lẻ dạng chữ');
    assertThrows(() => bc.luuBaoCaoPh(P.mbManager, lop, { dot: tr.dot, phan: 'listening', studentId: sid, muc: {}, chu: '', diemSua: 'x'.repeat(21) }), /20/, 'chữ quá dài');
    const th = (conn.prepare(`SELECT c.id FROM classes c WHERE c.is_fast_track = 0 AND c.status = 'active' AND c.programme_code IN ('FOU','BE','ELE')`).all() as any[]).map((r) => r.id);
    for (const id of th) {
      const t2 = bc.trangBaoCaoPh(P.admin, id, null);
      if (!t2.dot || !t2.em.length) continue;
      assertThrows(() => bc.luuBaoCaoPh(P.admin, id, { dot: t2.dot, phan: 'listening', studentId: t2.em[0].id, muc: {}, chu: '', diemSua: '6.5 - 7.0' }), /./, 'lớp thường chữ');
      break;
    }
  }));

  check('PDF-3 · xuất PDF một lớp: mỗi em một báo cáo, đầu trang = địa chỉ / SĐT chi nhánh lớp, phần + tiêu chí + mức + điểm chữ cùng nguồn Excel', () => thu(() => {
    const tr = bc.trangBaoCaoPh(P.mbManager, lop, null);
    const sid = tr.em[0].id;
    conn.prepare(`UPDATE branches SET dia_chi = 'Số 1 Thử', so_dien_thoai = '0900' WHERE id = (SELECT branch_id FROM classes WHERE id = ?)`).run(lop);
    bc.luuBaoCaoPh(P.mbManager, lop, { dot: tr.dot, phan: 'listening', studentId: sid, muc: { c1: 'tot', c2: 'kha' }, chu: 'Nghe ổn', diemSua: '6.5 - 7.0' });
    const r = xbc.xuatLopBaoCaoPh(P.mbManager, lop, tr.dot, null, 'pdf');
    assert(r.ds.length === tr.em.length && r.lop === 'MB FT 101', `${r.ds.length} / ${tr.em.length}`);
    const em = r.ds.find((x: any) => x.hocVien === tr.em[0].ten);
    assert(em.ft && em.diaChi === 'Số 1 Thử' && em.soDienThoai === '0900' && em.lop === 'MB FT 101', JSON.stringify({ ...em, phan: undefined }));
    assert(em.phan.map((p: any) => p.ngan).join() === 'Chung,L,R,W1,W2,S', em.phan.map((p: any) => p.ngan).join());
    const L = em.phan[1];
    assert(L.diem === '6.5 - 7.0' && L.chu === 'Nghe ổn' && L.nhom[0].ds[0].muc === 'tot' && L.nhom[0].ds[2].muc === null && L.nhom[0].ds[0].en, JSON.stringify(L));
    const xl = xbc.xuatLopBaoCaoPh(P.mbManager, lop, tr.dot, sid).sheets[0].aoa;
    assert(xl.some((h: any[]) => h[0] === 'Điểm:\nScore:' && h[1] === '6.5 - 7.0'), 'Excel in điểm chữ');
    const mot = xbc.xuatLopBaoCaoPh(P.mbManager, lop, tr.dot, sid, 'pdf');
    assert(mot.ds.length === 1 && mot.ds[0].hocVien === tr.em[0].ten, 'một em');
    assertThrows(() => xbc.xuatLopBaoCaoPh(P.lrTeacher, lop, tr.dot, null, 'pdf'), /./, 'GV không xuất');
  }));

  check('PDF-4 · GVCN in theo phân công LÚC HẠN đợt (đổi GVCN sau hạn → báo cáo đợt cũ vẫn tên người cũ), Excel và PDF như nhau', () => thu(() => {
    const tr = bc.trangBaoCaoPh(P.mbManager, lop, null);
    const cu = tr.dsDot.find((x: any) => x.han < tr.dsDot[0].mo) ?? tr.dsDot[1];
    assert(cu, 'lớp có đợt đã qua hạn');
    const gv = get(`SELECT ta.id, u.full_name ten FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id WHERE ta.class_id = ? AND ta.is_core = 1 AND ta.status = 'active'`, lop);
    const khac = get(`SELECT id, full_name ten FROM users WHERE full_name != ? ORDER BY id LIMIT 1`, gv.ten);
    const doi = d.addDaysIso(cu.han, 3);
    conn.prepare(`UPDATE teacher_assignments SET status = 'ended', effective_to = ? WHERE id = ?`).run(doi, gv.id);
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?, ?, NULL, 1, ?, 'active', ?)`)
      .run(khac.id, lop, doi, `${doi}T00:00:00.000Z`);
    xoaNho();
    const pdf = xbc.xuatLopBaoCaoPh(P.mbManager, lop, cu.ma, null, 'pdf');
    assert(pdf.ds[0].phan[0].gv === gv.ten, `PDF: ${pdf.ds[0].phan[0].gv} ≠ ${gv.ten}`);
    const xl = xbc.xuatLopBaoCaoPh(P.mbManager, lop, cu.ma, null).sheets[0].aoa;
    assert(xl[1][1] === gv.ten, `Excel: ${xl[1][1]}`);
  }));

  await checkAsync('PDF-5 · dựng PDF ở Node (pdf-lib + Quicksand trong repo): FT 1 em, lớp thường, FOU (P không tiêu chí), chữ 4 000 ký tự → PDF hợp lệ, trang A4', async () => {
    const lib: any = await import('pdf-lib');
    const fontkit: any = (await import('@pdf-lib/fontkit')).default;
    const { dungPdfBaoCao } = await import('../../../shared/domain/pdfBaoCaoPh.ts');
    const thu = path.resolve('web/src/assets/quicksand');
    const phong = { r: fs.readFileSync(path.join(thu, 'Quicksand-Regular.ttf')), b: fs.readFileSync(path.join(thu, 'Quicksand-Bold.ttf')) };
    const mau = (ct: string, ft: boolean, chu: string) => ({
      ft, diaChi: 'Số 48 Tô Hiệu, Cẩm Phả, Quảng Ninh', soDienThoai: '082.228.9288', hocVien: 'Nguyễn Văn Ấn', lop: `CP ${ct} 01`,
      phan: d.boPhanBc(ct).map((p: any) => ({ khoa: p.khoa, ngan: p.ngan, gv: 'Trần Thị Ể', chu, diem: p.coDiem ? '6.5 - 7.0' : null,
        nhom: p.nhom.map((n: any) => ({ vi: n.vi, en: n.en, ds: n.ds.map((x: any, i: number) => ({ vi: x.vi, en: x.en, muc: i % 2 ? 'tot' : null })) })) })),
    });
    for (const [ct, ft, chu, toiThieu] of [['FT', true, 'Nhận xét ngắn.', 2], ['ELE', false, 'Ổn.', 4], ['FOU', false, 'Ổn.', 3], ['ELE', false, 'Rất dài. '.repeat(440), 8]] as const) {
      const byte = await dungPdfBaoCao(lib, fontkit, phong, mau(ct, ft, chu) as any);
      const doc = await lib.PDFDocument.load(byte);
      const [w, h] = [doc.getPage(0).getWidth(), doc.getPage(0).getHeight()];
      assert(doc.getPageCount() >= toiThieu && (ft ? w < h : w > h) && Math.abs(Math.min(w, h) - 595.5) < 1, `${ct}: ${doc.getPageCount()} trang ${w}×${h}`);
      assert(doc.getTitle() === `CP ${ct} 01 - Nguyễn Văn Ấn`, String(doc.getTitle()));
    }
  });
}
