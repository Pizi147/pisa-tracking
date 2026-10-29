# V8-CV — Công việc vai QL theo mockup v8 (`thiet-ke/v8/cong-viec-ql.html` + `cong-viec-ql-ghi-chu.md`, chủ SP duyệt 29/10 #688)

Loại PR: **đổi bố cục một màn** (Công việc · QL). Kế hoạch: `docs/superpowers/plans/2026-10-29-v8-trien-khai.md` (V8-CV). Merge **sau #694** (đã merge).
HÌNH theo v8 sát; TÍNH NĂNG giữ đủ (bảng TRƯỚC → SAU). 5 câu hỏi ở ghi chú mockup chưa trả lời → làm như mockup vẽ, chỗ mockup không vẽ giữ web.

## Truy vết khung → thành phần → ảnh
| Khung mockup | Thành phần | Ảnh | KHỚP / KHÁC |
|---|---|---|---|
| A1 đầu trang: "Công việc · n nhóm · n việc …" — bỏ "n chờ bạn duyệt" | `HoTroHocVienTab` header | `cap-a1-1440-toi.png` | KHỚP (BỎ chữ trùng: số đã ở chip dải nhóm) |
| A1 hàng lọc: Của tôi · Của GV · Tất cả (số) · Một GV ▾ · Mọi khung ▾ · chi nhánh ▾ · Mọi hạn ▾ | `BoLocDoan`, `ChonPhuTrach chiChonGv`, `CongTacKhung kieu="chon" chuTatCa`, `BranchFilter`, select hạn | `cap-a1-1440-toi.png` | KHỚP (chi nhánh ẩn khi phạm vi một chi nhánh — như cũ) |
| A1 "Chờ bạn duyệt" = nhóm đầu cột trái 600 px, ba tầng (khối em → dòng yêu cầu; yêu cầu cả lớp = dòng có ô biểu tượng) | `HopChoDuyet gon` → `CayDuyet` / `DongDuyet` (dùng `NET_CAY`, `chuDau`, `IconNhom` của danh sách việc) | `cap-a1-1440-toi.png`, `cap-b1-375-sang.png` | KHỚP |
| A1 dòng: tên · loại · người gửi · ngày / "Nếu duyệt" một dòng (đủ chữ ở title + panel) · hạn 136 · Duyệt + Từ chối… · Mở › | `DongDuyet` | như trên | KHỚP |
| A1 ⓘ ở dải nhóm thay câu "Đánh dấu ô ở thẻ…" | `DaiNhom phu` + `NutLuat` | như trên | KHỚP |
| A1 chân nhóm: Xem thêm n yêu cầu · Mở hộp duyệt › · n yêu cầu ở chi nhánh khác · Xem › | chân `HopChoDuyet gon` | như trên | KHỚP ("thẻ" → "yêu cầu") |
| A1 panel trống cao hết cột, viền đứt "Chọn một việc hoặc yêu cầu ở danh sách." | cột phải `HoTroHocVienTab` | `cap-a1-1440-toi.png` | KHỚP |
| A2 bấm chữ dòng = panel duyệt phải: loại · tên · em · lớp · chip hạn, bối cảnh, "Sau khi duyệt", Từ chối… / Duyệt | `PanelDuyet` (một khuôn với Hộp duyệt) qua `createPortal` vào cột phải | `cap-a2-1440-toi.png` | KHỚP phần chính · KHÁC 2 chỗ (dưới) |
| A2 thanh chọn dính chân cột trái: Đã chọn n · loại · Chọn hết · Bỏ chọn · Từ chối n… · Duyệt n yêu cầu | thanh chọn sẵn có | `cap-a2-1440-toi.png` | KHỚP |
| Sau duyệt (V12): "✓ Đã duyệt · Hoàn tác" + "Yêu cầu tiếp ›" | thẻ kết quả ở cột phải | (thử tay, mục Kiểm) | KHỚP |
| B1 375: phạm vi một khối hết bề rộng · ô chọn lưới 2 × 2 cao 44 px · nút dòng hiện | lớp `max-sm:` | `cap-b1-375-sang.png` | KHỚP |
| B2 375: panel duyệt toàn màn, "‹ Công việc" | cột phải `max-lg` | `cap-b2-375-sang.png` | KHỚP |

KHÁC (có lý do):
1. Panel duyệt chưa có chân dính "Tiếp: …" và nút ở chân — nút nằm cuối thân như Hộp duyệt đầy đủ (một khuôn `TheYeuCau panel`); đổi chân là đổi cả Hộp duyệt → PR riêng nếu chủ SP muốn.
2. Panel duyệt chưa có "Lịch sử · n" và khối khoá–giá trị (Đề xuất / PA / Case / Hạn duyệt) — máy chủ chỉ gửi `dong[]` chữ sẵn, chưa có lịch sử yêu cầu → cần API, để sau.
3. Chip SOS cạnh tên em ở nhóm Chờ bạn duyệt — `TheYeuCauDto` chưa có mức SOS → cần máy chủ, để sau.
Ước KHỚP: 13 / 16 điểm khung ≈ **≥ 90 %** phần nhìn thấy (3 KHÁC trên đều là dữ liệu / khuôn dùng chung).

## Thao tác TRƯỚC → SAU (không mất thao tác)
| Thao tác | Trước | Sau |
|---|---|---|
| Duyệt một yêu cầu | nút Duyệt trên thẻ (Hoàn tác 5 s loại cho huỷ) | nút Duyệt ở dòng (giữ, Hoàn tác 5 s) **và** ở panel |
| Duyệt… (chọn tuần / ghi chú / lệnh chuyển lớp) | ô mở dưới thẻ | mở panel với ô sẵn |
| Từ chối… (lý do) | ô dưới thẻ | mở panel, ô lý do sẵn + focus |
| Trả lời… · + Thêm PA | trên thẻ | nút Trả lời… ở dòng → panel; + Thêm PA trong panel |
| Mở trang gốc | "Mở" | "Mở ›" (dòng + panel) |
| Xem lý do đầy đủ / Xem thêm · Thu gọn | trên thẻ | panel (bối cảnh đầy đủ) |
| Huỷ quyết định / Hoàn tác | toast 5 s; Hộp duyệt › Đã xử lý | giữ + "Hoàn tác" ở thẻ kết quả (loại cho huỷ); toast được thay khi huỷ |
| Duyệt nhiều: tích · Chọn hết · Bỏ chọn · Từ chối n… · Duyệt n | thanh dính đáy | như cũ |
| Xem thêm · Mở hộp duyệt › · n ở chi nhánh khác · Xem | chân khối | chân nhóm ("yêu cầu") |
| Gập / mở nhóm Chờ bạn duyệt | có | có (đang mở panel duyệt thì nhóm không gập) |
| Của tôi / Của GV / Tất cả · Một GV | nút đoạn + "Xem việc của: một GV…" | như cũ, nhãn "Một GV" (aria-label giữ "Xem việc của") |
| Lọc khung FT / Lớp thường | nút đoạn "✓ Tất cả · FT · Lớp thường" | ô chọn "Mọi khung ▾" (số trong mục), nhớ như cũ; "Mọi khung" / "Mọi hạn" là ô chọn gốc mang dáng nút "Một GV ▾" (`ChonDangNut`, PTA rà 29/10); 375 số ô lẻ thì ô cuối hết hàng |
| Chi nhánh · Mọi hạn · chip lọc ✕ · Xoá lọc | có | như cũ |
| Mở việc · Lưu · việc tiếp › · Em này còn · Hết việc nhóm · Gia hạn · Làm thay / Nhập hộ | panel phải | như cũ; mở việc thì đóng panel duyệt (một panel một lúc) |
| Bỏ chữ đang gõ? khi đổi dòng | có ở panel việc | có cả panel duyệt (thử tay) |
| "n chờ bạn duyệt" đầu trang | chữ | **bỏ** — cùng số ở chip "n yêu cầu" ngay dưới |

## Kiểm
- Thử tay (QL Vy, 1440 + 375): bấm dòng → panel; Từ chối… → ô lý do focus; gõ dở rồi bấm dòng khác → hộp "Bỏ chữ đang gõ?"; Duyệt trong panel → "✓ Đã duyệt … · Yêu cầu tiếp › · Hoàn tác · Đóng"; Hoàn tác → yêu cầu về Chờ duyệt, panel mở lại; Duyệt ở dòng → toast Hoàn tác (5) → về lại; tích chọn → thanh chọn; mở việc khi panel duyệt mở → `the` bỏ, panel việc hiện.
- Phép kiểm: `prUiConLai` UICL-7 (cập nhật: bản gọn = dòng cây) + **V8-CV** mới; `prNenTypoMau` K-CHU-4 (chữ cắt dùng `leading-normal`).
- impeccable `audit` 18/20 (detector 0; 1 ghi chú cũ dòng 496 ngoài phạm vi) · web-design-guidelines: không lỗi mới.

## Ảnh
`cap-a1-1440-toi.png` · `cap-a2-1440-toi.png` · `cap-b1-375-sang.png` · `cap-b2-375-sang.png` (mockup | web) · `truoc-sau-1440.png` · `truoc-sau-375.png` · `web-1440-toi-toan-trang.png` · `web-375-sang-toan-trang.png`.
