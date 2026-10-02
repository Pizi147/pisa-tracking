// Nhóm F: sửa điểm, hồ sơ Mock, Học viên & Lớp, ghi kết quả cuối, hồ sơ giáo viên, Công việc, tab hồ sơ học viên. CHỈ ĐỌC: không bấm Lưu.
const DLG = (p) => p.locator('[role="dialog"]').last();
const THE = (p, ten) => p.getByText(ten, { exact: true }).first().locator('xpath=ancestor::*[contains(@class,"card") or self::section][1]');

export const ANH_F = [
  {
    id: 'g-08-sua-huy-diem', tieu_de: 'Hộp "Sửa" điểm đã nhập (bắt buộc ghi lý do)', user: 7, url: '/nhap-diem/3?periodId=41', w: 1280,
    buoc: async (p) => {
      const o = p.locator('table tbody td[data-kn="listening"] input:not([value=""])').first();
      await o.fill('31');
      await o.press('Tab');
      await DLG(p).waitFor();
      await p.waitForTimeout(300);
    },
    vung: (p) => p.locator('table').first(),
    ghi_chu: 'Hà (id 7), lớp 3 W2 SEP, dòng Lương Bảo Anh ô Listening (đã 27 câu): gõ 31 rồi Tab để hộp hiện; KHÔNG bấm Lưu nên không đổi dữ liệu.',
    marks: [
      { n: 1, loc: (p) => p.locator('table tbody td[data-kn="listening"] input').nth(1), ghi: 'Ô đã có điểm: gõ số mới rồi rời ô, web mở hộp hỏi lý do.' },
      { n: 2, loc: (p) => DLG(p).getByText(/Đang lưu:/), pad: 6, ghi: 'Dòng "Đang lưu" cho thấy điểm cũ để bạn đối chiếu.' },
      { n: 3, loc: (p) => DLG(p).getByText('Lý do sửa (bắt buộc)').locator('xpath=..'), pad: 6, ghi: 'Ô "Lý do sửa": bắt buộc, từ 5 ký tự; chưa đủ thì nút Lưu mờ.' },
      { n: 4, loc: (p) => DLG(p).getByRole('button', { name: 'Lưu', exact: true }), ghi: 'Bấm "Lưu" để ghi điểm mới; "Đóng" để bỏ, điểm cũ giữ nguyên.' },
    ],
  },
  {
    id: 'g-09-ho-so-mock', tieu_de: 'Hồ sơ Mock của một học viên', user: 7, url: '/mock-test/167',
    vung: (p) => THE(p, 'Nhận xét'),
    ghi_chu: 'Tạ Minh Quân MT3 W2 SEP (lớp MB FT 101), tài khoản Hà.',
    marks: [
      { n: 1, loc: (p) => p.getByText(/Đã đủ điểm/).first(), ghi: 'Nhãn "Đã đủ điểm" (hoặc "Tạm thời" khi còn thiếu) và kết quả so với kỳ vọng.' },
      { n: 2, loc: (p) => p.getByText('Listening', { exact: true }).first().locator('xpath=ancestor::*[contains(@class,"grid")][1]'), pad: 2, ghi: 'Năm ô điểm L · R · W · S · Overall; mũi tên so với kỳ vọng.' },
      { n: 3, loc: (p) => THE(p, 'Nhận xét'), pad: 2, ghi: 'Nhận xét Writing và Speaking, kèm tên người nhập điểm.' },
      { n: 4, loc: (p) => p.getByRole('link', { name: 'Nhập điểm cả lớp' }), ghi: 'Bấm "Nhập điểm cả lớp" để về lưới nhập điểm của đợt này.' },
    ],
  },
  {
    id: 'g-10-hoc-vien-lop', tieu_de: 'Học viên & Lớp', user: 7, url: '/hoc-vien',
    vung: (p) => p.locator('main').first(),
    ghi_chu: 'Hà (id 7): 9 lớp.',
    marks: [
      { n: 1, loc: (p) => p.getByPlaceholder(/Tìm tên, mã học viên/), ghi: 'Ô tìm theo tên, mã học viên hoặc mã lớp.' },
      { n: 2, loc: (p) => p.getByRole('button', { name: /^Cần làm/ }).locator('xpath=..'), ghi: 'Chip lọc: Tất cả · Cần làm · Chờ duyệt · Đang SOS · Thiếu thông tin.' },
      { n: 3, loc: (p) => p.getByText('34 bài chờ chấm'), ghi: 'Cột "Việc tiếp theo": bấm vào chip trong hàng (ví dụ "34 bài chờ chấm") để làm việc đó.' },
      { n: 4, loc: (p) => p.locator('main button[aria-label^="Thao tác"]').first(), ghi: 'Nút ⋯ của lớp: thao tác nhanh.' },
    ],
  },
  {
    id: 'g-17-ghi-ket-qua-cuoi', tieu_de: 'Panel "Ghi kết quả cuối" (PA chạm mốc quy chế)', user: 7, url: '/hoc-vien/51', panel: true,
    buoc: async (p) => {
      await p.locator('#bang-ky-nang tr', { hasText: 'Listening' }).first().click();
      await p.waitForTimeout(400);
      await p.locator('#bang-ky-nang').getByRole('button', { name: /Ghi kết quả/ }).first().click();
      await p.waitForTimeout(700);
      await p.mouse.move(5, 5);
      await p.setViewportSize({ width: 1440, height: 700 });
      await p.waitForTimeout(300);
    },
    vung: (p) => p.locator('[role="dialog"]').last(),
    le: 0,
    ghi_chu: 'Hoàng Bảo Ngọc (id 51), PA Tự học Listening chạm mốc 1 tháng. Chỉ mở panel, không lưu.',
    marks: [
      { n: 1, loc: (p) => DLG(p).getByText(/chạm mốc quy chế/), pad: 6, ghi: 'Dòng báo tuần này chạm mốc quy chế: lưu lần này là kết thúc PA.' },
      { n: 2, loc: (p) => DLG(p).getByRole('button', { name: /Tiến bộ rõ/ }).locator('xpath=../..'), pad: 6, ghi: 'Chọn một trong bốn mức kết quả, hoặc "Chưa đủ dữ liệu".' },
      { n: 3, loc: (p) => DLG(p).locator('textarea').locator('xpath=ancestor::label[1]'), pad: 8, ghi: 'Ô "Tiến triển": bắt buộc, ít nhất 8 ký tự.' },
      { n: 4, loc: (p) => DLG(p).getByRole('button', { name: 'Ghi kết quả cuối' }), ghi: 'Bấm "Ghi kết quả cuối" để lưu; sau đó mới Hoàn thành Case được.' },
    ],
  },
  {
    id: 'g-46-ho-so-giao-vien', tieu_de: 'Hồ sơ giáo viên (của chính bạn)', user: 7, url: '/giao-vien/7',
    vung: (p) => p.locator('table').first(),
    ghi_chu: 'Hà (id 7).',
    marks: [
      { n: 1, loc: (p) => p.getByText(/Mở Công việc/).first(), ghi: 'Bấm "Mở Công việc" để vào danh sách việc của bạn.' },
      { n: 2, loc: (p) => p.getByText('Việc đang có').first().locator('xpath=ancestor::*[.//*[contains(text(),"Chấm điểm")]][1]'), pad: 2, ghi: 'Khối "Việc đang có": bốn nhóm việc, số quá hạn ghi đỏ.' },
      { n: 3, loc: (p) => p.locator('table').first(), pad: 2, ghi: 'Bảng "Lớp đang dạy": vai trò của bạn ở từng lớp, số bài chưa nhập và quá hạn.' },
    ],
  },
  {
    id: 'g-47-viec-hoc-vien', tieu_de: 'Công việc › Hỗ trợ học viên', user: 7, url: '/cong-viec',
    vung: (p) => p.getByText('Nhập điểm Listening, Reading').nth(2),
    ghi_chu: 'Hà (id 7), 41 việc.',
    marks: [
      { n: 1, loc: (p) => p.getByText('Hỗ trợ học viên', { exact: true }).first().locator('xpath=..'), ghi: 'Hai tab: "Hỗ trợ học viên" và "Yêu cầu của tôi".' },
      { n: 2, loc: (p) => p.getByRole('button', { name: /^Đến hết tuần/ }).locator('xpath=..'), ghi: 'Lọc theo hạn: Quá hạn · Hôm nay · Tuần này · Đến hết tuần.' },
      { n: 3, loc: (p) => p.getByRole('button', { name: /^Chấm điểm \d/ }).locator('xpath=..'), ghi: 'Lọc theo nhóm: Chấm điểm · Case học thuật · Ý thức & Phối hợp · Vận hành.' },
      { n: 4, loc: (p) => p.getByRole('button', { name: 'Nhập điểm' }).first().locator('xpath=..'), ghi: 'Nút cuối dòng làm việc đó ngay.' },
    ],
  },
  {
    id: 'g-48-tab-ho-so-hoc-vien', tieu_de: 'Hồ sơ học viên: tab và menu ⋮', user: 7, url: '/hoc-vien/50', w: 1280,
    buoc: async (p) => {
      await p.setViewportSize({ width: 1280, height: 1200 });
      await p.waitForTimeout(300);
      await p.locator('main button[aria-haspopup]').first().click();
      await p.waitForTimeout(400);
    },
    vung: (p) => p.locator('main').first(),
    ghi_chu: 'Lý Minh Châu (id 50). Chỉ mở menu ⋮, không chọn mục nào.',
    marks: [
      { n: 1, loc: (p) => p.getByRole('button', { name: '+ Case' }), ghi: 'Bấm "+ Case" để tạo Case bằng tay.' },
      { n: 2, loc: (p) => p.locator('main button[aria-haspopup]').first(), ghi: 'Menu ⋮: sửa thông tin, Tạm dừng học, Dừng học hẳn, đề xuất.' },
      { n: 3, loc: (p) => p.getByText('Việc của tôi', { exact: false }).first().locator('xpath=..'), pad: 2, ghi: 'Dải "Việc của tôi": chỉ hiện việc của chính bạn.' },
      { n: 4, loc: (p) => p.getByText('Ý thức & Phối hợp', { exact: true }).first().locator('xpath=..'), ghi: 'Ba tab: Học thuật · Ý thức & Phối hợp · Hành trình.' },
    ],
  },
];
