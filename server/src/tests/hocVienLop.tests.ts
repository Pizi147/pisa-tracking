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
}
