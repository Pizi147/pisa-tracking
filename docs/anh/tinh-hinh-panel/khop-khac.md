# PR 3/3 TINH-HINH — panel Xác nhận xử lý · Ghi vi phạm / nhắc nhở · Công việc (GVCN, TVV) · thẻ duyệt QL · KHỚP / KHÁC

Mockup `thiet-ke/v20/tinh-hinh.html` (chủ SP duyệt #1497). Ảnh cặp (trái mockup | phải web, bộ demo, tối):
`xu-ly-1440.png` (D1, GVCN) · `vuot-bac-1440.png` (D2 sau bấm Vượt bậc) · `nhac-nho-1440.png` (B1 sau bấm Chỉ nhắc nhở) · `hop-duyet-1440.png` (E1, QL — userId 2).

| Khung | Thành phần web | Kết quả |
|---|---|---|
| D 4 ô cách xử lý (Nâng 1 bậc = Mặc định · Không nâng · Vượt bậc · Ngoài thang) | `XacNhanXuLyPanel` — panel rộng 720 (`rong="rong"`), 4 ô một hàng; 375: 2×2 như mockup D4 | KHỚP |
| D dòng mốc · bậc kế dưới tiêu đề | `chuMoc` · Bậc kế | KHỚP |
| D chip bậc / loại + dải vàng "Khác mặc định → sẽ gửi QL duyệt. QL có 5 ngày (tới …); hết hạn giữ quyết định của bạn: …" + ⓘ TVV sau chốt | cùng panel | KHỚP |
| D đầu panel: "Việc · Ý thức & Phối hợp" · tên em · lớp · chip hạn (⚠ quá n ngày) | `dauViec` + `ChipHan` ở dòng 2 (chip chỉ khi việc có hạn — em trong ảnh demo chưa có hạn nên không chip) | KHỚP |
| D chân lưu: trái "Chưa lưu" / trạng thái lưu · phải Đóng + nút chính "Xác nhận · {bậc}" / "Gửi Quản lý duyệt" | `KhungPanel chan` (`huyPhai`) — bỏ nút trong thân (PTA rà 12/11) | KHỚP |
| D thân phẳng: không hộp lồng, không khối "Lần trước · Bậc tiếp theo" (trùng dòng mốc) | gỡ `CanLam` / `BoiCanh` khỏi panel | KHỚP |
| D "Vi phạm đưa vào" bảng dòng có viền, nhãn trạng thái bên phải | `ul` viền 10 px, kẻ giữa dòng | KHỚP (phải ghi trạng thái thật "Mới / Đã ghi nhận" thay "bắt buộc") |
| D Ngày + "Người thực hiện" (ô chọn) chỉ khi mặc định · Mô tả không chữ mẫu, bộ đếm "n / 300" | `ONgay` · `ChonNguoi` · bộ đếm dưới ô; máy chủ chặn > 300 (`moTa`, chữ cũ dài giữ được — N35) | KHỚP |
| D "Lưu xong: TVV … nhận việc báo PH · hạn …" | dòng dưới Bằng chứng (TVV phụ trách em, hạn = `hanBaoPh`); em không có TVV thì không hiện | KHỚP |
| D bỏ "Đề xuất QL duyệt" (nút chữ trong panel + link ở cột Bước tab lớp / HV) + "← Quay lại Xác nhận xử lý" | gỡ | BỎ (đề bài) |
| D không dải bước (PTA 12/11: bỏ mọi ① ② ③) | gỡ `TienTrinh` khỏi panel | KHỚP |
| B lựa chọn Vi phạm \| Chỉ nhắc nhở + câu hậu quả + tiêu đề "Ghi nhắc nhở" + "Lưu nhắc nhở"; Sửa đổi được hai chiều | `RecordViolationPanel` | KHỚP |
| B nhãn khối + ô "Nhắc nhở *" khi Chỉ nhắc nhở | `DongViPham chiNhac` | KHỚP |
| C2 TVV "Báo PH · Tình hình học tập" — nội dung GV gửi + form Đã báo PH / Chưa liên hệ được | `PanelBaoPhTvv` (khối tình hình thay dải vi phạm) | KHỚP |
| F2 / F4 GVCN "Tình hình học tập · TVV hỏi" — câu hỏi + Kết quả (bộ đếm) + Lưu · gửi TVV + Hoàn tác + Việc tiếp › | `PanelHoiTinhHinh` (Công việc `yt_hoi_tinh_hinh`) | KHỚP (một em một panel — Công việc mở theo dòng việc) |
| E thẻ duyệt: nhãn cách + bậc, "Còn n ngày · 5 vạch · Hết hạn: giữ quyết định GVCN", ≤ 1 ngày nền vàng ⚠ | `HopChoDuyet` `DemNguocYThuc` (thẻ `y_thuc`) | KHỚP phần đếm ngược; **KHÁC**: hộp duyệt giữ dáng danh sách dòng chung mọi loại thẻ (mockup vẽ thẻ lớn riêng) — đổi cả hộp là màn khác |

**KHỚP 15 / 16** (94 %) (1 KHÁC có lý do: hộp duyệt giữ dáng dòng chung mọi loại thẻ — PTA chấp nhận 12/11). Ảnh thêm: `khong-nang-375.png` (D4).

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau | |
|---|---|---|---|
| Xác nhận xử lý bậc kế | panel | ô "Nâng 1 bậc" (mặc định) | GIỮ |
| Đề xuất WL 3 / Meeting / Đình chỉ / Khác · Không tăng bậc | nút chữ → chế độ thứ hai | ô Ngoài thang · Không nâng trong cùng form | ĐỔI chỗ |
| Vượt bậc | không có | ô Vượt bậc | MỚI |
| Rút đề xuất · Sửa lý do · bằng chứng (chờ QL) | panel lần xử lý / Hộp duyệt | như cũ | GIỮ |
| Ghi nhắc nhở · đổi Vi phạm ↔ Nhắc nhở | — | panel Ghi / Sửa vi phạm | MỚI |
| GVCN trả lời TVV hỏi · Hoàn tác | — | Công việc / tab Ý thức | MỚI |
| QL Duyệt / Từ chối thẻ Ý thức | Hộp duyệt | như cũ + đếm ngược | GIỮ |
| Đóng panel Xác nhận xử lý | ✕ / Esc (chân chỉ hiện khi lỗi) | ✕ / Esc + nút Đóng ở chân (cùng đường hỏi "Bỏ chữ đang gõ?") | GIỮ + thêm |
| Mô tả xử lý / Lý do đề xuất dài | cắt lặng ở 2000 | > 300 báo tại ô, không lưu, chữ giữ | ĐỔI (N35, mockup "/ 300") |

Turso: +0 câu — tên TVV lấy cùng câu đọc học viên (`hocVien` LEFT JOIN users).
