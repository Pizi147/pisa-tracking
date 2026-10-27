/**
 * PHÉP KIỂM M6 · 6b-2 PILOT-CASE (kế hoạch `docs/superpowers/plans/2026-10-27-m6-code.md` mục 6b-2, mockup `thiet-ke/v7/panel-pilot.html` khu ①, Case A,
 * "Vòng 2 · chữ"):
 *  · Q4: ô "Case chưa chốt PA" của Tổng quan — dòng mang việc (`kemViec`) + nhóm phân rã máy chủ (`nhom`, 6 nhóm); số = số dòng, Σ nhóm = phân rã;
 *  · Q3: danh sách xếp theo 6 nhóm (rỗng không vẽ, quá hạn lên đầu nhóm) — `xepNhomCase`;
 *  · Q7: "Case tiếp ›" = Case kế chưa xử lý mà người xem làm được, theo thứ tự danh sách — `caseTiep`;
 *  · Q1: Thêm PA / Ghi kết quả mở từ Case lưu xong tự về Case, PA vừa đổi viền nhấn + Hoàn tác (đường máy chủ #623);
 *  · Case A: đầu mục Case · Phương án · Kết luận · Lịch sử; "Vấn đề" → "Case", nhãn "Mô tả"; câu "ai làm được"; DESIGN.md V11 bản M6 + luật Quay lại + luật chữ.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { docSach } from './panelUx3.tests.ts';

export async function runPrPilotCaseTests(t: YThucTestKit) {
  const { check, assert, conn, P } = t as any;
  const d: any = await import('../../../shared/domain/index.ts');
  const bang: any = await import('../worklist/bangChiNhanh.ts');
  console.log('\nM6 · 6b-2 PILOT-CASE — nhóm theo bước, việc trong dòng, Case A, lưu về Case, Case tiếp');

  const mb = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id;
  const oTong = (p: any) => bang.oBangChiNhanh(p, { branchId: mb, ct: 'ft', cot: 'caseChuaChot', khoa: 'tong', chuY: true });

  check('6b-2 · ô "Case chưa chốt PA" (chú ý): mỗi dòng có nhóm trong 6 nhóm; Σ dòng theo nhóm = phân rã của bảng; số = số dòng', () => {
    const o = oTong(P.mbManager);
    const r = bang.bangChiNhanh(P.mbManager, { branchId: mb, ct: 'ft', chuY: true });
    assert(o.n === o.rows.length && o.n === r.tong.caseChuaChot.n, `số ${o.n} · dòng ${o.rows.length} · bảng ${r.tong.caseChuaChot.n}`);
    assert(o.n > 0, 'bộ demo không có Case chưa chốt PA ở MB — phép kiểm không soi được gì');
    for (const x of o.rows) assert((d.NHOM_CASE_CHUA_CHOT as readonly string[]).includes(x.nhom), `dòng ${x.id} nhóm lạ: ${x.nhom}`);
    for (const k of d.NHOM_CASE_CHUA_CHOT) {
      const n = o.rows.filter((x: any) => x.nhom === k).length;
      assert(n === (r.phanRa?.[k] ?? 0), `nhóm ${k}: ${n} dòng ≠ phân rã ${r.phanRa?.[k]}`);
    }
  });

  check('6b-2 · Q4 kemViec: dòng mang việc tiếp; QL làm được (lam), GV môn khác không làm được nhưng vẫn thấy dòng', () => {
    const o = oTong(P.mbManager);
    const coViec = o.rows.filter((x: any) => x.viec);
    assert(coViec.length > 0, 'dòng Tổng quan vẫn bỏ việc (C22 cũ)');
    assert(coViec.some((x: any) => x.viec.lam), 'QL không làm được việc nào trong dòng');
    /* Cột khác của bảng vẫn chỉ đọc (G8): HV có Case → không việc. */
    const hv = bang.oBangChiNhanh(P.mbManager, { branchId: mb, ct: 'ft', cot: 'caseChuaChotHv', khoa: 'tong', chuY: true });
    assert(hv.rows.every((x: any) => !x.viec), 'cột khác cũng kèm việc');
  });

  check('6b-2 · Q3 xepNhomCase: thứ tự 6 nhóm máy chủ, nhóm rỗng không vẽ, quá hạn lên đầu, giữ thứ tự trong cùng mức', () => {
    const ds = [
      { id: 1, nhom: 'choNhanXet' }, { id: 2, nhom: 'trongPa' }, { id: 3, nhom: 'trongPa', tre: true }, { id: 4, nhom: 'choDuyetPa' },
      { id: 5, nhom: 'trongPa' }, { id: 6, nhom: 'choNhanXet', tre: true },
    ];
    const g = d.xepNhomCase(ds, (x: any) => !!x.tre);
    assert(JSON.stringify(g.map((x: any) => x.nhom)) === '["trongPa","choNhanXet","choDuyetPa"]', JSON.stringify(g.map((x: any) => x.nhom)));
    assert(JSON.stringify(g[0].dong.map((x: any) => x.id)) === '[3,2,5]', JSON.stringify(g[0].dong.map((x: any) => x.id)));
    assert(JSON.stringify(g[1].dong.map((x: any) => x.id)) === '[6,1]', 'quá hạn chưa lên đầu nhóm');
    assert(g[0].ten === d.NHOM_CASE_CHUA_CHOT_LABEL.trongPa, 'tên nhóm không lấy từ nhãn máy chủ');
    assert(d.xepNhomCase([{ id: 9 }], () => false).length === 0, 'dòng không nhóm lọt vào nhóm');
  });

  check('6b-2 · Q7 caseTiep: Case kế làm được, chưa xử lý, theo thứ tự danh sách (vòng lên đầu); hết → null', () => {
    const ds = [{ id: 1, lam: true }, { id: 2, lam: false }, { id: 3, lam: true, xong: true }, { id: 4, lam: true }, { id: 5, lam: true }];
    assert(d.caseTiep(ds, 1) === 4, `sau 1 → ${d.caseTiep(ds, 1)}`);
    assert(d.caseTiep(ds, 5) === 1, `sau 5 vòng lên → ${d.caseTiep(ds, 5)}`);
    assert(d.caseTiep(ds, 99) === 1, 'Case đã ra khỏi danh sách → Case đầu còn chờ');
    assert(d.caseTiep([{ id: 1, lam: true }], 1) === null, 'chỉ còn Case đang xem');
    assert(d.caseTiep([{ id: 1, lam: true }, { id: 2, lam: true, xong: true }], 1) === null, 'Case đã xử lý vẫn được chọn');
  });

  check('6b-2 · Q1: Thêm PA / Ghi kết quả mở từ Case → lưu xong tự về Case, viền PA vừa đổi + Hoàn tác (đường /hoan-tac-them)', () => {
    const ng = docSach('web/src/modules/students/NganCase.tsx');
    assert(/vuaDoi/.test(ng) && /xem\.ds\[xem\.ds\.length - 2\] === 'case'/.test(ng), 'Ngăn Case không về Case sau khi lưu');
    const tp = docSach('web/src/modules/cases/ThaoTacCase.tsx');
    assert(/\/hoan-tac-them/.test(tp) && /paId/.test(tp), 'Thêm PA không đưa Hoàn tác máy chủ + id PA mới');
    const cp = docSach('web/src/modules/cases/CasePanel.tsx');
    assert(/vuaDoi/.test(cp) && /Hoàn tác/.test(cp), 'thẻ PA không có "✓ … · Hoàn tác"');
  });

  check('6b-2 · Case A: đầu mục Case · Phương án · Kết luận · Lịch sử; không còn "Vấn đề" / "Ghi nhận"; nhãn Mô tả; câu ai làm được', () => {
    const cp = docSach('web/src/modules/cases/CasePanel.tsx');
    const than = cp.slice(cp.indexOf('export function ThanCase'), cp.indexOf('function TheKhoiPa'));
    for (const x of ['tieuDe="Case"', "t('Phương án')", "t('Kết luận')", "t('Lịch sử')", "t('Mô tả')"]) assert(than.includes(x), `thiếu ${x}`);
    assert(!/t\('Vấn đề'\)|Ghi nhận/.test(than), 'còn "Vấn đề" / "Ghi nhận"');
    assert(/export function DauMuc/.test(cp), 'đầu mục chưa là component dùng chung');
    assert(/chuAiLamDuoc/.test(cp) && /chuAiLamDuoc/.test(docSach('web/src/modules/students/NganCase.tsx')), 'chưa có câu "ai làm được"');
    assert(typeof d.chuAiLamDuoc === 'function' && d.chuAiLamDuoc('Lê Minh Khoa').includes('Lê Minh Khoa') && d.chuAiLamDuoc(null).includes('Quản lý'), 'câu ai làm được');
  });

  check('6b-2 · panel số: dòng có nhóm → dải nhóm dính + bấm dòng mở view Case trong CÙNG panel; Case tiếp ›', () => {
    const sl = docSach('web/src/ui/SoLieu.tsx');
    assert(/xepNhomCase\(/.test(sl) && /sticky/.test(sl), 'không vẽ dải nhóm dính');
    assert(/caseTiep\(/.test(sl) && /Case tiếp ›/.test(docSach('web/src/modules/students/NganCase.tsx')), 'không có Case tiếp ›');
  });

  check('6b-2 · DESIGN.md: V11 bản M6 + luật Quay lại + luật chữ đầu mục (G14 sửa: vạch nhóm theo bước)', () => {
    const ds = docSach('DESIGN.md');
    assert(/V11[^\n]*M6/.test(ds), 'V11 chưa ghi bản M6');
    assert(/Quay lại/.test(ds) && /‹ = lùi một view/.test(ds), 'thiếu luật Quay lại');
    assert(/Đầu nhóm[^\n]*15 \/ 700/.test(ds) && /Đầu mục[^\n]*15 \/ 700/.test(ds), 'thiếu luật chữ đầu mục');
    assert(/G14[^\n]*theo bước/.test(ds), 'G14 chưa sửa');
  });
}
