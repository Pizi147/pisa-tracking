// Nhóm E: việc riêng của GVCN, yêu cầu gửi Quản lý, hồ sơ giáo viên. CHỈ ĐỌC: chỉ mở trang/panel/menu/tab.
const HA = 7;
const kh = (p) => p.locator('#yeu-cau-cua-toi').locator('xpath=ancestor::section[1]');
const hopNho = (p) => p.locator('[role="dialog"] div.card').first();
const hop = (p) => p.locator('[role="dialog"][aria-label]').first();
const hopAny = (p) => p.locator('[role="dialog"]').first();

export const ANH_E = [
  {
    id: 'g-40-ho-so-lop',
    tieu_de: 'Hồ sơ lớp MB FT 101 (GVCN)',
    user: HA,
    url: '/hoc-vien/lop/3',
    w: 1160,
    buoc: async (page) => {
      await page.setViewportSize({ width: 1160, height: 3200 }); // đặt khung cao trước: đổi cỡ khung sẽ đóng menu
      await page.waitForTimeout(400);
      await page.locator('main button[aria-label="Thao tác khác"]').first().click();
      await page.waitForTimeout(300);
    },
    vung: (p) => p.locator('tbody tr').nth(2),
    marks: [
      { n: 1, loc: (p) => p.getByRole('button', { name: '+ Học viên', exact: true }), ghi: 'Bấm "+ Học viên" để thêm học viên vào lớp.' },
      { n: 2, loc: (p) => p.getByRole('link', { name: 'Nhập điểm', exact: true }), ghi: 'Bấm "Nhập điểm" để vào bảng nhập điểm cả lớp; đây là nút chính, hiện khi lớp còn bài chờ nhập.' },
      { n: 3, loc: (p) => p.locator('main button[aria-label="Thao tác khác"]'), ghi: 'Bấm ⋮ ("Thao tác khác") để mở thêm thao tác; GVCN có "Xuất Excel".' },
      { n: 4, loc: (p) => p.locator('[role="tablist"][aria-label="Hồ sơ lớp"]'), ghi: 'Ba tab của lớp: "Học viên", "Ý thức & Phối hợp", "Phân tích lớp".' },
      { n: 5, loc: (p) => p.locator('[role="group"][aria-label="Cách xem"]'), ghi: 'Chọn cách xem bảng học viên: "Điểm" hoặc "Cần hỗ trợ".' },
      { n: 6, loc: (p) => p.locator('thead'), ghi: 'Bảng học viên: mỗi dòng một em, cột Target, Dự kiến thi, Mốc, OVR, các kỹ năng và "Theo dõi" (việc tiếp theo).' },
    ],
    ghi_chu: 'Menu ⋮ của GVCN Hà chỉ có "Xuất Excel" (không có "Thêm thao tác"; nhãn thật của nút là "Thao tác khác"). Dải ảnh gồm 3 dòng học viên đầu bảng; nút "+ Case" nằm cạnh "+ Học viên" nhưng không khoanh.',
  },
  {
    id: 'g-41-them-hoc-vien',
    tieu_de: 'Panel "Thêm học viên"',
    user: HA,
    url: '/hoc-vien/lop/3',
    w: 1320,
    buoc: async (page) => {
      await page.getByRole('button', { name: '+ Học viên', exact: true }).first().click();
      await hop(page).waitFor();
      await page.setViewportSize({ width: 1320, height: 640 });
      await page.waitForTimeout(300);
    },
    vung: hop,
    panel: true,
    le: 0,
    marks: [
      { n: 1, loc: (p) => hop(p).locator('select').first(), pad: 14, ghi: 'Chọn lớp ở ô "Thêm vào lớp" (đã chọn sẵn lớp đang mở).' },
      { n: 2, loc: (p) => hop(p).locator('label:has-text("Tuần bắt đầu học")').locator('xpath=..'), pad: 14, ghi: 'Ô "Tuần bắt đầu học (mặc định cho mọi dòng)": lấy sẵn tuần khai giảng của lớp; em vào muộn thì đổi tuần.' },
      { n: 3, loc: (p) => hop(p).locator('textarea'), pad: 14, ghi: 'Dán vùng bảng từ Excel / Google Sheets vào đây; bảng phải có dòng tiêu đề "Họ và tên".' },
      { n: 4, loc: (p) => hop(p).getByRole('button', { name: 'Đọc nội dung đã dán' }), pad: 14, ghi: 'Bấm "Đọc nội dung đã dán" để đưa dữ liệu vào lưới bên dưới.' },
      { n: 5, loc: (p) => hop(p).locator('thead, [role="columnheader"]').first(), pad: 14, ghi: 'Lưới nhập: gõ thẳng từng em; cột "Trạng thái" báo dòng lỗi hoặc lưu ý cho từng dòng.' },
      { n: 6, loc: (p) => hop(p).getByRole('button', { name: /^Thêm (\d+ )?học viên$/ }), pad: 14, ghi: 'Bấm "Thêm n học viên" để lưu khi mọi dòng đã sẵn sàng (nút mờ khi chưa có dòng hợp lệ).' },
    ],
    ghi_chu: 'Chỉ mở panel, không dán nên lưới còn 1 dòng trống và chưa có dòng lỗi / dòng xem trước "n MT sẽ là MT lịch sử". Dòng giải thích trên màn hình: "Em vào muộn thì đổi tuần — cột Trạng thái báo trước MT nào sẽ là MT lịch sử."',
  },
  {
    id: 'g-42-bao-vang',
    tieu_de: 'Hồ sơ Mock: menu ⋯ của từng kỹ năng có mục "Báo vắng"',
    user: HA,
    url: '/mock-test/170', // Lương Bảo Anh · MB FT 101 · MT3 · Speaking còn "Chờ nhập điểm"
    panel: true, // không để lib đổi cỡ khung (đổi cỡ sẽ đóng menu); khung 900 đủ chứa thẻ Lịch Test
    buoc: async (page) => {
      await page.locator('button[aria-label="Thao tác khác · Speaking"]').click();
      await page.waitForTimeout(300);
    },
    vung: (p) => p.locator('h2:has-text("Lịch Test")').locator('xpath=ancestor::*[contains(@class,"card")][1]'),
    marks: [
      { n: 1, loc: (p) => p.getByText('Chờ nhập điểm').last(), ghi: 'Kỹ năng đang "Chờ nhập điểm" (chưa có điểm) mới báo vắng được.' },
      { n: 2, loc: (p) => p.locator('button[aria-label="Thao tác khác · Speaking"]'), pad: 1, ghi: 'Bấm ⋯ ("Thao tác khác · Speaking") ở dòng kỹ năng để mở menu.' },
      { n: 3, loc: (p) => p.getByRole('menuitem', { name: 'Báo vắng' }), pad: 1, ghi: 'Bấm "Báo vắng" để mở hộp ghi lý do em vắng phần thi này.' },
    ],
    ghi_chu: 'Dữ liệu: MT3 của Lương Bảo Anh (MB FT 101), Hà là GVCN. Kỹ năng đã có điểm (Listening, Reading) thì menu ⋯ chỉ có "Huỷ điểm" (chữ đỏ), không có "Báo vắng". Chỉ mở menu, không bấm.',
  },
  {
    id: 'g-42b-bao-vang-hop-ly-do',
    tieu_de: 'Hộp "Báo vắng · Speaking" (nhập lý do)',
    user: HA,
    url: '/mock-test/170',
    buoc: async (page) => {
      await page.locator('button[aria-label="Thao tác khác · Speaking"]').click();
      await page.getByRole('menuitem', { name: 'Báo vắng' }).click();
      await hopAny(page).waitFor();
    },
    vung: hopNho,
    panel: true,
    marks: [
      { n: 1, loc: (p) => hopAny(p).locator('h2'), pad: 8, ghi: 'Tên hộp cho biết đang báo vắng kỹ năng nào: "Báo vắng · Speaking".' },
      { n: 2, loc: (p) => hopAny(p).getByText(/Lần vắng đầu máy tự dời/), pad: 8, ghi: 'Luật: lần vắng đầu máy tự dời sang tuần kế tiếp; từ lần 2 Quản lý duyệt.' },
      { n: 3, loc: (p) => hopAny(p).locator('textarea'), pad: 16, ghi: 'Ô "Lý do" (bắt buộc, ít nhất 5 ký tự; số ký tự hiện ở góc phải).' },
      { n: 4, loc: (p) => hopAny(p).getByRole('button', { name: 'Báo vắng', exact: true }), pad: 4, ghi: 'Bấm "Báo vắng" để ghi "-" cho kỹ năng này và chốt (chỉ bấm khi đã nhập lý do).' },
    ],
    ghi_chu: 'Chỉ mở hộp, không nhập lý do, không bấm "Báo vắng". Hộp này là hộp thoại nhỏ giữa màn hình (không phải ngăn bên).',
  },
  {
    id: 'g-43-de-xuat-chuyen-lop',
    tieu_de: 'Panel "Đề xuất chuyển lớp" (GVCN)',
    user: HA,
    url: '/hoc-vien/lop/3',
    buoc: async (page) => {
      await page.locator('tbody tr', { has: page.getByRole('link', { name: 'Chu Nhật Minh' }) }).locator('button[aria-label="Thao tác khác"]').click();
      await page.getByRole('menuitem', { name: /Đề xuất chuyển lớp/ }).click();
      await hop(page).waitFor();
      await page.setViewportSize({ width: 1440, height: 600 });
      await page.waitForTimeout(300);
    },
    vung: hop,
    panel: true,
    le: 0,
    marks: [
      { n: 1, loc: (p) => hop(p).locator('select').nth(0), pad: 14, ghi: 'Chọn "Chi nhánh" của lớp em muốn chuyển tới.' },
      { n: 2, loc: (p) => hop(p).locator('select').nth(1), pad: 14, ghi: 'Chọn "Lớp chuyển đến" (không bắt buộc; có thể để Quản lý chọn).' },
      { n: 3, loc: (p) => hop(p).locator('input[aria-label="Từ tuần"]').locator('xpath=..'), pad: 14, ghi: 'Chọn "Từ tuần" nếu muốn em chuyển từ một tuần nhất định (không bắt buộc).' },
      { n: 4, loc: (p) => hop(p).locator('textarea'), pad: 14, ghi: 'Ô "Lý do" (bắt buộc, ít nhất 15 ký tự; số ký tự hiện ở góc phải).' },
      { n: 5, loc: (p) => hop(p).getByText(/Gửi thành thẻ trong Chờ duyệt/), pad: 14, ghi: 'Đề xuất đi tới hộp Chờ duyệt của Quản lý (hạn 5 ngày); Quản lý duyệt là ra quyết định chuyển lớp.' },
      { n: 6, loc: (p) => hop(p).getByRole('button', { name: 'Gửi đề xuất' }), pad: 14, ghi: 'Bấm "Gửi đề xuất" để gửi cho Quản lý (chỉ bấm khi đã đủ lý do).' },
    ],
    ghi_chu: 'Học viên dùng: Chu Nhật Minh (MB FT 101). Bản GVCN chỉ có Chi nhánh, Lớp chuyển đến, Từ tuần, Lý do — KHÔNG có ô "hướng đi" (lên lớp / học lại / FT / bảo lưu / dừng học). Các hướng đó nằm ở panel "Lộ trình tiếp theo" của lớp thường (menu ⋯ dòng học viên MB FOU 12). Chỉ mở, không gửi.',
  },
  {
    id: 'g-44-ban-giao',
    tieu_de: 'Panel "Bàn giao · MB FOU 22" (GVCN)',
    user: HA,
    url: '/',
    w: 1320,
    buoc: async (page) => {
      await page.locator('main button:text-is("Bàn giao")').first().click();
      await hop(page).waitFor();
      await page.setViewportSize({ width: 1320, height: 660 });
      await page.waitForTimeout(300);
    },
    vung: hop,
    panel: true,
    le: 0,
    marks: [
      { n: 1, loc: (p) => hop(p).locator('[role="listbox"]'), pad: 6, ghi: 'Danh sách em cần bàn giao; bấm tên một em để xem và điền phiếu của em đó (nhãn "Môn 3/4" cho biết đã có mấy môn).' },
      { n: 2, loc: (p) => hop(p).locator('section[aria-label="Hệ thống tự điền"]'), pad: 14, ghi: '"Hệ thống tự điền · chỉ đọc": kết quả, Case đang mở, Ý thức, việc còn dở của em.' },
      { n: 3, loc: (p) => hop(p).getByRole('button', { name: 'Điền thay' }).locator('xpath=..'), pad: 14, ghi: 'Môn GVBM chưa viết ("Chưa có"): bấm "Nhắc" để nhắc GVBM hoặc "Điền thay" để GVCN tự ghi một câu.' },
      { n: 4, loc: (p) => hop(p).locator('textarea'), pad: 14, ghi: 'Ô "Nhận xét chung của GVCN" (bắt buộc, ít nhất 15 ký tự).' },
      { n: 5, loc: (p) => hop(p).getByRole('button', { name: 'GVCN xác nhận bàn giao' }), pad: 14, ghi: 'Bấm "GVCN xác nhận bàn giao" khi đã có nhận xét chung (nút mờ nếu chưa đủ).' },
    ],
    ghi_chu: 'Việc "Bàn giao 5 em · MB FOU 22" ở Việc hôm nay của Hà (Hà là GVCN lớp này và cũng dạy L nên việc "Bàn giao môn L" cũng mở ra đúng panel này). Em đang chọn: Lâm Gia Bảo CT (chờ môn P). Chỉ mở, không bấm Nhắc / Điền thay / xác nhận.',
  },
  {
    id: 'g-44b-ban-giao-gvbm',
    tieu_de: 'Panel "Bàn giao môn P" (GVBM)',
    user: 9,
    url: '/',
    buoc: async (page) => {
      await page.locator('main button:text-is("Bàn giao môn P")').first().click();
      await hop(page).waitFor();
      await page.setViewportSize({ width: 1440, height: 520 });
      await page.waitForTimeout(300);
    },
    vung: hop,
    panel: true,
    le: 0,
    marks: [
      { n: 1, loc: (p) => hop(p).getByText('Kết quả', { exact: true }), pad: 14, ghi: 'Cột "Kết quả" của từng em (chỉ đọc) để GVBM nhớ lại em học thế nào.' },
      { n: 2, loc: (p) => hop(p).locator('input').first(), pad: 14, ghi: 'Ô "Viết một câu…": GVBM ghi một câu về em ở môn P; tự lưu khi rời ô.' },
      { n: 3, loc: (p) => hop(p).getByText(/Lưu từng dòng khi rời ô/), pad: 14, ghi: 'Dòng đếm: cho biết đã ghi bao nhiêu em (ví dụ 0/2 đã có).' },
      { n: 4, loc: (p) => hop(p).getByRole('button', { name: 'Xong', exact: true }), pad: 14, ghi: 'Bấm "Xong" để đóng panel khi đã ghi đủ các em.' },
    ],
    ghi_chu: 'Tài khoản Phạm Thu Trang (GVBM thuần, id 9), việc "Bàn giao môn P" của lớp MB FOU 23 (2 em). Không gõ gì vào ô.',
  },
  {
    id: 'g-45-yeu-cau-cua-toi',
    tieu_de: 'Công việc · tab "Yêu cầu của tôi"',
    user: HA,
    url: '/cong-viec/yeu-cau',
    vung: (p) => p.locator('main article').nth(5),
    marks: [
      { n: 1, loc: (p) => p.locator('main article').nth(5).getByText('Chờ duyệt', { exact: true }), ghi: 'Nhãn "Chờ duyệt": Quản lý chưa quyết; góc phải có "Còn n ngày" và hạn.' },
      { n: 2, loc: (p) => p.locator('main article').nth(6).getByText(/^Tự đóng ·/), ghi: 'Nhãn "Tự đóng": hệ thống tự đóng yêu cầu (hết hạn hoặc không còn cần).' },
      { n: 3, loc: (p) => p.locator('main article').nth(7).getByText(/^Bị từ chối ·/), ghi: 'Nhãn "Bị từ chối": Quản lý đã từ chối (kèm ngày).' },
      { n: 4, loc: (p) => p.locator('main article').nth(7).getByText(/từ chối 14[/]09/), ghi: 'Lý do Quản lý từ chối, ghi ngay trong thẻ.' },
      { n: 5, loc: (p) => p.locator('main article').nth(7).getByRole('link', { name: 'Mở' }), ghi: 'Bấm "Mở" để xem chi tiết yêu cầu.' },
    ],
    ghi_chu: 'Tab này tên thật là "Yêu cầu của tôi" cạnh tab "Hỗ trợ học viên" (không phải "Việc học viên"). Đầu trang có dòng "6 đang chờ Quản lý · 8 đã xử lý (60 ngày)". Tab này KHÔNG có nút "Sửa và gửi lại" — nút đó nằm ở khối "Yêu cầu của tôi" trên Tổng quan (ảnh g-45b). Ảnh cắt từ thẻ thứ 6 (Chờ duyệt) tới thẻ thứ 8 (Bị từ chối) cho gọn.',
  },
  {
    id: 'g-45b-yeu-cau-tong-quan',
    tieu_de: 'Tổng quan · khối "Yêu cầu của tôi" có nút "Sửa và gửi lại"',
    user: HA,
    url: '/',
    vung: kh,
    marks: [
      { n: 1, loc: (p) => kh(p).getByText(/chờ duyệt/).first().locator('xpath=..'), pad: 6, ghi: 'Tóm tắt: bao nhiêu yêu cầu đang chờ duyệt và bao nhiêu bị từ chối.' },
      { n: 2, loc: (p) => kh(p).locator('div.grid').first(), pad: 2, ghi: 'Mỗi yêu cầu bị từ chối là một dòng: tên yêu cầu, lý do Quản lý từ chối ngay dưới.' },
      { n: 3, loc: (p) => kh(p).getByRole('link', { name: 'Sửa và gửi lại' }).first(), pad: 14, ghi: 'Bấm "Sửa và gửi lại" để chỉnh nội dung rồi gửi lại cho Quản lý.' },
      { n: 4, loc: (p) => kh(p).getByRole('link', { name: /Mở Yêu cầu của tôi/ }), pad: 14, ghi: 'Bấm "Mở Yêu cầu của tôi →" để vào danh sách đầy đủ.' },
    ],
    ghi_chu: 'Chỉ chụp, không bấm "Sửa và gửi lại".',
  },
];
