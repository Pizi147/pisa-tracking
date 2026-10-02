// Sổ Quản lý, nhóm 2: lộ trình, chuyển lớp, Test, Chờ duyệt, Công việc. Quản lý Monbay (Vy, id 2). CHỈ ĐỌC: không bấm Lưu/Duyệt/Gửi.
const QL = 2;
const DLG = (p) => p.locator('[role="dialog"]').last();

export const ANH_Q2 = [
  {
    id: 'q-14-lo-trinh', tieu_de: 'Panel "Lộ trình" của học viên', user: QL, url: '/hoc-vien/50', w: 1320, panel: true,
    buoc: async (p) => {
      await p.locator('main button[aria-haspopup]').first().click();
      await p.getByRole('menuitem', { name: /^Lộ trình/ }).first().click();
      await DLG(p).waitFor();
      await p.setViewportSize({ width: 1320, height: 800 });
      await p.waitForTimeout(400);
    },
    vung: (p) => DLG(p), le: 0,
    ghi_chu: 'Lý Minh Châu (id 50). Chỉ mở panel, không lưu.',
    marks: [
      { n: 1, loc: (p) => DLG(p).getByText(/Target|Band mục tiêu/).first(), pad: 6, ghi: 'Đổi Target (hoặc KCK) của em. Chỉ Quản lý đổi được; GVCN chỉ đề xuất.' },
      { n: 2, loc: (p) => DLG(p).getByRole('button', { name: /Lưu/ }).last(), ghi: 'Bấm "Lưu" sau khi ghi lý do và ngày hiệu lực.' },
    ],
  },
  {
    id: 'q-15-chuyen-lop-mot-em', tieu_de: 'Panel "Chuyển lớp" cho một học viên', user: QL, url: '/hoc-vien/50', w: 1320, panel: true,
    buoc: async (p) => {
      await p.locator('main button[aria-haspopup]').first().click();
      await p.getByText('Chuyển lớp…').last().click();
      await DLG(p).waitFor();
      await p.setViewportSize({ width: 1320, height: 900 });
      await p.waitForTimeout(500);
    },
    vung: (p) => DLG(p), le: 0,
    ghi_chu: 'Lý Minh Châu (id 50). Chỉ mở panel.',
    marks: [
      { n: 1, loc: (p) => DLG(p).locator('h2, h3').first(), pad: 6, ghi: 'Đầu panel: tên em và lớp hiện tại.' },
      { n: 2, loc: (p) => DLG(p).getByText(/Lớp chuyển đến/i).first(), pad: 6, ghi: 'Chọn chi nhánh và lớp chuyển đến (bắt buộc).' },
      { n: 3, loc: (p) => DLG(p).getByRole('button', { name: /Chọn tuần|Wd/ }).first(), pad: 6, ghi: 'Chọn tuần bắt đầu: Thứ Hai, từ tuần sau trở đi.' },
      { n: 4, loc: (p) => DLG(p).getByRole('button', { name: 'Quyết định chuyển lớp' }), ghi: 'Bấm "Quyết định chuyển lớp" để ra lệnh; lệnh tự chạy sáng Thứ Hai ở tuần bắt đầu.' },
    ],
  },
  {
    id: 'q-16-ket-thuc-khoa', tieu_de: 'Hồ sơ lớp hết khoá: dải đỏ và nút "Chuyển tiếp lớp…"', user: QL, url: '/hoc-vien/lop/21', w: 1280,
    vung: (p) => p.locator('main').first(),
    ghi_chu: 'MB FOU 21, vào từ danh sách lớp.',
    marks: [
      { n: 1, loc: (p) => p.getByText(/Kết thúc khoá/).first(), pad: 6, ghi: 'Dải đỏ báo lớp tới tuần kết thúc và còn bao nhiêu em chưa có lệnh chuyển.' },
      { n: 2, loc: (p) => p.getByRole('button', { name: /Chuyển tiếp lớp/ }).first(), ghi: '"Chuyển tiếp lớp…" mở bảng ra lệnh cho từng em.' },
    ],
  },
  {
    id: 'q-17-chuyen-lop-ca-lop', tieu_de: 'Panel "Chuyển lớp" cả lớp (bước 1)', user: QL, url: '/hoc-vien/lop/21', w: 1400, panel: true,
    buoc: async (p) => {
      await p.getByRole('button', { name: /Chuyển tiếp lớp/ }).first().click();
      await DLG(p).waitFor();
      await p.setViewportSize({ width: 1400, height: 900 });
      await p.waitForTimeout(500);
    },
    vung: (p) => DLG(p), le: 0,
    ghi_chu: 'Chỉ mở bước 1, không gửi lệnh.',
    marks: [
      { n: 1, loc: (p) => DLG(p).getByText(/Cuối khoá|Kết quả/).first(), pad: 8, ghi: 'Mỗi em một dòng: chọn hướng đi, lớp đích; cột kết quả Cuối khoá giúp quyết định.' },
      { n: 2, loc: (p) => DLG(p).getByRole('button', { name: /Mở lớp mới/ }), ghi: '"+ Mở lớp mới" tạo ngay lớp đích nếu chưa có.' },
      { n: 3, loc: (p) => DLG(p).getByRole('button', { name: /^Tiếp tục/ }), ghi: '"Tiếp tục · n em" sang bước xem lại, rồi "Gửi lệnh chuyển n em".' },
    ],
  },
  {
    id: 'q-20-lich-test-ql', tieu_de: 'Test › Lịch Test (Quản lý)', user: QL, url: '/test/lich', w: 1280,
    vung: (p) => p.locator('main').first(),
    marks: [
      { n: 1, loc: (p) => p.getByRole('tab', { name: 'Kế hoạch Test' }).locator('xpath=..'), ghi: 'Hai tab: "Lịch Test" và "Kế hoạch Test" (tab này chỉ Quản lý có).' },
      { n: 2, loc: (p) => p.getByRole('button', { name: /Xuất Excel/ }).first(), ghi: '"Xuất Excel" tải kết quả Test theo phạm vi của bạn.' },
    ],
  },
  {
    id: 'q-21-ke-hoach-test', tieu_de: 'Test › Kế hoạch Test', user: QL, url: '/test/ke-hoach', w: 1280,
    vung: (p) => p.getByText('Bùi Thảo Vy').first().locator('xpath=ancestor::tr[1]'),
    ghi_chu: 'Lớp MB FT 101 mở sẵn.',
    marks: [
      { n: 1, loc: (p) => p.locator('[aria-label="Khung lớp"]'), ghi: 'Công tắc khung: Fast Track hoặc Lớp thường.' },
      { n: 2, loc: (p) => p.getByRole('button', { name: /^Cần xếp lại/ }), ghi: '"Cần xếp lại (n)": học viên có kỹ năng vắng hoặc phần thi đã huỷ.' },
      { n: 3, loc: (p) => p.getByRole('button', { name: /Xếp lịch MT/ }), ghi: '"Xếp lịch MT…" xếp nhiều em một lần.' },
      { n: 4, loc: (p) => p.getByText('MT1', { exact: true }).first(), pad: 6, ghi: 'Mỗi cột là một đợt Mock Test, ghi tuần thi.' },
      { n: 5, loc: (p) => p.getByText(/W1 JUL/).first().locator('xpath=ancestor::button[1]'), ghi: 'Chip kỹ năng: màu xanh dương = đã xếp, xám = đã thi, vàng = dời vì vắng, tím = chờ duyệt, gạch ngang = đã huỷ phần thi. Bấm chip để sửa.' },
    ],
  },
  {
    id: 'q-22-hop-ky-nang', tieu_de: 'Hộp lịch kỹ năng của một đợt', user: QL, url: '/test/ke-hoach', w: 1280, panel: true,
    buoc: async (p) => {
      await p.getByText(/W1 JUL/).first().click();
      await DLG(p).waitFor();
      await p.waitForTimeout(500);
      await p.setViewportSize({ width: 1280, height: 900 });
    },
    vung: (p) => DLG(p),
    le: 24,
    ghi_chu: 'Bùi Thảo Vy MT1. Chỉ mở hộp, không bấm Lưu.',
    marks: [
      { n: 1, loc: (p) => DLG(p).getByText('W1 JUL').first().locator('xpath=..'), pad: 6, ghi: 'Mỗi kỹ năng một dòng: bấm ‹ › để đổi tuần thi.' },
      { n: 2, loc: (p) => DLG(p).getByText('Chưa đổi gì.'), pad: 4, ghi: 'Dòng trạng thái: "Chưa đổi gì" cho tới khi bạn đổi một tuần.' },
      { n: 3, loc: (p) => DLG(p).getByRole('button', { name: 'Đóng' }), ghi: '"Đóng" thoát mà không lưu.' },
      { n: 4, loc: (p) => DLG(p).getByRole('button', { name: /^Lưu|Vẫn xếp/ }).first(), ghi: 'Bấm "Lưu" để ghi lịch; khi dời một tuần đã bắt đầu, web hỏi thêm lý do.' },
    ],
  },
  {
    id: 'q-23-xep-lich-mt', tieu_de: 'Panel "Xếp lịch Mock Test"', user: QL, url: '/test/ke-hoach', w: 1400, panel: true,
    buoc: async (p) => {
      await p.getByRole('button', { name: /Xếp lịch MT/ }).click();
      await DLG(p).waitFor();
      await p.setViewportSize({ width: 1400, height: 900 });
      await p.waitForTimeout(600);
    },
    vung: (p) => DLG(p), le: 0,
    ghi_chu: 'Chỉ mở panel.',
    marks: [
      { n: 1, loc: (p) => DLG(p).getByText('Lọc', { exact: true }).first(), pad: 8, ghi: 'Lọc theo lớp hoặc tìm học viên.' },
      { n: 2, loc: (p) => DLG(p).getByText('Đợt', { exact: true }).first(), pad: 8, ghi: 'Chọn đợt Mock Test cần xếp.' },
      { n: 3, loc: (p) => DLG(p).getByText('Tuần thi', { exact: true }).first(), pad: 8, ghi: '"Tuần chung cho 4 kỹ năng", hoặc mở "Lịch riêng từng kỹ năng" nếu cần.' },
      { n: 4, loc: (p) => DLG(p).getByText(/Học viên · /).first(), pad: 8, ghi: 'Tích học viên; cột "Sẽ xếp" cho biết web sẽ Tạo, Xếp nốt, Dời hay Thi lại.' },
    ],
  },
  {
    id: 'q-30-cho-duyet', tieu_de: 'Công việc › Chờ duyệt', user: QL, url: '/cong-viec/cho-duyet', w: 1280,
    vung: (p) => p.getByText('Đề xuất WL 3').first().locator('xpath=ancestor::article[1]'),
    ghi_chu: 'Vy, hộp Chờ duyệt 22 thẻ.',
    marks: [
      { n: 1, loc: (p) => p.locator('[aria-label="Loại yêu cầu"]'), ghi: 'Năm phân loại: Học thuật · Ý thức · Lịch thi · Thông tin HV · Báo QL.' },
      { n: 2, loc: (p) => p.locator('[aria-label="Trạng thái"]'), ghi: '"Chờ duyệt" hoặc "Đã xử lý (30 ngày)".' },
      { n: 3, loc: (p) => p.getByText('Báo QL', { exact: true }).first(), ghi: 'Thẻ Báo QL chỉ để biết và nhắc, không có nút Duyệt.' },
      { n: 4, loc: (p) => p.getByText(/Quá hạn · /).first(), ghi: 'Hạn của thẻ; thẻ quá hạn viền cam và xếp lên đầu.' },
      { n: 5, loc: (p) => p.getByRole('button', { name: 'Duyệt', exact: true }).first(), ghi: '"Duyệt" và "Từ chối…" ở chân thẻ.' },
      { n: 6, loc: (p) => p.getByRole('button', { name: /^Nhắc /i }).first(), ghi: '"Nhắc {tên giáo viên}" gửi thông báo, không đổi trạng thái thẻ.' },
    ],
  },
  {
    id: 'q-31-tu-choi', tieu_de: 'Thẻ đang mở ô "Từ chối…" (bắt buộc lý do)', user: QL, url: '/cong-viec/cho-duyet', w: 1280,
    buoc: async (p) => {
      await p.getByRole('button', { name: /^Từ chối/ }).first().click();
      await p.waitForTimeout(500);
    },
    vung: (p) => p.getByRole('button', { name: 'Gửi từ chối' }).locator('xpath=ancestor::article[1]'),
    ghi_chu: 'Chỉ mở ô, không bấm Gửi từ chối.',
    marks: [
      { n: 1, loc: (p) => p.getByRole('button', { name: 'Gửi từ chối' }).locator('xpath=ancestor::article[1]//textarea | ancestor::article[1]//input[@type="text"]'), pad: 6, ghi: 'Ô lý do: bắt buộc, ít nhất 3 ký tự; giáo viên sẽ đọc câu này.' },
      { n: 2, loc: (p) => p.getByRole('button', { name: 'Gửi từ chối' }), ghi: 'Bấm "Gửi từ chối" để từ chối; Esc để bỏ.' },
    ],
  },
  {
    id: 'q-32-duyet-hang-loat', tieu_de: 'Duyệt hàng loạt (lọc một loại thẻ)', user: QL, url: '/cong-viec/cho-duyet', w: 1280,
    buoc: async (p) => {
      await p.getByRole('button', { name: /^Học thuật/ }).first().click();
      await p.waitForTimeout(500);
      const o = p.locator('article input[type="checkbox"]');
      await o.nth(0).check();
      await o.nth(1).check();
      await p.waitForTimeout(300);
    },
    vung: (p) => p.locator('article').first(),
    ghi_chu: 'Tích hai thẻ, không bấm Duyệt.',
    marks: [
      { n: 1, loc: (p) => p.getByRole('button', { name: /^Học thuật/ }).first(), ghi: 'Lọc một phân loại trước: duyệt hàng loạt chỉ chạy khi mọi thẻ cùng một loại.' },
      { n: 2, loc: (p) => p.locator('article input[type="checkbox"]').first(), ghi: 'Tích ô đầu mỗi thẻ cần duyệt.' },
      { n: 3, loc: (p) => p.getByRole('button', { name: /^Duyệt \d+ yêu cầu/ }), ghi: '"Duyệt n yêu cầu" ở thanh dưới màn hình.' },
    ],
  },
  {
    id: 'q-40-viec-hoc-vien-ql', tieu_de: 'Công việc › Hỗ trợ học viên (Quản lý)', user: QL, url: '/cong-viec', w: 1280,
    buoc: async (p) => { await p.getByRole('tab', { name: /Hỗ trợ học viên/ }).click().catch(() => {}); await p.waitForTimeout(600); },
    vung: (p) => p.locator('main').first(),
    marks: [
      { n: 1, loc: (p) => p.locator('[aria-label="Việc của ai"]'), ghi: '"Của tôi" hoặc "Của GV (nhắc)": xem việc của giáo viên để nhắc.' },
      { n: 2, loc: (p) => p.locator('[aria-label="Nhóm việc"]'), ghi: 'Lọc theo bốn nhóm việc.' },
      { n: 3, loc: (p) => p.getByRole('button', { name: /^Nhắc/ }).first(), ghi: '"Nhắc" gửi thông báo cho giáo viên giữ việc; sau đó đổi thành "✓ Đã nhắc".' },
    ],
  },
  {
    id: 'q-41-van-hanh', tieu_de: 'Công việc › Vận hành', user: QL, url: '/cong-viec/van-hanh', w: 1280,
    vung: (p) => p.locator('main').first(),
    marks: [
      { n: 1, loc: (p) => p.getByRole('button', { name: '+ Giao việc' }), ghi: 'Nút "+ Giao việc" tạo việc mới, có thể giao cho người ngoài hệ thống.' },
      { n: 2, loc: (p) => p.getByText('Nhóm:').first().locator('xpath=ancestor::*[self::div][1]'), pad: 4, ghi: 'Bộ lọc Nhóm, Trạng thái, Người phụ trách.' },
      { n: 3, loc: (p) => p.locator('table').first(), ghi: 'Bảng việc: người phụ trách, hạn, trạng thái (Cần làm · Đang làm · Tạm ngưng · Đã dừng · Xong) và tiến độ việc con.' },
    ],
  },
  {
    id: 'q-42-ngan-viec', tieu_de: 'Ngăn một công việc', user: QL, url: '/cong-viec/van-hanh', w: 1280, panel: true,
    buoc: async (p) => {
      await p.locator('table tbody tr').first().click();
      await DLG(p).waitFor();
      await p.setViewportSize({ width: 1280, height: 900 });
      await p.waitForTimeout(500);
    },
    vung: (p) => DLG(p), le: 0,
    ghi_chu: 'Chỉ mở ngăn, không đổi gì.',
    marks: [
      { n: 1, loc: (p) => DLG(p).getByText(/^hạn \d\d\/\d\d/).first(), pad: 6, ghi: 'Hạn của việc, và nhãn quá hạn nếu có.' },
      { n: 2, loc: (p) => DLG(p).getByRole('button', { name: 'Cập nhật tiến độ' }), ghi: '"Cập nhật tiến độ": đổi trạng thái; Tạm ngưng thì phải ghi lý do và ngày xem lại.' },
    ],
  },
  {
    id: 'q-43-bao-cao-don-vi', tieu_de: 'Công việc › Báo cáo đơn vị', user: QL, url: '/cong-viec/bao-cao', w: 1280,
    vung: (p) => p.locator('main').first(),
    marks: [
      { n: 1, loc: (p) => p.getByText(/Tuần báo cáo/).first().locator('xpath=ancestor::*[self::div][2]'), pad: 4, ghi: 'Chọn tuần báo cáo và kỳ (tuần hoặc tháng).' },
      { n: 2, loc: (p) => p.getByText(/Chưa mở|Nộp từ|Đã khoá/).first(), pad: 4, ghi: 'Cửa sổ nộp: từ Thứ Bảy đến hết Chủ nhật. Trước đó "Chưa mở"; sau đó khoá và chỉ Quản trị hệ thống mở lại được.' },
      { n: 3, loc: (p) => p.getByText('Tình hình đơn vị').first().locator('xpath=ancestor::*[contains(@class,"card")][1]'), pad: 2, ghi: 'Ma trận đơn vị × hạng mục; mỗi ô là Ổn, Cần theo dõi hoặc Có vấn đề. Bấm ô để mở.' },
    ],
  },
  {
    id: 'q-45-ho-so-gv-ql', tieu_de: 'Hồ sơ giáo viên (Quản lý xem)', user: QL, url: '/giao-vien/7', w: 1280,
    vung: (p) => p.locator('main').first(),
    marks: [
      { n: 1, loc: (p) => p.getByText(/Quản lý đang xem/).first(), pad: 4, ghi: 'Dòng nhắc bạn đang xem với tư cách Quản lý, chỉ tính lớp, Case, yêu cầu trong chi nhánh.' },
      { n: 2, loc: (p) => p.getByText(/^Việc của /).first(), ghi: '"Việc của {tên} ›" mở danh sách việc của giáo viên.' },
    ],
  },
];
