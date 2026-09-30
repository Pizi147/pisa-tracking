/**
 * PHÉP KIỂM PR-LT2a — lớp thường · Giữa khoá: Case tự tạo, PA Bổ trợ, kế hoạch bài giảng qua Quản lý, Báo PH qua TVV.
 * Kế hoạch: docs/superpowers/plans/2026-09-30-pr-lt2a-giua-khoa.md (khối 1–11 theo Task).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrLt2aTests(t: YThucTestKit) {
  const { check, assert, conn } = t;
  const d = await import('../../../shared/domain/index.ts');
  const { migratePrLt2a } = await import('../migrate/prLt2a.ts');
  const { default: SqliteDb } = await import('libsql');
  console.log('\nPR-LT2a · Lớp thường Giữa khoá');

  // ------------------------------------------------------------------ khối 1 · luật thuần (Task 1)
  check('LT2a (1) · boTroGiuaKhoa: FOU chung 2 buổi/tuần · BE, ELE 1 buổi/tuần/môn · Pre FOU và FT không có Giữa khoá (PF2)', () => {
    assert(JSON.stringify(d.boTroGiuaKhoa('FOU')) === '{"buoiMoiTuan":2,"chung":true}', 'FOU');
    for (const ct of ['BE', 'ELE']) assert(JSON.stringify(d.boTroGiuaKhoa(ct)) === '{"buoiMoiTuan":1,"chung":false}', ct);
    for (const ct of ['PREFOU', 'FT', null]) assert(d.boTroGiuaKhoa(ct) === null, String(ct));
  });

  check('LT2a (1) · nhomBoTro: FOU cùng một nhóm cho G+V và P; BE khác nhóm theo môn', () => {
    assert(d.nhomBoTro('FOU', 7, 'writing') === d.nhomBoTro('FOU', 7, 'pronunciation'), 'FOU chung');
    assert(d.nhomBoTro('FOU', 7, 'writing') === 'gk:7', 'FOU gk:{id}');
    assert(d.nhomBoTro('BE', 7, 'writing') !== d.nhomBoTro('BE', 7, 'speaking'), 'BE khác nhóm');
    assert(d.nhomBoTro('BE', 7, 'writing') === 'gk:7:writing', 'BE gk:{id}:{môn}');
  });

  check('LT2a (1) · moTaBoTro / tenCaseThuong / mocChuBoTro: đủ chữ, không có SOS', () => {
    const fou = d.moTaBoTro('FOU', 'writing');
    assert(fou.includes('2 buổi/tuần') && fou.includes('trừ buổi Free') && fou.includes('chung'), fou);
    const be = d.moTaBoTro('BE', 'writing');
    assert(be.includes('1 buổi/tuần') && be.includes('W') && be.includes('trừ buổi Free'), be);
    const ten = d.tenCaseThuong({ dot: 'progress', giua: 'G+V không đạt' });
    assert(ten === '[Giữa khoá] G+V không đạt' && !/SOS/.test(ten), ten);
    assert(d.mocChuBoTro(null, t.TODAY) === 'đến Cuối khoá · chưa có lịch', 'chưa có lịch');
    assert(/^đến Cuối khoá · W\d /.test(d.mocChuBoTro(t.addDays(t.TODAY, 20), t.TODAY)), 'mã tuần');
  });

  check('LT2a (1) · nhanKetQuaThuong: 6 ca, KHÔNG ca nào có chữ SOS', () => {
    const base = { kind: 'progress' as const, ct: 'FOU', khongChiaMon: false };
    const du = d.nhanKetQuaThuong({ ...base, scored: 4, required: 4, failedSkills: ['writing', 'pronunciation'], tyLeTong: 0.61 });
    assert(du.chinh === '2/4 môn đạt' && du.phu === 'Không đạt: G+V P' && du.pct === '61%' && du.dat === false, JSON.stringify(du));
    const thieu = d.nhanKetQuaThuong({ ...base, scored: 3, required: 4, failedSkills: ['reading'], tyLeTong: null });
    assert(thieu.chinh === '2/3 môn đạt (đã chấm)' && thieu.pct === null && thieu.dat === false, JSON.stringify(thieu));
    const dat = d.nhanKetQuaThuong({ ...base, scored: 4, required: 4, failedSkills: [], tyLeTong: 0.8 });
    assert(dat.chinh === '4/4 môn đạt' && dat.dat === true && dat.phu === null, JSON.stringify(dat));
    const preFou = d.nhanKetQuaThuong({ kind: 'final', ct: 'PREFOU', scored: 1, required: 1, failedSkills: [], tyLeTong: 0.68, khongChiaMon: true });
    assert(preFou.chinh === '68%' && preFou.dat === false, JSON.stringify(preFou));
    const cuoi = d.nhanKetQuaThuong({ ...base, kind: 'final', scored: 4, required: 4, failedSkills: [], tyLeTong: 0.75 });
    assert(cuoi.chinh === '75%' && cuoi.dat === true, JSON.stringify(cuoi));
    const chua = d.nhanKetQuaThuong({ ...base, scored: 0, required: 4, failedSkills: [], tyLeTong: null });
    assert(chua.chinh === '—' && chua.dat === null, JSON.stringify(chua));
    for (const x of [du, thieu, dat, preFou, cuoi, chua]) assert(!/SOS/.test(JSON.stringify(x)), 'không SOS');
  });

  check('LT2a (1) · trangThaiCaseV4: hai trạng thái kế hoạch, chờ nguyên nhân thắng chờ kế hoạch; viecTiepCuaCase có loại hạn ke-hoach-bo-tro', () => {
    const c = { status: 'open' as const, fromSos: true, hasCause: true, dismissed: false, systemClosed: false, choDuyetKhongTheoDoi: false,
      coPaChoXacNhan: false, hanXacNhan: null };
    const nop = { ...c, boTro: { choNop: true, choDuyet: false, hanKeHoach: '2026-09-20' } };
    const s = d.trangThaiCaseV4(nop, '2026-09-21');
    assert(s.k === 'cho-ke-hoach' && s.t === 'qua-han' && s.chu === 'Chờ nộp kế hoạch bổ trợ', JSON.stringify(s));
    assert(d.trangThaiCaseV4(nop, '2026-09-19').t === 'can-lam', 'chưa quá hạn');
    const duyet = d.trangThaiCaseV4({ ...c, boTro: { choNop: false, choDuyet: true, hanKeHoach: null } }, '2026-09-19');
    assert(duyet.k === 'cho-duyet-ke-hoach' && duyet.t === 'cho-duyet' && duyet.chu === 'Chờ Quản lý duyệt · kế hoạch bổ trợ', JSON.stringify(duyet));
    assert(d.trangThaiCaseV4({ ...nop, hasCause: false }, '2026-09-19').k === 'cho-nguyen-nhan', 'chờ nguyên nhân thắng');
    const v = d.viecTiepCuaCase(nop, [], '2026-09-19');
    assert(v?.chu === 'Nộp kế hoạch bổ trợ' && v.loaiHan === 'ke-hoach-bo-tro' && v.han === '2026-09-20', JSON.stringify(v));
    assert(d.viecTiepCuaCase({ ...c, boTro: { choNop: false, choDuyet: true, hanKeHoach: null } }, [], '2026-09-19')?.chu === 'Chờ Quản lý duyệt kế hoạch', 'chờ duyệt');
    assert(d.mocChuPa({ span: 'den_cuoi_khoa', followupDue: null, mtKe: null, daXacNhan: false }, '2026-09-19') === 'đến Cuối khoá', 'PA chưa chạy');
  });

  check('LT2a (1) · noiDungBaoPh đúng 4 phần tử; nguyên nhân trống → "GVBM chưa xác nhận"; loại thẻ ke_hoach_bo_tro hạn 3 ngày', () => {
    const n = d.noiDungBaoPh({ ketQua: '2/4 môn đạt', monTruot: ['G+V', 'P'], nguyenNhan: [], boTro: 'Bổ trợ 2 buổi/tuần' });
    assert(n.length === 4 && n[2].includes('GVBM chưa xác nhận') && n[1].includes('G+V, P'), JSON.stringify(n));
    assert(d.LOAI_YC_META.ke_hoach_bo_tro.hanNgay === 3 && d.LOAI_YC_META.ke_hoach_bo_tro.phanLoai === 'hoc-thuat', 'thẻ kế hoạch');
    assert((d.INTERVENTION_KINDS as readonly string[]).includes('bo_tro') && !(d.SUPPORT_KINDS as readonly string[]).includes('bo_tro'), 'bo_tro là PA hệ thống');
  });

  // ------------------------------------------------------------------ khối 2 · migrate (Task 2)
  check('LT2a (2) · migrate thêm 2 cột + chỉ mục trên DB cũ, chạy lại không làm gì; DB mới từ schema.sql đã có đủ', () => {
    const coCot = (c: any, cot: string) => (c.prepare('SELECT name FROM pragma_table_info(?)').all('case_interventions') as any[]).some((x) => x.name === cot);
    const coChiMuc = (c: any) => !!c.prepare("SELECT 1 FROM pragma_index_list('case_interventions') WHERE name = 'idx_ci_nhom_bo_tro'").get();
    const tam = new SqliteDb(':memory:');
    tam.exec('CREATE TABLE case_interventions (id INTEGER PRIMARY KEY, case_id INTEGER)');
    const a: string[] = []; migratePrLt2a(tam, a);
    assert(a.length === 2 && coCot(tam, 'nhom_bo_tro') && coCot(tam, 'han_ke_hoach') && coChiMuc(tam), a.join('; '));
    const b: string[] = []; migratePrLt2a(tam, b);
    assert(b.length === 0, `lần 2 vẫn thêm: ${b.join('; ')}`);
    tam.close();
    const c: string[] = []; migratePrLt2a(conn, c);
    assert(c.length === 0 && coCot(conn, 'nhom_bo_tro') && coCot(conn, 'han_ke_hoach') && coChiMuc(conn), 'schema.sql thiếu cột/chỉ mục PR-LT2a');
  });
}
