// Sổ Quản lý, nhóm 1: Tổng quan, Phân tích, Học viên & Lớp, tạo lớp, hồ sơ học viên. Tài khoản Quản lý Monbay (Vy, id 2). CHỈ ĐỌC.
const QL = 2;
const DLG = (p) => p.locator('[role="dialog"]').last();
const CHA = (loc, xp) => loc.first().locator(`xpath=${xp}`);

export const ANH_Q1 = [
  {
    id: 'q-01-tong-quan', tieu_de: 'Tổng quan › Việc hôm nay', user: QL, url: '/', w: 1280,
    vung: (p) => p.locator('#can-xu-ly').locator('xpath=ancestor::*[contains(@class,"card")][1]'),
    ghi_chu: 'Vy (id 2, MB), ngày demo 14/09/2026.',
    marks: [
      { n: 1, loc: (p) => p.getByRole('tablist', { name: 'Tổng quan' }), ghi: 'Hai tab của Tổng quan: "Việc hôm nay" và "Phân tích".' },
      { n: 2, loc: (p) => p.locator('main .card').first(), pad: 4, ghi: 'Dải "Chờ duyệt": tổng số thẻ đang chờ, số quá hạn và số thẻ Báo QL; dòng dưới chia theo phân loại.' },
      { n: 3, loc: (p) => p.getByText('Mở hộp duyệt', { exact: true }), ghi: 'Bấm "Mở hộp duyệt" để vào Công việc › Chờ duyệt.' },
      { n: 4, loc: (p) => p.locator('#can-xu-ly'), pad: 6, ghi: '"Cần xử lý": việc giáo viên đang trễ và việc chờ bạn sắp xếp, quá hạn xếp trên cùng.' },
      { n: 5, loc: (p) => p.getByText('Người phụ trách', { exact: true }).first(), ghi: 'Cột "Người phụ trách": giáo viên đang giữ việc, hoặc "Bạn".' },
      { n: 6, loc: (p) => p.getByText('Xem và nhắc', { exact: true }).first(), ghi: '"Xem và nhắc" mở Công việc đã lọc sẵn, có tên từng người và nút Nhắc.' },
    ],
  },
  {
    id: 'q-02-so-lieu', tieu_de: 'Tổng quan › Số liệu', user: QL, url: '/', w: 1280,
    vung: (p) => p.locator('#so-lieu').locator('xpath=..'),
    ghi_chu: 'Vy, khung Fast Track.',
    marks: [
      { n: 1, loc: (p) => p.getByRole('group', { name: 'Khung lớp' }).or(p.locator('[aria-label="Khung lớp"]')), ghi: 'Công tắc khung: Fast Track hoặc Lớp thường. Chỉ phần Số liệu đổi; Chờ duyệt và Cần xử lý luôn gộp cả hai.' },
      { n: 2, loc: (p) => p.locator('[aria-label="Số liệu chính"]'), ghi: 'Bốn ô số liệu chính; bấm con số để mở danh sách học viên hoặc Case.' },
      { n: 3, loc: (p) => p.getByText('Điểm đáng chú ý', { exact: true }).locator('xpath=ancestor::*[contains(@class,"card")][1]'), pad: 2, ghi: '"Điểm đáng chú ý": điều web thấy cần chú ý, bấm để mở danh sách.' },
      { n: 4, loc: (p) => p.getByText('Lịch sắp tới', { exact: true }).locator('xpath=ancestor::*[contains(@class,"card")][1]'), pad: 2, ghi: '"Lịch sắp tới": các đợt Test trong ba tuần tới.' },
    ],
  },
  {
    id: 'q-03-theo-lop', tieu_de: 'Tổng quan › Theo lớp / Theo giáo viên', user: QL, url: '/', w: 1280,
    buoc: async (p) => { await p.getByText(/^Theo lớp · /).first().scrollIntoViewIfNeeded(); },
    vung: (p) => p.getByText(/^Theo lớp · /).first().locator('xpath=ancestor::*[contains(@class,"card")][1]'),
    marks: [
      { n: 1, loc: (p) => p.locator('[aria-label="Cách xem"]'), ghi: 'Công tắc "Theo lớp | Theo giáo viên".' },
      { n: 2, loc: (p) => p.getByText(/^Theo lớp · /).first(), ghi: 'Bảng theo từng lớp của chi nhánh; số trong ô bấm được.' },
    ],
  },
  {
    id: 'q-04-phan-tich', tieu_de: 'Phân tích › Tổng hợp Test + SOS', user: QL, url: '/phan-tich', w: 1280,
    vung: (p) => p.locator('main').first(),
    marks: [
      { n: 1, loc: (p) => p.locator('[aria-label="Góc nhìn"]'), ghi: 'Năm góc nhìn: Tổng hợp Test + SOS · Tổng hợp vấn đề HV · Hiệu quả PA · Ý thức · Giáo viên.' },
      { n: 2, loc: (p) => p.locator('select[aria-label="Khoảng thời gian"]'), ghi: 'Khoảng thời gian: 4 tuần, 8 tuần, 12 tuần hoặc 6 tháng.' },
      { n: 3, loc: (p) => p.locator('select[aria-label="Lớp"]'), ghi: 'Lọc một lớp hoặc "Mọi lớp".' },
      { n: 4, loc: (p) => p.getByRole('radiogroup', { name: 'Cách xếp dòng' }).or(p.locator('[aria-label="Cách xếp dòng"]')), ghi: 'Cách xếp dòng: theo tuần, lớp, đợt hoặc chi nhánh.' },
      { n: 5, loc: (p) => p.locator('[aria-label="Chú giải màu kết quả"]'), ghi: 'Chú giải màu: Đạt · SOS 1 · SOS 2 · SOS 3 · Tạm thời.' },
      { n: 6, loc: (p) => p.getByRole('button', { name: /Xuất bảng này/ }), ghi: '"Xuất bảng này" tải bảng ra Excel.' },
    ],
  },
  {
    id: 'q-05-phan-tich-van-de', tieu_de: 'Phân tích › Tổng hợp vấn đề HV', user: QL, url: '/phan-tich?goc=van-de', w: 1280,
    vung: (p) => p.locator('main').first(),
    marks: [
      { n: 1, loc: (p) => p.locator('[aria-label="Chỉ vấn đề chính hay cả yếu tố đi kèm"]'), ghi: '"Lỗi chính + phụ" hoặc "Chỉ lỗi chính".' },
      { n: 2, loc: (p) => p.getByRole('switch').first(), ghi: 'Công tắc "Gộp theo loại lỗi chung".' },
      { n: 3, loc: (p) => p.locator('table').first(), ghi: 'Bảng kỹ năng × nhóm nguyên nhân: số học viên, số lớp và số theo từng tháng; bấm số để xem danh sách.' },
    ],
  },
  {
    id: 'q-06-phan-tich-pa', tieu_de: 'Phân tích › Hiệu quả PA', user: QL, url: '/phan-tich?goc=hieu-qua-pa', w: 1280,
    vung: (p) => p.locator('main').first(),
    marks: [
      { n: 1, loc: (p) => p.locator('table').first(), ghi: 'Mỗi dòng là một loại PA: số PA, số học viên, tỷ lệ có cải thiện và thời gian tới cải thiện.' },
      { n: 2, loc: (p) => p.getByRole('button', { name: 'Cách đọc' }).first(), pad: 4, ghi: 'Bấm "Cách đọc" để xem web tính và đọc bảng thế nào; nhãn "Nên dùng" chỉ hiện khi đủ mẫu, "Ít dữ liệu" là chưa đủ để kết luận.' },
    ],
  },
  {
    id: 'q-07-phan-tich-y-thuc', tieu_de: 'Phân tích › Ý thức', user: QL, url: '/phan-tich?goc=y-thuc', w: 1280,
    vung: (p) => p.locator('main').first(),
    marks: [
      { n: 1, loc: (p) => p.getByRole('heading', { name: /^Học viên cần chú ý/ }).locator('xpath=ancestor::*[contains(@class,"card")][1]'), pad: 2, ghi: '"Học viên cần chú ý": bậc hiện tại, bậc kế, số vi phạm chưa xử lý và lần xử lý gần nhất.' },
      { n: 2, loc: (p) => p.getByRole('heading', { name: /^Lớp nhiều vi phạm/ }).locator('xpath=ancestor::*[contains(@class,"card")][1]'), pad: 2, ghi: '"Lớp nhiều vi phạm": xếp theo số vi phạm chưa xử lý.' },
    ],
  },
  {
    id: 'q-08-phan-tich-giao-vien', tieu_de: 'Phân tích › Giáo viên', user: QL, url: '/phan-tich?goc=giao-vien', w: 1280,
    vung: (p) => p.locator('main').first(),
    marks: [
      { n: 1, loc: (p) => p.locator('[aria-label="Khoảng theo tuần hoặc tháng"]'), ghi: 'Xem theo tuần hoặc theo tháng.' },
      { n: 2, loc: (p) => p.locator('[aria-label^="Bảng Phân tích giáo viên"]'), ghi: 'Mỗi ô ghi n/N và phần trăm; màu chỉ ở ô kết quả, dưới 5 mục thì không tô màu. Bảng không xếp hạng, sắp theo tên.' },
    ],
  },
  {
    id: 'q-10-hoc-vien-lop-ql', tieu_de: 'Học viên & Lớp (Quản lý)', user: QL, url: '/hoc-vien', w: 1280,
    vung: (p) => p.locator('main').first(),
    marks: [
      { n: 1, loc: (p) => p.getByRole('button', { name: '+ Lớp mới' }), ghi: '"+ Lớp mới": tạo lớp và phân công giáo viên.' },
      { n: 2, loc: (p) => p.getByRole('button', { name: '+ Học viên' }).first(), ghi: '"+ Học viên": thêm học viên vào một lớp.' },
      { n: 3, loc: (p) => p.getByRole('button', { name: /^Chờ duyệt/ }).first().locator('xpath=..'), ghi: 'Chip lọc có thêm "Chờ duyệt" cho Quản lý.' },
      { n: 4, loc: (p) => p.locator('main button[aria-label^="Thao tác"]').nth(1), ghi: 'Nút ⋯ của lớp: "Chuyển lớp…", "+ Học viên", sửa phân công.' },
    ],
  },
  {
    id: 'q-11-tao-lop', tieu_de: 'Panel "Tạo lớp mới"', user: QL, url: '/hoc-vien', w: 1320, panel: true,
    buoc: async (p) => {
      await p.getByRole('button', { name: '+ Lớp mới' }).click();
      await DLG(p).waitFor();
      await p.setViewportSize({ width: 1320, height: 900 });
      await p.waitForTimeout(400);
    },
    vung: (p) => DLG(p), le: 0,
    ghi_chu: 'Chỉ mở panel, không bấm Tạo lớp.',
    marks: [
      { n: 1, loc: (p) => DLG(p).locator('[aria-label="Kiểu lớp"]'), pad: 6, ghi: 'Chọn Fast Track hoặc Lớp thường.' },
      { n: 2, loc: (p) => DLG(p).getByText(/Lộ trình|Chương trình/).first(), pad: 6, ghi: 'Fast Track chọn lộ trình (LT1, LT2, RF); lớp thường chọn chương trình (FOU, BE, ELE).' },
      { n: 3, loc: (p) => DLG(p).getByText('Số lớp').first(), pad: 6, ghi: 'Số lớp (1–4 chữ số); web hiện trước mã lớp sẽ tạo.' },
      { n: 4, loc: (p) => DLG(p).getByText('Phân công').first(), pad: 6, ghi: 'Khối "Phân công": một môn một người, GVCN phải dạy ít nhất một môn.' },
      { n: 5, loc: (p) => DLG(p).getByRole('button', { name: 'Tạo lớp' }), ghi: 'Bấm "Tạo lớp" khi phân công hợp lệ (nút mờ và có chú thích khi chưa đủ).' },
    ],
  },
  {
    id: 'q-13-menu-hoc-vien-ql', tieu_de: 'Hồ sơ học viên: menu ⋮ của Quản lý', user: QL, url: '/hoc-vien/50', w: 1280,
    buoc: async (p) => {
      await p.setViewportSize({ width: 1280, height: 1200 });
      await p.waitForTimeout(300);
      await p.locator('main button[aria-haspopup]').first().click();
      await p.waitForTimeout(400);
    },
    vung: (p) => p.locator('main').first(),
    marks: [
      { n: 1, loc: (p) => p.locator('main button[aria-haspopup]').first(), ghi: 'Menu ⋮ của Quản lý.' },
      { n: 2, loc: (p) => p.getByRole('menuitem', { name: /^Lộ trình/ }).or(p.getByText('Lộ trình', { exact: true }).last()), pad: 4, ghi: '"Lộ trình": đổi Target hoặc KCK, thi dự kiến, điểm đầu vào (chỉ Quản lý).' },
      { n: 3, loc: (p) => p.getByText(/^Chuyển lớp/).last(), pad: 4, ghi: '"Chuyển lớp…": ra lệnh chuyển lớp cho em.' },
      { n: 4, loc: (p) => p.getByText('Tạm dừng học', { exact: false }).last(), pad: 4, ghi: '"Tạm dừng học", "Kết thúc học", "Lưu trữ": hiệu lực ngay.' },
    ],
  },
];
