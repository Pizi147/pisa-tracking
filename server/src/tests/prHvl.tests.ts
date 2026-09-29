/**
 * PHÉP KIỂM PR-HVL — Học viên & Lớp + hồ sơ lớp (kế hoạch 2026-09-29-pr-hvl-hoc-vien-lop). Tên mỗi phép kiểm bắt đầu bằng "PR-HVL ·".
 * Harness do `run.ts` truyền vào; file này không tự mở database. Task 1 = luật thuần (`shared/domain/hocVienLop.ts`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrHvlTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const eq = (got: unknown, want: unknown, m: string) =>
    assert(JSON.stringify(got) === JSON.stringify(want), `${m}: ${JSON.stringify(got)} ≠ ${JSON.stringify(want)}`);
  console.log('\nPR-HVL · Học viên & Lớp + hồ sơ lớp');

  // ------------------------------------------------------------------ Task 1 · Kết quả gần nhất hai dòng

  const ft = { mode: 'ielts_band', attemptLabel: 'MT3', attemptKind: 'mock', sosLevel: 2, provisional: false, scored: 4, required: 4, failed: null,
    overall: 6.5, expectation: 7.0, belowSkills: [{ skill: 'listening', band: 6 }, { skill: 'reading', band: 6 }, { skill: 'writing', band: 6 }], failedSkills: [] };
  const thuong = (o: any = {}) => ({ mode: 'ratio', attemptLabel: 'Giữa khoá', attemptKind: 'progress', sosLevel: 1, provisional: false, scored: 4, required: 4,
    failed: 1, overall: null, expectation: null, belowSkills: [], failedSkills: [{ skill: 'writing', score: 12, total: 20 }], chuongTrinh: 'FOU', ...o });

  check('PR-HVL (1) · T18 kết quả FT hai dòng: đủ điểm / thiếu điểm / không cam kết; lệch "−0.5", không "…"', () => {
    eq(d.ketQuaGanNhat(ft), { chinh: '6.5', lech: '−0.5', dat: false, sos: 'SOS 2', dong1: 'MT3 · kỳ vọng 7.0', dong2: 'Không đạt: L R W' }, 'Đủ điểm');
    const thieu = d.ketQuaGanNhat({ ...ft, scored: 3, provisional: true, overall: null });
    eq([thieu.chinh, thieu.lech, thieu.dong1, thieu.sosTamThoi], ['—', null, 'MT3 · kỳ vọng 7.0 · 3/4 kỹ năng có điểm', true], 'Thiếu điểm');
    /* Target "không cam kết" (PR-KCK): không kỳ vọng, không SOS. */
    const kck = d.ketQuaGanNhat({ ...ft, expectation: null, sosLevel: null, belowSkills: [] });
    eq([kck.dong1, kck.sos, kck.lech, kck.dong2], ['MT3', null, null, null], 'Không cam kết: không "kỳ vọng", không SOS');
    for (const k of [d.ketQuaGanNhat(ft), thieu, kck]) assert(!/…/.test(JSON.stringify(k)), `Có "…": ${JSON.stringify(k)}`);
  });

  check('PR-HVL (1) · T58 kết quả lớp thường: "n/4 môn đạt" + "Không đạt: G+V"; Cuối khoá đủ điểm "58%"; Pre FOU "64%"; không SOS, không "…"', () => {
    eq(d.ketQuaGanNhat(thuong()), { chinh: '3/4 môn đạt', lech: null, dat: false, sos: null, dong1: 'Giữa khoá', dong2: 'Không đạt: G+V' }, 'FOU Giữa khoá');
    const be = d.ketQuaGanNhat(thuong({ chuongTrinh: 'BE', attemptLabel: 'Cuối khoá', attemptKind: 'final', tyLeTong: 0.58, failed: 2,
      failedSkills: [{ skill: 'reading', score: 10, total: 20 }, { skill: 'writing', score: 8, total: 20 }] }));
    eq([be.chinh, be.dong1, be.dong2, be.sos], ['58%', 'Cuối khoá', 'Không đạt: R W', null], 'BE Cuối khoá đủ điểm');
    const pre = d.ketQuaGanNhat(thuong({ chuongTrinh: 'PREFOU', khongChiaMon: true, attemptLabel: 'Cuối khoá', attemptKind: 'final', tyLeTong: 0.64, failed: 0, sosLevel: 0, failedSkills: [] }));
    eq([pre.chinh, pre.dong1, pre.dong2, pre.dat], ['64%', 'Cuối khoá', null, true], 'Pre FOU: không dòng 2');
    const thieu = d.ketQuaGanNhat(thuong({ attemptLabel: 'Cuối khoá', attemptKind: 'final', scored: 2, failed: 0, sosLevel: null, failedSkills: [] }));
    eq([thieu.chinh, thieu.dong1], ['2/2 môn đạt', 'Cuối khoá · 2/4 môn có điểm'], 'Cuối khoá còn thiếu môn thì chưa có %');
    for (const k of [d.ketQuaGanNhat(thuong()), be, pre, thieu]) assert(!/SOS|…/.test(JSON.stringify(k)), `Có "SOS"/"…": ${JSON.stringify(k)}`);
    eq(d.ketQuaGanNhat(null).dong1, 'Chưa có kết quả', 'Chưa có');
  });

  // ------------------------------------------------------------------ Task 1 · chip, badge

  check('PR-HVL (1) · K2-02/03 chip Cần làm · Chờ duyệt · Đang SOS · Thiếu thông tin; link cũ không vỡ; demLoc một hàm đếm', () => {
    eq(d.LOC_HOC_VIEN, ['tat-ca', 'can-lam', 'cho-duyet', 'sos', 'thieu_tt'], 'Khoá chip');
    for (const v of ['case_working', 'case_no_plan', 'case_overdue']) eq(d.docThamSoLoc(v), { loc: 'can-lam' }, `view=${v}`);
    eq(d.docThamSoLoc('sos_open'), { loc: 'sos' }, 'sos_open');
    eq(d.docThamSoLoc('cho-duyet'), { loc: 'cho-duyet' }, 'cho-duyet');
    const hv = [
      { loc: ['tat-ca', 'sos', 'can-lam'], khung: 'ft' }, { loc: ['tat-ca', 'cho-duyet'], khung: 'thuong' },
      { loc: ['tat-ca', 'can-lam', 'thieu_tt'], khung: 'thuong' },
    ];
    eq(d.demLoc(hv, 'tat-ca'), { 'tat-ca': 3, 'can-lam': 2, 'cho-duyet': 1, sos: 1, thieu_tt: 1 }, 'Đếm cả hai khung');
    eq(d.demLoc(hv, 'thuong'), { 'tat-ca': 2, 'can-lam': 1, 'cho-duyet': 1, sos: 0, thieu_tt: 1 }, 'Đếm lớp thường');
    eq(d.demLoc(hv, 'ft')['tat-ca'], 1, 'Đếm Fast Track');
  });

  check('PR-HVL (1) · B4 badge theo vai: thứ tự GV ≠ Quản lý; gộp xep-lop; qua-han danger, cho-duyet info; bỏ "Case mở"', () => {
    const goc = { needsPlacement: false, canXepLop: 0, soChuaLoTrinhTiep: 3, missingSkills: [], soBaiChoCham: 2, needScoresTitle: null, phase: 'running', missingCount: 0, soChoDuyet: 1, soEmQuaHan: 4 };
    const gv = d.badgeLop({ ...goc, vai: 'gv' });
    eq([...gv.hien, ...gv.an].map((x: any) => x.key), ['cham', 'qua-han', 'xep-lop', 'cho-duyet'], 'Thứ tự GV');
    const ql = d.badgeLop({ ...goc, vai: 'ql' });
    eq([...ql.hien, ...ql.an].map((x: any) => x.key), ['cho-duyet', 'xep-lop', 'cham', 'qua-han'], 'Thứ tự Quản lý');
    eq([ql.hien.length, ql.an.length], [2, 2], 'Hiện 2, còn lại "+n"');
    const tat = [...ql.hien, ...ql.an];
    eq(tat.find((x: any) => x.key === 'qua-han'), { key: 'qua-han', nhan: '4 HV quá hạn việc', tone: 'danger', title: tat.find((x: any) => x.key === 'qua-han').title }, 'qua-han');
    eq(tat.find((x: any) => x.key === 'cho-duyet').tone, 'info', 'cho-duyet tone');
    eq(tat.find((x: any) => x.key === 'xep-lop').nhan, '3 HV cần xếp lớp tiếp', 'xep-lop khi chưa có lộ trình');
    const het = d.badgeLop({ ...goc, vai: 'gv', needsPlacement: true, canXepLop: 5 });
    eq([...het.hien, ...het.an].find((x: any) => x.key === 'xep-lop').nhan, '5 HV cần xếp lớp tiếp', 'xep-lop khi hết khoá dùng canXepLop');
    assert(!JSON.stringify(tat).includes('"case"'), 'Còn badge case');
  });

  // ------------------------------------------------------------------ Task 1 · việc tiếp theo

  const HN = '2026-09-16';
  const viecCase = (caseId: number, topic: string | null, viecTiep: any) => ({ caseId, topic, viecTiep });

  check('PR-HVL (1) · K2-04 viecTiepCuaEm: Xác nhận nguyên nhân / Xác nhận PA / Ghi kết quả (hạn hết T2) / Xử lý vi phạm / Nhập điểm, có đích bấm được', () => {
    const v = d.viecTiepCuaEm({
      nhapDiem: { kyNang: ['listening', 'reading'], dot: 'Giữa khoá', quaHan: false },
      cases: [
        viecCase(11, 'listening', { chu: 'Xác nhận nguyên nhân', loaiHan: 'xac-minh-sos', han: '2026-09-16' }),
        viecCase(12, 'reading', { chu: 'Xác nhận PA Ôn lại dạng bài True/False/NG', loaiHan: 'xac-minh-sos', han: '2026-09-14', paId: 90 }),
        viecCase(13, 'speaking', { chu: 'Ghi kết quả PA Luyện nói', loaiHan: 'cap-nhat-pa', han: '2026-09-21', paId: 91 }),
        viecCase(14, 'writing1', { chu: 'Ghi kết quả cuối Viết lại', loaiHan: 'cap-nhat-pa', han: '2026-09-14', paId: 92 }),
        viecCase(15, 'writing2', { chu: 'Đề ra PA', loaiHan: 'lap-pa', han: null }),
        viecCase(16, null, { chu: 'Chờ Quản lý duyệt · không theo dõi', loaiHan: null, han: null }),
        viecCase(17, 'listening', null),
      ],
      yThuc: { nhom: 'bat_buoc', so: 1, han: '2026-09-18', quaHanNgay: null },
      homNay: HN,
    });
    const theoViec = (re: RegExp) => v.find((x: any) => re.test(x.viec));
    const xn = theoViec(/^Xác nhận nguyên nhân/);
    eq([xn.viec, xn.tone, xn.han, xn.dich], ['Xác nhận nguyên nhân L', 'warn', '16/09', { loai: 'case', caseId: 11, ghiKetQua: false }], 'Xác nhận nguyên nhân');
    const pa = theoViec(/^Xác nhận PA/);
    eq([pa.viec, pa.tone, pa.quaHanNgay, pa.dich.paId], ['Xác nhận PA R', 'danger', 2, 90], 'Xác nhận PA quá hạn');
    assert(!/True|Ôn lại/.test(pa.viec) && /Ôn lại/.test(pa.title), `Tên PA dài phải bỏ khỏi viec, còn ở title: ${JSON.stringify(pa)}`);
    const gk = theoViec(/^Ghi kết quả PA/);
    eq([gk.viec, gk.han, gk.tone, gk.dich.ghiKetQua], ['Ghi kết quả PA S', 'hết T2 21/09', 'info', true], 'Ghi kết quả');
    const cuoi = theoViec(/^Ghi kết quả cuối/);
    eq([cuoi.viec, cuoi.tone, cuoi.quaHanNgay], ['Ghi kết quả cuối W1', 'danger', 2], 'Ghi kết quả cuối');
    assert(/hạn hết T2 14\/09 · quá hạn 2 ngày/.test(cuoi.title), cuoi.title);
    eq(theoViec(/^Đề ra PA/).tone, 'warn', 'Đề ra PA chưa hạn');
    eq([theoViec(/^Chờ Quản lý/).viec, theoViec(/^Chờ Quản lý/).tone], ['Chờ Quản lý duyệt Case', 'info'], 'Chờ QL duyệt');
    const yt = theoViec(/^Xử lý vi phạm/);
    eq([yt.tone, yt.dich, yt.han], ['warn', { loai: 'y-thuc' }, '18/09'], 'Ý thức bắt buộc');
    eq(theoViec(/^Nhập điểm/).dich, { loai: 'nhap-diem' }, 'Nhập điểm');
    eq(v.length, 8, 'Case không việc (viecTiep null) bị bỏ');
    const rank: any = { danger: 0, warn: 1, info: 2 };
    for (let i = 1; i < v.length; i++) assert(rank[v[i - 1].tone] <= rank[v[i].tone], `Chưa xếp danger → warn → info: ${v.map((x: any) => x.tone)}`);
    const qua = d.viecTiepCuaEm({ nhapDiem: null, cases: [], yThuc: { nhom: 'qua_han', so: 2, han: '2026-09-12', quaHanNgay: 4 }, homNay: HN })[0];
    eq([qua.tone, qua.quaHanNgay], ['danger', 4], 'Ý thức quá hạn');
    eq(d.viecTiepCuaEm({ nhapDiem: null, cases: [], yThuc: null, homNay: HN }), [], 'Không việc');
  });

  check('PR-HVL (1) · Q6 tachViecChung: việc Nhập điểm trùng chữ ở ≥ 2 em thành một dòng "Cả lớp"; một em thì không gộp', () => {
    const nd = (han: string | null = null) => d.viecTiepCuaEm({ nhapDiem: { kyNang: ['listening', 'reading'], dot: 'Cuối khoá', quaHan: false, han }, cases: [], yThuc: null, homNay: HN })[0];
    const rieng = d.viecTiepCuaEm({ nhapDiem: null, cases: [viecCase(1, 'reading', { chu: 'Xác nhận nguyên nhân', loaiHan: 'xac-minh-sos', han: '2026-09-17' })], yThuc: null, homNay: HN });
    const r = d.tachViecChung([1, 2, 3, 4].map((id) => ({ id, viec: id === 1 ? [nd(), ...rieng] : [nd()] })));
    eq([r.chung.soEm, r.chung.viec.viec], [4, 'Nhập điểm L, R · Cuối khoá'], 'Bốn em');
    eq([r.conLai.get(1).map((x: any) => x.viec), r.conLai.get(2)], [['Xác nhận nguyên nhân R'], []], 'Việc chung bỏ khỏi từng em, việc riêng còn');
    const mot = d.tachViecChung([{ id: 1, viec: [nd()] }, { id: 2, viec: [] }]);
    eq([mot.chung, mot.conLai.get(1).length], [null, 1], 'Một em: không gộp');
  });

  // ------------------------------------------------------------------ Task 1 · Cần hỗ trợ theo kỹ năng, nút chính

  const cs = (id: number, topic: string | null, o: any = {}) => ({ id, topic, quaHan: false, sosLevel: 1, ...o });
  const nhanHang = (h: any[]) => h.map((x: any) => (x.kind === 'rong' ? `~${x.nhan}` : `${x.nhan}:${x.cases.length}`));

  check('PR-HVL (1) · T19 hangCanHoTro FT: hàng L R W S; hai Case cùng R xếp quá hạn → mức SOS; Case chung; hàng rỗng liền nhau gộp', () => {
    const h = d.hangCanHoTro({ ct: 'FT', cases: [cs(1, 'reading', { sosLevel: 3 }), cs(2, 'reading', { quaHan: true, sosLevel: 1 }), cs(3, 'reading', { sosLevel: 2 }), cs(4, null)] });
    eq(nhanHang(h), ['L:0', 'R:3', '~Không có Case: W · S', 'Chung:1'], 'Hàng');
    const r = h.find((x: any) => x.khoa === 'reading');
    eq([r.cases.map((x: any) => x.id), r.hien.length, r.them], [[2, 1, 3], 2, 1], 'Quá hạn trước, rồi SOS cao; hien 2, "+1 Case"');
    const w = d.hangCanHoTro({ ct: 'FT', cases: [cs(5, 'writing1'), cs(6, 'writing2'), cs(7, 'writing')] });
    eq(w.find((x: any) => x.khoa === 'writing').cases.map((x: any) => x.id), [5, 6, 7], 'W1, W2 và writing bàn giao đều ở hàng W');
    eq(w.some((x: any) => x.khoa === 'chung'), false, 'Không có Case chung thì không có hàng Chung');
  });

  check('PR-HVL (1) · K2-36 hangCanHoTro theo chương trình: FOU G+V/P · BE/ELE L R W S · Pre FOU một hàng Tổng hợp · lọc "chỉ kỹ năng tôi dạy"', () => {
    const fou = d.hangCanHoTro({ ct: 'FOU', cases: [cs(1, 'writing'), cs(2, 'speaking')] });
    eq(nhanHang(fou), ['~Không có Case: L · R', 'G+V:1', 'P:1'], 'FOU: tên G+V, P; L R rỗng gộp');
    eq(nhanHang(d.hangCanHoTro({ ct: 'BE', cases: [cs(1, 'listening')] })), ['L:1', '~Không có Case: R · W · S'], 'BE');
    eq(nhanHang(d.hangCanHoTro({ ct: 'PREFOU', cases: [cs(1, 'tong_hop'), cs(2, 'tong_hop')] })), ['Tổng hợp:2'], 'Pre FOU một hàng');
    eq(nhanHang(d.hangCanHoTro({ ct: 'PREFOU', cases: [] })), ['Tổng hợp:0'], 'Pre FOU rỗng: một hàng "—"');
    const loc = d.hangCanHoTro({ ct: 'FT', chiKyNang: ['writing1'], cases: [cs(1, 'writing2'), cs(2, null), cs(3, 'listening')] });
    eq(nhanHang(loc), ['W:1', 'Chung:1'], 'Chỉ W1 → còn hàng W (giữ W2) và hàng Chung');
  });

  check('PR-HVL (1) · sapEmCanHoTro: em có Case quá hạn lên đầu, rồi theo tên tiếng Việt', () => {
    const em = [{ ten: 'Đỗ Minh Khôi', cases: [{ quaHan: false }] }, { ten: 'Bùi Thảo Vy', cases: [{ quaHan: true }] }, { ten: 'An Bình', cases: [] }, { ten: 'Ánh Dương', cases: [{ quaHan: true }] }];
    eq(d.sapEmCanHoTro(em).map((x: any) => x.ten), ['Ánh Dương', 'Bùi Thảo Vy', 'An Bình', 'Đỗ Minh Khôi'], 'Thứ tự');
  });

  check('PR-HVL (1) · K2-14 nutChinhDauTrang: lớp rỗng / cuối khoá lớp thường / nhập điểm / không nút', () => {
    const g = { thuong: false, phase: 'running', needsPlacement: false, soHocVien: 8, coTheThemHv: true, coTheNhapDiem: false, coTheChuyenTiep: true, soEmChuyen: 0 };
    eq(d.nutChinhDauTrang({ ...g, soHocVien: 0 }), { loai: 'them-hv', nhan: '+ Học viên' }, 'Lớp rỗng');
    eq(d.nutChinhDauTrang({ ...g, thuong: true, phase: 'final_week', soEmChuyen: 6 }), { loai: 'chuyen-tiep', nhan: 'Chuyển tiếp lớp · 6 em' }, 'Cuối khoá lớp thường');
    eq(d.nutChinhDauTrang({ ...g, thuong: true, phase: 'running', needsPlacement: true, soEmChuyen: 2 }).loai, 'chuyen-tiep', 'Cần xếp lớp');
    eq(d.nutChinhDauTrang({ ...g, thuong: true, phase: 'final_week', coTheChuyenTiep: false, coTheNhapDiem: true }).loai, 'nhap-diem', 'Không chuyển tiếp được → Nhập điểm');
    eq(d.nutChinhDauTrang({ ...g, coTheNhapDiem: true }), { loai: 'nhap-diem', nhan: 'Nhập điểm Test' }, 'Nhập điểm');
    eq(d.nutChinhDauTrang(g).loai, null, 'Không nút');
    eq(d.nutChinhDauTrang({ ...g, thuong: false, phase: 'final_week' }).loai, null, 'FT không có "Chuyển tiếp lớp"');
  });
}
