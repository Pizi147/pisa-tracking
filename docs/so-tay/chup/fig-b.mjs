// NHÓM B: Case (bảng kỹ năng, Ngăn Case, Tạo Case, Thêm PA, Ghi kết quả). CHỈ ĐỌC.
export const ANH_B = [
  {
    id: 'g-11-bang-ky-nang',
    tieu_de: 'Bảng "Tiến độ và hỗ trợ theo kỹ năng" trong hồ sơ học viên',
    user: 7,
    url: '/hoc-vien/46',
    vung: (p) => p.locator('#bang-ky-nang'),
    marks: [
      { n: 1, loc: (p) => p.locator('#bang-ky-nang').getByText('Writing Task 2', { exact: true }), pad: 9, ghi: 'Mỗi hàng là một kỹ năng; bấm một hàng để mở chi tiết các Case ngay bên dưới.' },
      { n: 2, loc: (p) => p.locator('#bang-ky-nang tr', { hasText: 'Writing Task 2' }).locator('td').nth(1), ghi: 'Cột "Gần nhất": điểm của lần Test gần nhất, mức thiếu so với kỳ vọng.' },
      { n: 3, loc: (p) => p.locator('#bang-ky-nang').getByText('Writing Task 2 không đạt', { exact: true }).locator('xpath=..'), pad: 8, ghi: 'Cột "Case": tên Case đang mở của kỹ năng này, kèm chip SOS.' },
      { n: 4, loc: (p) => p.locator('#bang-ky-nang').getByText('Quá hạn', { exact: true }).first().locator('xpath=..'), pad: 3, ghi: 'Nhãn "Quá hạn" và dòng bên cạnh cho biết Case đang chờ bước nào ("Chờ xác nhận nguyên nhân").' },
      { n: 5, loc: (p) => p.locator('#bang-ky-nang tr', { hasText: 'Writing Task 2' }).locator('td').nth(3), ghi: 'Cột "Việc tiếp": việc cần làm tiếp theo, hạn và người phụ trách.' },
    ],
    ghi_chu: 'Học viên Đỗ Minh Khôi (id 46, MB FT 101), tài khoản Hà. Nhãn thật trên web là "Cần làm / Quá hạn / Đang làm / Chờ duyệt / Xong", không có chữ "Chưa xử lý/Đang xử lý". Hạn xác nhận hiện ở cột "Việc tiếp" ("quá hạn 2 ngày · Cao Khánh Linh").',
  },
  {
    id: 'g-12-xac-nhan-nguyen-nhan',
    tieu_de: 'Panel "Xác nhận Case" (Case SOS chờ xác nhận nguyên nhân)',
    user: 7,
    url: '/hoc-vien/47?case=36',
    panel: true,
    // Giãn khoảng cách giữa các ô chỉ để khung đỏ không chồng nhau (không đổi dữ liệu).
    buoc: async (p) => { await p.addStyleTag({ content: '[role="dialog"] .space-y-3 > * + * { margin-top: 30px !important; }' }); await p.waitForTimeout(200); },
    vung: (p) => p.locator('[role="dialog"][aria-label="Xác nhận Case"]').locator('xpath=./*[last()]'),
    marks: [
      { n: 1, loc: (p) => p.locator('[role="dialog"]').locator('input').first().locator('xpath=ancestor::label[1]'), pad: 10, ghi: 'Ô "Tên Case": chỉ sửa được phần giữa, MT# và SOS do hệ thống gắn.' },
      { n: 2, loc: (p) => p.locator('[role="dialog"] select').locator('xpath=ancestor::label[1]'), pad: 10, ghi: 'Ô "Nhóm nguyên nhân": bấm để chọn phân loại nguyên nhân của em (bắt buộc).' },
      { n: 3, loc: (p) => p.locator('[role="dialog"]').getByRole('button', { name: 'Bình thường', exact: true }).locator('xpath=../../..'), pad: 10, ghi: 'Ô "Mức độ gấp": chọn "Bình thường" hoặc "Gấp".' },
      { n: 4, loc: (p) => p.locator('[role="dialog"] #o-mo-ta').locator('xpath=ancestor::label[1]'), pad: 10, ghi: 'Ô "Mô tả": ghi sai ở đâu, bài hay buổi nào; cần ít nhất 15 ký tự (bộ đếm ở góc ô).' },
      { n: 5, loc: (p) => p.locator('[role="dialog"]').getByText('Phương án theo quy chế SOS', { exact: false }).locator('xpath=..'), ghi: 'Khối "Phương án theo quy chế SOS": phương án bắt buộc, hệ thống đã điền sẵn.' },
      { n: 6, loc: (p) => p.locator('[role="dialog"] button.btn-primary', { hasText: 'Xác nhận Case' }), ghi: 'Bấm "Xác nhận Case" để xác nhận nguyên nhân và bắt đầu theo dõi.' },
    ],
    ghi_chu: 'Học viên Vũ Ngọc Lan (id 47, MB FT 101), Case Listening id 36, SOS 3, tài khoản Hà (GVCN). Mở bằng ?case=36 thì vào thẳng panel "Xác nhận Case" (không qua Ngăn Case). Nút "Không cần theo dõi…" KHÔNG nằm trong panel này mà nằm ở hàng Case của bảng kỹ năng (xem ảnh g-12b); đã không bấm vào nó vì sẽ mở form có nút gửi.',
  },
  {
    id: 'g-12b-hang-case',
    tieu_de: 'Hàng Case trong bảng kỹ năng: nút Xác nhận nguyên nhân và Không cần theo dõi…',
    user: 7,
    url: '/hoc-vien/47',
    buoc: async (p) => { await p.locator('#bang-ky-nang tr', { hasText: 'Listening' }).first().click(); await p.waitForTimeout(500); },
    vung: (p) => p.locator('#bang-ky-nang'),
    marks: [
      { n: 1, loc: (p) => p.locator('#bang-ky-nang tr', { hasText: 'Listening' }).first().locator('td').first(), ghi: 'Bấm một hàng kỹ năng để mở chi tiết Case và phương án (PA) bên dưới.' },
      { n: 2, loc: (p) => p.locator('#bang-ky-nang').getByText('Chờ xác nhận nguyên nhân').nth(1).locator('xpath=..'), pad: 3, ghi: 'Nhãn "Cần làm" và dòng bên cạnh cho biết Case đang chờ xác nhận nguyên nhân, kèm hạn.' },
      { n: 3, loc: (p) => p.locator('#bang-ky-nang').getByRole('button', { name: 'Xác nhận nguyên nhân' }).last(), ghi: 'Bấm "Xác nhận nguyên nhân" để mở panel "Xác nhận Case".' },
      { n: 4, loc: (p) => p.locator('#bang-ky-nang').getByRole('button', { name: 'Không cần theo dõi…' }), ghi: 'Bấm "Không cần theo dõi…" nếu Case này không cần theo dõi (gửi Quản lý duyệt).' },
      { n: 5, loc: (p) => p.locator('#bang-ky-nang').getByText('Tutor · đến MT2').first().locator('xpath=ancestor::tr[1]'), ghi: 'Dòng "PA": phương án theo quy chế, đang "Chờ xác nhận" kèm hạn.' },
    ],
    ghi_chu: 'Cùng Vũ Ngọc Lan (id 47), chỉ mở rộng hàng Listening, không bấm nút nào.',
  },
  {
    id: 'g-13-xac-nhan-pa',
    tieu_de: 'Panel "Xác nhận PA theo quy chế"',
    user: 9,
    url: '/hoc-vien/48',
    panel: true,
    buoc: async (p) => {
      await p.locator('#bang-ky-nang tr', { hasText: 'Speaking' }).first().click();
      await p.waitForTimeout(400);
      await p.locator('#bang-ky-nang').getByRole('button', { name: 'Xác nhận PA' }).first().click();
      await p.waitForTimeout(700);
      await p.setViewportSize({ width: 1440, height: 640 });
      await p.addStyleTag({ content: '[role="dialog"] .space-y-3 > * + * { margin-top: 26px !important; }' });
      await p.waitForTimeout(300);
    },
    vung: (p) => p.locator('[role="dialog"][aria-label="Xác nhận PA theo quy chế"]').locator('xpath=./*[last()]'),
    marks: [
      { n: 1, loc: (p) => p.locator('[role="dialog"]').locator('.space-y-3 > p').first(), pad: 10, ghi: 'Dòng tóm tắt phương án: loại PA (Học Tutor), tuần bắt đầu và mốc kết thúc theo quy chế ("đến lúc thi").' },
      { n: 2, loc: (p) => p.locator('[role="dialog"]').locator('div.block', { hasText: 'Người thực hiện' }).first(), pad: 10, ghi: 'Ô "Người thực hiện": bấm "Đổi" nếu người làm không phải người đang hiện.' },
      { n: 3, loc: (p) => p.locator('[role="dialog"] textarea').locator('xpath=ancestor::label[1]'), pad: 10, ghi: 'Ô "Mô tả": nêu hướng dẫn và trọng tâm cụ thể, cần ít nhất 15 ký tự.' },
      { n: 4, loc: (p) => p.locator('[role="dialog"] button.btn-primary', { hasText: 'Xác nhận PA' }), ghi: 'Bấm "Xác nhận PA" để PA bắt đầu chạy.' },
    ],
    ghi_chu: 'Bùi Thảo Vy (id 48, MB FT 101), Case Speaking SOS 1, PA quy chế "Học Tutor" chờ xác nhận. Phải dùng tài khoản Phạm Thu Trang (id 9, GVBM Speaking, người thực hiện PA) vì chỉ người đó thấy nút "Xác nhận PA"; Hà không thấy. Panel mở bằng cách bấm hàng Speaking rồi nút "Xác nhận PA" trong bảng kỹ năng (URL không đổi). Không bấm lưu.',
  },
  {
    id: 'g-14-tao-case',
    tieu_de: 'Panel "Tạo Case" mở từ nút "+ Case"',
    user: 7,
    url: '/hoc-vien/2',
    panel: true,
    buoc: async (p) => {
      await p.getByRole('button', { name: '+ Case', exact: true }).first().click();
      await p.waitForTimeout(700);
      await p.mouse.move(5, 5);
      await p.addStyleTag({ content: '[role="dialog"] .space-y-3 > * + * { margin-top: 26px !important; }' });
      await p.waitForTimeout(300);
    },
    vung: (p) => p.locator('[role="dialog"][aria-label="Tạo Case"]').locator('xpath=./*[last()]'),
    marks: [
      { n: 1, loc: (p) => p.locator('[role="dialog"] div.block', { hasText: 'Kỹ năng' }).first(), pad: 10, ghi: 'Ô "Kỹ năng": bấm một nút (L, R, W1, W2, S) để chọn kỹ năng đang gặp vấn đề.' },
      { n: 2, loc: (p) => p.locator('[role="dialog"] select').locator('xpath=ancestor::label[1]'), pad: 10, ghi: 'Ô "Nhóm nguyên nhân": bấm để chọn phân loại vấn đề (bắt buộc).' },
      { n: 3, loc: (p) => p.locator('[role="dialog"] div.block', { hasText: 'Mức độ' }).first(), pad: 10, ghi: 'Ô "Mức độ": chọn "Bình thường" hoặc "Gấp"; đây là nhận định của người báo, không phải mức SOS.' },
      { n: 4, loc: (p) => p.locator('[role="dialog"] label.block', { hasText: 'Tên Case' }).first(), pad: 10, ghi: 'Ô "Tên Case": gõ tên ngắn gọn cho vấn đề.' },
      { n: 5, loc: (p) => p.locator('[role="dialog"] textarea').locator('xpath=ancestor::label[1]'), pad: 10, ghi: 'Ô "Mô tả và dẫn chứng": ghi sai ở đâu, bài hay buổi nào; cần ít nhất 15 ký tự (bộ đếm ở góc ô).' },
      { n: 6, loc: (p) => p.locator('[role="dialog"] button.btn-primary', { hasText: 'Tạo Case' }), ghi: 'Bấm "Tạo Case" để lưu (nút chỉ bấm được khi đủ các ô bắt buộc).' },
    ],
    ghi_chu: 'Mở từ hồ sơ Trần Thu Hà (id 2, MB FT 101), nút "+ Case" ở đầu hồ sơ, tài khoản Hà. Panel có hai tab con "Đang gặp vấn đề" (đang hiện) và "Đã xong từ trước" (nhập bù). "Mức độ" mặc định đã chọn "Bình thường". Khối "Theo dõi" (Bắt đầu theo dõi) và "Bằng chứng" nằm dưới, ảnh chỉ cắt phần đầu panel nếu cần thì mở rộng. Chưa gõ gì, không bấm Tạo Case.',
  },
  {
    id: 'g-15-them-pa',
    tieu_de: 'Panel "Thêm PA" (đang mở ô chọn người thực hiện)',
    user: 9,
    url: '/hoc-vien/3?case=9',
    panel: true,
    buoc: async (p) => {
      const d = p.locator('[role="dialog"]');
      await d.getByRole('button', { name: '+ Thêm PA' }).click();
      await p.waitForTimeout(600);
      await d.locator('button', { hasText: 'Đổi' }).first().click();
      await p.waitForTimeout(600);
      await p.addStyleTag({ content: '[role="dialog"] .space-y-3 > * + * { margin-top: 26px !important; } [role="dialog"] .grid.grid-cols-1 { column-gap: 30px !important; } [role="dialog"] .grid.grid-cols-1 label { margin-bottom: 18px !important; }' });
      await p.waitForTimeout(300);
    },
    vung: (p) => p.locator('[role="dialog"][aria-label="Thêm PA"]').locator('xpath=./*[last()]'),
    marks: [
      { n: 1, loc: (p) => p.locator('[role="dialog"] select').locator('xpath=ancestor::label[1]'), pad: 10, ghi: 'Ô "Loại PA": bấm để chọn loại phương án (nhóm tự làm được, và nhóm "cần Quản lý duyệt").' },
      { n: 2, loc: (p) => p.locator('[role="dialog"] textarea').locator('xpath=ancestor::label[1]'), pad: 10, ghi: 'Ô "Mô tả": nêu hướng dẫn và trọng tâm cụ thể, ai thực hiện; cần ít nhất 8 ký tự.' },
      { n: 3, loc: (p) => p.locator('[role="dialog"] input[placeholder^="Gõ tên"]'), pad: 4, ghi: 'Ô "Người thực hiện" sau khi bấm "Đổi": gõ tên giáo viên để tìm.' },
      { n: 4, loc: (p) => p.locator('[role="dialog"]').getByText('Cao Khánh Linh').locator('xpath=ancestor::*[self::ul or @role="listbox"][1]'), pad: 0, ghi: 'Danh sách gợi ý: bấm một tên để chọn; dòng nhỏ cho biết người đó dạy kỹ năng nào ở lớp này.' },
      { n: 5, loc: (p) => p.locator('[role="dialog"] input[placeholder^="Mặc định"]').locator('xpath=../..'), pad: 4, ghi: 'Ô "Ngày bắt đầu": để trống thì mặc định là hôm nay.' },
      { n: 6, loc: (p) => p.locator('[role="dialog"] button.btn-primary', { hasText: 'Thêm PA' }), ghi: 'Bấm "Thêm PA" để lưu phương án (loại cần Quản lý duyệt thì nút là "Gửi duyệt").' },
    ],
    ghi_chu: 'Lê Quang Huy (id 3, MB FT 101), Case Speaking id 9 chưa có PA, quá hạn 5 ngày. Phải dùng Phạm Thu Trang (id 9, GVBM Speaking) vì Hà (GVCN) không thấy nút "+ Thêm PA" ở Case này. Panel "Thêm PA" KHÔNG có ô file/link: phần "Bằng chứng" (+ Đính kèm tệp, + Thêm liên kết) nằm ở Ngăn Case. Ô tìm người thực hiện hiện ra sau khi bấm "Đổi" (danh sách gợi ý có sẵn; gõ từ 3 ký tự để tìm thêm). Không gõ, không lưu.',
  },
  {
    id: 'g-16-ghi-ket-qua-pa',
    tieu_de: 'Panel "Ghi kết quả" của phương án (PA) hằng tuần',
    user: 7,
    url: '/hoc-vien/50',
    panel: true,
    buoc: async (p) => {
      await p.locator('#bang-ky-nang tr', { hasText: 'Reading' }).first().click();
      await p.waitForTimeout(400);
      await p.locator('#bang-ky-nang').getByRole('button', { name: 'Ghi kết quả' }).first().click();
      await p.waitForTimeout(700);
      await p.mouse.move(5, 5);
      await p.setViewportSize({ width: 1440, height: 860 });
      // Chỉ để số khoanh không che chữ: tạo khe nhỏ bên trái vài dòng.
      await p.addStyleTag({ content: '[role="dialog"] span.whitespace-nowrap.font-bold { margin-left: 40px; }' });
      await p.waitForTimeout(300);
    },
    vung: (p) => p.locator('[role="dialog"][aria-label="Ghi kết quả"]').locator('xpath=./*[last()]'),
    marks: [
      { n: 1, loc: (p) => p.locator('[role="dialog"]').getByText(/quá hạn d+ ngày/), pad: 14, ghi: 'Nhãn hạn của PA: "hạn hết T2 07/09" và "quá hạn 7 ngày" cho biết đã trễ bao lâu; tiêu đề bước 1 bên dưới nói ghi kết quả cho tuần nào.' },
      { n: 2, loc: (p) => p.locator('[role="dialog"]').getByRole('button', { name: /Tiến bộ rõ/ }).locator('xpath=../..'), pad: 6, ghi: 'Chọn một kết quả: "Tiến bộ rõ", "Tiến bộ một phần", "Không tiến bộ" hoặc "Kém hơn"; chưa có bài để so thì bấm "Chưa đủ dữ liệu".' },
      { n: 3, loc: (p) => p.locator('[role="dialog"] textarea').locator('xpath=ancestor::label[1]'), pad: 10, ghi: 'Ô "Tiến triển": mô tả đã cải thiện ở đâu, cần ít nhất 8 ký tự.' },
      { n: 4, loc: (p) => p.locator('[role="dialog"] [class~="space-y-1.5"]').first(), pad: 10, ghi: 'Bước 2 "Quyết định": "Giữ nguyên", "Điều chỉnh" hoặc "Xin hỗ trợ QL" (chỉ chọn được sau khi đã chọn kết quả).' },
      { n: 5, loc: (p) => p.locator('[role="dialog"] button.btn-primary', { hasText: 'Ghi kết quả' }), ghi: 'Bấm "Ghi kết quả" để lưu.' },
    ],
    ghi_chu: 'Lý Minh Châu (id 50, MB FT 101), Case Reading, PA "Tự học Reading" (PA theo quy chế), quá hạn 7 ngày, tài khoản Hà; mở bằng cách bấm hàng Reading rồi nút "Ghi kết quả". Web THẬT khác mô tả: chỉ có 4 mức kết quả (Tiến bộ rõ / Tiến bộ một phần / Không tiến bộ / Kém hơn) + nút nhỏ "Chưa đủ dữ liệu"; PA theo quy chế chỉ có 3 quyết định (Giữ nguyên / Điều chỉnh / Xin hỗ trợ QL), chưa chọn kết quả thì các quyết định còn mờ với dòng "Chọn kết quả trước". Tiêu đề bước 1 là "1 · Kết quả W1–W2 SEP (ghi bù 2 tuần)" chứ không phải dòng "Ghi kết quả tuần W3 SEP · hạn hết T2 14/09"; nhãn hạn ở dòng trên ("hạn hết T2 07/09 · quá hạn 7 ngày"). Panel dài nên cuối (Ghi chú, Ngày ghi) bị cắt, không ảnh hưởng. Chưa bấm gì, không lưu.',
  },
];
