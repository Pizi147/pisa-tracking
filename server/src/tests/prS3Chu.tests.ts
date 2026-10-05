/**
 * PHÉP KIỂM PR-S3 — chữ cuối trên web (kế hoạch 2026-10-02-pr-s3-chu-cuoi; nhãn [S3]).
 * Nguồn chữ: thiet-ke/THUAT_NGU_2026-10-01.md (cột "Sửa thành") + mục "Đã chốt" của kế hoạch.
 * Chỉ quét CHỮ HIỂN THỊ trong code (bỏ chú thích, bỏ tests, bỏ dữ liệu kể chuyện của bộ demo) — không quét tên bảng/cột/enum.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
// dist-server/server/src/tests → gốc repo.

/** Dữ liệu kể chuyện của bộ demo, không phải chữ giao diện — trừ `seed.ts` (in ra màn hình lệnh) và `duLieuNen.ts` (dữ liệu nền bản chính). */
const LOAI_TRU = (f: string) => f.startsWith('server/src/seed/') && f !== 'server/src/seed/seed.ts' && f !== 'server/src/seed/duLieuNen.ts';

function boChuThich(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ''))
    .replace(/(^|[^:\\])\/\/.*$/gm, '$1');
}

const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  if (e.isDirectory()) return e.name === 'tests' || e.name === 'node_modules' ? [] : walk(p);
  return /\.(ts|tsx|mjs)$/.test(e.name) ? [p] : [];
});

let cacheNguon: Array<{ f: string; dong: string[] }> | null = null;
/** Mọi tệp nguồn (đã bỏ chú thích), mỗi tệp là mảng dòng — đọc một lần cho cả file kiểm. */
function nguon() {
  if (cacheNguon) return cacheNguon;
  cacheNguon = ['web/src', 'shared', 'server/src', 'scripts'].flatMap((d) => walk(path.join(ROOT, d)))
    .map((f) => path.relative(ROOT, f).replace(/\\/g, '/'))
    .filter((f) => !LOAI_TRU(f))
    .map((f) => ({ f, dong: boChuThich(fs.readFileSync(path.join(ROOT, f), 'utf8')).split('\n') }));
  return cacheNguon;
}

/**
 * Quét một nhóm chữ cũ. `choPhep`: [đường dẫn (hoặc tiền tố), chuỗi con của dòng] cho chỗ cố ý giữ (chữ khác nghĩa,
 * hằng so khớp). Trả về danh sách vị trí còn sót.
 */
export function quetChuCu(chuCu: Array<[string, RegExp]>, choPhep: Array<[string, string]> = []): string[] {
  const hits: string[] = [];
  for (const { f, dong } of nguon()) {
    dong.forEach((line, i) => {
      if (choPhep.some(([pf, s]) => f.startsWith(pf) && line.includes(s))) return;
      for (const [ten, re] of chuCu) if (re.test(line)) hits.push(`${f}:${i + 1} "${ten}": ${line.trim().slice(0, 100)}`);
    });
  }
  return hits;
}

/** Nội dung nguyên văn một tệp (đã bỏ chú thích) — để khẳng định chữ MỚI có mặt đúng chỗ. */
export const docNguon = (rel: string) => boChuThich(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

export async function runPrS3ChuTests(t: YThucTestKit) {
  const { check, checkAsync, assert } = t;
  console.log('\nPR-S3 · Chữ cuối trên web');

  const khongCon = (ten: string, chuCu: Array<[string, RegExp]>, choPhep: Array<[string, string]> = []) =>
    check(ten, () => {
      assert(nguon().length > 150, `Quét quá ít tệp (${nguon().length}) — sai ROOT?`);
      const hits = quetChuCu(chuCu, choPhep);
      assert(hits.length === 0, `Còn ${hits.length} chỗ:\n    ${hits.join('\n    ')}`);
    });

  // ------------------------------------------------------------------ Task 0 · bảng thuật ngữ còn nguyên 147 dòng "Sửa thành"
  check('S3 (0) · THUAT_NGU_2026-10-01.md còn đủ 147 dòng có "Sửa thành" (nguồn để đối chiếu)', () => {
    const md = fs.readFileSync(path.join(ROOT, 'thiet-ke/THUAT_NGU_2026-10-01.md'), 'utf8');
    const n = md.split('\n').filter((l) => /^\| [A-G]-\d{3} \|/.test(l) && (l.split('|').slice(-2, -1)[0] ?? '').trim() !== '').length;
    assert(n === 147, `${n} dòng`);
  });
  // ------------------------------------------------------------------ Task 1 · điều hướng & tên trang (nhóm A)
  // `migrate.ts`: chữ đã lưu trong DB / nhật ký di cư (Q11) — giữ nguyên.
  khongCon('S3 (1) · Nhóm A: không còn "Lịch kiểm tra", "Khu Lưu trữ", "Quyền và nhật ký", "Tổng quan chấm điểm", "Lịch sử thay đổi/cập nhật/chỉnh sửa", "Hồ sơ đợt", "hồ sơ Mock", tên trang tính không dấu',
    [
      ['Lịch kiểm tra', /[Ll]ịch kiểm tra/],
      ['Khu Lưu trữ', /Khu Lưu trữ/],
      ['Quyền và nhật ký', /Quyền và nhật ký/],
      ['Tổng quan chấm điểm', /Tổng quan chấm điểm/],
      ['Lịch sử thay đổi', /[Ll]ịch sử (thay đổi|cập nhật|chỉnh sửa)/],
      ['Việc của tôi · hôm nay', /Việc của tôi · hôm nay/],
      ['Hồ sơ đợt', /[Hh]ồ sơ đợt/],
      ['hồ sơ Mock', /[Hh]ồ sơ Mock(?! Test)/],
      ['Xuất kết quả Mock Test', /Xuất kết quả Mock Test/],
      ['Kết quả kiểm tra', /Kết quả kiểm tra/],
      ['Việc học viên (tên tab)', /'Việc học viên'/],
      ['Tên trang tính không dấu', /'(Tong hop|HV can chu y|Lop nhieu vi pham|Xu ly theo loai)'/],
    ],
    [['server/src/migrate.ts', '']]);
  check('S3 (1) · Hồ sơ Mock Test là tên trang FT; lớp thường dùng "Bảng điểm đợt" (không có chữ Mock/MT); tab Hỗ trợ học viên', () => {
    assert(/Hồ sơ Mock Test ·/.test(docNguon('web/src/modules/fasttrack/MockDetailPage.tsx')), 'tiêu đề MockDetailPage');
    const sd = docNguon('web/src/modules/students/StudentDetailPage.tsx');
    // PR-U12: bỏ link riêng "Bảng điểm đợt ›" — ô Bài là liên kết; tên trang vẫn là "bảng điểm đợt" (gợi ý cột Bài)
    assert(!sd.includes('Bảng điểm đợt ›') && /mở bảng điểm đợt/.test(sd), 'link lớp thường');
    assert(/'ho-tro': 'Hỗ trợ học viên'/.test(docNguon('shared/domain/dieuHuong.ts')), 'TAB_CONG_VIEC_LABEL');
    assert(/'Tổng hợp'/.test(docNguon('web/src/modules/phanTich/TongHopTestSos.tsx')), 'Excel A-054');
  });

  // ------------------------------------------------------------------ Task 2 · khái niệm nghiệp vụ (nhóm B)
  // Chữ kỹ thuật (dòng lệnh, câu lệnh gõ ở máy dev) và chữ đã lưu trong DB / nhật ký di cư (Q11) được giữ.
  const KY_THUAT: Array<[string, string]> = [['scripts/', ''], ['server/src/ops/', ''], ['server/src/db.ts', ''], ['server/src/migrate', ''],
    ['web/src/modules/platform/WelcomePage.tsx', ''], ['web/src/modules/platform/DemoBar.tsx', '']];
  khongCon('S3 (2) · Chữ "lệnh" (chuyển lớp) đã thành "quyết định chuyển lớp" — chỉ còn "lệnh" kỹ thuật', [['lệnh', /[Ll]ệnh/]], KY_THUAT);
  khongCon('S3 (2) · Bảo lưu = Tạm dừng học (bảo lưu); "Dừng học" = "Dừng học hẳn"', [
    ['bảo lưu', /(?<!\()[Bb]ảo lưu/],
    ['Dừng học', /(?<![Tt]ạm )[Dd]ừng học(?! hẳn)/],
  ], KY_THUAT);
  khongCon('S3 (2) · Target: không còn "Mục tiêu", "Mục tiêu band", "Band target"', [['mục tiêu', /[Mm]ục tiêu|Band target/], ['target thường', /bằng target|đổi target|Sửa target|trùng target|có target|Điền target|' = target|MT = target|(, |· )target (?=[\d$])|\btarget <b>|(?<![A-Za-z_.$])target\.(?![A-Za-z])/]], KY_THUAT);
  khongCon('S3 (2) · Không còn "tín hiệu" / "Cần xác minh" (thành "Case chờ xác nhận nguyên nhân")',
    [['tín hiệu', /[Tt]ín hiệu|[Cc]ần xác minh|Chờ xác minh/]], [...KY_THUAT, ['web/src/modules/dev/ThanhPhanDemo.tsx', 'không tín hiệu nào chỉ bằng màu']]);
  khongCon('S3 (2) · "Dự kiến thi" một chữ (không còn Thi dự kiến / Thi thật dự kiến / Tháng · Tuần dự kiến thi)',
    [['dự kiến thi', /Thi dự kiến|Thi thật dự kiến|[Tt]háng dự kiến thi|[Tt]háng thi dự kiến|[Tt]uần dự kiến thi|ngày thi dự kiến|thi dự kiến/]], KY_THUAT);
  khongCon('S3 (2) · "Lên FT" một chữ', [['Fast Track', /Sang Fast Track|Chuyển sang Fast Track|[Ll]ên Fast Track/]], KY_THUAT);
  khongCon('S3 (2) · Một nghĩa một chữ: Lớp chuyển đến, Chuyển tiếp lớp, Nhóm nguyên nhân, Vấn đề chính / Yếu tố đi kèm, Hạn chấm, Bài kiểm tra, Case bàn giao, Tuần học', [
    ['Lớp đích', /[Ll]ớp đích|Lớp muốn chuyển tới/],
    ['Chuyển lớp cả lớp', /Chuyển lớp cả lớp|Chuyển nhiều em/],
    ['Phân loại vấn đề', /[Pp]hân loại (vấn đề|nguyên nhân)|[Ll]oại lỗi/],
    ['Lỗi chính / phụ', /[Ll]ỗi chính|[Ll]ỗi phụ/],
    ['Hạn nhập', /Hạn nhập/],
    ['Bài đánh giá', /Bài đánh giá/],
    ['Từ lớp trước', /Từ lớp trước|mang từ lớp trước|Case đi theo em/],
    ['Tuần học FT', /Tuần học FT|Tuần khoá|tuần học thứ/],
  ], KY_THUAT);
  check('S3 (2) · Chuyển lớp: hằng chữ CHU_CHUYEN_LOP (quyết định · ba trạng thái · GVCN xác nhận bàn giao); OVR chỉ ở cột hẹp; Điểm đầu vào; Lên FT; Tạm dừng học (bảo lưu)', () => {
    const cl = docNguon('shared/domain/chuyenLop.ts');
    for (const chu of ["'Quyết định chuyển lớp'", "'Chưa có quyết định chuyển lớp'", "'Chờ QL duyệt đề xuất'", 'Sắp chuyển · từ', "'GVCN xác nhận bàn giao'", "'Huỷ quyết định'"]) assert(cl.includes(chu), chu);
    assert(/CHU_CHUYEN_LOP\.huy/.test(docNguon('web/src/modules/students/ChuyenLopPanel.tsx')), 'ChuyenLopPanel dùng hằng');
    assert(/CHU_CHUYEN_LOP\.sapChuyen/.test(docNguon('web/src/modules/classes/DaiChuyenLop.tsx')), 'DaiChuyenLop dùng hằng');
    const ll = docNguon('shared/domain/lenLop.ts');
    assert(ll.includes("'Tạm dừng học (bảo lưu)'") && ll.includes("'Dừng học hẳn'") && ll.includes("'Lên FT'"), 'nhãn hướng (lenLop)');
    assert(docNguon('web/src/modules/students/StudentPlanPanel.tsx').includes('label="Điểm đầu vào"'), 'Điểm đầu vào');
    assert(/>OVR<\/Th>/.test(docNguon('web/src/modules/cham/LuoiFT.tsx')), 'LuoiFT OVR (cột hẹp)');
  });
  // ------------------------------------------------------------------ Task 3 · trạng thái & chip (nhóm C)
  khongCon('S3 (3) · Một nghĩa một chữ: Quá hạn · n ngày, Hạn hôm nay, Chưa có hạn, Xong, Dưới kỳ vọng, Không lưu được, Đã nhắc, Hệ thống đóng, Bị từ chối, Chờ duyệt, Case đang mở…', [
    ['Trễ / ⚠ Quá hạn', /Trễ \$\{|⚠ Quá hạn/],
    ['hạn hôm nay', /chu: 'hạn hôm nay'/],
    ['chưa có hạn', /chưa có hạn/],
    ['không có hạn', /Nhập bù, không có hạn|nhập bù, không có hạn|>không có hạn<|'không có hạn'|<span[^>]*>không có hạn/],
    ['Đã xong', /Đã xong|Đã hoàn thành(?! Case)/],
    ['Chưa đạt kỳ vọng', /Chưa đạt kỳ vọng|chưa đạt kỳ vọng/],
    ['Chưa có người làm', /[Cc]hưa có người làm/],
    ['Hệ thống tự đóng', /Hệ thống tự đóng/],
    ['Tiếp tục xử lý', /Tiếp tục xử lý/],
    ['Lưu lỗi', /Chưa lưu được|Lưu lỗi|Lưu thất bại/],
    ['✓ Đã nhắc', /✓ Đã nhắc|"có nhắc"|"Có nhắc"/],
    ['Không duyệt', /Không duyệt(?! được)/],
    ['Đang chờ duyệt', /Đang chờ duyệt|nhan: 'Đang chờ'/],
    ['Case mở', /'Case mở'|>Case mở</],
    ['Đã kết thúc, chưa ghi kết quả', /Đã kết thúc, chưa ghi kết quả|PA đã xong,? chưa ghi kết quả/],
  ], [['web/src/modules/cases/QuickReport.tsx', 'Đã xong từ trước'], ['web/src/modules/platform/AccountsAdmin.tsx', 'Không duyệt'],
    ['shared/domain/students.ts', "completed: 'Đã hoàn thành'"], ['server/src/seed/seed.ts', 'Đã hoàn thành'],
    ['web/src/modules/platform/DemoBar.tsx', ''], ['web/src/modules/platform/WelcomePage.tsx', ''], ['server/src/migrate', '']]);
  check('S3 (3) · Q1: trạng thái Vận hành một map (Chưa bắt đầu · Đang xử lý · Tạm ngưng · Dừng hẳn · Xong); MgmtTasksPage lấy từ TASK_PROGRESS_LABEL; HV "Tạm dừng học"', () => {
    const wl = docNguon('shared/domain/worklist.ts');
    for (const chu of ["'Chưa bắt đầu'", "'Đang xử lý'", "'Tạm ngưng'", "'Dừng hẳn'", "done: 'Xong'"]) assert(wl.includes(chu), chu);
    assert(/\.\.\.TASK_PROGRESS_LABEL/.test(docNguon('web/src/modules/worklist/MgmtTasksPage.tsx')), 'MgmtTasksPage dùng TASK_PROGRESS_LABEL');
    assert(/inactive: 'Tạm dừng học'/.test(docNguon('shared/domain/students.ts')) && /chuTamDung/.test(docNguon('shared/domain/students.ts')), 'students.ts');
    assert(!/NHAN_TRANG_THAI_O/.test(docNguon('shared/domain/hoSoHocVien.ts')), 'bản sao NHAN_TRANG_THAI_O đã gộp');
    assert(/CHUA_CO_HAN/.test(docNguon('shared/domain/display.ts')) && /CHUA_CO_HAN/.test(docNguon('shared/domain/hoSoHocVien.ts')) && /CHUA_CO_HAN/.test(docNguon('web/src/modules/cases/TheKyNang.tsx')), 'so khớp "Chưa có hạn" theo hằng, không theo chuỗi');
  });
  // ------------------------------------------------------------------ Task 4 · nút và hành động (nhóm D)
  khongCon('S3 (4) · Nút: thoát hộp là "Đóng" (không Thôi / Huỷ trần), Thao tác khác, Đánh dấu đã đọc, Nhập điểm, Thêm PA, Báo QL, Gửi Quản lý duyệt…', [
    ['Thôi', /\bThôi\b/],
    ['Huỷ (thoát hộp)', />Huỷ<|'Huỷ'|nhan: 'Huỷ'/],
    ['Thêm thao tác / Thao tác với lớp', /Thêm thao tác|Thao tác với lớp/],
    ['Đọc hết', /Đọc hết/],
    ['Nhập điểm Test', /Nhập điểm Test|→ Nhập\b|>Chấm<|\? 'Chấm'/],
    ['Đề ra PA', /Đề ra PA/],
    ['Báo lên', /[Bb]áo lên/],
    ['Duyệt dời / Xử lý việc vắng', /Duyệt dời|Xử lý việc vắng/],
    ['Gửi duyệt', /Gửi duyệt|Gửi QL duyệt/],
    ['+ Công việc', /\+ Công việc(?! con)/],
    ['Dời lịch / Lùi lịch', /Lùi lịch thi|Dời lịch một kỹ năng|Đổi tuần thi kỹ năng|Ghi vắng thi|Huỷ lượt (MT|Test)|Bỏ khỏi đợt/],
    ['Tiếp tục theo dõi / Hoàn thành case', /Tiếp tục theo dõi|Hoàn thành case/],
    ['Chọn tuần…', /Chọn tuần…|Tuần khác…|xoá điểm|Lưu kết quả/],
  ], KY_THUAT);
  check('S3 (4) · "Thêm PA" so khớp theo hằng CHU_THEM_PA (không so chuỗi hiển thị); KhungPanel / ConfirmDialog mặc định "Đóng"', () => {
    assert(/CHU_THEM_PA/.test(docNguon('server/src/students/viecHocVien.ts')) && /CHU_THEM_PA/.test(docNguon('web/src/modules/cases/QuickReport.tsx')) && /CHU_THEM_PA/.test(docNguon('shared/domain/sosV4.ts')), 'hằng CHU_THEM_PA');
    assert(/huy\.nhan \?\? \(chan\.daSua \? 'Huỷ thay đổi' : 'Đóng'\)/.test(docNguon('web/src/ui/KhungPanel.tsx')), 'KhungPanel');   // PR-SL I1: chưa sửa → "Đóng"
    assert(/closeLabel = 'Đóng'/.test(docNguon('web/src/ui/Drawer.tsx')), 'ConfirmDialog');   // PR-LM: nút trái đặt được ("Quay lại"), mặc định vẫn "Đóng"
    assert(/nhan = 'Thao tác khác'/.test(docNguon('web/src/ui/MenuDong.tsx')), 'MenuDong');
  });
  // ------------------------------------------------------------------ Task 5 · tiêu đề cột & số liệu (nhóm E)
  khongCon('S3 (5) · Số liệu: một số một tên (Học viên có SOS, Case chưa có PA, Tỷ lệ đủ dữ liệu, Bài quá hạn chưa nhập điểm, Cần chấm, Test sắp tới, Người phụ trách, Trạng thái, Tổng, Nguyên nhân phổ biến, Chấm đúng hạn, Kỹ năng phụ trách được)', [
    ['SOS hiện tại', /Học viên có SOS hiện tại/],
    ['Thiếu PA học thuật (số liệu)', /Case thiếu PA học thuật|nhan: \(\) => 'Thiếu PA học thuật'|thieuPa: 'Thiếu PA học thuật'/],
    ['Độ phủ', /Độ phủ đánh giá|Đủ dữ liệu đánh giá/],
    ['Bài chưa nhập', /Bài chưa nhập điểm quá hạn|bài chưa nhập điểm quá hạn|Bài quá hạn nhập|bài quá hạn nhập|Bài chưa nhập'|Bài chưa nhập\b(?! điểm| đủ)/],
    ['Bạn cần chấm', /Bạn cần chấm/],
    ['Test kế tiếp', /Test kế tiếp|Mốc kế tiếp đã xếp lịch/],
    ['Người giữ việc', /Người giữ việc/],
    ['Tình trạng', /Tình trạng/],
    ['Cộng', /\bCộng \{/],
    ['Kết quả Test (đếm lượt)', /Kết quả Test \(đếm lượt\)|So với lần Test trước|Lỗi phổ biến/],
    ['Chấm điểm đúng hạn', /Chấm điểm đúng hạn|Case có việc tiếp quá hạn|Tự khai dạy được|>Phụ trách được</],
  ], KY_THUAT);
  check('S3 (5) · Chú thích cột bảng Phân tích giáo viên đã chép vào THUAT_NGU_2026-10-01.md (mục mới cuối tệp)', () => {
    const md = fs.readFileSync(path.join(ROOT, 'thiet-ke/THUAT_NGU_2026-10-01.md'), 'utf8');
    assert(/## Chú thích cột bảng Phân tích giáo viên/.test(md), 'thiếu mục');
    for (const k of ['PT-GV-1', 'PT-GV-9']) assert(md.includes(k), k);
  });
  // ------------------------------------------------------------------ Task 6 · vai trò, việc, thông báo (nhóm F)
  khongCon('S3 (6) · Vai trò & việc: HV (không Học sinh / HS), Hệ thống (không Web / Máy), Tư vấn viên, Tutor, Việc con, Việc được giao, Vận hành, Vai trò, Xếp lại lịch thi', [
    ['Học sinh / HS', /Học sinh|\bHS\b/],
    ['Web / Máy', /Web gợi ý|Web tự điền|Máy tự/],
    ['Người tư vấn', /Người tư vấn/],
    ['Công việc con', /[Cc]ông việc con|Công việc được giao|Việc đã giao/],
    ['Các vấn đề khác', /Các vấn đề khác|Lớp & vận hành|Thiếu dữ liệu cần cho đánh giá/],
    ['Xử lý lịch thi', /Xử lý lịch thi|Case chờ nguyên nhân quá hạn/],
    ['của bạn', /Việc của bạn|việc khác của bạn/],
    ['chưa có vai', /chưa có vai(?! trò)|\+ Thêm vai(?! trò)/],
    ['Học tutor / trợ giảng', /Học tutor|trợ giảng/],
    ['Tiêu đề thông báo cũ', /Vi phạm mới —|Xem lại case|Xác nhận nguyên nhân \S+ —|Đăng ký tài khoản mới —/],
  ], [...KY_THUAT, ['web/src/modules/platform/WelcomePage.tsx', '']]);
  check('S3 (6) · Tiêu đề thông báo theo mẫu "việc · em · lớp" (dấu · , không còn "— tên")', () => {
    const yc = docNguon('server/src/duyet/yeuCau.ts');
    for (const mau of ["'Chờ duyệt'} · ${meta.nhan}", 'Bổ sung · ${meta.nhan}', 'Quá hạn duyệt · ${metaCua', 'Yêu cầu ${meta.nhan}']) assert(yc.includes(mau), mau);
    assert(/Vi phạm mới · \$\{hv\.full_name\}/.test(docNguon('server/src/yThuc/xuLy.ts')), 'xuLy');
    assert(/Báo phụ huynh qua TVV · \$\{hv\?\.full_name/.test(docNguon('server/src/yThuc/phoiHop.ts')), 'phoiHop');
    assert(/Bị từ chối · Không cần theo dõi/.test(docNguon('server/src/cases/sosAuto.ts')), 'sosAuto');
  });
  // ------------------------------------------------------------------ Task 7 · Ý thức & vi phạm (nhóm G)
  khongCon('S3 (7) · Ý thức: "lần xử lý" (không "phương án xử lý" / "PA xử lý"), Chưa xử lý lần nào, Lần xử lý gần nhất, Theo xử lý · Theo vi phạm, Vi phạm chưa xem', [
    ['phương án xử lý', /phương án xử lý|PA xử lý/],
    ['Chưa bậc nào', /Chưa bậc nào/],
    ['Xử lý gần nhất', />Xử lý gần nhất<|'Xử lý gần nhất'|HV có VP/],
    ['vi phạm chưa ai xem', /vi phạm chưa ai xem|vi phạm mới chưa xem/],
    ['tab con cũ', /label: 'Xử lý'|label: 'Vi phạm' \}/],
  ], KY_THUAT);
  await checkAsync('S3 (7) · "Chưa xử lý lần nào" không áp cho em đã bị xử lý ngoài thang (Đình chỉ…) hoặc đã có bậc — khi đó hiện bậc / lần xử lý đó; Phối hợp SOS (FT) · Phối hợp (lớp thường)', async () => {
    const d: any = await import('../../../shared/domain/index.ts');
    assert(d.bacHoacNgoaiThang(0, []) === null, 'chưa gì');
    assert(d.bacHoacNgoaiThang(0, [{ kind: 'suspension', status: 'done', performedOn: '2026-09-01' }]) === d.MEASURE_KIND_LABEL.suspension, 'Đình chỉ → hiện Đình chỉ');
    assert(d.bacHoacNgoaiThang(0, [{ kind: 'suspension', status: 'cho_duyet', performedOn: null }]) === null, 'đang chờ duyệt thì chưa tính là đã xử lý');
    assert(d.bacHoacNgoaiThang(3, []) === d.MEASURE_KIND_LABEL.wl_1, 'bậc 3 = WL 1 (kể cả bậc khai trước khi dùng web)');
    assert(/thuong \? 'Phối hợp' : 'Phối hợp SOS'/.test(docNguon('web/src/modules/yThuc/ClassYThucCard.tsx')) && /thuong \? 'Phối hợp' : 'Phối hợp SOS'/.test(docNguon('web/src/modules/yThuc/StudentYThucSection.tsx')), 'tab Phối hợp theo khung');
    assert(/lanXuLyMoi/.test(docNguon('server/src/phanTich/yThucPhanTich.ts')) && /lanXuLyMoi/.test(docNguon('web/src/modules/phanTich/YThucPhoiHop.tsx')), 'lần xử lý mới hơn kèm nhãn trạng thái');
  });
  // ------------------------------------------------------------------ Task 8 · Case viết hoa, PA ngắn · Phương án rộng, Normal / Progress / Final còn sót
  khongCon('S3 (8) · "Case" luôn viết hoa trong chữ người dùng thấy; không còn "lớp Normal" / Progress Test / Final Test; nút "Kết thúc PA", "Thay PA"', [
    ['case thường', /^(?!\s*(case|default)\b)(?=.*[^\x00-\x7F]).*?(?<![\w'`.${}-])case(?![\w:.${}-])(?!\s+['"`])(?!\s+[\w.]+\s*:)/],
    ['Normal / Progress / Final', /[Ll]ớp Normal|Progress Test|Final Test/],
    ['Kết thúc phương án', /Kết thúc phương án|Thay phương án/],
  ], KY_THUAT);
  // ------------------------------------------------------------------ Task 9 · việc nhỏ chuyển cho S3
  check('S3 (9) · A5 giữ ct · A6 một tham số chi nhánh cn (link cũ branchId vẫn đọc được) · A8 ngày nghiệp vụ qua useNgayNghiepVu · A10 Được thay thế · A11 bỏ "chu kỳ" · A17 mgmt có loại hạn', () => {
    assert(/\['cn', 'ct'\]/.test(docNguon('web/src/modules/worklist/OverviewPage.tsx')), 'A5');
    for (const f of ['students/StudentsPage.tsx', 'students/LuuTruPage.tsx', 'test/KeHoachTestTab.tsx', 'test/TestPage.tsx']) {
      assert(/get\('cn'\) \?\? params\.get\('branchId'\)/.test(docNguon(`web/src/modules/${f}`)), `A6 ${f}`);
    }
    for (const f of ['classes/ClassOverviewPage.tsx', 'phanTich/TongHopTestSos.tsx', 'phanTich/YThucPhoiHop.tsx', 'students/StudentDetailPage.tsx', 'test/keHoach/HopKyNang.tsx', 'test/keHoach/NganXepHangLoat.tsx', 'test/keHoach/NganXepLichMt.tsx']) {
      assert(!/session\??\.demoDate/.test(docNguon(`web/src/modules/${f}`)), `A8 ${f}`);
    }
    assert(!/session\??\.demoDate/.test(docNguon('web/src/ui/Filters.tsx')) && !/session\??\.demoDate/.test(docNguon('web/src/modules/worklist/OverviewPage.tsx')), 'A8 Filters / Overview');
    assert(/Được thay thế/.test(docNguon('shared/domain/hoSoHocVien.ts')), 'A10');
    assert(!/chu kỳ/.test(docNguon('server/src/cases/cases.ts')), 'A11');
    assert(/mgmt: 'viec-van-hanh'/.test(docNguon('shared/domain/tongQuan.ts')), 'A17');
  });
  check('S3 (9) · Q10 ô bấm ≥ 44 px trên điện thoại: Thu gọn, Thu tất cả, ← Quay lại, Lộ trình / + Case / ⋮, chip lọc, số "Lớp tôi dạy"', () => {
    const cao = (f: string, mau: RegExp) => assert(mau.test(docNguon(f)), `${f}: ${mau}`);
    cao('web/src/ui/HangNhom.tsx', /max-sm:before:-inset-3\.5/);
    cao('web/src/modules/test/LichTestTab.tsx', /min-h-\[44px\] px-1 text-xs/);
    cao('web/src/modules/fasttrack/MockDetailPage.tsx', /mb-1 min-h-\[44px\] sm:min-h-0" onClick=\{\(\) => navigate\(-1\)\}>← Quay lại/);
    cao('web/src/ui/ThanhTruocSau.tsx', /btn btn-sm btn-ghost min-h-\[44px\] sm:min-h-0[^']*';[\s\S]*← Quay lại/);   // PR-DH 04/10: nút Quay lại hồ sơ HV nay nằm trong ThanhTruocSau
    cao('web/src/modules/students/StudentDetailPage.tsx', /className="btn btn-primary min-h-\[44px\] sm:min-h-0" onClick=\{\(\) => setReportOpen\(true\)\}>\+ Case/);
    cao('web/src/modules/students/StudentsPage.tsx', /cursor-pointer max-sm:min-h-\[44px\]/);
    cao('web/src/modules/worklist/LopToiDay.tsx', /max-sm:before:-inset-y-3/);
  });
}
