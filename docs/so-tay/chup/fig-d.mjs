// NHÓM D — Ý thức & Phối hợp (G11). Chỉ đọc: mở trang/panel/tab, không bấm Lưu/Xác nhận/Ghi nhận/Gửi/Đề xuất/Xoá/Bỏ.
const HA = 7;
const TRANG = 9;
const W = 1100; // bề rộng cửa sổ chụp trang (ảnh cắt ≤ ~1000px CSS)

const hop = (ten) => (p) => p.locator(`[role="dialog"][aria-label="${ten}"]`);
/** Khung panel bên trong (không lấy lớp phủ tối) để cắt ảnh gọn. */
const khungPanel = (ten) => (p) => hop(ten)(p).locator(':scope > div').nth(1);
/** Cả trường (nhãn + ô) để số tròn không đè lên nhãn. */
const truong = (loc) => loc.locator("xpath=ancestor::*[self::label or (self::div and not(contains(concat(' ',@class,' '),' contents ')))][1]");
/** Hộp bao nhiều phần tử (vd ba bậc đã qua) — giả Locator đủ dùng cho lib. */
const hopNhieu = (loc) => ({
  first() { return this; },
  waitFor: (o) => loc.first().waitFor(o),
  async boundingBox() {
    const bs = [];
    for (const l of await loc.all()) { const b = await l.boundingBox(); if (b) bs.push(b); }
    if (!bs.length) return null;
    const x0 = Math.min(...bs.map((b) => b.x)), y0 = Math.min(...bs.map((b) => b.y));
    const x1 = Math.max(...bs.map((b) => b.x + b.width)), y1 = Math.max(...bs.map((b) => b.y + b.height));
    return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
  },
});
const thang = (p) => p.locator('ol[aria-label^="Thang xử lý"]');
const thanhViec = (p) => p.getByText(/chưa xem · hạn|bắt buộc xử lý · |chờ QL · hạn|Đề xuất .* chờ QL/).first().locator('xpath=..');
const nhan = (p, ten) => p.getByText(ten, { exact: true });

/** Mở panel từ nút `nut` rồi hạ chiều cao cửa sổ để panel gọn (panel: true không tự nới). */
const moPanel = (nut, ten) => async (page) => {
  await page.setViewportSize({ width: 1440, height: 760 });
  await page.getByRole('button', { name: nut }).first().click();
  await page.locator(`[role="dialog"][aria-label="${ten}"]`).waitFor({ state: 'visible' });
  await page.waitForTimeout(500);
};

export const ANH_D = [
  {
    id: 'g-30-ghi-vi-pham',
    tieu_de: 'Panel "Ghi vi phạm" (mở từ hồ sơ lớp)',
    user: TRANG,
    url: '/hoc-vien/lop/3?tab=y-thuc',
    panel: true,
    buoc: moPanel('+ Ghi vi phạm', 'Ghi vi phạm'),
    vung: khungPanel('Ghi vi phạm'),
    le: 4,
    marks: [
      { n: 1, loc: (p) => truong(hop('Ghi vi phạm')(p).locator('select').first()), pad: 8, ghi: 'Học viên: bấm để chọn em bị ghi vi phạm (ô này chỉ có khi ghi từ hồ sơ lớp; ghi từ hồ sơ một em thì em đã được chọn sẵn).' },
      { n: 2, loc: (p) => truong(hop('Ghi vi phạm')(p).locator('input').first()), pad: 8, ghi: 'Ngày: ngày vi phạm xảy ra, mặc định là hôm nay; bấm để chọn ngày khác.' },
      { n: 3, loc: (p) => truong(hop('Ghi vi phạm')(p).locator('select').nth(1)), pad: 8, ghi: 'Môn: không bắt buộc; chọn môn đang dạy khi vi phạm xảy ra.' },
      { n: 4, loc: (p) => hop('Ghi vi phạm')(p).getByRole('button', { name: 'Chuyên cần' }).locator("xpath=ancestor::div[not(contains(concat(' ',@class,' '),' contents '))][2]"), pad: 8, ghi: 'Nhóm: bấm chọn một trong 5 nhóm: Chuyên cần, BTVN, Thái độ / hành vi, Kỷ luật lớp học, Khác.' },
      { n: 5, loc: (p) => truong(hop('Ghi vi phạm')(p).locator('textarea')), pad: 8, ghi: 'Mô tả: viết rõ chuyện gì đã xảy ra (ít nhất 10 ký tự, có bộ đếm ở góc phải).' },
      { n: 6, loc: (p) => hop('Ghi vi phạm')(p).getByRole('button', { name: 'Lưu', exact: true }), ghi: 'Lưu: bấm để ghi vi phạm; sau khi lưu, panel chuyển sang bước "Đã ghi" để đính kèm bằng chứng (không bắt buộc).' },
    ],
    ghi_chu: 'Tài khoản Phạm Thu Trang (GVBM) mở từ hồ sơ lớp MB FT 101. Form để trống (chỉ mở, không lưu). Khối "Bằng chứng · không bắt buộc" chỉ hiện SAU khi bấm Lưu nên không chụp được; cảnh báo trùng (cùng em, cùng nhóm, cùng ngày) chỉ hiện sau khi chọn đủ ba ô, không chụp để không nhập dữ liệu.',
  },

  {
    id: 'g-31-thang-xu-ly',
    tieu_de: 'Thang xử lý một dòng của Nguyễn Minh An',
    user: HA,
    url: '/hoc-vien/1?tab=y-thuc',
    w: W,
    vung: (p) => thang(p).locator('xpath=../..'),
    le: 18,
    marks: [
      { n: 1, loc: thanhViec, ghi: 'Thanh việc: một câu cho biết việc cần làm kế tiếp với em này, kèm nút hành động bên phải ("Ghi nhận 1").' },
      { n: 2, loc: (p) => hopNhieu(p.locator('ol[aria-label^="Thang xử lý"] li[aria-label$="đã xử lý"]')), ghi: 'Các bậc có dấu ✓ (Report 1, Report 2, WL 1): em đã được xử lý ở các bậc này.' },
      { n: 3, loc: (p) => p.locator('li[aria-label$="lần xử lý kế tiếp"]'), ghi: '"Report 4 + Meeting CX/GĐCN · lần này": bậc kế tiếp sẽ dùng cho lần xử lý sau.' },
      { n: 4, loc: (p) => p.locator('li[aria-label$="cần QL duyệt"]'), ghi: '"WL 3 · QL": bậc cao nhất, viền đứt vì cần Quản lý duyệt, giáo viên không tự xác nhận được.' },
      { n: 5, loc: (p) => p.getByRole('button', { name: /Đề xuất QL duyệt/ }), pad: 6, ghi: 'Đề xuất QL duyệt…: bấm để đề xuất việc nặng hơn thang (WL 3, Meeting CX/GĐCN, Đình chỉ học tạm thời…).' },
      { n: 6, loc: (p) => p.getByRole('button', { name: 'Xem', exact: true }).first(), ghi: 'Xem: bấm để xem lại một lần xử lý đã ghi (dòng "XỬ LÝ WL 1": ngày, người thực hiện, mô tả, tệp).' },
    ],
    ghi_chu: 'Nguyễn Minh An có thang Report 1 → Report 2 → WL 1 (đã qua). Em chưa bắt buộc xử lý nên KHÔNG có nút "Xác nhận xử lý" ở thanh việc; nút đó xem ở g-33 (Phạm Bảo Ngọc) và g-32 (Lê Quang Huy). Dòng "Đã xử lý trước khi dùng web? Khai bậc" chỉ hiện khi chưa có bậc nào, nên không có ở An.',
  },

  {
    id: 'g-32-xac-nhan-xu-ly',
    tieu_de: 'Panel "Xác nhận xử lý" của Lê Quang Huy',
    user: HA,
    url: '/hoc-vien/3?tab=y-thuc',
    panel: true,
    buoc: moPanel('Xác nhận xử lý · Report 1', 'Xác nhận xử lý'),
    vung: khungPanel('Xác nhận xử lý'),
    le: 4,
    marks: [
      { n: 1, loc: (p) => hop('Xác nhận xử lý')(p).getByText(/lần xử lý thứ 1/).locator('xpath=..'), pad: 8, ghi: 'Bậc xử lý: web tự điền theo thang ("Report 1 · lần xử lý thứ 1"), không phải chọn.' },
      { n: 2, loc: (p) => hop('Xác nhận xử lý')(p).getByRole('button', { name: 'Khai bậc trước' }), pad: 5, ghi: 'Khai bậc trước: bấm nếu em đã bị xử lý trước khi dùng web (xem g-35).' },
      { n: 3, loc: (p) => hop('Xác nhận xử lý')(p).locator('input[type="checkbox"]').first().locator('xpath=../../..'), pad: 10, ghi: 'Vi phạm đưa vào: mặc định đã tích mọi vi phạm chưa xử lý; bỏ tích vi phạm nào không thuộc lần xử lý này.' },
      { n: 4, loc: (p) => truong(hop('Xác nhận xử lý')(p).locator('input[type="text"], input:not([type])').first()), pad: 8, ghi: 'Ngày thực hiện: ngày thực tế làm việc xử lý, mặc định hôm nay.' },
      { n: 5, loc: (p) => hop('Xác nhận xử lý')(p).locator('button').filter({ hasText: /^Đổi$/ }).locator("xpath=ancestor::div[not(contains(concat(' ',@class,' '),' contents '))][2]"), pad: 8, ghi: 'Người thực hiện: mặc định là bạn; bấm "Đổi" nếu người khác làm.' },
      { n: 6, loc: (p) => truong(hop('Xác nhận xử lý')(p).locator('textarea')), pad: 8, ghi: 'Mô tả: ghi đã làm gì, ít nhất 10 ký tự.' },
      { n: 7, loc: (p) => hop('Xác nhận xử lý')(p).getByRole('button', { name: /^Xác nhận xử lý · Report 1$/ }), ghi: 'Xác nhận xử lý · Report 1: bấm để ghi lần xử lý (tệp hoặc liên kết đính kèm sau khi lưu, không bắt buộc).' },
    ],
    ghi_chu: 'Lê Quang Huy (3 vi phạm Cần xử lý, hạn 14/09). Chỉ mở panel, không nhập, không bấm nút xác nhận. Tệp/liên kết chỉ đính kèm được sau khi lưu nên panel chỉ có dòng nhắc.',
  },

  {
    id: 'g-33-bat-buoc-qua-han',
    tieu_de: 'Bắt buộc xử lý và quá hạn — Phạm Bảo Ngọc',
    user: HA,
    url: '/hoc-vien/4?tab=y-thuc',
    w: W,
    vung: (p) => thang(p).locator('xpath=../..'),
    le: 18,
    marks: [
      { n: 1, loc: thanhViec, ghi: 'Thanh việc màu đỏ cam: "3 vi phạm bắt buộc xử lý · quá hạn 1 ngày · đã báo QL" (xử lý phải xong trong 5 ngày, quá hạn thì web báo Quản lý).' },
      { n: 2, loc: (p) => p.getByRole('button', { name: /^Xác nhận xử lý · Report 2$/ }), ghi: 'Xác nhận xử lý · Report 2: bấm để mở panel ghi lần xử lý ở bậc kế tiếp.' },
      { n: 3, loc: (p) => p.locator('li[aria-label$="lần xử lý kế tiếp"]'), ghi: '"Report 2 · lần này": bậc phải xử lý ở thang.' },
      { n: 4, loc: (p) => nhan(p, 'Quá hạn 1 ngày'), ghi: 'Nhãn "Quá hạn 1 ngày" ở từng vi phạm: đã quá hạn xử lý 1 ngày. Các nhãn khác: Mới, Đã ghi nhận · vẫn tính, Cần xử lý, Chờ QL duyệt, Đã xử lý.' },
    ],
    ghi_chu: 'Phạm Bảo Ngọc: "Quá hạn 1 ngày". Khi vi phạm đã bắt buộc xử lý thì các dòng không còn nút "Ghi nhận" (chỉ còn nhãn). Xem thêm g-33b (vi phạm Mới + nút Ghi nhận).',
  },

  {
    id: 'g-33b-ghi-nhan-moi',
    tieu_de: 'Vi phạm Mới và nút "Ghi nhận" — Nguyễn Minh An',
    user: HA,
    url: '/hoc-vien/1?tab=y-thuc',
    w: W,
    vung: (p) => thang(p).locator('xpath=../..'),
    le: 18,
    marks: [
      { n: 1, loc: thanhViec, ghi: 'Thanh việc: "1 vi phạm chưa xem · hạn 16/09": hạn để xem và quyết định (chưa bắt buộc xử lý).' },
      { n: 2, loc: (p) => p.getByRole('button', { name: /^Ghi nhận 1$/ }), ghi: 'Ghi nhận 1: bấm để đánh dấu đã xem tất cả vi phạm mới.' },
      { n: 3, loc: (p) => nhan(p, 'Mới'), ghi: 'Nhãn "Mới": vi phạm vừa được ghi, chưa ai xem.' },
      { n: 4, loc: (p) => p.getByRole('button', { name: 'Ghi nhận', exact: true }).nth(1), ghi: 'Ghi nhận: đã xem, không cần xử lý; vi phạm vẫn được đếm vào luật 3 vi phạm / 2 tuần (nhãn đổi thành "Đã ghi nhận · vẫn tính").' },
    ],
    ghi_chu: 'Nguyễn Minh An có 1 vi phạm Mới (12/09). KHÔNG bấm Ghi nhận. Ảnh nối g-33: cho thấy nút Ghi nhận còn khi chưa bắt buộc xử lý.',
  },

  {
    id: 'g-34-de-xuat-ql-duyet',
    tieu_de: 'Đề xuất WL 3 chờ QL duyệt — Lương Gia Bảo',
    user: HA,
    url: '/hoc-vien/89?tab=y-thuc',
    w: W,
    vung: (p) => thang(p).locator('xpath=../..'),
    le: 18,
    marks: [
      { n: 1, loc: thanhViec, ghi: 'Thanh việc màu tím: "Đề xuất WL 3 · chờ QL · hạn 15/09": đề xuất đã gửi, Quản lý trả lời trong 5 ngày.' },
      { n: 2, loc: (p) => p.locator('li[aria-label$="lần xử lý kế tiếp"]'), ghi: '"WL 3 · lần này": bậc đang đề xuất.' },
      { n: 3, loc: (p) => p.getByRole('button', { name: 'Xem', exact: true }).first(), ghi: 'Xem: bấm để mở đề xuất, xem lý do, các vi phạm đưa vào và tệp/liên kết bằng chứng.' },
      { n: 4, loc: (p) => p.getByText(/3 vi phạm · 1 tệp/).first(), pad: 6, ghi: 'Dòng "XỬ LÝ WL 3": 3 vi phạm · 1 tệp (bằng chứng) · Chờ QL duyệt.' },
    ],
    ghi_chu: 'Lương Gia Bảo: đề xuất WL 3 chờ QL duyệt, có 1 bằng chứng (xem g-34b). Không có thẻ "đã duyệt" nên chưa có nút "Đánh dấu đã thực hiện".',
  },

  {
    id: 'g-34b-xem-de-xuat',
    tieu_de: 'Panel xem đề xuất WL 3 (có bằng chứng)',
    user: HA,
    url: '/hoc-vien/89?tab=y-thuc',
    panel: true,
    buoc: moPanel('Xem', 'WL 3'),
    vung: khungPanel('WL 3'),
    le: 4,
    marks: [
      { n: 1, loc: (p) => hop('WL 3')(p).getByText(/Chờ QL duyệt · bậc/), pad: 10, ghi: 'Trạng thái: "Chờ QL duyệt · bậc 6 trên thang".' },
      { n: 2, loc: (p) => hop('WL 3')(p).getByText(/Gửi 11\/09/), pad: 10, ghi: 'Ngày gửi đề xuất và hạn Quản lý trả lời (trước 15/09).' },
      { n: 3, loc: (p) => hop('WL 3')(p).getByText(/^VI PHẠM · 3$/i).locator('xpath=..'), pad: 10, ghi: 'Vi phạm: danh sách vi phạm đưa vào đề xuất.' },
      { n: 4, loc: (p) => hop('WL 3')(p).getByText('TỆP HOẶC LIÊN KẾT', { exact: false }).locator('xpath=..'), pad: 10, ghi: 'Tệp hoặc liên kết: bằng chứng đã đính kèm (đề xuất ngoài thang bắt buộc có bằng chứng).' },
    ],
    ghi_chu: 'Chỉ mở panel "WL 3" của Lương Gia Bảo từ nút Xem, không bấm Gỡ/Đính kèm.',
  },

  {
    id: 'g-34c-de-xuat-ngoai-thang',
    tieu_de: 'Panel "Đề xuất QL duyệt" (loại ngoài thang) — Lê Quang Huy',
    user: HA,
    url: '/hoc-vien/3?tab=y-thuc',
    panel: true,
    buoc: moPanel('Đề xuất QL duyệt…', 'Đề xuất QL duyệt'),
    vung: khungPanel('Đề xuất QL duyệt'),
    le: 4,
    marks: [
      { n: 1, loc: (p) => hop('Đề xuất QL duyệt')(p).getByRole('button', { name: 'Meeting CX/GĐCN' }).locator('xpath=..'), pad: 8, ghi: 'Loại cần QL duyệt: chọn Meeting CX/GĐCN, Đình chỉ học tạm thời hoặc Khác.' },
      { n: 2, loc: (p) => hop('Đề xuất QL duyệt')(p).getByText(/Duyệt đề xuất ngoài thang/), pad: 10, ghi: 'Lưu ý: duyệt đề xuất ngoài thang không đổi bậc; bậc kế vẫn là Report 1.' },
      { n: 3, loc: (p) => hop('Đề xuất QL duyệt')(p).getByText(/^VI PHẠM ĐƯA VÀO/i).locator('xpath=..'), pad: 10, ghi: 'Vi phạm đưa vào: các vi phạm đi kèm đề xuất.' },
      { n: 4, loc: (p) => truong(hop('Đề xuất QL duyệt')(p).locator('textarea')), pad: 8, ghi: 'Lý do đề xuất: mô tả bắt buộc, ít nhất 10 ký tự.' },
      { n: 5, loc: (p) => hop('Đề xuất QL duyệt')(p).getByRole('button', { name: 'Tiếp: đính kèm bằng chứng' }), ghi: 'Tiếp: đính kèm bằng chứng: sang bước 2 để gắn bằng chứng (bắt buộc) rồi gửi QL.' },
    ],
    ghi_chu: 'Chỉ mở panel từ link "Đề xuất QL duyệt…" ở hồ sơ Lê Quang Huy; không nhập, không bấm "Tiếp". Bước 2 (Gửi QL duyệt · trả lời trong 5 ngày) không chụp vì phải nhập mô tả trước.',
  },

  {
    id: 'g-35-khai-bac',
    tieu_de: 'Panel "Khai bậc" (học sinh cũ)',
    user: HA,
    url: '/hoc-vien/3?tab=y-thuc',
    panel: true,
    buoc: moPanel('Khai bậc', 'Khai bậc'),
    vung: khungPanel('Khai bậc'),
    le: 4,
    marks: [
      { n: 1, loc: (p) => hop('Khai bậc')(p).getByText(/khai một lần/), pad: 10, ghi: 'Khai bậc chỉ được làm một lần cho mỗi thang; sau đó chỉ Quản lý sửa được.' },
      { n: 2, loc: (p) => hop('Khai bậc')(p).getByRole('button', { name: 'Report 1' }).locator('xpath=..'), pad: 8, ghi: 'Bậc cao nhất đã xử lý trước khi dùng web: bấm chọn một bậc (Report 1 … WL 2).' },
      { n: 3, loc: (p) => truong(hop('Khai bậc')(p).locator('input').first()), pad: 8, ghi: 'Tháng xử lý: không bắt buộc.' },
      { n: 4, loc: (p) => truong(hop('Khai bậc')(p).locator('textarea')), pad: 8, ghi: 'Ghi chú: bắt buộc (ví dụ "Report 2 tháng 8, cô Hà gửi PH").' },
      { n: 5, loc: (p) => hop('Khai bậc')(p).getByRole('button', { name: 'Khai bậc', exact: true }).last(), ghi: 'Khai bậc: bấm để lưu (làm một lần, chỉ Quản lý sửa sau).' },
    ],
    ghi_chu: 'Mở từ link "Khai bậc" dưới thanh việc ở hồ sơ Lê Quang Huy (chưa có bậc nào). Không thấy việc "Khai bậc Ý thức HS cũ" ở Việc hôm nay của Hà trong demo nên lấy đường vào từ hồ sơ học viên.',
  },

  {
    id: 'g-36-phoi-hop-sos',
    tieu_de: 'Tab "Phối hợp SOS" của hồ sơ lớp',
    user: HA,
    url: '/hoc-vien/lop/3?tab=y-thuc',
    w: W,
    buoc: async (page) => {
      await page.getByRole('tab', { name: /Phối hợp SOS/ }).click();
      await page.waitForTimeout(700);
    },
    vung: (p) => p.getByText('Đỗ Minh Khôi', { exact: true }).first().locator('xpath=ancestor::*[self::section or self::article or self::li or self::div][3]'),
    le: 18,
    marks: [
      { n: 1, loc: (p) => p.getByText('Hiện cả lượt đã xong'), pad: 6, ghi: 'Hiện cả lượt đã xong: tích để xem cả những lượt SOS đã hoàn thành.' },
      { n: 2, loc: (p) => p.getByText('1/3 việc hoàn thành').locator('xpath=..'), ghi: '"1/3 việc hoàn thành": số việc phối hợp đã làm xong của em ở lượt Mock này.' },
      { n: 3, loc: (p) => p.getByRole('button', { name: 'Xác nhận' }).first(), ghi: 'Xác nhận: bấm khi việc trao đổi đã làm xong, rồi điền ngày và người thực hiện.' },
      { n: 4, loc: (p) => p.getByRole('button', { name: /^Bỏ/ }).first(), ghi: 'Bỏ ▾: bấm để bỏ việc không cần làm nữa; bắt buộc ghi lý do.' },
      { n: 5, loc: (p) => p.getByRole('button', { name: '+ Thêm việc' }).first(), ghi: '+ Thêm việc: bấm để thêm một việc phối hợp mới cho lượt này.' },
    ],
    ghi_chu: 'Hồ sơ lớp MB FT 101, tab "Phối hợp SOS" (6 lượt). Thẻ đầu: Đỗ Minh Khôi MT2 · SOS 2 (1/3 việc xong). Không có việc "Meeting CX/GĐCN (sau Mock)" hay "Báo phụ huynh qua TVV" ở thẻ đầu; chỉ chụp các việc Trao đổi.',
  },

  {
    id: 'g-37-y-thuc-lop',
    tieu_de: 'Ý thức & Phối hợp của lớp — nhóm em theo trạng thái',
    user: HA,
    url: '/hoc-vien/lop/3?tab=y-thuc',
    w: W,
    vung: (p) => p.locator('main').first(),
    cao: 800,
    le: 18,
    marks: [
      { n: 1, loc: (p) => p.locator('section[aria-label^="Quá hạn"]'), ghi: 'QUÁ HẠN: các em đã quá hạn xử lý (hiện "⚠ quá hạn n ngày"); việc gấp nhất.' },
      { n: 2, loc: (p) => p.locator('section[aria-label^="Bắt buộc xử lý"]'), ghi: 'BẮT BUỘC XỬ LÝ: các em đủ 3 vi phạm / 2 tuần, phải xử lý trước hạn ghi bên phải.' },
      { n: 3, loc: (p) => p.locator('section[aria-label^="Chờ QL duyệt"]'), ghi: 'CHỜ QL DUYỆT: đề xuất đã gửi, đang chờ Quản lý.' },
      { n: 4, loc: (p) => p.locator('section[aria-label^="Mới"]'), ghi: 'MỚI, CHƯA GHI NHẬN: vi phạm vừa ghi, chưa ai xem.' },
      { n: 5, loc: (p) => p.locator('section[aria-label^="Đã xử lý"]'), ghi: 'ĐÃ XỬ LÝ (7 NGÀY): các em vừa được xử lý trong 7 ngày gần đây.' },
    ],
    ghi_chu: 'Lớp MB FT 101, tab "Vi phạm & xử lý" xem theo học sinh. Nhóm: Quá hạn (Vũ Hải Đăng, Phạm Bảo Ngọc), Bắt buộc xử lý (Lê Quang Huy, Kiều Minh Đức), Chờ QL duyệt (Lương Gia Bảo), Mới (Mạc Tuấn Kiệt, Nguyễn Minh An), Đã xử lý (Hà Phương Linh).',
  },
];
