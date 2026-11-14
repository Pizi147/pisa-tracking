# GD-13c · Học viên & Lớp › Phân công GV — khớp / khác mockup ⑥

Nguồn: `12-plan-giao-dien-dot-3.md` dòng GD-13c · mockup `thiet-ke/v21/hoc-vien-lop.html` (K6, K6b, K6c, K7 "Phân công · CX chỉ xem") + ghi chú mục 2–3 (dòng 44–51) · luật V22.
Nhánh chồng trên GD-13a (`claude/gd13a-hv-lop`, #1685) vì cùng `StudentsPage.tsx` (ô Xem có tìm, hàng lọc ⑥). Ảnh TRƯỚC: `thiet-ke/v21/anh/hoc-vien-lop/truoc/k6*.png`.
Ảnh cặp mockup │ web: `cap-*.png` thư mục này. Tài khoản demo tên giả: QL Nguyễn Khánh Vy (2) · Quản trị (1) · CX Vũ Thanh Tâm (24).

## 1. Truy vết khung → thành phần → ảnh

| # | Khung | Thành phần (nguồn chuẩn) | Web sau PR | Ảnh | Kết quả |
|---|---|---|---|---|---|
| 1 | K6 | Hàng lọc cùng chỗ các tab (ngoài thẻ bảng): Tìm lớp, GV (kính lúp) · vạch · **Thiếu GV n** · phải "22 lớp · 11 GV" + ⓘ | hàng lọc ra khỏi thẻ, `o-tim` + chip dáng ⑥ (số 0 viền đứt không bấm) | cap-k6-ql-1440 | KHỚP |
| 2 | K6 | Ô GV = ô chọn có tìm, nhóm **"Đang dạy lớp này" → "GV khác · chi nhánh"** có số, dòng phụ (hiện tại · môn lớp này · số lớp · dạy được), cuối **Bỏ trống (Chưa có)** | ô môn nay nhóm như ô GVCN (trước: một danh sách xếp "dạy được" trước) | cap-k6-ql-1440 | KHỚP |
| 3 | K6 | Danh sách nằm trong hộp chọn, cao đủ | sửa lỗi có sẵn: danh sách `.oc-ds` (nổi) bị hộp `overflow:auto` 58 px cắt mất | cap-k6-ql-1440 | KHỚP |
| 4 | K6 | Dòng đang sửa nền vàng nhạt + "Nháp · n ô đổi", ô đổi "trước: …", Huỷ sửa · Lưu cuối dòng | nền dòng nháp `--soon-bg` (trước: xanh nhấn nhạt) | cap-k6-ql-1440 | KHỚP |
| 5 | K6 | "Lưu cả n lớp…" · Huỷ hết ở chân | giữ (`ThanhLuuPc`) | — | KHỚP |
| 6 | K6 | **Xếp: Tổng** = ô chọn thường dáng v21 (danh sách ngắn cố định, không ô tìm — ⑤ A6) | `<select>` + `o-chon-vai` (mũi tên vẽ, cao 32) | cap-k6-ql-1440 | KHỚP |
| 7 | K6 | Tổng hợp Giảng dạy · GVCN, bấm tên tô ô, Bỏ tô | giữ | cap-k6-ql-1440 | KHỚP |
| 8 | K6c | Hộp Lưu: Hiệu lực **Ngay hôm nay / Từ tuần** với **ô tuần chuẩn** (gõ "W4 SEP" + nút lịch) | `ONgay kieu="tuan"` thay `<select>` 12 tuần; chỉ thứ Hai từ tuần sau (mốc chờ cũ vẫn hiện) | cap-k6c-ql-1440 | KHỚP |
| 9 | K6c | Đổi người A → B · tick "Tạo việc bàn giao" · câu hệ quả · nút | giữ nội dung | cap-k6c-ql-1440 | KHỚP (KHÁC 2) |
| 10 | K6b | Quản trị mở tab → **vào thẳng chi nhánh gần nhất** (nhớ `nhoChiNhanh`, chưa có → chi nhánh đầu), đổi ở ô Xem; tab này không có "Mọi chi nhánh" | `StudentsPage` chuyển `phamVi=chi-nhanh&cn=…`; ô Xem ẩn mục phạm vi khác ở tab này | cap-k6b-qt-1440, cap-k6b-qt-375 | KHỚP |
| 11 | K7 | CX chỉ xem: một câu chung trên bảng, ô không bấm | giữ; CX cũng vào thẳng chi nhánh | cap-k7-cx-1440 | KHỚP |
| 12 | 375 | Thẻ lớp + Sửa, tổng hợp 6 dòng + "Xem đủ" | giữ; hàng lọc 375 cùng dáng (vạch ẩn) | cap-k6-ql-375 | KHỚP |

| 13 | K6 | Hộp chọn GV: vùng cuộn mờ đáy, **"Bỏ trống (Chưa có)" luôn ở chân hộp** (PTA rà #1690 ý 1) | dòng Bỏ trống `position: sticky` đáy + bóng mờ phía trên | cap-k6-ql-1440 | KHỚP |
| 14 | 375 | Hàng tab thấy được tab đầu (PTA rà #1690 ý 2) | nhãn gọn 375 "SOS" · "Phân công"; `HangTab` (dùng chung) mờ MÉP TRÁI khi đã cuộn qua tab đầu (trước chỉ mờ mép phải) — tab "Tất cả 51" ló mờ bên trái; đệm phải 32 px chỉ khi còn tab bên phải. Bốn tab cần ~406 px > 343 nên vẫn cuộn | cap-k6-ql-375, cap-k6b-qt-375 | KHỚP |

**KHỚP 14 / 14 (100 %).**

## 2. KHÁC (có lý do)

1. Nhóm "GV khác · **MB**": dữ liệu trang phân công chỉ có mã chi nhánh (`chiNhanh.code`); mockup ghi tên "Monbay". Không thêm cột / câu đọc.
2. Hộp Lưu giữ dáng v9 đã duyệt (hai lựa chọn hiệu lực là ô viền, câu hệ quả dưới, chân "Quay lại sửa · Lưu · tạo n việc bàn giao") — mockup vẽ "Đóng · Lưu" và dòng quy chế; chữ cũ nói rõ hậu quả hơn, R6.6 chỉ yêu cầu ô tuần chuẩn.
3. Bảng tổng hợp hiện đủ GV + dòng Tổng (dữ liệu thật); mockup vẽ 3 dòng.

## 3. Thao tác TRƯỚC → SAU (dòng 44–51 ghi chú mockup)

| # | Thao tác TRƯỚC | SAU | Mất? |
|---|---|---|---|
| 44 | Tìm lớp, GV · Thiếu GV | giữ (hàng lọc chuẩn) | không |
| 45 | Bấm ô → chọn GV · Bỏ trống | ô chọn có tìm, nhóm chuẩn, Bỏ trống cuối | không |
| 46 | Lưu cuối dòng · Huỷ sửa · Lưu cả n lớp… · Huỷ hết · Ctrl+Enter · mũi tên giữa ô | giữ | không |
| 47 | Hiệu lực Ngay hôm nay / Từ tuần (chọn trong 12 tuần) · tạo việc bàn giao | Từ tuần = gõ / lịch (mọi tuần từ tuần sau, không giới hạn 12) | không (rộng hơn) |
| 48 | Hoàn tác sau lưu · Chờ đổi (đổi mốc / huỷ lịch, Hoàn tác) | giữ (Đổi mốc dùng cùng ô tuần mới) | không |
| 49 | Bấm tên GV ở tổng hợp → tô · Bỏ tô · Xếp | giữ | không |
| 50 | ⓘ Cách dùng | giữ | không |
| 51 | Quản trị: "Chọn chi nhánh để xem phân công" + ô chọn | vào thẳng chi nhánh gần nhất; đổi ở ô Xem (ô chọn trong khung rỗng còn là đường dự phòng khi không có danh sách chi nhánh) | không |

**Mất thao tác: không.**

## 4. Đo

- **Turso (đọc ít hơn)**: không sửa máy chủ. Mở tab Phân công — QL: trước `/hoc-vien-lop/phan-cong` (không chi nhánh) + `…?branchId=1`, sau chỉ `…?branchId=1` (**−1 câu đọc trang**); Quản trị: trước `/phan-cong` (màn chọn) rồi bấm chọn → `/hoc-vien-lop` + `/phan-cong` chi nhánh, sau tự vào → bỏ lượt `/phan-cong` không chi nhánh (**−1**). Góc chỉ dựng khi đã biết chi nhánh.
- **✕ / ⋯**: ✕ hộp Lưu 32 × 32 lệch 0 / 0,75 px · ⋯ trang 36 × 36: 0 / 0,75 px → ≤ 1 px.
- `impeccable detect` (GocPhanCongGv, HopLuuPhanCong, TongHopPc): 0 lỗi, 0 ghi chú.
