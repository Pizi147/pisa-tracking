# v29 · Vai mới (VAI-1 web) — ghi chú mockup

Đặc tả: `docs/superpowers/specs/2026-11-26-vai-gdcn-lead-tvv-bpxl/thiet-ke.md` (chủ SP duyệt 26/11; máy chủ VAI-0 đã merge #2253) · luật N74–N77 (`plan.md` 1.6) · chủ SP 26/11 "Ẩn điểm, chỉ lịch".
Chủ SP 26/11: "cái gì làm được luôn làm đi, mockup v29?" — đơn giản, ít khung, chỉ vẽ màn thật sự đổi.

Hai tệp (hai nền khác nhau, không trộn CSS):
- `ke-hoach-test-bpxl.html` — nền v22 BPXL trang đầu (v21 CSS) · khung K1–K3.
- `vai-moi.html` — nền v27 / v28 (khuôn A, panel 720, khối việc, Tuyến; `../v28/chung-v27.js`) · khung V1–V4.
- `v29.css` — chỉ thêm: ô Chi nhánh, cụm "Xếp lịch", ô lượt "chỉ lịch", hàng vai hộp Sửa tài khoản. Không màu / cỡ chữ mới.

Ảnh: `anh/` — 1440 / 1280 tối, 375 sáng (như v28).

## 1. Đặc tả → khung

| Đặc tả (mục / luật) | Khung | Ghi |
|---|---|---|
| Mục 9 V1 · Sửa tài khoản: ô vai thêm GĐCN, Lead TVV | V1a | ô vai mở, hai vai mới có dòng phụ nói quyền |
| Mục 9 V1 · BPXL "Toàn hệ thống" = lead (không nhận việc tự động) | V1b | dòng phụ dưới chip nói hậu quả (lưu ý cần thiết) |
| N77 · BPXL tích chi nhánh = nhận việc chi nhánh đó | V1c (375) | "nhận việc tự động của lớp chưa ai nhận ở MB, CP" |
| N76 · Lead TVV toàn hệ thống chỉ theo dõi | V1b | dòng phụ Lead TVV |
| Kỹ năng phụ trách chỉ khi có vai GV (PR #2245) | V1a–c | không vẽ khối Kỹ năng (tài khoản không có vai GV) |
| Mục 9 V2 · Kế hoạch Test ô Chi nhánh (mặc định CN gán; mọi CN) | K1a–c, K2a–b | ô "Chi nhánh" đầu hàng lọc |
| N77 · Nhận lớp / Bỏ nhận / Nhận lại ở dòng lớp | K1a–c | ba trạng thái: Bạn · tên người khác · Chưa ai nhận |
| N77 · nhận lại không khoá, người cũ có tin; Hoàn tác | K3a | toast "Đã nhận … · n việc Xếp lịch họp chuyển sang bạn" + Hoàn tác |
| Lỗi 409 (hai người bấm cùng lúc) | K3b | "Lớp vừa được người khác nhận — mở lại để xem." + Tải lại |
| Chủ SP "Ẩn điểm, chỉ lịch" · lớp CN khác không band / Overall / nhận xét, S Ex giữ lịch | K2a–b | "Đã có điểm" thay band; "S Ex 1 · W1 SEP" không điểm; tên em không link |
| Mục 9 V3 · Đầu hồ sơ lớp "Xếp lịch: {tên}" · Head / GĐCN / QT / lead BPXL đổi | V2a (hộp chọn BPXL), V2b (vừa đổi + Hoàn tác) | hộp chọn người của v28, chỉ BPXL |
| Head ở hồ sơ lớp: lớp chưa ai nhận (bấm gán) | V2c (375) | BPXL ở hồ sơ lớp dùng đúng cụm Nhận lớp / Bỏ nhận của K1 (không vẽ lại) |
| Mục 9 V4 · Công việc GĐCN — chỉ Kết quả meeting (N75) | V3a (1440 + panel), V3b (375) | khối Phụ trách "Bạn"; Tuyến Phối hợp SOS |
| GĐCN không có việc riêng → mở "Tất cả" (như CX N63 ④) | V3c (1280) | dòng ghi người giữ (Head / GVCN / Lead TVV) |
| N76b · Lead TVV giữ việc TVV của em chưa có TVV / TVV hết vai | V4a (1440 + panel), V4b (375) | khối "Em chưa có TVV · Gán TVV cho em ›" |
| N74 · một việc một người | V3a, V4a | ô Phụ trách một tên, "mặc định" |

## 2. Thao tác TRƯỚC → SAU

| Màn | Trước | Sau | Mất gì |
|---|---|---|---|
| Kế hoạch Test (BPXL) | lớp chi nhánh gán | + ô Chi nhánh; + Nhận lớp / Bỏ nhận / Nhận lại | không |
| Kế hoạch Test CN khác | không thấy | thấy + xếp được; không điểm | không |
| Sửa tài khoản | 8 vai | 10 vai (+ GĐCN, Lead TVV) + dòng phụ nói hậu quả | không |
| Hồ sơ lớp | — | + "Xếp lịch {tên}" (bấm đổi / nhận) | không |
| Công việc GĐCN / Lead TVV | (vai chưa có) | như Head / như CX + việc riêng | — |

## 3. Không vẽ khung riêng (dùng lại thứ sẵn có)

Lịch Test tuần chi nhánh khác (cùng ô Chi nhánh) · Tổng quan GĐCN (= Head) · Tổng quan Lead TVV (= CX) · chuông "Cập nhật" người cũ khi bị nhận lại lớp (khuôn tin v28) · Đang theo dõi của Lead TVV (khuôn v27) · hộp Sửa tài khoản khi lưu lỗi (khuôn sẵn có).

## 4. Rà

Máy dò khi chụp (18 khung): tràn mép khung 0 · chữ `undefined` 0 · cắt chữ 0 (trừ chữ chỉ cho trình đọc màn hình).

## 5. Critique — `impeccable critique`, hai vòng 26/11 (mỗi vòng một reviewer độc lập đọc đủ 18 ảnh)

| Vòng | Điểm | P0 | P1 | Đã làm |
|---|---|---|---|---|
| 1 | 31/40 | 0 | 3 | sửa 3 P1 (toast lỗi K3b, ✓ chip Toàn hệ thống V1b, hàng Của tôi · Tất cả V4) + P2 (cụm Xếp lịch thẳng cột, chữ xuống dòng, tên gọi, vẽ thêm Lead TVV toàn HT · BPXL đủ CN · Head "chưa ai nhận") |
| 2 | **33/40** | 0 | 1 | sửa P1 (toast K3a tương phản thấp) + P3 (V3c chụp đúng 1280, câu lỗi ngắn, chip chưa chọn, "Bỏ người xếp lịch") |

Chưa tới 35; theo cổng (chạm 30 → tối đa 2 vòng nữa, rồi chỉ cần không P0 / P1): dừng ở **không còn P0 / P1 đã biết**.

Để lại cho người làm web (nền v27 / v28, không do v29): Tuyến ở 375 tên bước dài xuống dòng (V3b) · dòng phụ việc sát mép phải ở 375 khi lý do dài (V4b) — thêm `text-overflow: ellipsis` · detector 43 phát hiện đều ở nền v21 / v28 (chip L R W S vàng, sọc trái nhóm).
