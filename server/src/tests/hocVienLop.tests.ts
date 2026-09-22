/**
 * PHÉP KIỂM PR-Qa — Học viên & Lớp + Hồ sơ lớp (đặc tả 2026-09-22-ux-toan-web-truoc-deploy-design §1, §3.6, §3.7, §4, §7 dòng Qa;
 * kiểm kê Q1–Q5, Q10–Q13, K2-6a, YT-8). Tên mỗi phép kiểm bắt đầu bằng "PR-Qa ·".
 *
 * Harness do `run.ts` sở hữu và truyền vào — file này không tự mở database. Lớp và học viên dùng để đếm do CHÍNH file này tạo
 * (mã lớp "MB-FT QA…", "MB-FOU QA…"), nên số đếm không lẫn dữ liệu demo. Ngày demo cố định TODAY = 2026-09-14 (thứ Hai).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runHocVienLopTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, TODAY, P, addDays, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const week: any = await import('../platform/week.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const intake: any = await import('../classes/intake.ts');
  const classes: any = await import('../classes/classes.ts');
  const standingMod: any = await import('../students/standing.ts');
  const violations: any = await import('../yThuc/violations.ts');
  const warn: any = await import('../yThuc/canhBao.ts');
  const casesMod: any = await import('../cases/cases.ts');
  const fsMod = await import('node:fs');
  const pathMod = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  /**
   * Mô-đun chưa có thì phép kiểm ĐỎ với câu nói rõ thiếu gì, không làm sập cả bộ (cùng mẹo với luatMayChu.tests.ts).
   * `then` trả `undefined` để `await load(...)` không tưởng đây là promise.
   */
  const load = async (p: string): Promise<any> => import(p).catch((e) =>
    new Proxy({}, { get: (_x, k) => {
      if (k === 'then') return undefined;
      throw new Error(`Chưa có mô-đun ${p} (${String(k)}) — ${e.message}`);
    } }));
  const hvl: any = await load('../classes/hocVienLop.ts');
  const ptl: any = await load('../classes/phanTichLop.ts');
  const ttl: any = await load('../classes/thongTinLop.ts');
  const REPO = pathMod.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
  const eq = (got: unknown, want: unknown, m: string) =>
    assert(JSON.stringify(got) === JSON.stringify(want), `${m}: ${JSON.stringify(got)} ≠ ${JSON.stringify(want)}`);
  console.log('\nPR-Qa · Học viên & Lớp + Hồ sơ lớp');

  // ------------------------------------------------------------------ Task 1 · G-6

  check('PR-Qa · G-6 chuỗi có giờ (UTC) đổi sang giờ Việt Nam rồi mới lấy ngày', () => {
    eq(d.ngay('2026-09-22T18:30:00Z', '2026-09-22'), '23/09', '01:30 sáng 23/09 giờ VN');
    eq(d.ngay('2026-09-22T16:59:59Z', '2026-09-22'), '22/09', '23:59:59 giờ VN vẫn là 22/09');
    eq(d.ngay('2026-09-22 20:00:00', '2026-09-22'), '23/09', 'Dạng SQLite (UTC, không ghi múi giờ)');
    eq(d.ngay('2026-09-22T08:00:00+07:00', '2026-09-22'), '22/09', 'Có ghi múi giờ +07:00');
    eq(d.ngay('2026-12-31T17:00:00Z', '2026-09-22'), '01/01/2027', 'Sang năm mới theo giờ VN phải ghi năm');
    eq(d.shortDate('2026-09-22T18:30:00Z', '2026-09-22'), '23/09', 'shortDate (display.ts) cùng luật');
    eq(d.shortDate('2027-01-05', '2026-12-31T18:00:00Z'), '05/01', 'Hôm nay là một mốc giờ: 01/01/2027 giờ VN');
    eq(d.tuanLich('2026-09-27T20:00:00Z', '2026-09-22'), 'W1 OCT', '20:00 UTC Chủ nhật 27/09 = thứ Hai 28/09 giờ VN');
    eq(d.businessDateText('2026-09-14', '2026-09-19T10:20:00Z', '2026-09-19'), 'Ngày nghiệp vụ 14/09 · Ghi nhận 19/09', 'Không đổi');
  });

  check('PR-Qa · G-6 ngày không tồn tại bị từ chối (31/02, 29/02 năm thường, tháng 13, giờ 25)', () => {
    for (const s of ['2026-02-31', '2026-02-29', '2026-13-01', '2026-00-10', '2026-09-31', '2026-09-22T25:00:00Z']) {
      eq(d.ngay(s, '2026-09-22'), '—', `ngay ${s}`);
      eq(d.shortDate(s, '2026-09-22'), '—', `shortDate ${s}`);
      eq(d.tuanLich(s, '2026-09-22'), '—', `tuanLich ${s}`);
    }
    eq(d.ngay('2028-02-29', '2028-01-01'), '29/02', 'Năm nhuận 2028 có 29/02');
    eq(d.ngayTheoGioVN('2026-02-31'), null, 'ngayTheoGioVN từ chối 31/02');
    eq(d.ngayTheoGioVN('2026-09-22'), '2026-09-22', 'ngày trần giữ nguyên');
    assert(/chưa có hạn/.test(d.deadlineView({ kind: 'nhap-diem', due: '2026-02-31', today: '2026-09-14' }).text),
      'Hạn là ngày không tồn tại = chưa có hạn');
  });

  // ------------------------------------------------------------------ Task 2 · nợ PR-O

  check('PR-Qa · Nợ PR-O: tiêu đề tab trình duyệt "PISA Progress"; thanh dưới điện thoại z-30', () => {
    const html = fsMod.readFileSync(pathMod.join(REPO, 'index.html'), 'utf8');
    assert(/<title>PISA Progress<\/title>/.test(html) && !/Bản demo nội bộ/.test(html), 'index.html còn tiêu đề cũ');
    const app = fsMod.readFileSync(pathMod.join(REPO, 'web/src/App.tsx'), 'utf8');
    const dong = app.split('\n').find((l) => l.includes('md:hidden fixed bottom-0'));
    assert(!!dong && /\bz-30\b/.test(dong) && !/\bz-40\b/.test(dong), `Thanh dưới: ${dong}`);
  });

  // ------------------------------------------------------------------ Task 3 · luật thuần

  check('PR-Qa · Q4 chip lọc: nhãn THUAT_NGU, khoá URL cũ vẫn mở đúng chip, missing_scores sang Test › Cần chấm', () => {
    eq(d.LOC_HOC_VIEN.map((k: string) => d.LOC_HOC_VIEN_NHAN[k].nhan),
      ['Tất cả', 'Đang SOS', 'Có Case đang xử lý', 'Case thiếu PA học thuật', 'Case quá hạn cập nhật', 'Thiếu thông tin'], 'Nhãn chip');
    eq(d.docThamSoLoc(null), { loc: 'tat-ca' }, 'Không có view');
    eq(d.docThamSoLoc('classes'), { loc: 'tat-ca' }, 'view=classes cũ');
    eq(d.docThamSoLoc('sos_open'), { loc: 'sos' }, 'signals.ts dùng sos_open');
    eq(d.docThamSoLoc('case_no_plan'), { loc: 'case_no_plan' }, 'WeeklyBoard');
    eq(d.docThamSoLoc('missing_scores'), { chuyenDen: '/test/can-cham' }, 'Việc nhập điểm nằm ở khu Test');
    eq(d.docThamSoLoc('la'), { loc: 'tat-ca' }, 'Khoá lạ');
  });

  check('PR-Qa · Q3/Q12 Phạm vi: chỉ lựa chọn có nghĩa, mặc định theo vai', () => {
    eq(d.phamViCoThe({ dayLop: true, capChiNhanh: false, toanHeThong: false, soChiNhanh: 0 }), ['toi'], 'GV');
    eq(d.phamViCoThe({ dayLop: false, capChiNhanh: true, toanHeThong: false, soChiNhanh: 1 }), ['chi-nhanh'], 'QL một chi nhánh');
    eq(d.phamViCoThe({ dayLop: true, capChiNhanh: true, toanHeThong: false, soChiNhanh: 2 }), ['toi', 'chi-nhanh', 'tat-ca'], 'QL hai chi nhánh có dạy');
    eq(d.phamViCoThe({ dayLop: false, capChiNhanh: false, toanHeThong: true, soChiNhanh: 0 }), ['chi-nhanh', 'tat-ca'], 'Quản trị');
    eq(d.phamViMacDinh(['toi', 'chi-nhanh']), 'toi', 'Có dạy → Lớp tôi dạy');
    eq(d.phamViMacDinh(['chi-nhanh', 'tat-ca']), 'tat-ca', 'Quản trị → Tất cả');
    eq(d.phamViMacDinh(['chi-nhanh']), 'chi-nhanh', 'QL một chi nhánh');
    eq(d.PHAM_VI_NHAN, { toi: 'Lớp tôi dạy', 'chi-nhanh': 'Chi nhánh', 'tat-ca': 'Tất cả' }, 'Nhãn');
  });

  check('PR-Qa · §3.6 Kết quả gần nhất FT: Overall to + "Thiếu x" + chip SOS; dòng phụ đợt · kỳ vọng · kỹ năng thiếu', () => {
    const ft = { mode: 'ielts_band', attemptLabel: 'MT2', sosLevel: 1, provisional: false, scored: 4, required: 4, failed: null,
      overall: 6.0, expectation: 6.5, belowSkills: [{ skill: 'listening', band: 5.5 }], failedSkills: [] };
    eq(d.ketQuaGanNhat(ft), { chinh: '6.0', thieu: 'Thiếu 0.5', dat: false, sos: 'SOS 1', phu: 'MT2 · kỳ vọng 6.5 · Thiếu L 5.5' }, 'Đủ điểm');
    eq(d.ketQuaGanNhat({ ...ft, overall: null, scored: 2, sosLevel: 2, provisional: true,
      belowSkills: [{ skill: 'writing', band: 5.5 }, { skill: 'speaking', band: 6.0 }] }),
      { chinh: '—', thieu: null, dat: false, sos: 'SOS 2 · tạm thời', phu: 'MT2 · kỳ vọng 6.5 · mới có 2/4 kỹ năng · Thiếu W 5.5, S 6.0' }, 'Tạm thời');
    eq(d.ketQuaGanNhat({ ...ft, overall: 6.5, expectation: 6.0, sosLevel: 0, belowSkills: [] }),
      { chinh: '6.5', thieu: null, dat: true, sos: null, phu: 'MT2 · kỳ vọng 6.0' }, 'Đạt: chỉ ✓ nhỏ');
    eq(d.ketQuaGanNhat(null), { chinh: '—', thieu: null, dat: false, sos: null, phu: 'Chưa có kết quả' }, 'Chưa thi');
  });

  check('PR-Qa · §2/§3.6 Kết quả gần nhất lớp thường: "Đạt 3/4 môn", không "kỳ vọng", không "MT"', () => {
    const th = { mode: 'ratio', attemptLabel: 'Giữa khoá', sosLevel: 1, provisional: false, scored: 4, required: 4, failed: 1,
      overall: null, expectation: null, belowSkills: [], failedSkills: [{ skill: 'writing', score: 12, total: 20 }] };
    const k = d.ketQuaGanNhat(th);
    eq(k, { chinh: 'Đạt 3/4 môn', thieu: null, dat: false, sos: 'SOS 1', phu: 'Giữa khoá · chưa đạt W 12/20' }, 'Đủ điểm');
    eq(d.ketQuaGanNhat({ ...th, attemptLabel: 'Cuối khoá', scored: 2, failed: 0, sosLevel: null, failedSkills: [] }),
      { chinh: 'Đạt 2/2 môn đã chấm', thieu: null, dat: false, sos: null, phu: 'Cuối khoá · còn 2 môn chưa có điểm' }, 'Còn thiếu môn');
    eq(d.ketQuaGanNhat({ ...th, sosLevel: 0, failed: 0, failedSkills: [] }).dat, true, 'Đạt đủ bốn môn');
    assert(!/kỳ vọng|MT\d|Overall|Normal/.test(JSON.stringify(k)), `Chữ FT lọt vào lớp thường: ${JSON.stringify(k)}`);
  });

  check('PR-Qa · §3.6 cột Khoá lớp thường "FOU · W8/8" + "kết thúc W4 SEP"; "tiếp theo: …" chỉ khi đã ghi', () => {
    const k = { maChuongTrinh: 'FOU', tuanHienTai: 8, tongTuan: 8, tuanKetThuc: '2026-09-21', tiepTheo: null, homNay: '2026-09-14' };
    eq(d.khoaLopThuong(k), { chinh: 'FOU · W8/8', phu: 'kết thúc W4 SEP' }, 'Tuần cuối');
    eq(d.khoaLopThuong({ ...k, tuanHienTai: 10 }).chinh, 'FOU · W8/8', 'Quá số tuần vẫn ghi W8/8');
    eq(d.khoaLopThuong({ ...k, tuanHienTai: 0 }).chinh, 'FOU · chưa khai giảng', 'Chưa khai giảng');
    eq(d.khoaLopThuong({ ...k, tiepTheo: 'Fast Track' }).phu, 'tiếp theo: Fast Track', 'Đã ghi lộ trình tiếp theo (PR-LT)');
  });

  check('PR-Qa · Q7 hộp lớp: tối đa 2 badge theo thứ tự ưu tiên, phần còn lại gom "+n"', () => {
    const b = d.badgeLop({ needsPlacement: true, studentCount: 4, missingSkills: ['writing'], needScoresText: 'Lớp còn 3 bài chưa nhập điểm',
      soCaseMo: 2, phase: 'final_week', missingCount: 1 });
    eq(b.hien.map((x: any) => x.nhan), ['Hết khoá · 4 HV cần xếp lớp tiếp', 'Thiếu GV W'], 'Hai badge đầu');
    eq(b.an.map((x: any) => x.key), ['cham', 'case', 'chang', 'thieu-tt'], 'Phần gom');
    const c = d.badgeLop({ needsPlacement: false, studentCount: 8, missingSkills: [], needScoresText: null, soCaseMo: 6, phase: 'running', missingCount: 0 });
    eq(c.hien, [{ key: 'case', nhan: '6 Case đang mở', tone: 'danger' }], 'Chỉ Case');
    assert(!/Progress|Final/.test(Object.values(d.CLASS_PHASE_LABEL).join(' ')), 'CLASS_PHASE_LABEL còn Progress/Final');
    eq(d.CLASS_PHASE_LABEL.progress_week, 'Thi Giữa khoá tuần này', 'Chữ chặng thi');
  });

  check('PR-Qa · §3.7 dòng GV bộ môn gom theo người ("L · R Trần Ngọc Hà"), kỹ năng thiếu người ghi "Chưa phân công"', () => {
    const n = d.nhomGiaoVienBoMon(['listening', 'reading', 'writing1', 'writing2', 'speaking'], [
      { skill: 'listening', id: 7, name: 'Trần Ngọc Hà' }, { skill: 'reading', id: 7, name: 'Trần Ngọc Hà' },
      { skill: 'writing1', id: 8, name: 'Lê Minh Khoa' }, { skill: 'speaking', id: 9, name: 'Phạm Thu Trang' }]);
    eq(n.map((g: any) => `${g.nhan}|${g.ten}|${g.id}`), ['L · R|Trần Ngọc Hà|7', 'W1|Lê Minh Khoa|8', 'W2|Chưa phân công|null', 'S|Phạm Thu Trang|9'], 'Nhóm');
    eq(n[0].title, 'Listening · Reading', 'Tooltip tên đầy đủ (G-7)');
  });

  check('PR-Qa · Q1 menu ⋯ dòng học viên: Lộ trình tiếp theo và Chuyển lớp ẩn tới PR-LT', () => {
    const q = { laLopThuong: true, dangHoc: true, coTheGhiViPham: true, coTheBaoCase: true, coTheNhapDiem: true, coTheSuaHocVien: true, coTheChuyenLop: true };
    eq(d.mucMenuDongHocVien(q), ['ho-so', 'vi-pham', 'case', 'nhap-diem'], 'Mặc định');
    eq(d.MENU_DONG_CHO_PR_LT, { loTrinhTiepTheo: false, chuyenLop: false }, 'Hằng PR-LT bật');
    eq(d.mucMenuDongHocVien(q, { loTrinhTiepTheo: true, chuyenLop: true }), ['ho-so', 'vi-pham', 'case', 'nhap-diem', 'lo-trinh-tiep', 'chuyen-lop'], 'PR-LT bật');
    eq(d.mucMenuDongHocVien({ ...q, laLopThuong: false }, { loTrinhTiepTheo: true, chuyenLop: true }).includes('lo-trinh-tiep'), false, 'FT không có Lộ trình tiếp theo');
    eq(d.mucMenuDongHocVien({ ...q, dangHoc: false }), ['ho-so'], 'Em đã kết thúc: chỉ Hồ sơ');
    eq(d.mucMenuDongHocVien({ ...q, coTheGhiViPham: false, coTheNhapDiem: false }), ['ho-so', 'case'], 'Theo quyền');
    eq(d.MUC_MENU_DONG_NHAN['vi-pham'], '+ Ghi nhận vi phạm', 'Chữ');
  });

  check('PR-Qa · §3.6 xếp A→Z hoặc "Cần chú ý trước"; lớp mở sẵn', () => {
    const r = [
      { ten: 'Nguyễn Minh An', quaHan: false, canhBao: false, sosLevel: 0, soCaseMo: 0 },
      { ten: 'Bùi Thảo Vy', quaHan: false, canhBao: false, sosLevel: 2, soCaseMo: 1 },
      { ten: 'Đỗ Minh Khôi', quaHan: true, canhBao: false, sosLevel: 1, soCaseMo: 2 },
    ];
    eq(d.sapXepHocVien(r, 'ten').map((x: any) => x.ten), ['Bùi Thảo Vy', 'Đỗ Minh Khôi', 'Nguyễn Minh An'], 'A→Z tiếng Việt');
    eq(d.sapXepHocVien(r, 'chu-y').map((x: any) => x.ten), ['Đỗ Minh Khôi', 'Bùi Thảo Vy', 'Nguyễn Minh An'], 'Quá hạn trước, rồi mức SOS');
    eq(d.lopMoSan({ thamSoOpen: null, lopHien: [3, 5, 7], dangLoc: false }), [3], 'Mở lớp đầu tiên');
    eq(d.lopMoSan({ thamSoOpen: null, lopHien: [3, 5, 7], dangLoc: true }), [3, 5, 7], 'Đang lọc: mở các lớp còn hiện');
    eq(d.lopMoSan({ thamSoOpen: [], lopHien: [3, 5], dangLoc: false }), [], 'Người dùng đã đóng hết');
    eq(d.lopMoSan({ thamSoOpen: [5, 9], lopHien: [3, 5], dangLoc: false }), [5], 'Theo URL, bỏ lớp không còn hiện');
  });

  check('PR-Qa · Q13 việc tiếp theo: nhập điểm + việc của Case, quá hạn lên đầu, chữ hạn trùng <Han>', () => {
    const v = d.viecTiepTheoCua({
      nhapDiem: { kyNang: ['listening', 'writing'], dot: 'Giữa khoá', quaHan: false },
      cases: [
        { id: 1, topic: 'writing2', state: 'no_plan', nextDue: null, dueOverdue: false },
        { id: 2, topic: 'listening', state: 'working', nextDue: '2026-09-13', dueOverdue: true },
        { id: 3, topic: 'reading', state: 'working', nextDue: '2026-09-20', dueOverdue: false },
        { id: 4, topic: 'speaking', state: 'working', nextDue: null, dueOverdue: false },
      ],
      homNay: '2026-09-14',
    });
    eq(v, [
      { nhan: 'L · Cập nhật kết quả · trước CN 13/09 · quá hạn', tone: 'danger' },
      { nhan: 'Nhập điểm L, W · Giữa khoá', tone: 'warn' },
      { nhan: 'Xác định nguyên nhân W2', tone: 'warn' },
      { nhan: 'R · Cập nhật kết quả · trước CN 20/09', tone: 'info' },
    ], 'Thứ tự và chữ');
    eq(d.chonCaseChinh([
      { id: 5, topic: 'reading', state: 'working', nextDue: null, dueOverdue: false, sosLevel: 3 },
      { id: 6, topic: 'listening', state: 'no_plan', nextDue: null, dueOverdue: false, sosLevel: 1 },
      { id: 7, topic: 'speaking', state: 'done', nextDue: null, dueOverdue: true, sosLevel: 3 },
    ]).id, 6, 'Case chưa có PA học thuật trước Case đang chạy; Case đã xong không tính');
  });

  check('PR-Qa · Q2 tên GV chưa là link khi chưa có trang hồ sơ GV; GV chỉ xem được hồ sơ của chính mình', () => {
    eq(d.CO_TRANG_HO_SO_GIAO_VIEN, false, 'PR-GV bật');
    eq(d.duongHoSoGiaoVien(7, { userId: 1, laQuanLy: true }), null, 'Chưa có trang → không link');
    eq(d.duongHoSoGiaoVien(7, { userId: 1, laQuanLy: true }, true), '/giao-vien/7', 'QL');
    eq(d.duongHoSoGiaoVien(7, { userId: 9, laQuanLy: false }, true), null, 'GV xem đồng nghiệp');
    eq(d.duongHoSoGiaoVien(9, { userId: 9, laQuanLy: false }, true), '/giao-vien/9', 'GV xem chính mình');
    eq(d.laVaiQuanLy(['teacher']), false, 'GV');
    eq(d.laVaiQuanLy(['manager']), true, 'QL');
  });

  check('PR-Qa · Q4 hồ sơ lớp 3 tab, không còn tab Giáo viên; mã học viên 6 số; dòng phụ ≤ 60 ký tự', () => {
    eq(d.TAB_HO_SO_LOP.map((k: string) => d.TAB_HO_SO_LOP_NHAN[k]), ['Học viên', 'Ý thức & Phối hợp', 'Phân tích lớp'], 'Tab');
    eq(d.tabHoSoLop('giao-vien'), 'hoc-vien', 'Link cũ tab Giáo viên về tab Học viên');
    eq(d.tabHoSoLop('phan-tich'), 'phan-tich', 'Tab Phân tích lớp');
    eq(d.maHocVienNgan('PISA-000011'), '000011', 'Mã có tiền tố');
    eq(d.maHocVienNgan('PISA-QA-3'), '000003', 'Đệm đủ 6 số');
    eq(d.catDongPhu('x'.repeat(70)).length, 60, 'G-3');
  });

  // ------------------------------------------------------------------ helper dữ liệu riêng của PR-Qa

  const NOW = new Date().toISOString();
  const MB = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  let soThuTu = 0;
  const taoLop = (code: string, kind: 'FT' | 'FOU'): number =>
    (intake.createClass(P.admin, { code, branchId: MB, kind, isFastTrack: kind === 'FT', startDate: '2026-08-03' }) as any).id as number;
  function taoHocVien(o: { cid: number; ft: boolean; target?: number; ten?: string }): { sid: number; cycleId: number } {
    soThuTu += 1;
    const tag = `QA-${soThuTu}`;
    const ten = o.ten ?? `Hoc vien ${tag}`;
    const sid = Number(conn.prepare(
      `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
    ).run(`PISA-${tag}`, ten, ten.toLowerCase(), MB, NOW).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-08-03', ?)`)
      .run(sid, o.cid, NOW);
    const cycleId = Number(conn.prepare(
      `INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at)
       VALUES (?, 1, ?, ?, ?, '2026-08-03', 'active', ?)`,
    ).run(sid, o.ft ? 'LT1' : null, o.ft ? null : 'FOU', o.target ?? null, NOW).lastInsertRowid);
    return { sid, cycleId };
  }
  function themLuot(o: { sid: number; cid: number; cycleId: number; no: number; kind: 'mock' | 'progress' | 'final'; weekStart: string }): number {
    const periodId = week.ensurePeriod(o.weekStart).id;
    const id = Number(conn.prepare(
      `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at)
       VALUES (?,?,?,?,?,?, 'planned', ?)`,
    ).run(o.cycleId, o.sid, o.no, o.kind, o.cid, periodId, NOW).lastInsertRowid);
    skillSchedule.ensureSkillRows(id);
    return id;
  }
  const bandFT = (attemptId: number, bands: Record<string, number>) => {
    for (const [k, b] of Object.entries(bands)) {
      conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, entered_by, entered_at) VALUES (?,?,?,?,?)`)
        .run(attemptId, k, b, P.admin.userId, NOW);
    }
  };
  const diemThuong = (attemptId: number, diem: Record<string, [number, number]>) => {
    for (const [k, [s, tong]] of Object.entries(diem)) {
      conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, entered_by, entered_at) VALUES (?,?,?,?,?,?)`)
        .run(attemptId, k, s, tong, P.admin.userId, NOW);
    }
  };
  const LOP_FT = taoLop('MB-FT QA1', 'FT');
  const LOP_THUONG = taoLop('MB-FOU QA1', 'FOU');

  // ------------------------------------------------------------------ Task 4 · Standing

  check('PR-Qa · §3.6 FT: standingFor trả Overall, kỳ vọng CỦA ĐỢT ĐÓ và kỹ năng dưới kỳ vọng', () => {
    const a = taoHocVien({ cid: LOP_FT, ft: true, target: 6.5 });
    const at = themLuot({ ...a, cid: LOP_FT, no: 2, kind: 'mock', weekStart: '2026-09-07' });
    bandFT(at, { listening: 5.0, reading: 6.0, writing1: 6.0, writing2: 6.0, speaking: 6.0 });
    const s = standingMod.standingFor([a.sid]).get(a.sid);
    eq([s.expectation, s.overall], [6, 6], 'MT2: kỳ vọng 6.5 − 0.5; Overall (5+6+6+6)/4 = 5.75 → 6.0');
    eq(s.belowSkills, [{ skill: 'listening', band: 5 }], 'Chỉ L dưới kỳ vọng');
    eq(s.failedSkills, [], 'FT không có môn đúng/tổng');
    eq(d.ketQuaGanNhat(s), { chinh: '6.0', thieu: null, dat: false, sos: 'SOS 1', phu: 'MT2 · kỳ vọng 6.0 · Thiếu L 5.0' }, 'Chữ cột');
  });

  check('PR-Qa · §3.6 lớp thường: standingFor trả môn chưa đạt kèm đúng/tổng', () => {
    const b = taoHocVien({ cid: LOP_THUONG, ft: false });
    const at = themLuot({ ...b, cid: LOP_THUONG, no: 1, kind: 'progress', weekStart: '2026-09-07' });
    diemThuong(at, { listening: [30, 40], reading: [32, 40], writing: [12, 20], speaking: [8, 10] });
    const s = standingMod.standingFor([b.sid]).get(b.sid);
    eq(s.failedSkills, [{ skill: 'writing', score: 12, total: 20 }], 'W 12/20 = 60% < 70%');
    eq([s.overall, s.expectation, s.belowSkills], [null, null, []], 'Lớp thường không có Overall/kỳ vọng');
    eq(d.ketQuaGanNhat(s), { chinh: 'Đạt 3/4 môn', thieu: null, dat: false, sos: 'SOS 1', phu: 'Giữa khoá · chưa đạt W 12/20' }, 'Chữ cột');
  });

  // ------------------------------------------------------------------ Task 5 · GET /hoc-vien-lop

  check('PR-Qa · Q3/Q12 Phạm vi theo vai: GV "Lớp tôi dạy", QL chi nhánh, Quản trị "Tất cả"; link cũ ?branchId= = một chi nhánh', () => {
    const gv = hvl.danhSachHocVienLop(P.subjectTeacher, {});
    assert(gv.phamVi.dangDung === 'toi' && !gv.phamVi.coThe.includes('tat-ca'), `GV: ${JSON.stringify(gv.phamVi)}`);
    const cuaGv = new Set(P.subjectTeacher.assignments.map((a: any) => a.classId));
    assert(gv.rows.length > 0 && gv.rows.every((r: any) => cuaGv.has(r.id)), 'GV chỉ thấy lớp mình dạy');
    const ql = hvl.danhSachHocVienLop(P.mbManager, {});
    assert(ql.phamVi.dangDung === (ql.phamVi.coThe.includes('toi') ? 'toi' : 'chi-nhanh'), `QL: ${JSON.stringify(ql.phamVi)}`);
    const qlCn = hvl.danhSachHocVienLop(P.mbManager, { phamVi: 'chi-nhanh' });
    assert(qlCn.rows.every((r: any) => r.branchId === MB), 'QL MB chỉ thấy lớp MB');
    const qt = hvl.danhSachHocVienLop(P.admin, {});
    assert(qt.phamVi.dangDung === 'tat-ca' && qt.phamVi.coThe.includes('chi-nhanh'), `Quản trị: ${JSON.stringify(qt.phamVi)}`);
    const cu = hvl.danhSachHocVienLop(P.admin, { branchId: MB });
    assert(cu.phamVi.dangDung === 'chi-nhanh' && cu.phamVi.chiNhanh === MB && cu.rows.every((r: any) => r.branchId === MB),
      'Có branchId mà không ghi phạm vi = xem chi nhánh đó');
    const la = hvl.danhSachHocVienLop(P.subjectTeacher, { phamVi: 'tat-ca' });
    eq(la.phamVi.dangDung, 'toi', 'Phạm vi không có quyền thì về mặc định');
  });

  check('PR-Qa · Q4 số đếm chip = số học viên mang cờ đó; khớp hàng đợi Case và mức SOS của máy chủ', () => {
    const r = hvl.danhSachHocVienLop(P.admin, {});
    eq(r.dem['tat-ca'], r.hocVien.length, 'Tất cả');
    for (const k of d.LOC_HOC_VIEN) eq(r.dem[k], r.hocVien.filter((h: any) => h.loc.includes(k)).length, `Chip ${k}`);
    const ids = new Set(r.hocVien.map((h: any) => h.id));
    const quaHan = new Set(casesMod.listCases(P.admin, { queue: 'due' }).rows.filter((c: any) => ids.has(c.studentId)).map((c: any) => c.studentId));
    eq(r.dem.case_overdue, quaHan.size, 'Case quá hạn cập nhật = hàng đợi due');
    const sos = [...standingMod.standingFor([...ids]).values()].filter((s: any) => (s.sosLevel ?? 0) > 0).length;
    eq(r.dem.sos, sos, 'Đang SOS = standing');
    assert(r.dem.sos > 0 && r.dem.thieu_tt >= 0, 'Bộ demo có em đang SOS');
  });

  check('PR-Qa · Q1/Q3 tìm theo tên học viên: chỉ em khớp; tìm theo mã lớp: cả lớp', () => {
    const e = taoHocVien({ cid: LOP_FT, ft: true, ten: 'Qa Tim Kiem Duy Nhat' });
    const r = hvl.danhSachHocVienLop(P.admin, { q: 'Tim Kiem Duy Nhat' });
    assert(r.rows.some((x: any) => x.id === LOP_FT), 'Lớp chứa em phải hiện');
    eq(r.hocVien.map((h: any) => h.id), [e.sid], 'Chỉ em khớp được đếm');
    const c = hvl.danhSachHocVienLop(P.admin, { q: 'MB-FT QA1' });
    const soEm = (conn.prepare(`SELECT COUNT(*) AS n FROM enrollments WHERE class_id = ? AND status = 'active'`).get(LOP_FT) as any).n;
    assert(c.rows.length === 1 && c.hocVien.length === soEm, `Tìm mã lớp: ${c.rows.length} lớp, ${c.hocVien.length}/${soEm} em`);
  });

  check('PR-Qa · Q2/Q5 "n Case đang mở" của lớp = tổng cột Case của danh sách lớp; cờ nút theo quyền', () => {
    const r = hvl.danhSachHocVienLop(P.admin, {});
    for (const lop of r.rows.filter((x: any) => x.code === 'MB-FT 101' || x.code === 'MB-FOU 12')) {
      const tong = classes.classRoster(P.admin, lop.id).filter((s: any) => !s.archived).reduce((n: number, s: any) => n + s.openCases, 0);
      eq(lop.soCaseMo, tong, `${lop.code}: hộp lớp và danh sách`);
      assert(lop.gvcn && lop.gvcn.name, `${lop.code} thiếu GVCN`);
    }
    const s = hvl.danhSachHocVienLop(P.sTeacher, {}).rows.find((x: any) => x.code === 'MB-FT 101');
    assert(s && s.viewer.coTheGhiViPham && s.viewer.coTheNhapDiem && !s.viewer.coTheSuaHocVien, `GV Speaking: ${JSON.stringify(s?.viewer)}`);
    const g = hvl.danhSachHocVienLop(P.coreTeacher, {}).rows.find((x: any) => x.code === 'MB-FT 101');
    assert(g && g.viewer.coTheSuaHocVien, 'GVCN sửa được học viên lớp mình');
    const fou = r.rows.find((x: any) => x.code === 'MB-FOU 12');
    assert(fou && fou.tuanKetThuc && /^\d{4}-\d{2}-\d{2}$/.test(fou.tuanKetThuc), 'Lớp thường có tuần kết thúc khoá');
  });

  // ------------------------------------------------------------------ Task 6 · dòng học viên, hồ sơ lớp

  check('PR-Qa · YT-8 nhãn cảnh báo 5 ngày ở dòng học viên — cùng dữ liệu với tab Ý thức của lớp', () => {
    const ft = classId('MB-FT 101');
    const e = taoHocVien({ cid: ft, ft: true, target: 6.5 });
    violations.recordViolation(P.coreTeacher, {
      studentId: e.sid, category: 'homework', description: 'Không làm bài tập về nhà (phép kiểm PR-Qa)', occurredOn: addDays(TODAY, -7),
    });
    const roster = classes.classRoster(P.coreTeacher, ft);
    const row = roster.find((s: any) => s.id === e.sid);
    assert(row?.canhBaoYThuc?.count === 1 && row.canhBaoYThuc.oldestAgeDays === 7, `Nhãn: ${JSON.stringify(row?.canhBaoYThuc)}`);
    eq(roster.filter((s: any) => s.canhBaoYThuc).length, warn.classWarning(P.coreTeacher, ft).activeCount, 'Khớp tab Ý thức');
  });

  check('PR-Qa · Q13 Việc tiếp theo ở dòng học viên: nhập điểm quá hạn (đỏ) lên đầu; lớp thường mang tuần thi từng môn', () => {
    const b = taoHocVien({ cid: LOP_THUONG, ft: false });
    const at = themLuot({ ...b, cid: LOP_THUONG, no: 1, kind: 'progress', weekStart: '2026-09-07' });
    diemThuong(at, { listening: [30, 40], reading: [32, 40], speaking: [8, 10] });
    const row = classes.classRoster(P.admin, LOP_THUONG).find((s: any) => s.id === b.sid);
    eq(row.viecTiepTheo[0], { nhan: 'Nhập điểm W · Giữa khoá', tone: 'danger' }, 'Writing tuần 07/09 chưa có điểm, hạn CN 13/09 đã qua');
    const t = row.timeline.find((x: any) => x.kind === 'progress');
    eq(t.tuanMon.writing, '2026-09-07', 'Tuần thi của môn Writing');
    assert(row.viecTiepTheo.every((v: any) => !/MT\d|kỳ vọng/.test(v.nhan)), 'Chữ FT lọt vào lớp thường');
  });

  check('PR-Qa · Q4/K2-6a hồ sơ lớp: cờ nút theo quyền, số Case đang mở, cảnh báo Ý thức của tab', () => {
    const ft = classId('MB-FT 101');
    const g = classes.classOverview(P.coreTeacher, ft);
    assert(g.viewer.canRecordViolation && g.viewer.canReportCase && g.viewer.canEnterScores, `GVCN: ${JSON.stringify(g.viewer)}`);
    const s = classes.classOverview(P.sTeacher, ft);
    assert(s.viewer.canRecordViolation && !s.viewer.canEditProgress && !s.viewer.canAssign, `GV Speaking: ${JSON.stringify(s.viewer)}`);
    const tong = classes.classRoster(P.admin, ft).filter((x: any) => !x.archived).reduce((n: number, x: any) => n + x.openCases, 0);
    eq(classes.classOverview(P.admin, ft).soCaseMo, tong, 'Số Case đang mở = tổng cột Case');
    eq(g.canhBaoYThuc, warn.classWarning(P.coreTeacher, ft).activeCount, 'Cảnh báo tab Ý thức');
  });

  // ------------------------------------------------------------------ Task 7 · Phân tích lớp

  check('PR-Qa · §3.7 Phân tích lớp FT: 5 kỹ năng × MT1…MT5, ô = số HV đạt kỳ vọng của đợt / số HV có điểm', () => {
    const cid = taoLop('MB-FT QA3', 'FT');
    const a = taoHocVien({ cid, ft: true, target: 6.5 });
    const b = taoHocVien({ cid, ft: true, target: 6.5 });
    bandFT(themLuot({ ...a, cid, no: 2, kind: 'mock', weekStart: '2026-09-07' }), { listening: 5.0, reading: 6.0 });
    bandFT(themLuot({ ...b, cid, no: 2, kind: 'mock', weekStart: '2026-09-07' }), { listening: 6.5, reading: 5.5 });
    const r = ptl.phanTichLop(P.admin, cid);
    eq([r.loai, r.dong.map((x: any) => x.nhan).join(' '), r.cot.map((x: any) => x.nhan).join(' ')],
      ['ft', 'L R W1 W2 S', 'MT1 MT2 MT3 MT4 MT5'], 'Khung');
    eq(r.o['listening|mt2'], { dat: 1, tong: 2 }, 'L MT2 (kỳ vọng 6.0)');
    eq(r.o['reading|mt2'], { dat: 1, tong: 2 }, 'R MT2');
    eq(r.o['listening|mt1'] ?? null, null, 'Đợt chưa có điểm');
    eq(r.soHocVien, 2, 'Sĩ số');
    assertThrows(() => ptl.phanTichLop(P.subjectTeacher, cid), /phạm vi/, 'GV không dạy lớp này');
  });

  check('PR-Qa · §3.7 Phân tích lớp thường: 4 môn × Giữa khoá / Cuối khoá, ô = n/N HV đạt (từ 70%)', () => {
    const cid = taoLop('MB-FOU QA3', 'FOU');
    const a = taoHocVien({ cid, ft: false });
    const b = taoHocVien({ cid, ft: false });
    diemThuong(themLuot({ ...a, cid, no: 1, kind: 'progress', weekStart: '2026-09-07' }), { writing: [12, 20], listening: [30, 40] });
    diemThuong(themLuot({ ...b, cid, no: 1, kind: 'progress', weekStart: '2026-09-07' }), { writing: [15, 20] });
    const r = ptl.phanTichLop(P.admin, cid);
    eq([r.loai, r.dong.map((x: any) => x.nhan).join(' '), r.cot.map((x: any) => x.nhan).join(' ')],
      ['thuong', 'L R W S', 'Giữa khoá Cuối khoá'], 'Khung');
    eq(r.o['writing|progress'], { dat: 1, tong: 2 }, 'W Giữa khoá');
    eq(r.o['listening|progress'], { dat: 1, tong: 1 }, 'L Giữa khoá');
    assert(!/MT\d|kỳ vọng|Progress|Final/.test(JSON.stringify(r)), 'Chữ FT lọt vào lớp thường');
  });

  // ------------------------------------------------------------------ Task 8 · Sửa thông tin lớp

  check('PR-Qa · Q8 Sửa thông tin lớp: mã có tiền tố chi nhánh, không trùng; chỉ người có quyền sửa lớp; có nhật ký', () => {
    const cid = taoLop('MB-FT QA4', 'FT');
    assertThrows(() => ttl.capNhatThongTinLop(P.sTeacher, cid, { code: 'MB-FT QA4B' }), /quyền/, 'GV bộ môn');
    assertThrows(() => ttl.capNhatThongTinLop(P.admin, cid, { code: 'FT QA4B' }), /bắt đầu bằng "MB-"/, 'Thiếu tiền tố');
    assertThrows(() => ttl.capNhatThongTinLop(P.admin, cid, { code: 'MB-FT 101' }), /Đã có lớp/, 'Trùng mã');
    assertThrows(() => ttl.capNhatThongTinLop(P.admin, cid, { route: 'LT9' }), /LT1 hoặc LT2/, 'LT lạ');
    const r = ttl.capNhatThongTinLop(P.admin, cid, { code: 'MB-FT QA4B', route: 'LT2', note: 'Lớp tối' });
    eq([r.code, r.route, r.note], ['MB-FT QA4B', 'LT2', 'Lớp tối'], 'Đã lưu');
    const log = conn.prepare(`SELECT before_json, after_json FROM audit_logs WHERE action = 'class.info' AND entity_id = ? ORDER BY id DESC LIMIT 1`).get(cid) as any;
    assert(log && /MB-FT QA4"/.test(log.before_json) && /MB-FT QA4B/.test(log.after_json), `Nhật ký: ${JSON.stringify(log)}`);
  });

  check('PR-Qa · Q8 đổi chương trình chỉ khi lớp chưa có học viên và chưa có bài Test; kỹ năng lớp theo chương trình mới', () => {
    const rong = taoLop('MB-FT QA5', 'FT');
    ttl.capNhatThongTinLop(P.admin, rong, { programmeCode: 'FOU' });
    const c = conn.prepare('SELECT programme_code, is_fast_track, route FROM classes WHERE id = ?').get(rong) as any;
    const ks = (conn.prepare('SELECT skill FROM class_skills WHERE class_id = ? ORDER BY skill').all(rong) as any[]).map((x) => x.skill).join(',');
    eq([c.programme_code, c.is_fast_track, c.route, ks], ['FOU', 0, null, 'listening,reading,speaking,writing'], 'Lớp trống đổi được');
    assertThrows(() => ttl.capNhatThongTinLop(P.admin, rong, { route: 'LT1' }), /Fast Track/, 'Lớp thường không có LT');
    const coEm = taoLop('MB-FT QA6', 'FT');
    taoHocVien({ cid: coEm, ft: true });
    assertThrows(() => ttl.capNhatThongTinLop(P.admin, coEm, { programmeCode: 'FOU' }), /đã có học viên/, 'Lớp có học viên');
  });

  check('PR-Qa · Q8 đổi chương trình: phân công kỹ năng KHÔNG còn ở chương trình mới bị KẾT THÚC (không xoá); phân công vẫn khớp thì giữ nguyên', () => {
    const cid = taoLop('MB-FT QA7', 'FT');
    // writing1 chỉ có ở FT, không có ở FOU (REGULAR_SKILLS = listening/reading/writing/speaking) → phải bị kết thúc.
    const idMat = Number(conn.prepare(
      `INSERT INTO teacher_assignments (class_id, user_id, skill, is_core, status, effective_from, created_at) VALUES (?, ?, 'writing1', 0, 'active', '2026-08-03', ?)`,
    ).run(cid, P.sTeacher.userId, NOW).lastInsertRowid);
    // listening có ở cả FT lẫn FOU → vẫn còn khớp, không được đụng tới.
    const idConKhop = Number(conn.prepare(
      `INSERT INTO teacher_assignments (class_id, user_id, skill, is_core, status, effective_from, created_at) VALUES (?, ?, 'listening', 1, 'active', '2026-08-03', ?)`,
    ).run(cid, P.coreTeacher.userId, NOW).lastInsertRowid);
    ttl.capNhatThongTinLop(P.admin, cid, { programmeCode: 'FOU' });
    const mat = conn.prepare('SELECT status, effective_to FROM teacher_assignments WHERE id = ?').get(idMat) as any;
    eq([mat?.status, mat?.effective_to], ['ended', TODAY], 'writing1 kết thúc đúng ngày, KHÔNG bị xoá (dòng vẫn còn)');
    const conKhop = conn.prepare('SELECT status, effective_to FROM teacher_assignments WHERE id = ?').get(idConKhop) as any;
    eq([conKhop?.status, conKhop?.effective_to], ['active', null], 'listening vẫn khớp chương trình mới nên giữ nguyên active');
  });
}
