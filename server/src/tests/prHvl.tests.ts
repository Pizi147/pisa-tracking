/**
 * PHÉP KIỂM PR-HVL — Học viên & Lớp + hồ sơ lớp (kế hoạch 2026-09-29-pr-hvl-hoc-vien-lop). Tên mỗi phép kiểm bắt đầu bằng "PR-HVL ·".
 * Harness do `run.ts` truyền vào; file này không tự mở database. Task 1 = luật thuần (`shared/domain/hocVienLop.ts`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrHvlTests(t: YThucTestKit) {
  const { check, checkAsync, assert, assertThrows } = t;
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
    eq([be.chinh, be.dong1, be.dong2, be.sos], ['58%', 'Cuối khoá → QL cân nhắc', 'Không đạt: R W', null], 'BE Cuối khoá đủ điểm (PR-UXF-a K2-01: hậu tố hướng)');
    const pre = d.ketQuaGanNhat(thuong({ chuongTrinh: 'PREFOU', khongChiaMon: true, attemptLabel: 'Cuối khoá', attemptKind: 'final', tyLeTong: 0.64, failed: 0, sosLevel: 0, failedSkills: [] }));
    eq([pre.chinh, pre.dong1, pre.dong2, pre.dat], ['64%', 'Cuối khoá → lên + bổ trợ', null, true], 'Pre FOU: không dòng 2 (PR-UXF-a K2-01: hậu tố hướng)');
    const thieu = d.ketQuaGanNhat(thuong({ attemptLabel: 'Cuối khoá', attemptKind: 'final', scored: 2, failed: 0, sosLevel: null, failedSkills: [] }));
    eq([thieu.chinh, thieu.dong1], ['2/2 môn đạt', 'Cuối khoá · 2/4 môn có điểm'], 'Cuối khoá còn thiếu môn thì chưa có %');
    eq(d.ketQuaGanNhat(thuong({ scored: 0, failed: 0, sosLevel: null, failedSkills: [] })).chinh, '—', 'chưa môn nào có điểm: không "0/0 môn đạt"');
    for (const k of [d.ketQuaGanNhat(thuong()), be, pre, thieu]) assert(!/SOS|…/.test(JSON.stringify(k)), `Có "SOS"/"…": ${JSON.stringify(k)}`);
    eq(d.ketQuaGanNhat(null).dong1, 'Chưa có kết quả', 'Chưa có');
  });

  // ------------------------------------------------------------------ Task 1 · chip, badge

  check('PR-HVL (1) · K2-02/03 chip Cần làm · Chờ duyệt · Đang SOS · Thiếu thông tin; link cũ không vỡ; demLoc một hàm đếm', () => {
    eq(d.LOC_HOC_VIEN, ['tat-ca', 'can-lam', 'qua-han', 'cho-duyet', 'sos', 'thieu_tt'], 'Khoá chip (PR-S4F thêm qua-han)');
    for (const v of ['case_working', 'case_no_plan', 'case_overdue']) eq(d.docThamSoLoc(v), { loc: 'can-lam' }, `view=${v}`);
    eq(d.docThamSoLoc('sos_open'), { loc: 'sos' }, 'sos_open');
    eq(d.docThamSoLoc('cho-duyet'), { loc: 'cho-duyet' }, 'cho-duyet');
    const hv = [
      { loc: ['tat-ca', 'sos', 'can-lam'], khung: 'ft' }, { loc: ['tat-ca', 'cho-duyet'], khung: 'thuong' },
      { loc: ['tat-ca', 'can-lam', 'thieu_tt'], khung: 'thuong' },
    ];
    eq(d.demLoc(hv, 'tat-ca'), { 'tat-ca': 3, 'can-lam': 2, 'qua-han': 0, 'cho-duyet': 1, sos: 1, thieu_tt: 1 }, 'Đếm cả hai khung');
    eq(d.demLoc(hv, 'thuong'), { 'tat-ca': 2, 'can-lam': 1, 'qua-han': 0, 'cho-duyet': 1, sos: 0, thieu_tt: 1 }, 'Đếm lớp thường');
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
    eq(tat.find((x: any) => x.key === 'cho-duyet').tone, 'wait', 'cho-duyet tone');
    eq(tat.find((x: any) => x.key === 'xep-lop').nhan, '3 HV chưa có quyết định chuyển lớp', 'xep-lop khi lớp chưa hết khoá (PR-Dọn Câu 2 = B)');
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
        viecCase(15, 'writing2', { chu: 'Thêm PA', loaiHan: 'lap-pa', han: null }),
        viecCase(16, null, { chu: 'Chờ Quản lý duyệt · không theo dõi', loaiHan: null, han: null }),
        viecCase(17, 'listening', null),
      ],
      yThuc: { nhom: 'bat_buoc', so: 1, han: '2026-09-18', quaHanNgay: null },
      homNay: HN,
    });
    const theoViec = (re: RegExp) => v.find((x: any) => re.test(x.viec));
    const xn = theoViec(/^Xác nhận nguyên nhân/);
    eq([xn.viec, xn.tone, xn.han, xn.dich], ['Xác nhận nguyên nhân L', 'warn', 'hạn 16/09', { loai: 'case', caseId: 11, ghiKetQua: false }], 'Xác nhận nguyên nhân');
    const pa = theoViec(/^Xác nhận PA/);
    eq([pa.viec, pa.tone, pa.quaHanNgay, pa.dich.paId], ['Xác nhận PA R', 'danger', 2, 90], 'Xác nhận PA quá hạn');
    assert(!/True|Ôn lại/.test(pa.viec) && /Ôn lại/.test(pa.title), `Tên PA dài phải bỏ khỏi viec, còn ở title: ${JSON.stringify(pa)}`);
    const gk = theoViec(/^Ghi kết quả PA/);
    eq([gk.viec, gk.han, gk.tone, gk.dich.ghiKetQua], ['Ghi kết quả PA S · tuần W3 SEP', 'hạn hết T2 21/09', 'info', true], 'Ghi kết quả');
    const cuoi = theoViec(/^Ghi kết quả cuối/);
    eq([cuoi.viec, cuoi.tone, cuoi.quaHanNgay], ['Ghi kết quả cuối W1 · tuần W2 SEP', 'danger', 2], 'Ghi kết quả cuối');
    assert(/hạn hết T2 14\/09 · quá hạn 2 ngày/.test(cuoi.title), cuoi.title);
    eq(theoViec(/^Thêm PA/).tone, 'warn', 'Thêm PA chưa hạn');
    eq([theoViec(/^Chờ Quản lý/).viec, theoViec(/^Chờ Quản lý/).tone], ['Chờ Quản lý duyệt Case', 'info'], 'Chờ QL duyệt');
    const yt = theoViec(/^Xử lý vi phạm/);
    eq([yt.tone, yt.dich, yt.han], ['warn', { loai: 'y-thuc' }, 'hạn 18/09'], 'Ý thức bắt buộc');
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
    eq(d.nutChinhDauTrang({ ...g, thuong: true, phase: 'final_week', soEmChuyen: 6 }), { loai: null, nhan: '' }, 'PR-CT: cuối khoá lớp thường');
    eq(d.nutChinhDauTrang({ ...g, thuong: true, phase: 'running', needsPlacement: true, soEmChuyen: 2 }).loai, null, 'PR-CT: cần xếp lớp — nút ở dải');
    eq(d.nutChinhDauTrang({ ...g, thuong: true, phase: 'final_week', coTheChuyenTiep: false, coTheNhapDiem: true }).loai, 'nhap-diem', 'Không chuyển tiếp được → Nhập điểm');
    eq(d.nutChinhDauTrang({ ...g, coTheNhapDiem: true }), { loai: 'nhap-diem', nhan: 'Nhập điểm' }, 'Nhập điểm');
    eq(d.nutChinhDauTrang(g).loai, null, 'Không nút');
    eq(d.nutChinhDauTrang({ ...g, thuong: false, phase: 'final_week' }).loai, null, 'FT không có "Chuyển tiếp lớp"');
  });

  // ------------------------------------------------------------------ Task 2 · máy chủ: Case mở theo lô

  const { conn, P, TODAY, classId, addDays } = t;
  const sosState: any = await import('../cases/sosState.ts');
  const caseLop: any = await import('../cases/caseLop.ts');
  const casesMod: any = await import('../cases/cases.ts');
  const classesMod: any = await import('../classes/classes.ts');
  const dongHv: any = await import('../classes/dongHocVien.ts');
  const { soCauSql } = await import('../platform/nguCanhRequest.ts');
  const moTatCa = () => casesMod.listCases(P.admin, {}).rows.filter((c: any) => c.status !== 'done' && c.studentId !== null) as any[];

  check('PR-HVL (2) · sosCaseStateMany khớp định nghĩa độc lập (`awaitingCauseCaseIds`, `LA_CASE_SOS`) trên mọi Case demo; Case lạ → rỗng', () => {
    const ids = (conn.prepare('SELECT id FROM sos_cases ORDER BY id').all() as any[]).map((r) => r.id as number);
    const nhieu = sosState.sosCaseStateMany(ids);
    eq(ids.filter((id) => nhieu.get(id).awaitingCause), sosState.awaitingCauseCaseIds(ids), 'awaitingCause');
    const laSos = (conn.prepare(`SELECT sc.id FROM sos_cases sc WHERE ${sosState.LA_CASE_SOS('sc')} ORDER BY sc.id`).all() as any[]).map((r) => r.id);
    eq(ids.filter((id) => nhieu.get(id).fromSos), laSos, 'fromSos');
    assert(ids.length > 5 && laSos.length > 0, 'Bộ demo phải có Case SOS');
    eq(sosState.sosCaseState(99999999), { fromSos: false, hasCause: false, awaitingCause: false, dueOn: null, dismissed: null, choDuyetKhongTheoDoi: null, coPaChoXacNhan: false, boTro: null }, 'Case không có');
  });

  check('PR-HVL (2) · chiTietCaseMo: trạng thái v4 + việc tiếp = đúng `caseDetail` (một nguồn luật SOS); PA đủ; tên Case SOS ba phần', () => {
    const mo = moTatCa();
    const ct = caseLop.chiTietCaseMo(mo);
    assert(mo.length >= 10 && ct.size === mo.length, `Case mở ${mo.length}, chi tiết ${ct.size}`);
    let soSos = 0;
    for (const c of mo.slice(0, 25)) {
      const x = ct.get(c.id);
      const dt = casesMod.caseDetail(P.admin, c.id);
      eq(x.viecTiep, dt.viecTiep, `viecTiep Case ${c.id}`);
      eq([x.trangThai.k, x.trangThai.t], [dt.trangThaiV4.k, dt.trangThaiV4.t], `trạng thái Case ${c.id}`);
      eq(x.pas.length, dt.interventions.filter((i: any) => i.status !== 'cancelled').length, `số PA Case ${c.id}`);
      const theoId = (a: any[]) => [...a].sort((p, q) => p.id - q.id).map((i) => i.mocChu);
      eq(theoId(x.pas), theoId(dt.interventions.filter((i: any) => i.status !== 'cancelled')), `mốc chữ PA Case ${c.id}`);
      if (dt.tenSos && c.topic) { soSos++; eq(x.tieuDe, d.tenCaseSos(dt.tenSos), `tên SOS Case ${c.id}`); }
    }
    assert(soSos > 0, 'Phải có Case SOS Fast Track trong mẫu');
  });

  check('PR-HVL (2) · số câu SQL của chiTietCaseMo cố định: 3 Case và mọi Case mở cùng số câu (một câu mỗi bảng theo lô)', () => {
    const mo = moTatCa();
    assert(mo.length > 6, 'cần nhiều Case');
    const dem = (ds: any[]) => { const a = soCauSql(); caseLop.chiTietCaseMo(ds); return soCauSql() - a; };
    const it = dem(mo.slice(0, 3)); const tat = dem(mo);
    /* PR-LT2a: Giữa khoá tự tạo Case nên Case mở có thể vượt 400 — mỗi LÔ 400 thêm đúng 4 câu (một câu mỗi bảng), không thêm theo số Case. */
    eq(tat, it + 4 * (Math.ceil(mo.length / 400) - 1), 'Chênh số câu giữa 3 Case và mọi Case (chỉ theo số lô 400)');
    assert(it <= 6, `${it} câu cho một lô`);
  });

  check('PR-HVL (2) · roster FT: em Chờ xác nhận nguyên nhân → "Xác nhận nguyên nhân L" (warn, đích Case); em Ý thức bắt buộc → "Xử lý vi phạm"', () => {
    const cho = sosState.awaitingCauseCaseIds(moTatCa().map((c) => c.id));
    assert(cho.length > 0, 'Bộ demo phải có Case chờ xác nhận nguyên nhân');
    let thay = 0;
    for (const id of cho.slice(0, 6)) {
      const c: any = moTatCa().find((x) => x.id === id);
      if (!c.homeClassId) continue;
      const r = classesMod.classRoster(P.admin, c.homeClassId).find((x: any) => x.id === c.studentId);
      const v = r?.viecTiepTheo.find((x: any) => x.dich?.loai === 'case' && x.dich.caseId === id);
      if (!v) continue;
      thay++;
      assert(/^Xác nhận nguyên nhân/.test(v.viec) && ['warn', 'danger'].includes(v.tone) && v.dich.ghiKetQua === false, JSON.stringify(v));
    }
    assert(thay > 0, 'Không em nào có việc Xác nhận nguyên nhân ở cột Việc tiếp theo');
    let yt = 0;
    for (const lopId of (conn.prepare(`SELECT id FROM classes WHERE status = 'active'`).all() as any[]).map((r) => r.id as number)) {
      for (const [sid] of dongHv.canhBaoTheoHocVien(P.admin, lopId)) {
        const r = classesMod.classRoster(P.admin, lopId).find((x: any) => x.id === sid);
        if (r?.viecTiepTheo.some((x: any) => x.viec === 'Xử lý vi phạm' && x.dich.loai === 'y-thuc')) yt++;
      }
    }
    assert(yt > 0, 'Không em Ý thức nào có việc "Xử lý vi phạm"');
  });

  check('PR-HVL (2) · đếm câu roster: thêm 10 Case cho một em → chênh ≤ 1 câu (không N+1)', () => {
    const lop = classId('MB FT 101');
    const hv = classesMod.classRoster(P.admin, lop)[0];
    const dem = () => { const a = soCauSql(); classesMod.classRoster(P.admin, lop); return soCauSql() - a; };
    const truoc = dem();
    const ins = conn.prepare(`INSERT INTO sos_cases (student_id, cycle_id, category, topic, origin_kind, status, sos_level, detected_at, created_at)
      VALUES (?, ?, 'reading', 'reading', 'teacher_report', 'open', 1, ?, ?)`);
    const moi: number[] = [];
    for (let i = 0; i < 10; i++) moi.push(Number(ins.run(hv.id, hv.cycle?.id ?? null, TODAY, new Date().toISOString()).lastInsertRowid));
    try {
      const sau = dem();
      assert(sau <= truoc + 1, `Roster ${truoc} → ${sau} câu khi thêm 10 Case`);
      const r = classesMod.classRoster(P.admin, lop).find((x: any) => x.id === hv.id);
      assert(r.viecTiepTheo.filter((x: any) => x.dich?.loai === 'case').length >= 10, 'Việc của 10 Case mới phải có mặt');
    } finally {
      conn.prepare(`DELETE FROM sos_cases WHERE id IN (${moi.map(() => '?').join(',')})`).run(...moi);
    }
  });

  // ------------------------------------------------------------------ Task 3 · máy chủ trang Học viên & Lớp

  const hvl: any = await import('../classes/hocVienLop.ts');
  const standingMod: any = await import('../students/standing.ts');
  const lopHienTai = (sid: number) => (conn.prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active'`).get(sid) as any)?.class_id as number | undefined;

  check('PR-HVL (3) · chip: "Đang SOS" chỉ em Fast Track (em lớp thường có "SOS n" theo số môn trượt vẫn KHÔNG có cờ sos); dem = demLoc; khung đúng', () => {
    const r = hvl.danhSachHocVienLop(P.admin, {});
    eq(r.dem, d.demLoc(r.hocVien, 'tat-ca'), 'dem = demLoc');
    const laFt = new Map<number, boolean>(r.rows.map((x: any) => [x.id, x.programmeCode === 'FT']));
    for (const h of r.hocVien) {
      eq(h.khung, laFt.get(h.classId) ? 'ft' : 'thuong', `khung em ${h.id}`);
      if (h.khung === 'thuong') assert(!h.loc.includes('sos'), `Em lớp thường ${h.id} còn cờ sos`);
    }
    const thuongSos = [...standingMod.standingFor(r.hocVien.filter((h: any) => h.khung === 'thuong').map((h: any) => h.id)).values()].filter((s: any) => (s.sosLevel ?? 0) > 0);
    assert(thuongSos.length > 0, 'Bộ demo phải có em lớp thường mang mức SOS (để chứng minh không tính vào chip)');
    assert(r.hocVien.every((h: any) => !h.loc.some((k: string) => k.startsWith('case_'))), 'Còn cờ Case cũ');
  });

  /**
   * Trang Học viên & Lớp đọc Case theo CHI NHÁNH (một `listCases` cho cả lô), roster đọc theo LỚP: hai tập bằng nhau trừ Case của em đã chuyển
   * lớp sang chi nhánh khác (bộ kiểm để lại vài em như vậy). Chỉ so lớp mà hai tập trùng và chỉ em ĐANG HỌC.
   */
  const lopCungCase = (r: any) => r.rows.filter((lop: any) => {
    const em = new Set(r.hocVien.filter((h: any) => h.classId === lop.id).map((h: any) => h.id));
    const ids = (ds: any[]) => ds.filter((c) => c.status !== 'done' && em.has(c.studentId)).map((c) => c.id).sort();
    return JSON.stringify(ids(casesMod.listCases(P.admin, { branchId: lop.branchId }).rows)) === JSON.stringify(ids(casesMod.listCases(P.admin, { classId: lop.id }).rows));
  });

  check('PR-HVL (3) · chip Cần làm = em có việc tone danger/warn ở cột Việc tiếp theo (cùng `viecTiepCuaEm`); link cũ case_overdue → can-lam', () => {
    const r = hvl.danhSachHocVienLop(P.admin, {});
    const canLam = new Set(r.hocVien.filter((h: any) => h.loc.includes('can-lam')).map((h: any) => h.id));
    const trong = new Set(r.hocVien.map((h: any) => h.id));
    let khop = 0; let soLop = 0;
    for (const lop of lopCungCase(r)) {
      soLop++;
      for (const s of classesMod.classRoster(P.admin, lop.id)) {
        if (!trong.has(s.id)) continue;
        const co = s.viecTiepTheo.some((v: any) => v.dich?.loai !== 'nhap-diem' && (v.tone === 'danger' || v.tone === 'warn'));
        if (co) khop++;
        eq(canLam.has(s.id), co, `Em ${s.id} (lớp ${lop.code}): chip Cần làm ≠ việc gấp ở roster`);
      }
    }
    assert(soLop > 0 && khop > 0, `Không có lớp/em để so (${soLop} lớp, ${khop} em)`);
    eq(d.docThamSoLoc('case_overdue'), { loc: 'can-lam' }, 'link cũ');
  });

  check('PR-HVL (3) · Chờ duyệt: số thẻ chờ theo lớp (QL/Quản trị thấy đúng số thẻ demo, GVBM 0); em có thẻ mang chip cho-duyet', () => {
    /* PR-GVb (J5b): "chờ duyệt" chỉ thẻ QL phải quyết — Báo QL (kieuNut 'nhac') ở tab Để QL biết, không vào badge. */
    const cho = (conn.prepare(`SELECT loai, hoc_vien_id, lop_id FROM yeu_cau_duyet WHERE trang_thai = 'cho'`).all() as any[])
      .filter((y) => d.nhomCuaLoai(y.loai) === 'can-quyet');
    assert(cho.length > 0, 'Bộ demo phải có thẻ đang chờ');
    const mong = new Map<number, number>();
    for (const y of cho) { const l = y.lop_id ?? (y.hoc_vien_id ? lopHienTai(y.hoc_vien_id) : undefined); if (l) mong.set(l, (mong.get(l) ?? 0) + 1); }
    const admin = hvl.danhSachHocVienLop(P.admin, { phamVi: 'tat-ca' });
    for (const lop of admin.rows) eq(lop.soChoDuyet, mong.get(lop.id) ?? 0, `soChoDuyet lớp ${lop.code}`);
    assert(admin.rows.some((l: any) => l.soChoDuyet > 0), 'Phải có lớp có thẻ chờ');
    const gv = hvl.danhSachHocVienLop(P.subjectTeacher, {});
    assert(gv.rows.length > 0 && gv.rows.every((l: any) => l.soChoDuyet === 0), 'GVBM thấy 0');
    const emCo = new Set(cho.filter((y) => y.hoc_vien_id).map((y) => y.hoc_vien_id));
    for (const h of admin.hocVien) eq(h.loc.includes('cho-duyet'), emCo.has(h.id), `chip cho-duyet em ${h.id}`);
    const lopA = lopCungCase(admin).find((l: any) => l.soChoDuyet > 0) ?? lopCungCase(admin)[0];
    const ov = classesMod.classOverview(P.admin, lopA.id);
    eq([ov.soChoDuyet, ov.soEmQuaHan], [lopA.soChoDuyet, lopA.soEmQuaHan], 'classOverview cùng hai số với hộp lớp');
  });

  check('PR-HVL (3) · soEmQuaHan = số em có việc tone danger (Case quá hạn / Ý thức quá hạn) — khớp roster', () => {
    const admin = hvl.danhSachHocVienLop(P.admin, { phamVi: 'tat-ca' });
    let tong = 0;
    const trong = new Set(admin.hocVien.map((h: any) => h.id));
    for (const lop of lopCungCase(admin)) {
      const n = new Set(classesMod.classRoster(P.admin, lop.id).filter((s: any) => trong.has(s.id) && s.viecTiepTheo.some((v: any) => v.dich?.loai !== 'nhap-diem' && v.tone === 'danger')).map((s: any) => s.id)).size;
      eq(lop.soEmQuaHan, n, `soEmQuaHan lớp ${lop.code}`);
      tong += n;
    }
    assert(tong > 0, 'Bộ demo phải có em quá hạn việc');
  });

  // ------------------------------------------------------------------ Task 4 · web Học viên & Lớp (đọc nguồn — web không có bộ kiểm riêng)

  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const REPO = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
  const web = (f: string) => fs.readFileSync(path.join(REPO, 'web/src', f), 'utf8');

  check('PR-HVL (4) · Học viên & Lớp: công tắc khung, mỗi nhóm một <section> tiêu đề dính riêng, cột Sắp tới, không còn cột "Target / Khoá"', () => {
    const s = web('modules/students/StudentsPage.tsx');
    assert(/<CongTacKhung trang="hoc-vien-lop" coTatCa/.test(s) && /demLoc\(/.test(s), 'thiếu công tắc khung / demLoc');
    assert(/<section key=\{g\.k\}/.test(s) && /md:sticky md:top-0/.test(s), 'mỗi nhóm khung phải là một <section> chứa khối tiêu đề dính');
    assert(!/Target \/ Khoá/.test(s) && /'Sắp tới'/.test(s), 'cột');
    assert(/<MenuDong bieuTuong=\{`\+\$\{b\.an\.length\}`\}/.test(s) && !/x\.key === 'case'/.test(s), '"+n" phải là MenuDong, không còn badge Case');
  });

  check('PR-HVL (4) · Kết quả hai dòng không cắt "…" (không truncate); việc tiếp bấm được; hàng "Cả lớp"; tên em đậm', () => {
    const b = web('modules/students/BangHocVienLop.tsx');
    const kq = b.slice(b.indexOf('k.dong1'), b.indexOf('k.dong1') + 400);
    assert(/k\.dong1/.test(b) && !/truncate/.test(kq), 'dòng Kết quả còn truncate');
    assert(/tachViecChung/.test(b) && /Cả lớp:/.test(b) && /duongViecTiep/.test(b) && /font-semibold/.test(b), 'thiếu Cả lớp / link việc / tên đậm');
    assert(/den \? <Link to=\{den\}/.test(web('ui/ViecTiep.tsx')), 'ViecTiep chưa có link');
  });

  // ------------------------------------------------------------------ Task 5 · máy chủ Cần hỗ trợ theo kỹ năng

  const canHoTro: any = await import('../classes/canHoTro.ts');
  const LOP_FT = classId('MB FT 101');
  const LOP_FOU = classId('MB FOU 12');

  check('PR-HVL (5) · can-ho-tro: quyền (GV lớp khác bị chặn); chỉ em có Case mở; `tong` khớp; mọi Case vào đúng một hàng', () => {
    assertThrows(() => canHoTro.canHoTroLop(P.cpManager, LOP_FT), /ngoài phạm vi/, 'Quản lý chi nhánh khác');
    const r = canHoTro.canHoTroLop(P.admin, LOP_FT);
    assert(r.em.length > 0 && r.em.every((e: any) => e.cases.length > 0), 'Chỉ em có Case mở (T19)');
    eq([r.tong.soEm, r.tong.soCase], [r.em.length, r.em.reduce((n: number, e: any) => n + e.cases.length, 0)], 'tong.soEm / soCase');
    const tatCa = r.em.flatMap((e: any) => e.cases);
    eq(r.tong.quaHan, tatCa.filter((c: any) => c.quaHan).length, 'tong.quaHan');
    eq(r.tong.choDuyet, tatCa.filter((c: any) => c.trangThai.k === 'cho-duyet-khong-theo-doi').length + tatCa.reduce((n: number, c: any) => n + c.pas.filter((p: any) => p.choDuyet && !p.xong).length, 0), 'tong.choDuyet');
    for (const e of r.em) {
      const hang = d.hangCanHoTro({ ct: r.ct, cases: e.cases });
      const dem = hang.reduce((n: number, h: any) => n + (h.kind === 'hang' ? h.cases.length : 0), 0);
      eq(dem, e.cases.length, `em ${e.id}: mọi Case vào đúng một hàng`);
    }
    eq(r.em.map((e: any) => e.id).sort(), [...new Set(canHoTro.canHoTroLop(P.mbManager, LOP_FT).em.map((e: any) => e.id))].sort(), 'QL thấy cùng tập em');
  });

  check('PR-HVL (5) · can-ho-tro: GVBM thuần có kyNangToi và laGvbmThuan; GVCN/Quản trị thì không (công tắc "Chỉ kỹ năng tôi dạy")', () => {
    const gvbm = canHoTro.canHoTroLop(P.subjectTeacher, LOP_FT);
    assert(gvbm.laGvbmThuan && gvbm.kyNangToi.length >= 1 && gvbm.kyNangToi.length < gvbm.boMon.length, JSON.stringify({ a: gvbm.laGvbmThuan, k: gvbm.kyNangToi, b: gvbm.boMon }));
    assert(!canHoTro.canHoTroLop(P.coreTeacher, LOP_FT).laGvbmThuan && !canHoTro.canHoTroLop(P.admin, LOP_FT).laGvbmThuan, 'GVCN/Quản trị không phải GVBM thuần');
  });

  check('PR-HVL (5) · can-ho-tro lớp FOU: bộ môn L R W S, hàng G+V và P theo chương trình; việc "Ghi kết quả" của FT nói "hạn hết T2"', () => {
    const fou = canHoTro.canHoTroLop(P.admin, LOP_FOU);
    eq([fou.ct, fou.boMon], ['FOU', ['listening', 'reading', 'writing', 'speaking']], 'FOU');
    const hang = d.hangCanHoTro({ ct: fou.ct, cases: [] });
    eq(hang.map((h: any) => h.nhan), ['Không có Case: L · R · G+V · P'], 'FOU không Case: một dòng gộp');
    const ft = canHoTro.canHoTroLop(P.admin, LOP_FT);
    const ghi = ft.em.flatMap((e: any) => e.cases).map((c: any) => c.viecTiep).filter((v: any) => v?.chu.startsWith('Ghi kết quả') && v.han);
    assert(ghi.length > 0, 'Bộ demo phải có Case đang chờ ghi kết quả');
    for (const v of ghi) {
      const [x] = d.viecTiepCuaEm({ nhapDiem: null, cases: [{ caseId: 1, topic: 'reading', viecTiep: v }], yThuc: null, homNay: TODAY });
      assert(/^hạn hết T2 \d\d\/\d\d$/.test(x.han ?? ''), `Hạn Ghi kết quả: ${x.han}`);
    }
  });

  check('PR-HVL (5) · can-ho-tro: thêm 10 Case cho một em → chênh ≤ 1 câu SQL (không N+1)', () => {
    const r0 = canHoTro.canHoTroLop(P.admin, LOP_FT);
    const em = r0.em[0];
    const cy = (conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(em.id) as any)?.id ?? null;
    const dem = () => { const a = soCauSql(); canHoTro.canHoTroLop(P.admin, LOP_FT); return soCauSql() - a; };
    const truoc = dem();
    const ins = conn.prepare(`INSERT INTO sos_cases (student_id, cycle_id, category, topic, origin_kind, status, sos_level, detected_at, created_at)
      VALUES (?, ?, 'listening', 'listening', 'teacher_report', 'open', 1, ?, ?)`);
    const moi: number[] = [];
    for (let i = 0; i < 10; i++) moi.push(Number(ins.run(em.id, cy, TODAY, new Date().toISOString()).lastInsertRowid));
    try {
      const sau = dem();
      assert(sau <= truoc + 1, `${truoc} → ${sau} câu`);
      eq(canHoTro.canHoTroLop(P.admin, LOP_FT).em.find((e: any) => e.id === em.id).cases.length, em.cases.length + 10, '10 Case mới có mặt');
    } finally {
      conn.prepare(`DELETE FROM sos_cases WHERE id IN (${moi.map(() => '?').join(',')})`).run(...moi);
    }
  });

  check('PR-HVL (5) · web Cần hỗ trợ: hàng theo kỹ năng (`hangCanHoTro`), mở Ngăn Case tại chỗ, công tắc "Chỉ kỹ năng tôi dạy"; không còn luật một-Case-chính/em', () => {
    const b = web('modules/classes/BangCanHoTro.tsx');
    /* PR-S4F #5: hàng + xếp em đi qua `locCanHoTro` (gọi `hangCanHoTro` rồi `sapEmCanHoTro`). */
    assert(/locCanHoTro\(/.test(b) && /<NganCase /.test(b) && /Chỉ kỹ năng tôi dạy/.test(b), 'thiếu hàng theo kỹ năng / Ngăn Case tại chỗ / công tắc');
    assert(!/chonCaseChinh|viecTiepTheoCua|Chưa có PA học thuật|\/cases\?classId=/.test(b), 'còn luật/chữ cũ');
    assert(!/\u{1F512}/u.test(b), 'ổ khoá phải là SVG (KhoaQuyChe), không phải emoji');
    assert(/tenSos/.test(b) && /export function TenCase/.test(web('modules/cases/SkillBoard.tsx')), 'chip [MT1] dùng TenCase của SkillBoard');
  });

  // ------------------------------------------------------------------ Task 6 · Phân tích lớp mở rộng một kỹ năng

  const effMod: any = await import('../cases/effectiveness.ts');
  const ptlMod: any = await import('../classes/phanTichLop.ts');
  const hqpMod: any = await import('../phanTich/hieuQuaPa.ts');
  const CATS_FT = ['listening', 'reading', 'writing1', 'writing2', 'speaking'];

  check('PR-HVL (6) · issueBoard.tong: mỗi số là độ dài một tập id; tập lồng nhau đúng (Case ⊇ đang theo dõi ∪ đã xong; thành công ⊆ đã xong; đã có PA ⊆ Case)', () => {
    let coCase = 0;
    for (const cat of CATS_FT) {
      const t = effMod.classIssueBoard(LOP_FT, cat).tong;
      const tatCa = new Set(t.caseTatCa);
      eq([...t.dangTheoDoi, ...t.daXong].sort((a: number, b: number) => a - b), [...t.caseTatCa].sort((a: number, b: number) => a - b), `${cat}: đang theo dõi ∪ đã xong = mọi Case`);
      assert(t.thanhCong.every((id: number) => t.daXong.includes(id)) && t.daCoPa.every((id: number) => tatCa.has(id)), `${cat}: tập lồng nhau`);
      assert(new Set(t.caseTatCa).size === t.caseTatCa.length && new Set(t.hvGapVanDe).size === t.hvGapVanDe.length, `${cat}: một Case / một em chỉ đếm một lần`);
      coCase += t.caseTatCa.length;
    }
    assert(coCase > 0, 'Bộ demo phải có Case ở lớp FT');
  });

  check('PR-HVL (6) · /issue-board/o: danh sách sau mỗi số = đúng số đó (Case, HV, PA đang/đã/thành công theo loại) — tính bằng chính issueBoard', () => {
    let soPa = 0;
    for (const cat of CATS_FT) {
      const b = effMod.classIssueBoard(LOP_FT, cat);
      const kiem = (cot: string, n: number, kind: string | null = null) => {
        const r = ptlMod.oPhanTichLop(P.admin, LOP_FT, cat, cot, kind);
        eq([r.n, r.rows.length], [n, n], `${cat} ${cot} ${kind ?? ''}`);
      };
      kiem('hv', b.tong.hvGapVanDe.length); kiem('case', b.tong.caseTatCa.length); kiem('dang-theo-doi', b.tong.dangTheoDoi.length);
      kiem('da-co-pa', b.tong.daCoPa.length); kiem('da-xong', b.tong.daXong.length); kiem('thanh-cong', b.tong.thanhCong.length);
      for (const p of b.plans) {
        soPa++;
        eq(p.ids.dangThucHien.length, p.dangThucHien, `${cat} ${p.kind}: đang thực hiện`);
        eq([p.ids.daThucHien.length, p.ids.thanhCong.length], [p.decided, p.success], `${cat} ${p.kind}: đã thực hiện / thành công = decided / success`);
        kiem('pa-dang', p.dangThucHien, p.kind); kiem('pa-da', p.decided, p.kind); kiem('pa-thanh-cong', p.success, p.kind);
      }
    }
    assert(soPa > 0, 'Phải có ít nhất một loại PA ở lớp FT');
    assertThrows(() => ptlMod.oPhanTichLop(P.admin, LOP_FT, 'listening', 'khong-co', null), /không hợp lệ/, 'cột lạ');
    assertThrows(() => ptlMod.oPhanTichLop(P.cpManager, LOP_FT, 'listening', 'case', null), /ngoài phạm vi/, 'Quản lý chi nhánh khác');
  });

  check('PR-HVL (6) · cùng `planOutcomes` với Phân tích › Hiệu quả PA: tổng "Đã thực hiện" của lớp = PA có kết quả xác định của lớp; khác Hiệu quả PA chỉ vì khung thời gian và Case chưa chọn nhóm nguyên nhân', () => {
    const tatCa = effMod.planOutcomes({ classId: LOP_FT }).filter((r: any) => r.group !== 'undetermined');
    const tong = CATS_FT.reduce((n, cat) => n + effMod.classIssueBoard(LOP_FT, cat).plans.reduce((m: number, p: any) => m + p.decided, 0), 0);
    eq(tong, tatCa.filter((r: any) => CATS_FT.includes(r.category)).length, 'Σ theo kỹ năng của bảng lớp = planOutcomes của lớp');
    const success = CATS_FT.reduce((n, cat) => n + effMod.classIssueBoard(LOP_FT, cat).plans.reduce((m: number, p: any) => m + p.success, 0), 0);
    eq(success, tatCa.filter((r: any) => CATS_FT.includes(r.category) && r.group === 'success').length, 'Σ thành công');
    /* Hiệu quả PA (52 tuần): cùng tập trừ PA ngoài khung và PA của Case chưa có lỗi chính. */
    const hq = hqpMod.hieuQuaPa(P.admin, { ct: 'ft', classId: LOP_FT, soTuan: 52 });
    const trongKhung = effMod.planOutcomes({ classId: LOP_FT, fromDate: d.tuDauKhoang(TODAY, 52) }).filter((r: any) => r.group !== 'undetermined');
    const coLoiChinh = new Set((conn.prepare(`SELECT DISTINCT case_id FROM case_issues WHERE role = 'primary'`).all() as any[]).map((r) => r.case_id));
    /* PR-Pb2-a: tách PA GV thêm (cần lỗi chính) / PA theo quy chế (không cần). */
    const kyVong = trongKhung.filter((r: any) => !r.quyChe && coLoiChinh.has(r.caseId) && r.category !== 'tong_hop').length;
    eq(hq.gvThem.tomTat.paCoKetQua, kyVong, 'Hiệu quả PA (GV thêm) = PA có kết quả trong khung 52 tuần, Case đã có lỗi chính');
    eq(hq.quyChe.tomTat.paCoKetQua, trongKhung.filter((r: any) => r.quyChe).length, 'Hiệu quả PA (quy chế) = mọi PA quy chế có kết quả trong khung');
    assert(tong >= hq.gvThem.tomTat.paCoKetQua + hq.quyChe.tomTat.paCoKetQua, 'Bảng lớp (mọi thời gian, mọi Case) không thể ít hơn Hiệu quả PA');
  });

  check('PR-HVL (6) · K2-40: lớp FOU có dòng đầu "Cả bài" (không mở rộng), n/N HV đạt theo % tổng ≥ ngưỡng chung; Pre FOU không có dòng này; lớp FT không có', () => {
    const fou = ptlMod.phanTichLop(P.admin, LOP_FOU);
    eq([fou.dong[0].key, fou.dong[0].nhan, fou.dong[0].moRong], ['ca-bai', 'Cả bài', false], 'dòng đầu');
    assert(/70%/.test(fou.dong[0].tenDayDu), fou.dong[0].tenDayDu);
    eq(fou.dong.slice(1).map((x: any) => x.nhan), ['L', 'R', 'G+V', 'P'], 'các môn FOU');
    let coO = false;
    for (const k of Object.keys(fou.o).filter((x) => x.startsWith('ca-bai|'))) {
      const o = fou.o[k]; coO = true;
      assert(o.dat <= o.tong && o.tong > 0, `${k}: ${JSON.stringify(o)}`);
    }
    assert(coO, 'Bộ demo phải có em đủ điểm một bài ở MB FOU 12');
    assert(!ptlMod.phanTichLop(P.admin, LOP_FT).dong.some((x: any) => x.key === 'ca-bai'), 'FT không có Cả bài');
    const pre = (conn.prepare(`SELECT id FROM classes WHERE code = 'MB Pre FOU 77'`).get() as any)?.id;
    if (pre) assert(!ptlMod.phanTichLop(P.admin, pre).dong.some((x: any) => x.key === 'ca-bai'), 'Pre FOU không có Cả bài');
  });

  check('PR-HVL (6) · web Phân tích lớp: hai bảng nhỏ với số bấm được (SoO nguon=/issue-board/o), TyLe n/N, không còn cột "không thành công"', () => {
    const b = web('modules/classes/ClassIssueBoard.tsx');
    assert(/export function VanDeKyNang/.test(b) && /Vấn đề ở/.test(b) && /Hiệu quả phương án ở/.test(b) && /issue-board\/o/.test(b), 'thiếu hai bảng / nguồn danh sách');
    assert(/<TyLe n=\{p\.success\} N=\{p\.decided\}/.test(b) && !/Không thành công/.test(b), 'tỷ lệ / cột không thành công');
    assert(/VanDeKyNang/.test(web('modules/classes/PhanTichLopTab.tsx')) && /moRong === false/.test(web('modules/classes/PhanTichLopTab.tsx')), 'PhanTichLopTab');
  });

  // ------------------------------------------------------------------ Task 7 · đầu hồ sơ lớp, Tuần khai giảng / Lịch kiểm tra

  const schedMod: any = await import('../classes/schedule.ts');
  const intakeMod: any = await import('../classes/intake.ts');
  const MB = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;

  check('PR-HVL (7) · K2-22: tomTatMt của lớp FT khớp roster (em có mốc kế tiếp = standing.nextAttemptNo); route progress có tomTatMt chỉ với lớp FT', () => {
    const t = schedMod.tomTatMt(LOP_FT);
    const ro = classesMod.classRoster(P.admin, LOP_FT).filter((r: any) => !r.archived && r.status === 'active');
    eq(t.soEm, new Set(ro.map((r: any) => r.id)).size, 'số em (đếm mỗi em một lần)');
    assert(t.coMocSapToi <= t.soEm && t.daXongMtCuoi <= t.soEm, JSON.stringify(t));
    eq(t.coMocSapToi, new Set(ro.filter((r: any) => r.standing?.nextAttemptNo != null).map((r: any) => r.id)).size, 'em có MT sắp tới = roster');
    const pr = schedMod.classProgress(LOP_FT);
    eq([pr.coGiuaKhoa, pr.programmeCode], [false, 'FT'], 'FT không có mốc Giữa khoá chung');
    const src = fs.readFileSync(path.join(REPO, 'server/src/routes/index.ts'), 'utf8');
    assert(/tomTatMt = pr\.programmeCode === 'FT' && can\(/.test(src), 'route progress phải kiểm quyền trước khi trả tomTatMt');
  });

  checkAsync('PR-HVL (7) · K2-23: coGiuaKhoa theo chương trình — FOU có, Pre FOU không; lớp thường cuối khoá có cuoiKhoa {du, tong}, FT không', async () => {
    eq(schedMod.classProgress(LOP_FOU).coGiuaKhoa, true, 'FOU');
    const pre = (conn.prepare(`SELECT id FROM classes WHERE code = 'MB Pre FOU 77'`).get() as any)?.id;
    if (pre) eq(schedMod.classProgress(pre).coGiuaKhoa, false, 'Pre FOU');
    eq(classesMod.classOverview(P.admin, LOP_FT).cuoiKhoa, null, 'FT không có cuoiKhoa');
    const weekMod: any = await import('../platform/week.ts');
    const batDau = addDays(TODAY, -49);
    const lop = (intakeMod.createClass(P.admin, { code: 'MB FOU HVL7', branchId: MB, kind: 'FOU', isFastTrack: false, startDate: batDau, startPeriodId: weekMod.ensurePeriod(batDau).id }) as any).id as number;
    for (const ten of ['HVL7 An', 'HVL7 Binh']) intakeMod.commitIntake(P.admin, { classId: lop, rows: [{ fullName: ten, email: 'hv@demo.test' }], idempotencyKey: `hvl7-${ten}` });
    const ov = classesMod.classOverview(P.admin, lop);
    assert(['final_week', 'finished'].includes(ov.summary.phase), `Lớp khai giảng 7 tuần trước phải ở tuần Cuối khoá: ${ov.summary.phase}`);
    eq(ov.cuoiKhoa, { du: 0, tong: 2, canQl: 0 }, 'chưa em nào có điểm Cuối khoá');
  });

  check('PR-HVL (7) · web đầu hồ sơ lớp: một nút chính theo chặng, ⋮ có Tuần khai giảng / Lịch kiểm tra, LT bọc abbr; panel không còn "Lộ trình lớp" / "Mở từng em rồi bấm"; ô Giữa khoá ẩn với Pre FOU', () => {
    const dau = web('modules/classes/DauTrangLop.tsx'); const pn = web('modules/classes/ClassProgressPanel.tsx'); const pg = web('modules/classes/ClassOverviewPage.tsx');
    assert(/nutChinhDauTrang\(/.test(dau) && /phu\.slice\(0, 2\)/.test(dau) && /'Tuần khai giảng'/.test(dau) && /ROUTE_NAME\[/.test(dau) && /<MenuDong bieuTuong=\{`\+\$\{b\.an\.length\}`\}/.test(dau), 'DauTrangLop');
    assert(!/Lộ trình lớp/.test(dau + pn + pg) && !/Mở từng em rồi bấm/.test(pn), 'chữ cũ còn sót');
    assert(/data\.coGiuaKhoa &&/.test(pn) && /onChuyenTiep/.test(pn) && /tomTatMt/.test(pn) && /Đổi tuần khai giảng không dời lịch MT/.test(pn), 'ClassProgressPanel');
    assert(!/rgba\(242, 161, 161/.test(pn), 'khung hết khoá không còn tô đỏ');
  });

  // ------------------------------------------------------------------ Task 8 · bảng điểm FT, Lộ trình tiếp theo, Chuyển tiếp lớp

  const loTrinhMod: any = await import('../classes/loTrinhTiep.ts');
  const trans: any = await import('../classes/transition.ts');
  check('PR-HVL (8) · B9: /students/:id/lo-trinh-tiep và /classes/:id/transition trả `ketQua` của em (cùng standingFor)', () => {
    const sid = (conn.prepare(`SELECT student_id AS id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`).get(LOP_FOU) as any).id as number;
    const loTrinh: any = loTrinhMod.layLoTrinhTiep(P.admin, sid);
    assert('ketQua' in loTrinh && (loTrinh.ketQua === null || typeof loTrinh.ketQua.attemptLabel !== 'undefined'), JSON.stringify(loTrinh.ketQua));
    eq(loTrinh.ketQua?.studentId ?? null, standingMod.standingFor([sid]).get(sid)?.studentId ?? null, 'cùng standingFor');
    const plan = trans.transitionPlan(P.admin, LOP_FOU);
    assert(plan.students.length > 0 && plan.students.every((s: any) => 'ketQua' in s), 'mỗi em phải có khoá ketQua');
  });

  check('PR-HVL (8) · web: bảng điểm FT bỏ Gọn/Đầy đủ, có nhánh MT lịch sử xám + nhãn, cột Theo dõi là ViecTiep bấm được; Lộ trình tiếp theo có Kết quả gần nhất, câu "Chỉ là dự định" hiện thẳng; Chuyển tiếp báo lỗi sau khi sửa/bấm', () => {
    const r = web('modules/students/ClassRoster.tsx');
    assert(!/Gọn|Đầy đủ/.test(r) && /lichSu/.test(r) && /ChipLichSu/.test(r) && /viecTiepTheo\[0\]/.test(r) && /<ViecTiep /.test(r), 'ClassRoster');
    const lt = web('modules/students/LoTrinhTiepPanel.tsx');
    assert(/Kết quả gần nhất/.test(lt) && /ketQuaGanNhat\(/.test(lt) && !/luat="Chỉ là dự định/.test(lt) && /Chỉ là dự định, chưa đổi lớp/.test(lt), 'LoTrinhTiepPanel');
    const tp = web('modules/classes/TransitionPanel.tsx');
    assert(/useLoiForm\(\)/.test(tp) && /lf\.bam\(\)/.test(tp) && /daSua/.test(tp) && /Cuối khoá/.test(tp) && /Kết quả gần nhất/.test(tp) && /ketQuaGanNhat\(/.test(tp), 'TransitionPanel (PR-CT: cột Cuối khoá / Kết quả gần nhất dùng ketQuaGanNhat)');
    assert(!/disabled=\{coLoi \|\| !data\?\.canEdit\}/.test(tp), 'nút Tiếp tục không được khoá vì lỗi (phải bấm được để hiện lỗi)');
  });

  // ------------------------------------------------------------------ Task 9 · điện thoại: bảng → thẻ (D2)

  check('PR-HVL (9) · D2: TheDong dùng chung; StudentsPage/BangHocVienLop, ClassRoster, BangDiemLopThuong, BangCanHoTro có nhánh điện thoại (< 640 px) dùng TheDong; tablet cuộn ngang trong vùng bảng, cột tên dính', () => {
    const td = web('ui/TheDong.tsx');
    assert(/export function TheDong/.test(td) && /export function useDienThoai/.test(td) && /max-width: 639px/.test(td) && /tabular-nums/.test(td), 'TheDong.tsx');
    for (const f of ['modules/students/BangHocVienLop.tsx', 'modules/students/ClassRoster.tsx', 'modules/classes/BangDiemLopThuong.tsx', 'modules/classes/BangCanHoTro.tsx']) {
      assert(/<TheDong\b/.test(web(f)), `${f} chưa dùng TheDong`);
    }
    const sp = web('modules/students/StudentsPage.tsx');
    assert(/useDienThoai\(\)/.test(sp) && /<HopLop key=\{c\.id\} the /.test(sp) && /if \(the\)/.test(sp), 'StudentsPage phải có nhánh thẻ gập ở điện thoại');
    assert(/aria-expanded=\{mo\}/.test(sp), 'thẻ lớp gập cần aria-expanded');
    assert(/sticky-col/.test(web('modules/students/ClassRoster.tsx')) && /sticky-col/.test(web('modules/classes/BangDiemLopThuong.tsx')), 'cột tên dính (640–1023 px)');
  });

  check('PR-HVL (2) · roster: `history[i].lichSu` là cờ thật của mốc; Standing có `nextWeekStart` (cột Sắp tới)', () => {
    let coMoc = 0;
    for (const lopId of (conn.prepare(`SELECT id FROM classes WHERE status = 'active'`).all() as any[]).map((r) => r.id as number)) {
      for (const r of classesMod.classRoster(P.admin, lopId)) {
        for (const h of r.history) {
          assert(typeof h.lichSu === 'boolean', `history.lichSu thiếu ở em ${r.id}`);
          eq(h.lichSu, !!r.timeline.find((x: any) => x.id === h.id)?.lichSu, `cờ lichSu mốc ${h.id}`);
        }
        const st = r.standing;
        if (st?.nextAttemptNo != null) { coMoc++; assert(/^\d{4}-\d{2}-\d{2}/.test(st.nextWeekStart ?? ''), `nextWeekStart em ${r.id}: ${st.nextWeekStart}`); }
        else assert(!st || st.nextWeekStart === null, `nextWeekStart lẻ loi em ${r.id}`);
      }
    }
    assert(coMoc > 0, 'Phải có em có mốc kế tiếp');
  });
}

/**
 * BỘ DEMO H1–H4 — chạy NGAY SAU KHI DỰNG (khối "Bộ demo vừa dựng" của `run.ts`), trước mọi phép kiểm khác: các phép kiểm chuyển tiếp lớp / chuyển lớp
 * về sau đóng Case của em lớp FOU 12, nên ở cuối bộ kiểm dữ liệu H2 đã đổi.
 */
export async function runPrHvlDemoTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const canHoTro: any = await import('../classes/canHoTro.ts');
  const classesMod: any = await import('../classes/classes.ts');
  const standingMod: any = await import('../students/standing.ts');
  const eq = (got: unknown, want: unknown, m: string) =>
    assert(JSON.stringify(got) === JSON.stringify(want), `${m}: ${JSON.stringify(got)} ≠ ${JSON.stringify(want)}`);
  const LOP_FT = classId('MB FT 101');
  const LOP_FOU = classId('MB FOU 12');
  const nhanHang = (h: any[]) => h.map((x: any) => (x.kind === 'rong' ? `~${x.nhan}` : `${x.nhan}:${x.cases.length}`));
  console.log('\nPR-HVL · Bộ demo H1–H4');
  const idHv = (ten: string) => (conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any)?.id as number | undefined;

  check('PR-HVL (10) · demo H1: Trịnh Bảo Ngọc (MB FT 101) — hàng R có 2 Case cùng kỹ năng, Case Writing chờ Quản lý duyệt "không theo dõi"', () => {
    const id = idHv('Trịnh Bảo Ngọc');
    assert(id, 'Thiếu học viên demo H1');
    const r = canHoTro.canHoTroLop(P.admin, LOP_FT);
    const em = r.em.find((e: any) => e.id === id);
    assert(em, 'H1 phải có mặt ở Cần hỗ trợ');
    const hang = d.hangCanHoTro({ ct: r.ct, cases: em.cases });
    const R = hang.find((h: any) => h.khoa === 'reading');
    assert(R && R.cases.length >= 2, `Hàng R phải có 2 Case cùng Reading: ${JSON.stringify(nhanHang(hang))}`);
    assert(em.cases.some((c: any) => c.trangThai.k === 'cho-duyet-khong-theo-doi'), 'Phải có Case chờ Quản lý duyệt');
    assert(em.cases.some((c: any) => c.tenSos?.mt === 1), 'Case SOS tự tạo mang chip [MT1]');
  });

  check('PR-HVL (10) · demo H2: MB FOU 12 — Hồ Diệu Linh có Case G+V và P; Nguyễn Thảo Vy Cuối khoá đủ điểm hiện "58%" không SOS; H3 Pre FOU 03 "64%"; H4 Đoàn Khánh Chi MT lịch sử → "Chưa có kết quả"', () => {
    const fou = canHoTro.canHoTroLop(P.admin, LOP_FOU);
    const linh = fou.em.find((e: any) => e.id === idHv('Hồ Diệu Linh'));
    assert(linh, 'H2: Hồ Diệu Linh phải có mặt ở Cần hỗ trợ lớp FOU (Case G+V và P)');
    eq(nhanHang(d.hangCanHoTro({ ct: fou.ct, cases: linh.cases })), ['~Không có Case: L · R', 'G+V:1', 'P:1'], 'Hàng G+V và P');
    const vy = standingMod.standingFor([idHv('Nguyễn Thảo Vy')!]).get(idHv('Nguyễn Thảo Vy')!);
    const kq = d.ketQuaGanNhat(vy);
    eq([kq.chinh, kq.sos, kq.dong1], ['58%', null, 'Cuối khoá → QL cân nhắc'], 'H2 Cuối khoá 58/100 (PR-UXF-a K2-01)');
    const pre = (conn.prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id JOIN classes c ON c.id = e.class_id
                                WHERE c.code = 'MB Pre FOU 03' AND e.status = 'active'`).all() as any[]).map((r) => r.id as number);
    const chinhPre = [...standingMod.standingFor(pre).values()].map((s: any) => d.ketQuaGanNhat(s).chinh);
    assert(chinhPre.includes('64%') && chinhPre.includes('52%'), `H3 Pre FOU: ${chinhPre}`);
    const chi = idHv('Đoàn Khánh Chi')!;
    const rr = classesMod.classRoster(P.admin, LOP_FT).find((x: any) => x.id === chi);
    assert(rr && rr.history.length >= 2 && rr.history.every((h: any) => h.lichSu), 'H4: MT1–MT3 phải là MT lịch sử có điểm');
    eq(d.ketQuaGanNhat(standingMod.standingFor([chi]).get(chi)).dong1, 'Chưa có kết quả', 'H4: chưa có lượt thường có điểm');
  });

}
