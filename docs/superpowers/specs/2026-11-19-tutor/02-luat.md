# 02 — Luật Tutor (bản 2, 19/11/2026 — theo lời chủ SP 19/11)

Bản 1 (buổi là bản ghi riêng, giao người dạy, tick Vắng) **đã bỏ** — chủ SP 19/11 ý 1, 2, 6 (nguyên văn: `plan.md` mục 4). Bản 1 còn trong git (#1848).
Cột "Nguồn": **CSP n** = lời chủ SP 19/11 ý n (đã chốt) · **PTA** = PTA Tutor tự chọn cho khớp, chủ SP sửa nếu khác · **Cn** = còn hỏi ở `04-cau-hoi.md`.
"20/10" = đặc tả `2026-10-19-tutor-head-tutor-design.md`. Luật không nhắc (SOS → PA, mốc quy chế, hạn thứ Ba, Hiệu quả PA, N46, N51, N52…) **không đổi**.

## Nguyên tắc (CSP 6)

Phần Tutor chỉ để **làm rõ kết quả PA** và **đánh giá được tutor**. **Không sinh thêm việc** cho ai.

## Luật

| # | Luật | So hiện tại / 20/10 | Nguồn |
|---|---|---|---|
| TU1 | **Không phân công người dạy.** Ai dạy chỉ ghi **sau khi dạy**, trong Ghi kết quả PA (ô **Tutor**). PA Tutor không còn ô "Người dạy" ở Xác nhận / Thêm / Sửa PA và không còn "Người dạy kỳ này" | ĐỔI: bỏ 2 trong 3 ô "ai dạy" (cột dữ liệu giữ, chỉ thôi hiện với PA Tutor) | CSP 1 · PTA (bỏ ô) |
| TU2 | **Số buổi ghi "a / b"** = đã học / dự kiến của kỳ. 1 / 2 = vắng 1, 0 / 2 = vắng 2. **Không có khái niệm, nút hay trạng thái "vắng"** | ĐỔI: nay một ô "Số buổi kỳ này" | CSP 2 |
| TU3 | **Một dòng gộp cho cả kỳ** là mặc định: Tutor + Nội dung. Chỉ thêm dòng khi **tutor khác** hoặc **nội dung khác** ("+ Tutor khác") — mỗi dòng thêm có ô số buổi nhỏ; tổng các dòng = a | ĐỔI: nay bắt đúng n dòng cho n buổi | CSP 4 |
| TU4 | **Ô Tutor** (một ô có tìm — N45) gồm: **GV** (mọi tài khoản GV đang làm việc) + tutor trong danh bạ + tên gõ tay. Gợi ý trước: cùng chi nhánh lớp em + đúng kỹ năng; kỳ sau điền sẵn tutor kỳ trước | ĐỔI: thêm GV | CSP 3 |
| TU5 | **3 nút Có / Không** (chuẩn bị bài · tài liệu đúng hạn · gửi feedback cho GV) **chỉ hiện sau khi dòng có tên Tutor**, và **tuỳ chọn**: bỏ trống vẫn lưu được, không báo thiếu. **Đánh giá thêm** (sao + nhận xét về tutor) vẫn gập, bấm mới mở | ĐỔI: nay bắt buộc cả 3 | CSP 6 |
| TU6 | Bắt buộc khi a ≥ 1: **một** tên Tutor + **một** Nội dung (≥ 8 ký tự) cho cả kỳ. a = 0: không cần Tutor, không cần Nội dung | GIỮ luật 19/10 "tên tutor + nhận xét", giảm từ mỗi buổi xuống một lần | PTA |
| TU7 | **Lưu nháp trong kỳ, bất kỳ lúc nào** (vd mỗi tuần sau 1–2 buổi): nháp giữ cả số buổi, tutor, nội dung, 3 nút — lưu máy chủ. Nháp **không** phải kết quả: việc, hạn, sổ nghĩa vụ không đổi. Tới hạn mở ra đã có sẵn, bổ sung rồi **Lưu** = chốt kỳ | MỞ RỘNG nháp máy chủ NHAP-KQ-PA 13/11 (nay chỉ giữ mức + nhận xét) | CSP 4 |
| TU8 | **Khối "PA đang chạy"** ở Công việc của GV, dưới các việc tới hạn: mọi PA GV đang giữ mà **chưa tới hạn** — em · kỹ năng · PA · hạn kỳ · dấu "nháp" nếu có; bấm = mở ghi nháp. **Không tính** vào số việc, badge, chuông | THAY dải "Sắp tới · Kết quả PA n" (chỉ một con số, cửa sổ 7 ngày — GD-21) | CSP 4 |
| TU9 | Khối TU8 áp **mọi loại PA** (Tutor, Tự học, Bổ trợ…), không riêng Tutor; phần Tutor (a / b, ô Tutor) chỉ hiện ở PA Tutor | — | PTA (chủ SP nói "những Phương Án… đang chạy") |
| TU10 | **Hạn Kết quả PA giữ: 2 tuần một lần, hết thứ Ba.** Không đổi công thức | GIỮ (OV-12a) | CSP 5 — xem `00-hien-trang.md` mục 4 |
| TU11 | **b (số buổi dự kiến của kỳ)**: — | — | **C1** |
| TU12 | **Trang Tutor** (đánh giá tutor): — | — | **C2** |
| TU13 | **Head** ở danh bạ tutor: — | — | **C3** |
| TU14 | **Đếm buổi theo người dạy × tháng**: — | — | **C4** |
| TU15 | Danh bạ tutor: Tên + Kỹ năng bắt buộc; SĐT chống trùng; Tải danh sách; Gộp tên gõ tay + Hoàn tác; GV chỉ thấy 3 số cuối SĐT; xoá chỉ khi chưa có buổi; tutor "Ngừng hợp tác" không hiện ở ô chọn | GIỮ 20/10 | — |
| TU16 | "Cần chú ý" (tutor) = có dòng có ô "Không" hoặc sao ≤ 2 **sau** nhận xét gần nhất của Head tutor / Quản trị. Dòng không trả lời 3 nút **không** vào mẫu số, không tính | GIỮ 20/10 (đã đúng với ô trống) | — |
| TU17 | Không thêm việc có hạn, không chuông, không chặn nào mới. Không tab cấu hình Tutor ở Quản trị (chủ SP 12/11) | GIỮ | CSP 6 |
| TU18 | Sửa kết quả đã lưu: bấm Sửa, sửa được mọi ô phần Tutor của **mọi** lần ghi (nay lần ghi cũ chỉ sửa chữ); có lịch sử. Bấm Lưu là lưu, không toast Hoàn tác (chủ SP 13/11) | NỚI nhỏ | PTA (N3) |
| TU19 | Dữ liệu cũ: 59 buổi đã ghi giữ nguyên (mỗi dòng = 1 buổi); không migrate đổi nghĩa | — | PTA |

## Không còn trong bản 2

Giao / đổi người dạy · danh sách "Chưa có người dạy" · tick Vắng · buổi có ngày riêng · người dạy tự ghi · khối "Em tôi dạy tutor" · thẻ tóm tắt cho GV dạy tutor · ô "Lịch" · "2 tuần chưa có buổi" như một việc theo dõi.
