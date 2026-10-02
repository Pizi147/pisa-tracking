// NHÓM C — lớp thường: Giữa khoá, Cuối khoá (g-20 … g-26).
const dlg = (p) => p.getByRole('dialog', { name: 'Nộp kế hoạch bổ trợ' });
const pn = (p) => dlg(p).locator('xpath=./div[2]');
const ROW = (p) => p.locator('tr', { hasText: 'Nguyễn Thảo Vy' }).first();
const KLK = (p) => p.locator('section[aria-label="Kết luận khoá"]');
const LT = (p) => p.getByRole('dialog', { name: 'Lộ trình tiếp theo' });
const tile = (ten) => (p) => p.locator('[class*="rounded-[10px]"][class*="gap-[3px]"]').filter({ has: p.getByText(ten, { exact: true }) }).first();
const daiDau = (p) => p.getByText(/^Hồ sơ học viên/).first().locator("xpath=ancestor::div[contains(@class,'rounded-xl')][1]");

export const ANH_C = [
  {
    id: 'g-20-giua-khoa-case',
    tieu_de: 'Hồ sơ học viên lớp thường sau Giữa khoá: không đạt G+V và P',
    user: 7, w: 1040,
    url: '/hoc-vien/74',
    vung: (p) => tile('Kết quả gần nhất')(p).locator('xpath=..'),
    marks: [
      { n: 1, loc: tile('Kết quả gần nhất'), ghi: 'Ô "Kết quả gần nhất": lớp thường ghi "2/4 môn đạt" và nói rõ "Không đạt: G+V · P".' },
      { n: 2, loc: tile('Học thuật'), ghi: 'Ô "Học thuật": mỗi môn không đạt có một Case riêng; G+V "Chờ duyệt" kế hoạch bổ trợ, P "Cần làm"; dòng dưới là PA Bổ trợ chung.' },
      { n: 3, pad: 0, loc: (p) => p.locator('#bang-ky-nang tr', { hasText: 'Grammar + Vocabulary' }).first(), ghi: 'Hàng Grammar + Vocabulary: điểm 11/20 "chưa đạt", Case "[Giữa khoá] G+V không đạt" (không có chữ SOS) và việc tiếp "Chờ Quản lý duyệt kế hoạch".' },
      { n: 4, pad: 0, loc: (p) => p.locator('#bang-ky-nang tr', { hasText: 'Pronunciation' }).first(), ghi: 'Hàng Pronunciation: Case "[Giữa khoá] P không đạt", việc tiếp "Xác nhận nguyên nhân" có hạn và người làm.' },
    ],
  },

  {
    id: 'g-21-ke-hoach-bo-tro',
    tieu_de: 'Panel "Nộp kế hoạch bổ trợ" (chỉ mở, không gửi)',
    user: 7, panel: true,
    url: '/hoc-vien/80',
    buoc: async (p) => { await p.getByRole('button', { name: 'Nộp kế hoạch' }).first().click(); await p.getByRole('dialog', { name: 'Nộp kế hoạch bổ trợ' }).waitFor(); await p.waitForTimeout(500); },
    vung: pn,
    le: 0,
    marks: [
      { n: 1, pad: 10, loc: (p) => dlg(p).getByText(/Em mất điểm/).first(), ghi: 'Dòng "G+V —": nguyên nhân từng môn đã ghi ở bước Xác nhận Case, chỉ để đọc.' },
      { n: 2, loc: (p) => dlg(p).locator('textarea').nth(0), ghi: 'Ô "Nội dung yếu" (bắt buộc, từ 15 ký tự): kiến thức, kỹ năng em đang yếu. Web điền sẵn từ nguyên nhân, có thể sửa.' },
      { n: 3, loc: (p) => dlg(p).locator('textarea').nth(1), ghi: 'Ô "Kế hoạch" (bắt buộc, từ 15 ký tự): buổi nào dạy gì, trọng tâm, bài tập.' },
      { n: 4, pad: 0, loc: (p) => dlg(p).getByText('Trần Ngọc Hà').locator('xpath=../..'), ghi: 'Nút "Đổi": đổi "Người dạy bổ trợ" (mặc định là GVCN của lớp).' },
      { n: 5, loc: (p) => dlg(p).getByRole('button', { name: 'Gửi Quản lý duyệt' }), ghi: 'Bấm "Gửi Quản lý duyệt" để nộp; Quản lý duyệt trong 3 ngày, duyệt xong phương án Bổ trợ mới bắt đầu chạy. (Ảnh chỉ mở, không bấm.)' },
    ],
  },
  {
    id: 'g-22-bao-ph-tvv',
    tieu_de: 'Việc "Báo phụ huynh qua TVV" trong tab Ý thức & Phối hợp',
    user: 7, w: 900,
    url: '/hoc-vien/74?tab=y-thuc&sub=phoi-hop',
    buoc: async (p) => { await p.getByText('Nội dung gửi TVV').click(); await p.waitForTimeout(400); },
    vung: (p) => p.getByText('Nội dung gửi TVV').locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]'),
    marks: [
      { n: 1, pad: 6, loc: (p) => p.getByText('Giữa khoá · 2/4 môn đạt'), ghi: 'Tiêu đề nhóm: kết quả Giữa khoá của em và các môn không đạt.' },
      { n: 2, pad: 6, loc: (p) => p.getByText('Báo phụ huynh qua TVV', { exact: true }).last(), ghi: 'Việc "Báo phụ huynh qua TVV" (trạng thái "Cần xử lý") dành cho GVCN.' },
      { n: 3, pad: 6, loc: (p) => p.getByText('Nội dung gửi TVV'), ghi: 'Bấm "Nội dung gửi TVV (4)" để xem bốn nội dung cần nói với tư vấn viên.' },
      { n: 4, loc: (p) => p.getByRole('button', { name: 'Đánh dấu đã làm' }).last(), ghi: 'Bấm "Đánh dấu đã làm" sau khi đã chuyển bốn nội dung cho TVV.' },
    ],
  },

  {
    id: 'g-23-bang-diem-cuoi-khoa',
    tieu_de: 'Bảng điểm lớp thường · bài Cuối khoá (MB FOU 12)',
    user: 7, w: 1100,
    url: '/bang-diem-thuong/6?kind=final',
    buoc: async (p) => { await p.evaluate(() => document.activeElement && document.activeElement.blur()); },
    vung: (p) => p.locator('table').first(),
    marks: [
      { n: 1, loc: (p) => p.locator('select').first(), ghi: 'Ô "Bài": chọn Giữa khoá hoặc Cuối khoá; đang xem bảng điểm Cuối khoá (hạn 20/09).' },
      { n: 2, loc: (p) => p.locator('th').filter({ hasText: 'Điền cả cột' }).first(), ghi: 'Đầu cột L: ô "tổng" là điểm tối đa của bài (25); "Điền cả cột" điền một điểm cho cả lớp.' },
      { n: 3, loc: (p) => ROW(p).locator('td').nth(1), ghi: 'Ô điểm một môn: nhập điểm, web hiện ngay "Chưa đạt" hoặc "Đạt" kèm tỉ lệ % (ví dụ "Chưa đạt · 60%").' },
      { n: 4, loc: (p) => ROW(p).locator('td').nth(3), ghi: 'Cột G+V (chấm ở tuần sau, nên chưa phải ô nhập): điểm đã có hiện "14/25" kèm "Chưa đạt · 56%"; môn chưa có điểm chỉ hiện tuần thi (W4 SEP).' },
      { n: 5, loc: (p) => ROW(p).locator('td').nth(5), ghi: 'Cột "Kết quả": % tổng của khoá (ví dụ 58%) và hướng gợi ý ("→ QL cân nhắc").' },
      { n: 6, loc: (p) => p.locator('tr', { hasText: 'Bùi Khánh Linh' }).locator('td').nth(5), ghi: 'Em chưa có điểm nào: cột "Kết quả" ghi "Chưa nhập điểm".' },
    ],
  },

  {
    id: 'g-24-ket-luan-cuoi-khoa',
    tieu_de: 'Hộp "Kết luận khoá" của học viên lớp thường sau Cuối khoá (Đặng Minh Khôi, 55%)',
    user: 8, w: 1100,
    url: '/hoc-vien/82',
    vung: (p) => KLK(p),
    marks: [
      { n: 1, loc: tile('Kết quả gần nhất'), ghi: 'Ô "Kết quả gần nhất": "Cuối khoá 55%", hướng "Quản lý cân nhắc" và các môn "không đạt".' },
      { n: 2, pad: 6, loc: (p) => KLK(p).getByText(/^Cuối khoá 55%/).first(), ghi: 'Dòng đầu hộp: % tổng của Cuối khoá và điểm từng môn (L 55 · R 55 · W 55 · S 55). Web dùng % tổng để xếp vào dải dưới 50, 50–59, 60–69 hoặc từ 70 trở lên.' },
      { n: 3, loc: (p) => KLK(p).getByText(/Quản lý cân nhắc:/).first(), ghi: 'Nhãn hướng gợi ý theo dải: 50–59% hiện "Quản lý cân nhắc: học lại hoặc lên (chọn khi chuyển lớp)"; Quản lý mới là người quyết định.' },
      { n: 4, pad: 6, loc: (p) => KLK(p).getByText(/Kỳ vọng đầu ra/).first(), ghi: 'Dòng "Kỳ vọng đầu ra (BE IELTS 4.0)": hiện "Chưa đánh dấu" cho tới khi có kết luận Đạt / Không đạt.' },
      { n: 5, loc: (p) => KLK(p).getByRole('button', { name: 'Lộ trình tiếp theo' }), ghi: 'Bấm "Lộ trình tiếp theo" để ghi dự định cho em (lên lớp, học lại…).' },
    ],
  },
  {
    id: 'g-25-mini-test',
    tieu_de: 'Mini Test và PA Bổ trợ miễn phí (Vương Bảo Ngọc, MB ELE 02)',
    user: 7, w: 1100,
    url: '/hoc-vien/83',
    vung: (p) => p.locator('#bang-ky-nang'),
    marks: [
      { n: 1, loc: (p) => p.getByRole('button', { name: 'Ghi Mini Test' }).locator('xpath=..'), ghi: 'Dòng "Mini Test": chưa có kết quả ("—") và có hạn ghi (hạn 15/09).' },
      { n: 2, loc: (p) => p.getByRole('button', { name: 'Ghi Mini Test' }), ghi: 'Bấm "Ghi Mini Test" để mở phiếu ghi kết quả cuối (một ô % và ngày làm).' },
      { n: 3, pad: 6, loc: (p) => p.getByText('Lên ELE + bổ trợ miễn phí').first(), ghi: 'Nhãn kết quả khoá: "Lên ELE + bổ trợ miễn phí 2 buổi (W, S) · 1 tuần · Mini Test sau buổi cuối".' },
      { n: 4, pad: 0, loc: (p) => p.locator('#bang-ky-nang tr', { hasText: 'Writing' }).first(), ghi: 'Hàng Writing: Case "Cuối khoá BE · Writing không đạt" đang làm, việc tiếp "Ghi kết quả cuối" cho PA "Bổ trợ miễn phí".' },
    ],
    ghi_chu: 'Mini Test trống vì chưa ghi; hạn 15/09, ngày demo 14/09. Ảnh g-25b là phiếu mở từ nút "Ghi Mini Test".',
  },
  {
    id: 'g-25b-mini-test-phieu',
    tieu_de: 'Phiếu "Ghi kết quả cuối" có ô Mini Test (chỉ mở, không lưu)',
    user: 7, panel: true,
    url: '/hoc-vien/83',
    buoc: async (p) => { await p.getByRole('button', { name: 'Ghi Mini Test' }).click(); await p.getByRole('dialog', { name: 'Ghi kết quả cuối' }).waitFor(); await p.waitForTimeout(500); },
    vung: (p) => p.getByRole('dialog', { name: 'Ghi kết quả cuối' }).locator('xpath=./div[2]'),
    le: 0,
    marks: [
      { n: 1, pad: 2, loc: (p) => p.getByRole('dialog', { name: 'Ghi kết quả cuối' }).getByRole('button', { name: /Tiến bộ rõ/ }).locator('xpath=..'), ghi: 'Bốn nút kết quả tuần (Tiến bộ rõ · Tiến bộ một phần · Không tiến bộ · Kém hơn): chọn một. Tuần này chạm mốc quy chế nên lưu là PA kết thúc.' },
      { n: 2, loc: (p) => p.getByRole('dialog', { name: 'Ghi kết quả cuối' }).getByPlaceholder('Ví dụ: 72'), ghi: 'Ô "Mini Test (%)" (bắt buộc): gõ điểm phần trăm; "Đạt từ 70%".' },
      { n: 3, loc: (p) => p.getByRole('dialog', { name: 'Ghi kết quả cuối' }).getByText('Ngày làm Mini Test').locator('xpath=following::input[1]'), ghi: 'Ô "Ngày làm Mini Test" (bắt buộc).' },
      { n: 4, loc: (p) => p.getByRole('dialog', { name: 'Ghi kết quả cuối' }).getByRole('button', { name: 'Ghi kết quả cuối' }), ghi: 'Nút "Ghi kết quả cuối" lưu phiếu. (Ảnh chỉ mở, không bấm.)' },
    ],
  },

  {
    id: 'g-26-lo-trinh-tiep-theo',
    tieu_de: 'Panel "Lộ trình tiếp theo" của học viên lớp thường (Nguyễn Thảo Vy, MB FOU 12; chỉ mở, không lưu)',
    user: 7, panel: true,
    url: '/hoc-vien/71',
    buoc: async (p) => { await p.getByRole('button', { name: 'Lộ trình tiếp theo' }).first().click(); await p.getByRole('dialog', { name: 'Lộ trình tiếp theo' }).waitFor(); await p.waitForTimeout(500); },
    vung: (p) => LT(p).locator('xpath=./div[2]'),
    le: 0,
    marks: [
      { n: 1, pad: 6, loc: (p) => LT(p).getByText('Kết quả gần nhất').first().locator('xpath=..'), ghi: 'Khối "Kết quả gần nhất": % tổng (58%), hướng "Cuối khoá → QL cân nhắc" và các môn "Không đạt".' },
      { n: 2, pad: 6, loc: (p) => LT(p).getByText('Hệ thống gợi ý theo Cuối khoá').first().locator('xpath=..'), ghi: 'Khối "Hệ thống gợi ý theo Cuối khoá": web nêu gợi ý theo % tổng; chỉ để tham khảo, Quản lý là người quyết định.' },
      { n: 3, pad: 8, loc: (p) => LT(p).getByText('Chỉ là dự định, chưa đổi lớp.', { exact: false }), ghi: 'Dòng nhắc: "Chỉ là dự định, chưa đổi lớp" — ghi trước để người kế nhiệm biết em sẽ đi đâu; chuyển lớp thật do Quản lý ra lệnh.' },
      { n: 4, pad: 4, loc: (p) => LT(p).getByRole('radiogroup').first(), ghi: 'Khối "Hướng đi": chọn một — Lên lớp thường tiếp (BE) · Lên FT · Học lại FOU · Tạm dừng học (bảo lưu) · Dừng học hẳn · Chưa rõ.' },
      { n: 5, loc: (p) => LT(p).getByRole('button', { name: 'Lưu' }), ghi: 'Bấm "Lưu" để ghi dự định. (Ảnh chỉ mở, không bấm.)' },
    ],
  },
];
