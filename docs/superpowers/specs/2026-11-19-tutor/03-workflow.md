# 03 — Workflow Tutor (đề xuất, 19/11/2026)

Trạng thái: **ĐỀ XUẤT — chờ `04-cau-hoi.md`**. Theo cách B của `01-de-bai.md` (buổi là trung tâm). Số câu hỏi trong ngoặc [C…] = phần còn chờ chủ SP.

## 1. Bốn bước, ba vật

Vật: **PA Tutor** (đã có — em × kỹ năng cần tutor) · **Người dạy** của PA (một ô, thay ba ô đang chồng nhau) · **Buổi** (MỚI — ngày · người dạy · kỹ năng · 1..n em; mỗi em: Có mặt / Vắng + nhận xét).

```
① Có PA Tutor ──► ② Giao người dạy ──► ③ Ghi buổi (lặp) ──► ④ Chốt tiến triển 2 tuần / lần ──► PA khép (mốc quy chế / Kết thúc)
   máy / Head / GV     Head tutor · Head · GV    người dạy (hoặc ghi hộ)     GV bộ môn (như nay, số buổi tự đếm)
```

## 2. Sáu câu cho từng bước

| | ① Có PA Tutor | ② Giao người dạy | ③ Ghi buổi | ④ Chốt tiến triển |
|---|---|---|---|---|
| Phát sinh từ đâu | SOS quy chế · Kỳ vọng "Trung tâm" · GV thêm (giữ nguyên) | PA Tutor đang mở chưa có người dạy | sau mỗi buổi dạy | hết kỳ 2 tuần (giữ nguyên) |
| Ai làm | máy / Head / GV; GV bộ môn **Xác nhận PA** (một bấm, không bắt Số buổi [C6]) | Head tutor (mọi chi nhánh) · Head (chi nhánh mình) · GV bộ môn của Case [C4] | **người dạy** nếu có tài khoản; tutor ngoài → GV bộ môn / GVCN / Head / Head tutor ghi hộ [C2] | GV bộ môn kỹ năng (giữ) |
| Ai chốt | GV bộ môn | không ai duyệt | không ai duyệt | GV bộ môn |
| Ai cần biết | GVCN, Head | người dạy (thấy em ở "Em tôi dạy tutor"), GV bộ môn, GVCN | GV bộ môn (đọc nhận xét), GVCN, TVV, Head tutor | Head, TVV, CX |
| Thông tin để làm ngay | (giữ) | em · lớp · kỹ năng · điểm kỹ năng / kỳ vọng · mô tả Case · người dạy đang rảnh theo kỹ năng + chi nhánh (gợi ý) | danh sách em mình dạy, chọn sẵn em + kỹ năng; nhận xét buổi trước | số buổi kỳ này **tự đếm**, danh sách buổi + nhận xét hiện sẵn |
| Đầu ra · xong khi | PA chạy | PA có người dạy (+ lịch chữ ngắn, tuỳ chọn [C3]) | buổi có ngày + người dạy + mỗi em Có mặt (kèm nhận xét) hoặc Vắng | lần ghi có Tiến triển + Quyết định |
| Bắt buộc | mô tả PA (giữ) | người dạy | ngày · người dạy · ≥ 1 em · nhận xét cho em có mặt (≥ 8 ký tự, ≤ 300) | Tiến triển · Quyết định (giữ) |
| Gộp / bỏ | **bỏ** "Số buổi / 2 tuần" bắt buộc [C6] | **gộp** "Người dạy kỳ này" vào ô Người dạy của PA | **bỏ** 3 ô Có / Không + sao [C5]; Hình thức tự suy, không hỏi | **bỏ** gõ lại từng buổi, bỏ ô Số buổi kỳ này |
| Sửa · huỷ · khôi phục | (giữ) | đổi người dạy bất kỳ lúc nào, có lịch sử; buổi cũ giữ tên người dạy cũ | sửa mọi lúc (người ghi, người dạy, GV bộ môn, Head, Head tutor), lịch sử trước → sau; xoá → Thùng rác 30 ngày + Hoàn tác (N28) | Sửa kết quả (giữ) |

Không thêm việc có hạn nào. Việc có hạn của Tutor vẫn chỉ là hai việc đang có: **Xác nhận PA** và **Kết quả PA** (đi qua `/my-work`, bộ đếm một nguồn #1840).

## 3. Mỗi vai thấy gì, ở đâu

| Vai | Ở đâu | Thấy / làm |
|---|---|---|
| GV dạy tutor | **Công việc** (trang đầu GV): khối "Em tôi dạy tutor" dưới "Lớp của tôi", chỉ hiện khi có em [C12] | mỗi dòng: em · lớp · kỹ năng · buổi gần nhất · số buổi; nút **+ Buổi** (chọn nhiều em → một buổi nhóm); bấm em → thẻ tóm tắt chỉ đọc [C9] |
| GV bộ môn | Case của em (hồ sơ HV / hồ sơ lớp / Công việc — đúng chỗ đang có thẻ PA) | thẻ PA Tutor: Người dạy (bấm đổi) · "5 buổi · vắng 1" · danh sách buổi (ngày · người dạy · nhận xét) · **+ Buổi**; Ghi kết quả PA chỉ còn Tiến triển + Quyết định |
| GVCN | hồ sơ lớp / hồ sơ HV (thẻ PA như trên, chỉ đọc + ghi hộ buổi) | — |
| Head tutor | menu **Tutor** (toàn hệ thống) + trang đầu như GV (N43) | 3 tab: **Học viên** · **Buổi** · **Người dạy** (mục 4) |
| Head | menu **Tutor** (chi nhánh mình) | như Head tutor trong chi nhánh; không sửa danh bạ tutor ngoài của chi nhánh khác |
| Quản trị | menu Tutor | mọi thứ |
| CX · Admin | menu Tutor, **chỉ xem** (Admin thêm Xuất số buổi [C10]) | — |
| TVV | hồ sơ HV (thẻ PA Tutor, chỉ đọc) | — |

## 4. Trang Tutor (Head tutor · Head · Quản trị · CX · Admin)

| Tab | Mỗi dòng | Bộ lọc nhanh (chip có số) | Thao tác |
|---|---|---|---|
| **Học viên** (mặc định) | em · lớp · kỹ năng · nguồn (SOS 3 · MT2 / Kỳ vọng / GV thêm) · người dạy · buổi (đã học, vắng) · buổi gần nhất | **Chưa có người dạy** · **2 tuần chưa có buổi** · Đang học · Tất cả | Giao / đổi người dạy tại dòng; chọn nhiều → "Giao cho n dòng"; + Buổi |
| **Buổi** | ngày · người dạy · kỹ năng · các em (có mặt / vắng) · người ghi | khoảng tuần (mặc định 4 tuần gồm tuần này) · người dạy · kỹ năng | + Buổi · sửa · xoá |
| **Người dạy** | tên · loại (GV / Tutor ngoài) · nơi dạy · kỹ năng · em đang dạy · buổi trong khoảng · báo vấn đề · kết luận | Cần chú ý · Đang dạy · Ngừng · Tất cả | Thêm tutor · Tải danh sách · Gộp tên gõ tay · Nhận xét + kết luận (tutor ngoài) · Xuất số buổi theo tháng [C10] |

Em gom theo em: em có 4 kỹ năng = một nhóm 4 dòng con (tên em một lần), không lặp tên.
"Việc của bạn" đầu trang (Head tutor / Head): tối đa 3 dòng — n dòng chưa có người dạy · n dòng 2 tuần chưa có buổi · n người dạy bị báo vấn đề; bấm = lọc tab tương ứng. Không hạn, không đỏ "quá hạn" [C7].

## 5. Tình huống thật

| Tình huống | Hôm nay | Đề xuất | Bấm |
|---|---|---|---|
| Em SOS 3 ở MT2, trượt R + W1 + W2 → 3 PA Tutor | GV bộ môn R và GV W mỗi người Xác nhận + gõ "Số buổi / 2 tuần"; 2 tuần sau mỗi người gõ lại từng buổi + 3 ô | Xác nhận một bấm; Head tutor thấy em ở "Chưa có người dạy" → giao; người dạy ghi buổi; GV bộ môn chỉ chọn Tiến triển | GV: 9+ ô / buổi → 0; người dạy: 4 (em · ngày sẵn hôm nay · nhận xét · Lưu) |
| Một người dạy 3 em cùng buổi (nhóm) | ghi ở 3 PA, 3 form, 3 người khác nhau | một form "+ Buổi": tick 3 em, mỗi em một ô nhận xét, Lưu một lần (một giao dịch) | 3 form → 1 |
| Em vắng buổi | không ghi được; GV ghi "0 buổi" | tick **Vắng** cho em đó (không cần nhận xét); không tính buổi; thẻ PA hiện "vắng 1" [C8] | 1 |
| Đổi lịch | không có lịch trong PISA | không có buổi xếp trước [C3] → không có gì phải dời; lịch chữ ngắn ở ô Người dạy sửa tự do | 0 |
| GV / tutor nghỉ một buổi | — | người dạy thay ghi buổi với tên mình (ô Người dạy của buổi điền sẵn, đổi được) | 1 |
| Người dạy nghỉ hẳn | sửa từng PA | Tutor › Người dạy › mở người đó → "Em đang dạy" → chọn tất cả → Giao cho người khác; buổi cũ giữ tên cũ | ~4 |
| Head tutor kiêm GV | trang đầu GV, không có gì về Tutor | trang đầu GV như nay + menu Tutor; em mình dạy tutor ở khối "Em tôi dạy tutor" | — |
| Người dạy ở chi nhánh khác (online) | Head chi nhánh không thấy | buổi thuộc chi nhánh **lớp của em lúc ghi** (giữ luật 19/10); người dạy chỉ thấy em được giao; Head chi nhánh của em thấy buổi | — |
| GV dạy tutor không dạy lớp em | 403 hồ sơ HV (N48) | thẻ tóm tắt chỉ đọc: kỹ năng, điểm kỹ năng + kỳ vọng, mô tả Case, nhận xét các buổi [C9]; không mở hồ sơ | 1 |
| Lô lỗi một phần — ghi buổi 5 em, 1 em vừa Tạm dừng / PA vừa khép | — | không lưu gì; dòng em lỗi báo lý do tại dòng + nút "Bỏ em này"; chữ 4 em kia giữ; bấm Lưu lại | 2 |
| Lô lỗi một phần — Tải danh sách tutor | dòng hợp lệ lưu, dòng lỗi báo tại dòng (đã có) | giữ | — |
| Em chưa có PA Tutor kỹ năng đó mà được dạy | — | form báo tại dòng "Chưa có PA Tutor Reading" + "Thêm PA" (quyền như thêm PA hôm nay); không tự sinh PA ngầm | 2 |
| Em có KQ thi thật (N46) / Tạm dừng | việc ẩn | em rời các danh sách Tutor; buổi cũ giữ; Học tiếp (N51) → hiện lại | 0 |
| Đổi GV bộ môn (N29) | PA theo GV mới | GV mới giữ việc Kết quả PA; **người dạy tutor không đổi** | 0 |
| PA Tutor khép (chạm mốc / Kết thúc / Thay PA) | — | em rời "Em tôi dạy"; buổi giữ ở lịch sử Case | 0 |
| Ghi nhầm buổi | Sửa kết quả (lần cũ chỉ sửa chữ) | sửa mọi trường; xoá có Hoàn tác + Thùng rác | 1–2 |
| 133 PA quy chế đang chờ xác nhận vì thiếu Số buổi | kẹt | bỏ bắt buộc → GV xác nhận một bấm (hoặc "Xác nhận n PA" đã có) | — |
| 59 buổi cũ + 26 tên gõ tay | — | chuyển sang bảng buổi mới (ngày = ngày ghi); 3 ô / sao cũ giữ chỉ đọc ở lịch sử; Gộp tên như cũ | — |

## 6. Dòng đọc Turso (ước, sẽ đo ở kế hoạch PR)

| Chỗ | Đọc | Ước |
|---|---|---|
| Tutor › Học viên, Head một chi nhánh | PA Tutor đang mở của chi nhánh (~60–120) + đếm buổi theo PA (một câu gom) | ≤ 10 câu · ≤ 600 dòng |
| Tutor › Học viên, Head tutor toàn hệ thống | ~430 PA + gom buổi; mặc định chip "Chưa có người dạy" + phân trang | ≤ 12 câu · ≤ 1 500 dòng |
| Tutor › Buổi / Người dạy | buổi trong khoảng (4 tuần) | ≤ 8 câu · ≤ 500 dòng |
| Công việc GV "Em tôi dạy tutor" | **không thêm request**: đi kèm `/my-work` (một câu theo `nguoi_day = tôi`, có chỉ mục) | + 1 câu · + ≤ 30 dòng |
| Thẻ PA Tutor trong Case | buổi của PA, nạp cùng chi tiết Case (đang nạp `followups[].buoi`) | ± 0 |

Không chỗ nào vượt 30 câu / 2 000 dòng → không cần cảnh báo. Trang Tutor chỉ 5 vai ít người mở → ước < 20 000 dòng / ngày.
