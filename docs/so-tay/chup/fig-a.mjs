// Nhóm A: khung chung, Việc hôm nay, Lịch Test, lưới nhập điểm, hồ sơ Mock, Học viên & Lớp (tài khoản giáo viên).
// Hộp thoại nổi: lấy phần tử role=dialog trong cùng (lớp ngoài là nền mờ).
const DLG = (p) => p.locator('[role="dialog"]').last();
const VIEC = 'section[aria-labelledby="viec-cua-toi"]';

export const ANH_A = [
  {
    id: 'g-00-dang-nhap', tieu_de: 'Màn đăng nhập', user: null, url: '/',
    // Ẩn phần chỉ có ở bản demo (nhãn Dữ liệu demo, tab Vào nhanh, hộp ghi chú tài khoản mẫu).
    buoc: async (p) => {
      await p.evaluate(() => {
        for (const e of document.querySelectorAll('span,button,div')) {
          const t = e.textContent.trim();
          if (e.children.length === 0 && (t === 'Dữ liệu demo' || t === 'Vào nhanh bằng tài khoản demo')) e.style.display = 'none';
        }
        const hop = document.querySelector('form > div');
        if (hop) hop.style.display = 'none';
      });
    },
    vung: (p) => p.locator('#root > div > div').first(),
    ghi_chu: 'Đã ẩn bằng JS: nhãn "Dữ liệu demo", tab "Vào nhanh bằng tài khoản demo", hộp ghi chú tài khoản mẫu. Dòng phụ dưới logo vẫn ghi "bản demo chạy local" (chữ của bản demo). Nút Đăng nhập mờ vì chưa nhập gì.',
    marks: [
      { n: 1, loc: (p) => p.locator('form input[type="email"]'), ghi: 'Ô "Email của trung tâm": gõ email có đuôi .pisa@gmail.com.' },
      { n: 2, loc: (p) => p.locator('form input[type="password"]'), ghi: 'Ô "Mật khẩu".' },
      { n: 3, loc: (p) => p.locator('form > button'), ghi: 'Bấm "Đăng nhập" để vào hệ thống (nút sáng lên khi đã nhập đủ email và mật khẩu).' },
      { n: 4, loc: (p) => p.getByRole('button', { name: 'Giáo viên đăng ký' }), ghi: 'Bấm "Giáo viên đăng ký" nếu chưa có tài khoản.' },
    ],
  },
  {
    id: 'g-01-khung', tieu_de: 'Thanh trên cùng', user: 7, url: '/',
    vung: (p) => p.locator('header').first(),
    marks: [
      { n: 1, loc: (p) => p.locator('header nav').first(), ghi: 'Bốn mục điều hướng: Tổng quan, Học viên & Lớp, Test, Công việc.' },
      { n: 2, loc: (p) => p.locator('header nav a', { hasText: 'Công việc' }).locator('span[aria-hidden="true"]'), ghi: 'Số đỏ cạnh "Công việc" là số việc quá hạn của bạn.', pad: 2 },
      { n: 3, loc: (p) => p.getByLabel('Tìm học viên, lớp trong phạm vi được cấp quyền'), ghi: 'Ô tìm: gõ tên học viên hoặc mã lớp.' },
      { n: 4, loc: (p) => p.getByRole('button', { name: /^Thông báo/ }), ghi: 'Bấm "Thông báo" để xem việc cần làm và tin để biết.' },
      { n: 5, loc: (p) => p.locator('button[aria-label^="Tài khoản "]'), ghi: 'Bấm tên tài khoản để xem phạm vi, hồ sơ cá nhân, đăng xuất.' },
    ],
  },
  {
    id: 'g-02-viec-hom-nay', tieu_de: 'Việc của tôi · hôm nay', user: 7, url: '/',
    // Chỉ để lại nhóm đầu và 3 dòng đầu cho gọn (ẩn trên màn hình, không đổi dữ liệu).
    buoc: async (p) => {
      await p.evaluate((sel) => {
        const kids = [...document.querySelector(sel).children];
        kids.slice(2).forEach((e) => { e.style.display = 'none'; });
        [...kids[1].querySelectorAll('ul > li')].slice(3).forEach((e) => { e.style.display = 'none'; });
      }, VIEC);
    },
    vung: (p) => p.locator(VIEC),
    le: 8,
    ghi_chu: 'Hà (id 7): 9 quá hạn, 4 hạn hôm nay, 31 việc đến hết W3 SEP. Ảnh chỉ giữ nhóm "Chấm điểm" và 3 dòng đầu (phần còn lại ẩn bằng JS). Các nhóm khác trên màn: Case học thuật, Ý thức & Phối hợp, Vận hành.',
    marks: [
      { n: 1, loc: (p) => p.locator(VIEC + ' header > span').first(), pad: 8, ghi: 'Dòng tóm tắt: số việc quá hạn, hạn hôm nay và việc đến hết tuần này.' },
      { n: 2, loc: (p) => p.locator(VIEC + ' b', { hasText: 'Chấm điểm' }).locator('..'), ghi: 'Tên nhóm việc, kèm số việc và số việc quá hạn của nhóm.' },
      { n: 3, loc: (p) => p.locator(VIEC).getByText('Quá hạn', { exact: true }).first(), ghi: 'Nhãn "Quá hạn" là việc đã trễ; "Cần làm" là việc còn trong hạn.' },
      { n: 4, loc: (p) => p.locator(VIEC + ' li').first().getByText(/^hạn \d\d\/\d\d/), pad: 6, ghi: 'Hạn của việc; dòng đỏ bên dưới cho biết đã quá hạn bao nhiêu ngày.' },
      { n: 5, loc: (p) => p.locator(VIEC + ' li').first().locator('button.btn'), ghi: 'Bấm nút cuối dòng (ở đây là "Nhập điểm") để làm việc đó ngay.' },
    ],
  },
  {
    id: 'g-03-lich-test', tieu_de: 'Lịch Test — tuần này và nợ tuần trước', user: 7, url: '/test/lich', w: 1280,
    // Chỉ để 3 dòng đầu của khối "Nợ tuần trước" và ẩn danh sách lớp bên dưới cho gọn (chỉ trên màn hình).
    buoc: async (p) => {
      await p.evaluate(() => {
        const no = document.querySelector('#lich-test-no');
        [...no.querySelectorAll('tbody tr')].slice(3).forEach((e) => { e.style.display = 'none'; });
        const lop = document.querySelector('#lich-test-lop');
        if (lop) lop.style.display = 'none';
        for (const e of document.querySelectorAll('main *')) if (e.children.length <= 1 && /MT lịch sử chưa nhập/.test(e.textContent) && e.textContent.length < 120) e.style.display = 'none';
      });
    },
    vung: (p) => p.locator('#lich-test-no'),
    ghi_chu: 'Hà (id 7), tuần W3 SEP: dải "Tiến độ chấm điểm" 2/27 · 25 · 72 · 65; "Nợ tuần trước" 72 bài ở MB FT 101 (đã ẩn bớt dòng bằng JS). Không thấy nhóm "Lớp tôi dạy | Tất cả" (Hà chỉ có phạm vi lớp của mình). Tên dải số trên màn hình là "Tiến độ chấm điểm" (không còn là "Tổng quan chấm điểm"). Cột nút "Nhập điểm" của khối Nợ bị cắt mép phải khi rộng 1440 — chỗ lạ của web.',
    marks: [
      { n: 1, loc: (p) => p.getByRole('button', { name: /^W\d+ \w+/ }), ghi: 'Chọn tuần để xem: bấm ‹ › hoặc "Tuần này" để về tuần hiện tại.' },
      { n: 2, loc: (p) => p.locator('[aria-label="Khung lớp"]'), ghi: 'Chuyển giữa "Fast Track" và "Lớp thường".' },
      { n: 3, loc: (p) => p.locator('[aria-label="Tiến độ chấm điểm"]'), ghi: 'Dải số: bài đã chấm tuần này, còn phải chấm, nợ tuần trước, quá hạn.' },
      { n: 4, loc: (p) => p.locator('#lich-test-no button').first(), ghi: 'Khối "Nợ tuần trước": bài của tuần trước chưa chấm xong; bấm để thu gọn hoặc mở.' },
      { n: 5, loc: (p) => p.locator('#lich-test-no').getByText('Chờ bạn chấm').first(), ghi: '"Chờ bạn chấm" nghĩa là bài này đang chờ chính bạn nhập điểm.' },
    ],
  },
  {
    id: 'g-04-luoi-ft', tieu_de: 'Lưới nhập điểm Fast Track (MB FT 101)', user: 7, url: '/nhap-diem/3?periodId=41',
    buoc: async (p) => {
      await p.evaluate(() => { document.activeElement?.blur?.(); });
    },
    vung: (p) => p.locator('table').first(),
    ghi_chu: 'Hà (id 7), lớp 3 tuần W2 SEP (periodId=41): Tạ Minh Quân đủ điểm "Đạt kỳ vọng", Lương Bảo Anh "Đang chấm · 2/4", Đinh Gia Huy "SOS 1". Hà chỉ được nhập L, R ("Bạn được nhập: L, R") nên W1, W2, S chỉ đọc; nút "GV chấm" chỉ hiện với giáo viên Speaking (xem g-04b). Ô nhận xét và bốn tiêu chí chỉ hiện với Khoa (W1) / Linh (W2). Dòng "Đã lưu hh:mm ✓" chỉ hiện sau khi lưu nên không chụp được (chỉ đọc).',
    marks: [
      { n: 1, loc: (p) => p.locator('h1').locator('..').first(), ghi: 'Tên lớp và đợt Test; dòng dưới ghi kỹ năng bạn được nhập (ở đây là L và R), kỹ năng khác chỉ để xem.' },
      { n: 2, loc: (p) => p.locator('th', { hasText: 'L (số câu)' }), ghi: 'Cột L và R: gõ số câu đúng, máy tự đổi ra band (số nhỏ trong ngoặc).' },
      { n: 3, loc: (p) => p.locator('th', { hasText: 'W1 (band)' }), ghi: 'Cột W1, W2, S: điểm band do giáo viên đúng kỹ năng nhập; kỹ năng không phải của bạn chỉ để xem.' },
      { n: 4, loc: (p) => p.locator('tr', { hasText: 'Lương Bảo Anh' }).locator('td:nth-child(3) > span'), ghi: 'Trạng thái của dòng: "Đang chấm · 2/4" là đã có 2 trong 4 kỹ năng.' },
      { n: 5, loc: (p) => p.locator('th', { hasText: 'OVR' }), ghi: 'Cột OVR (Overall): máy tự tính khi đủ điểm.' },
      { n: 6, loc: (p) => p.locator('tr', { hasText: 'Tạ Minh' }).locator('td:last-child span'), ghi: 'Cột "Kết quả": "Đạt kỳ vọng" hoặc mức SOS khi đủ điểm.' },
    ],
  },
  {
    id: 'g-04b-hop-speaking', tieu_de: 'Hộp "Speaking — bốn tiêu chí" (GV chấm Speaking)', user: 9, url: '/nhap-diem/4', panel: true,
    buoc: async (p) => {
      await p.locator('tr', { hasText: 'Tạ Thu Quỳnh' }).locator('td[data-kn="speaking"] button').first().click();
      await DLG(p).waitFor();
      await p.waitForTimeout(300);
      // Khung phụ ôm bốn ô tiêu chí để khoanh một lần (chỉ vẽ trên màn hình).
      await p.evaluate(() => {
        const ins = [...document.querySelectorAll('[role="dialog"] input')].slice(0, 4).map((i) => i.getBoundingClientRect());
        const card = document.querySelector('[role="dialog"] > div:nth-child(2)').getBoundingClientRect();
        const d = document.createElement('div');
        d.id = '__bon_tc';
        const x0 = card.x + 12, x1 = Math.max(...ins.map((r) => r.right)), y0 = Math.min(...ins.map((r) => r.top)), y1 = Math.max(...ins.map((r) => r.bottom));
        d.style.cssText = `position:fixed;left:${x0}px;top:${y0}px;width:${x1 - x0}px;height:${y1 - y0}px;pointer-events:none;z-index:2147483000`;
        document.body.appendChild(d);
      });
    },
    vung: (p) => DLG(p).locator('> div').nth(1),
    ghi_chu: 'Phạm Thu Trang (id 9), lớp 4 MB FT 102, dòng Tạ Thu Quỳnh MT2 (chưa có điểm S). CHỈ MỞ hộp, không gõ, không bấm Lưu. Hộp Writing ("Writing 1/2 — bốn tiêu chí", TA·CC·LR·GRA) mở tương tự bằng tài khoản Khoa (id 8) hoặc Linh (id 10) nhưng chưa chụp. Nút "Lưu" trong ảnh chỉ để khoanh, không bấm.',
    marks: [
      { n: 1, loc: (p) => p.locator('#__bon_tc'), ghi: 'Bốn tiêu chí FC · LR · GRA · P: gõ band từng tiêu chí; đủ bốn mới ra band kỹ năng.' },
      { n: 2, pad: 8, loc: (p) => DLG(p).getByText('Band kỹ năng', { exact: true }), ghi: '"Band kỹ năng": máy tự tính, hiện — khi chưa đủ bốn tiêu chí.' },
      { n: 3, loc: (p) => DLG(p).getByRole('button', { name: 'Đổi' }), ghi: '"GV chấm": mặc định là "Tôi"; bấm "Đổi" để chọn giáo viên khác đã chấm bài này.' },
      { n: 4, loc: (p) => DLG(p).getByRole('button', { name: /Nhận xét/ }), ghi: 'Bấm "+ Nhận xét" để ghi nhận xét cho học viên (không bắt buộc).' },
      { n: 5, loc: (p) => DLG(p).getByText(/Nhập - nếu học viên/), ghi: 'Gõ "-" nếu học viên không làm bài; để trống là chưa chấm, không phải điểm 0.' },
      { n: 6, loc: (p) => DLG(p).getByRole('button', { name: 'Lưu', exact: true }), ghi: 'Bấm "Lưu" để ghi điểm; "Đóng" để thoát không lưu.' },
    ],
  },
  {
    id: 'g-05-dau-gach-ft', tieu_de: 'Ô ghi vắng "-" trên lưới Fast Track', user: 9, url: '/nhap-diem/4',
    vung: (p) => p.locator('table').first(),
    ghi_chu: 'KHÔNG có sẵn trong demo nhãn "Không có bài · Có thể sửa đến hết Chủ nhật…" (nhãn này chỉ hiện ngay sau khi giáo viên gõ "-", mà ta không được ghi). Dùng thay: Phạm Thu Trang (id 9), lớp 4 MB FT 102, W3 SEP — Kiều Thu Trang MT1 có Speaking "vắng" ("Đã xác nhận vắng — Quản lý xếp lại bài trước khi nhập", chữ nhỏ "Không dự thi · Tuần W3 SEP") và Tạ Thu Quỳnh có ô S trống để minh hoạ chỗ gõ "-" (xem g-04b mục 5). Các nhãn tình trạng khác (Chờ quản lý hiệu chỉnh, Đã huỷ phần thi…) không có dữ liệu.',
    marks: [
      { n: 1, loc: (p) => p.locator('h1').locator('..').first(), ghi: 'Lớp MB FT 102 và đợt Test đang xem; đăng nhập bằng giáo viên Speaking nên chỉ nhập được cột S.' },
      { n: 2, loc: (p) => p.locator('tr', { hasText: 'Kiều Thu Trang' }).locator('td[data-kn="speaking"]'), ghi: 'Ô ghi "vắng": học viên có lịch thi nhưng không làm bài (đã ghi "-"); chữ nhỏ bên dưới cho biết "Không dự thi" và tuần.' },
      { n: 3, loc: (p) => p.locator('tr', { hasText: 'Kiều Thu Trang' }).locator('td').nth(3), ghi: 'Cột "Hạn chấm": dòng nhỏ "S: Không dự thi …" nhắc kỹ năng đang ghi vắng.' },
      { n: 4, loc: (p) => p.locator('tr', { hasText: 'Tạ Thu Quỳnh' }).locator('td[data-kn="speaking"] button'), ghi: 'Ô chưa có điểm: bấm để mở bốn tiêu chí; gõ "-" ở ô đầu nếu học viên không làm bài.' },
      { n: 5, loc: (p) => p.locator('tr', { hasText: 'Chu Minh Hiếu' }).locator('td[data-kn="speaking"] button'), ghi: 'Ô đã có điểm (6.0 "sửa"): ô đã có điểm không nhận "-", muốn đổi phải sửa số kèm lý do.' },
    ],
  },
  {
    id: 'g-06-luoi-thuong', tieu_de: 'Bảng điểm lớp thường (MB FOU 12, Cuối khoá)', user: 7, url: '/bang-diem-thuong/6?kind=final', w: 1280,
    buoc: async (p) => { await p.evaluate(() => { document.activeElement?.blur?.(); }); },
    vung: (p) => p.locator('table').first(),
    ghi_chu: 'Hà (id 7), lớp 6 MB FOU 12, bài Cuối khoá (?kind=final). Hà chỉ nhập L, R; G+V và P chỉ đọc. Dòng minh hoạ: Nguyễn Thảo Vy 15/25 · 14/25 · G+V 14/25 · P 15/25, % tổng 58% và dòng "→ QL cân nhắc". Chip Đạt/Chưa đạt trên màn hình là chữ nhỏ "Đạt · 70%" / "Chưa đạt · 60%" ngay dưới ô điểm (bài Giữa khoá có "Đạt · 70%", xem g-07; Cuối khoá demo chỉ có hàng Thảo Vy đủ điểm nên chỉ thấy "Chưa đạt"). Nút "Điền cả cột" nằm ngay dưới ô "tổng" mỗi cột.',
    marks: [
      { n: 1, loc: (p) => p.locator('h1').locator('..').first(), ghi: 'Tên lớp, bài (Cuối khoá) và tuần thi từng môn.' },
      { n: 2, loc: (p) => p.locator('thead input').first(), ghi: 'Ô "tổng" đầu cột L: số câu của đề; nhập một lần rồi bấm "Điền cả cột" bên dưới để áp cho cả lớp.' },
      { n: 3, loc: (p) => p.locator('thead th', { hasText: 'G+V' }), ghi: 'Cột G+V và cột P là hai phần khác của lớp FOU (giáo viên khác nhập); bạn chỉ xem.' },
      { n: 4, loc: (p) => p.locator('tr', { hasText: 'Nguyễn Thảo Vy' }).locator('input').first(), ghi: 'Ô điểm: gõ số câu đúng; ô bên cạnh là "tổng" số câu của đề (15/25).' },
      { n: 5, loc: (p) => p.locator('tr', { hasText: 'Nguyễn Thảo Vy' }).getByText('Chưa đạt · 56%').first(), ghi: 'Dưới ô điểm là % của môn và "Đạt" / "Chưa đạt" (đỏ khi dưới 70%).' },
      { n: 6, loc: (p) => p.locator('tr', { hasText: 'Nguyễn Thảo Vy' }).locator('td:last-child'), ghi: 'Cột "Kết quả": % tổng của cả bài (58%) và gợi ý "→ QL cân nhắc".' },
    ],
  },
  {
    id: 'g-07-dau-gach-thuong', tieu_de: 'Ô "-" ở lớp thường: môn dời sang tuần sau', user: 7, url: '/bang-diem-thuong/6', w: 1280,
    buoc: async (p) => { await p.evaluate(() => { document.activeElement?.blur?.(); }); },
    vung: (p) => p.locator('table').first(),
    ghi_chu: 'Hà (id 7), lớp 6 MB FOU 12, bài Giữa khoá (mặc định): hàng Âu Nhật Nam có ô L ghi "-" (đã dời), cột Kết quả ghi "Chưa nhập điểm · L dời sang W3 SEP". Dữ liệu sẵn có, không phải gõ.',
    marks: [
      { n: 1, loc: (p) => p.locator('h1').locator('..').first(), ghi: 'Tên lớp và bài đang xem (Giữa khoá).' },
      { n: 2, loc: (p) => p.locator('select').first().locator('xpath=..'), ghi: 'Chọn bài: "Giữa khoá" hoặc "Cuối khoá".' },
      { n: 3, loc: (p) => p.locator('tr', { hasText: 'Âu Nhật Nam' }).locator('input').first().locator('xpath=ancestor::td'), ghi: 'Ô L ghi "-": học viên có lịch mà không làm bài; ô "tổng" bên cạnh bị khoá.' },
      { n: 4, loc: (p) => p.locator('tr', { hasText: 'Âu Nhật Nam' }).locator('input').nth(2).locator('xpath=ancestor::td'), ghi: 'Môn R của em này vẫn chưa có điểm và đang quá hạn ("Quá hạn 23/08").' },
      { n: 5, loc: (p) => p.locator('tr', { hasText: 'Âu Nhật Nam' }).locator('td:last-child'), ghi: 'Cột "Kết quả" ghi "L dời sang W3 SEP": môn L tự dời sang tuần sau, chưa tính điểm.' },
    ],
  },
];
