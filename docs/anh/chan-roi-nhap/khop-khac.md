# CHAN-ROI-NHAP — còn nháp, rời góc Phân công GV thì hỏi một lần

Loại PR: **sửa nhỏ** (không đổi bố cục, thêm hộp theo mẫu sẵn có `HopBoChu`). Nguồn: `plan.md` dòng [XM] PR-C Góc Phân công GV (rà sâu #726).

## Ảnh
`hop-hoi-1440.jpg` · `hop-hoi-375.jpg` (QL Monbay, nền tối, không có khung mockup riêng: hộp dùng lại `.hop-hoi` của `cong-viec.html`).

## Bấm thử (QL Monbay; đổi chi nhánh bằng Quản trị)
| # | Thao tác khi còn nháp | 1440 | 375 |
|---|---|---|---|
| 1 | Link mã lớp | hỏi, chưa rời, focus "Ở lại" | hỏi |
| 2 | Hồ sơ GV › | hỏi; Bỏ nháp → `/giao-vien/7` | link không hiện ở 375 (có từ trước) |
| 3 | Menu | hỏi | hỏi (menu dưới) |
| 4 | Back trình duyệt | hỏi, URL giữ nguyên, nháp còn | hỏi |
| 5 | Đổi tab góc | hỏi, tab giữ Phân công GV | cùng đường |
| 6 | Đổi chi nhánh | hỏi; Ở lại không ghi nhớ chi nhánh mới, Bỏ nháp mới ghi | cùng đường |
| 7 | Gõ ô tìm trong góc | không hỏi, nháp còn | cùng đường |
| 8 | Huỷ sửa rồi bấm link | không hỏi | cùng đường |
| 9 | Lưu xong rồi bấm link | không hỏi | cùng đường |
| 10 | Back lúc lưu đang gửi (làm chậm 1,5 s) | cùng đường | hộp hiện, lưu xong tự đi tiếp, không hỏi thêm |
| 11 | Quay lại từ hồ sơ GV | về đúng `/hoc-vien?view=phan-cong` | cùng đường |

Số trong hộp: 2 ô ở 1 lớp · 3 ô ở 2 lớp · 1 ô ở 1 lớp, khớp nhãn "Nháp · n ô đổi".
Hộp của trình duyệt khi tải lại / đóng tab: giữ nguyên cách cũ (`beforeunload`), không bấm thử được trong khung trình duyệt của app.

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau |
|---|---|---|
| Link mã lớp, Hồ sơ GV ›, menu, Back khi còn nháp | rời ngay, mất nháp | hỏi; Ở lại giữ nháp |
| Đổi tab góc, phạm vi, chi nhánh khi còn nháp | hộp trình duyệt, chỉ nêu số lớp | hộp app, nêu số ô + số lớp |
| Lưu, Huỷ sửa, Hoàn tác, tìm, lọc khung | như cũ | như cũ |

Không mất thao tác nào.

## Thay đổi ngoài góc
`main.tsx` đổi `BrowserRouter` sang `createBrowserRouter` (một route `*` bọc cả app) vì `useBlocker` chỉ chạy trong data router; không thêm thư viện. Đường dẫn vẫn khai ở `<Routes>` của App. Lỗi vẽ ở phần vỏ ngoài `BatLoiTrang` nay hiện trang lỗi mặc định của router thay vì trắng trang.

## So với main: đổi router có đổi hành vi không
Cùng một kịch bản Playwright chạy trên main và trên nhánh, DB seed riêng từng bên, so từng bước: URL, `window.history.state`, `history.length`, tiêu đề tab, phần tử giữ focus, `scrollTop` của `<main>`, số hộp đang mở, số commit React. Vai QL 1440 · GV 1440 · QL 375, 165 bước.

| Luồng | Kết quả |
|---|---|
| Hồ sơ lớp → hồ sơ em → "Sau" (`state.ds`) → ‹ Quay lại, vị trí cuộn | như main |
| Tổng quan → hồ sơ → ‹ Quay lại | như main |
| Panel số liệu → hồ sơ → ‹ mở lại panel → Back → Forward → Esc (`?so-lieu=`) | như main |
| `setSearchParams` nhiều lần: lọc Công việc cùng tick và cách 5 ms, đổi tuần, ba tab cùng tick | như main |
| `Navigate replace`: `/tutor/*`, đường lạ, `/nhap-diem/:id`, `/bang-diem-thuong/:id`, `/phan-tich` + Back | như main |
| Tải lại trang sâu; hồ sơ không tồn tại (404) | như main |
| Back / Forward nhiều bước, bấm lại cùng trang | như main |
| Đăng xuất, Vào nhanh, Back sau đăng nhập | như main |
| Lưu · em tiếp › (GV, 6 lượt, `state.ds` giữ qua `replace`) rồi ‹ Quay lại về Lịch Test, cuộn 200 | như main |

Tổng: **lệch 0 / 165 bước**.

| Hạng mục | Main | Nhánh |
|---|---|---|
| Vị trí cuộn, focus, `window.history.state` | | không đổi ở mọi bước |
| Commit React cả kịch bản (162 bước) | 1 816 | 1 819 |
| Tệp `index` sau build, gzip | 349,0 KB | 363,5 KB (+14,5 KB, +4 %) |
| `do-khung` toàn bộ (425 mục ✓) | 0 lỗi · 216 miễn | 0 lỗi · 216 miễn |
| Cảnh báo future flag ở console, cả bản production | có sẵn | thêm các dòng của data router (chỉ console) |

Kịch bản `do-khung cham-lien-mach` dừng cùng chỗ trên cả main và nhánh: bước (f) còn tìm `#dai-diem`, trang hồ sơ MT nay không còn id này. Không liên quan PR này, chưa sửa.

Dòng đọc Turso: +0 câu, +0 dòng (không thêm request).
