/**
 * PHÉP KIỂM V8-PT-2 (backlog V8-PT, màn Phân tích): thẻ "Thời gian thường mất" · số HV ở thẻ Lượt MT · đường danh sách của thẻ chỉ số
 * (cùng hàm đếm: số thẻ = số dòng, chạy khi MỞ) · "so kỳ trước" ở thẻ Vi phạm.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runV8Pt2Tests(t: YThucTestKit & { P: any }) {
  const { check, assert, conn, P } = t;
  console.log('\nV8-PT-2 · thẻ chỉ số Phân tích');
  const { hieuQuaPa, oHieuQuaPa, tvTuanCua, paCoKetQua } = await import('../phanTich/hieuQuaPa.ts');
  const { tongHop, oTongHop } = await import('../phanTich/tongHop.ts');
  const { ketQuaMockKq, ketQuaThiThatKq, oKetQuaThi } = await import('../phanTich/ketQuaThi.ts');
  const { yThucPhanTich, oYThucPhanTich } = await import('../phanTich/yThucPhanTich.ts');
  const { chayTrongRequest, soCauSql } = await import('../platform/nguCanhRequest.ts');
  const d: any = await import('../../../shared/domain/index.ts');

  const TU = '2026-03-02', DEN = '2026-09-14';
  const doCau = <T>(fn: () => T): { kq: T; cau: number } => chayTrongRequest('GET', () => { const a = soCauSql(); const kq = fn(); return { kq, cau: soCauSql() - a }; });
  const nem = (fn: () => unknown) => { try { fn(); return null; } catch (e: any) { return e; } };

  check('V8-PT-2 · tvTuanCua: rỗng → null · dưới ngưỡng ít dữ liệu → null · đủ mẫu = trung vị PA có cải thiện (cùng luật cột bảng)', () => {
    const pa = (group: string, ngay: number) => ({ group, startedOn: '2026-08-03', outcomeOn: d.addDaysIso('2026-08-03', ngay) });
    assert(tvTuanCua([]) === null, 'rỗng phải null');
    assert(tvTuanCua([pa('success', 21), pa('success', 21)] as any) === null, 'dưới ngưỡng phải null');
    /* PA "không cải thiện" vào mẫu số nhưng KHÔNG vào trung vị. */
    const du = [pa('success', 7), pa('success', 21), pa('success', 35), pa('fail', 200), pa('fail', 200)];
    assert(tvTuanCua(du as any) === 3, `trung vị 21 ngày = 3 tuần, ra ${tvTuanCua(du as any)}`);
  });

  check('V8-PT-2 · hieuQuaPa có thoiGianThuongMat từ CHÍNH các PA của hai bảng; khoảng rỗng → null; 0 câu thêm', () => {
    const f = { ct: 'ft' as const, soTuan: 26, tu: TU, den: DEN };
    const kq = hieuQuaPa(P.admin, f);
    assert(kq.gvThem.tomTat.paCoKetQua + kq.quyChe.tomTat.paCoKetQua > 0, 'demo phải có PA có kết quả');
    assert('thoiGianThuongMat' in kq, 'thiếu trường thoiGianThuongMat');
    const mong = tvTuanCua(paCoKetQua({ branchIds: null, ct: 'ft', tu: TU, den: DEN }) as any);
    assert(kq.thoiGianThuongMat === mong, `${kq.thoiGianThuongMat} ≠ ${mong}`);
    const rong = hieuQuaPa(P.admin, { ct: 'ft', soTuan: 26, tu: '2020-01-06', den: '2020-01-13' });
    assert(rong.thoiGianThuongMat === null, 'khoảng rỗng phải null');
  });

  check('V8-PT-2 · hieuQuaPa /o dong=tong: pa · cai-thien = đúng số thẻ', () => {
    const f = { ct: 'ft' as const, soTuan: 26, tu: TU, den: DEN };
    const kq = hieuQuaPa(P.mbManager, f);
    const pa = oHieuQuaPa(P.mbManager, { ...f, dong: 'tong', cot: 'pa' });
    const cai = oHieuQuaPa(P.mbManager, { ...f, dong: 'tong', cot: 'cai-thien' });
    assert(pa.n === kq.gvThem.tomTat.paCoKetQua + kq.quyChe.tomTat.paCoKetQua && pa.rows.length === pa.n, `pa ${pa.n}`);
    assert(cai.n === kq.gvThem.tomTat.caiThien + kq.quyChe.tomTat.caiThien && cai.rows.length === cai.n, `cải thiện ${cai.n}`);
  });

  check('V8-PT-2 · lượt MT có soHv = số em khác nhau của chính tập lượt', () => {
    const f = { ct: 'ft' as const, soTuan: 26, theo: 'tuan' as const, tu: TU, den: DEN };
    const kq = tongHop(P.mbManager, f);
    const ids = oTongHop(P.mbManager, { ...f, khoa: 'tong', cot: 'luot' }).rows.map((r: any) => r.id);
    assert(ids.length > 0, 'demo phải có lượt');
    const em = new Set((conn.prepare(`SELECT student_id FROM assessment_attempts WHERE id IN (${ids.map(() => '?').join(',')})`).all(...ids) as any[]).map((r) => r.student_id));
    assert(kq.soHv === em.size, `soHv ${kq.soHv} ≠ ${em.size}`);
    assert(kq.soHv <= kq.tong.luot, 'số em không vượt số lượt');
  });

  check("V8-PT-2 · đường danh sách thẻ Kết quả Test 'dat' trả đúng em của số thẻ (cùng hàm đếm); ≤ 6 câu", () => {
    const f = { tu: TU, den: DEN };
    const bang = ketQuaMockKq(P.mbManager, f);
    assert(bang.tong.dat > 0, 'demo phải có lượt Đạt');
    const { kq: o, cau } = doCau(() => oKetQuaThi(P.mbManager, { ...f, loai: 'mock', o: 'dat' }));
    assert(o.n === bang.tong.dat && o.rows.length === o.n, `n ${o.n} ≠ thẻ ${bang.tong.dat}`);
    const mong = new Set(bang.rows.filter((r) => r.ketQua === 'dat').map((r) => r.attemptId));
    assert(o.rows.every((r: any) => mong.has(r.id)), 'dòng ngoài tập Đạt');
    assert(o.rows.every((r: any) => r.href.startsWith('/hoc-vien/') && r.diemHv?.luot.startsWith('MT')), 'dòng phải mở hồ sơ em + kèm điểm đúng lượt');
    assert(cau <= 6, `${cau} câu`);
  });

  check('V8-PT-2 · mọi thẻ Mock + Thi thật: số thẻ = số dòng; ô lạ → 400; không quyền → 403', () => {
    const f = { tu: TU, den: DEN };
    const m = ketQuaMockKq(P.mbManager, f).tong;
    for (const [o, n] of [['luot', m.luot], ['dat', m.dat], ['chua-dat', m.chuaDat], ['chua-du', m.chuaDu], ['sos1', m.sos1], ['sos2', m.sos2], ['sos3', m.sos3]] as const) {
      assert(oKetQuaThi(P.mbManager, { ...f, loai: 'mock', o }).rows.length === n, `mock ${o}`);
    }
    const tt = ketQuaThiThatKq(P.mbManager, f, { boQuyen: true }).tong;
    for (const [o, n] of [['luot', tt.luot], ['dat', tt.dat], ['chua-dat', tt.chuaDat], ['chua-chon', tt.chuaChon]] as const) {
      assert(oKetQuaThi(P.mbManager, { ...f, loai: 'thi-that', o }).rows.length === n, `thi thật ${o}`);
    }
    assert(nem(() => oKetQuaThi(P.mbManager, { ...f, loai: 'mock', o: 'la' }))?.status === 400, 'ô lạ phải 400');
    assert(nem(() => oKetQuaThi(P.subjectTeacher, { ...f, loai: 'mock', o: 'dat' }))?.status === 403, 'GV phải 403');
  });

  check('V8-PT-2 · Ý thức dong=tong / hv-can-chu-y: số thẻ = số dòng; lớp đủ cả nhóm "lớp khác"', () => {
    const f = { ct: null, from: TU, to: DEN };
    const kq = yThucPhanTich(P.mbManager, f);
    const lop = [...kq.lop, ...(kq.gom?.hang ?? [])];
    assert(lop.length > 0, 'demo phải có vi phạm');
    const cong = (k: 'viPham' | 'chuaXuLy') => lop.reduce((s, x) => s + x[k], 0);
    assert(oYThucPhanTich(P.mbManager, { ...f, dong: 'tong', cot: 'vi-pham' }).rows.length === cong('viPham'), 'vi phạm');
    assert(oYThucPhanTich(P.mbManager, { ...f, dong: 'tong', cot: 'chua-xu-ly' }).rows.length === cong('chuaXuLy'), 'chưa xử lý');
    assert(oYThucPhanTich(P.mbManager, { ...f, dong: 'tong', cot: 'lop' }).rows.length === lop.length, 'lớp');
    assert(oYThucPhanTich(P.mbManager, { ...f, dong: 'hv-can-chu-y', cot: 'hv' }).rows.length === kq.hvCanChuY.length, 'HV cần chú ý');
  });

  check('V8-PT-2 · Ý thức soVoiTruoc = tổng kỳ này − tổng kỳ trước, gồm lớp chỉ có vi phạm kỳ trước', () => {
    const f = { ct: null, from: '2026-08-31', to: '2026-09-13' };
    const kq = yThucPhanTich(P.admin, f);
    const dem = (a: string, b: string) => (conn.prepare(`SELECT COUNT(*) AS n FROM violations WHERE occurred_on >= ? AND occurred_on <= ?`).get(a, b) as any).n as number;
    assert(kq.soVoiTruoc === dem(f.from, f.to) - dem('2026-08-17', '2026-08-30'), `soVoiTruoc ${kq.soVoiTruoc}`);
  });
}
