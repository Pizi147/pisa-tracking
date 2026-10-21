# Truy vết — `ho-so-gv.html` (V5-B3 · Hồ sơ GV)

V5-B3 · 22/10/2026 · dựa trên nền V5-A (`v5-nen.css`, `du-lieu-demo.md` mục 3, 8b; `07-huong-thiet-ke.md` mục 3 — phương án C).
Trạng thái: **ĐỀ XUẤT THIẾT KẾ** — chờ chủ SP duyệt. Dữ liệu demo, không phải số thật. Ảnh: `anh/ho-so-gv-*.png`.
Điều khiển mockup (thanh nét đứt trên cùng, không có trên web): Phương án C / B · Người xem QL / GV tự xem · Trạng thái. URL: `?pa=b`, `?vai=gv`, `?tt=tai|loi|rong`, `?tab=ht`, `?mo=<số>`, `?theme=dark`.

## Yêu cầu → khung → thành phần

| Yêu cầu | Loại | Khung (ảnh) | Thành phần |
|---|---|---|---|
| C06 · brief 13 — hai nhóm Hành chính / Giảng dạy – Học thuật | CHỐT | `ho-so-gv-1440-sang`, `-hoc-thuat-1440` | dải tóm tắt 2 nhóm (`.dai`) + 2 tab |
| brief 13.3 — so 2 hướng A (tab) / B (hai khu); khuyến nghị A + dòng tóm tắt | ĐX | C: `-1440-sang` · B: `-phuong-an-b-1440` | C = A + dải tóm tắt luôn thấy (07 mục 3). B vẽ để so, không khuyến nghị (trang dài, hai cột lệch) |
| brief 13 — đầu hồ sơ chỉ tên, chi nhánh, kỹ năng, vai, lớp | CHỐT | đầu trang | `.dau-hs`; lớp đang dạy ở khối cuối (danh tính, không phải số kỳ) |
| brief 13 — một bộ lọc kỳ chung | CHỐT | đầu trang phải | `ky-chon` W4 AUG – W3 SEP (mặc định Phân tích GV 4 tuần) |
| brief 15 — tỷ lệ có tử / mẫu; mẫu 0 "Chưa có dữ liệu"; < 5 "mẫu nhỏ" (T19) | ĐX theo 05 | dải số, `-chua-co-du-lieu-1440` | `.chi-so` % + "n/N đơn vị"; `bd-kq thieu` |
| 13.1 — việc đúng hạn, điểm đúng hạn, quá hạn hiện tại, thời gian phản hồi | ĐX | tab Hành chính | 3 số + bảng "Theo loại việc"; phản hồi = "Chưa có dữ liệu · CẦN XÁC MINH" (`b3-ra-soat.md` 3.1) |
| 13.1 — xu hướng theo kỳ · phân bố theo loại · danh sách trễ | ĐX | tab Hành chính | cột theo tuần (không ngưỡng màu) · bảng loại việc · "Việc trễ — giải thích số" |
| 13.1 — không lấy S chấm chéo chưa giao làm nợ (C12, T03) | CHỐT | chú thích dưới bảng loại | — |
| 13.2 — đạt test, đạt / chưa / chưa đủ, tiến bộ, Case / PA, thi thật, HV cần xem sâu | ĐX | tab Học thuật | bảng theo lớp · kỹ năng · lượt; Case · PA; Thi thật; HV cần xem sâu |
| brief 15 quy tắc Overall · T06, T07, T08 | CHỐT C09 C10 | hộp luật đầu tab Học thuật; panel Đạt MT | ví dụ Trần Thu Hà (T06), Lê Quang Huy (T07), Tô Ngọc Hân (T08) |
| 13.2 — không "GV gây ra kết quả"; đổi GV giữa kỳ gắn theo thời gian phân công | CHỐT | câu dưới dải số; cột "Thời gian thầy Khoa phụ trách" | Phan Gia Hân: KQ trước 07/09 gán GV cũ |
| C08 — không KPI, không xếp loại, không ngưỡng xanh / vàng / đỏ | CHỐT | toàn màn | số màu trung tính; chỉ quá hạn có ⚠ đỏ |
| C22 · 14.3 — bấm số mở panel chỉ đọc | CHỐT | `-panel-dat-mt-1440`, `-panel-375` | panel: loại · tiêu đề = số · phạm vi · cách tính · tóm tắt · bảng · "Ngoài mẫu" gập · "Đang thấy n / N"; không nút xử lý |
| brief 7 — QL xem người khác = theo dõi, "Làm thay" chỉ khi có quyền | CHỐT | `-1440-sang` dòng 👁 | link sang Công việc chế độ theo dõi; GV tự xem (`-tu-xem-1440`) không có dòng này |
| Trạng thái tải / lỗi / rỗng | CHỐT | `-dang-tai-1440`, `-loi-khoi-1440`, `-chua-co-du-lieu-1440` | khung xương; lỗi một khối (khối khác vẫn đúng); GV mới — không 0 % |
| 1440 / 1280 / 375 / tối | CHỐT | `-1440-sang`, `-1280`, `-375`, `-hoc-thuat-375`, `-1440-toi` | 375: dải 2 nhóm xếp chồng, bảng → thẻ, panel toàn màn |

## BỎ (so với hồ sơ GV hiện tại `HoSoGiaoVienPage.tsx`)

- Bố cục một cột trộn "việc hôm nay" với "kết quả lớp mốc gần nhất" không có kỳ.
- Khối "Kết quả lớp · mốc gần nhất" (thay bằng kết quả theo lượt trong kỳ, áp quy tắc Overall).
- Khối "Yêu cầu đã gửi", chip bàn giao trên hồ sơ (việc → trang Công việc; đề xuất → hộp duyệt).
- Màu ngưỡng < 50 / 50–69 / ≥ 70 % (Q19) ở số kết quả — brief 15 / C08.

## GIỮ

- Hợp đồng số liệu: số ở ô = danh sách khi bấm, cùng hàm tập (`server/src/phanTich/giaoVien.ts`, `server/src/giaoVien/hoSo.ts`).
- Luật gán người: điểm → phân công ở hạn nhập; kết quả, tiến bộ → người dạy trong tuần thi; vi phạm → GVCN ở hạn xử lý; PA → người phụ trách Case.
- Quyền: hồ sơ người khác cần `analysis.view_teacher` (QL, Admin, QT); GV chỉ hồ sơ của mình.
- "Mẫu nhỏ" dưới 5 mục; khoảng tối đa 13 tuần.

## Giả định (ghi rõ, không phải quyết định)

- "Việc đúng hạn" gộp mọi loại việc **chưa có nguồn** trong mã (`06` điểm 7, `05` #8) — mockup dựng theo định nghĩa `05` #8, cần PR số liệu ở V5-C.
- Đạt MT theo GV đếm **lượt × kỹ năng của GV** (Khoa dạy R + W1 ở RF 12 → 2 mục cho một lượt). Đơn vị ghi "lượt".
- Số theo lớp (18/25 = 9/11 + 5/7 + 4/7) là [V5], khớp tổng của `du-lieu-demo.md` 8b.

## CẦN XÁC MINH

1. Mốc "phản hồi vấn đề HV" (ảnh KPI KH.01): `sos_cases.acknowledged_at` hay nhận xét đầu tiên? Đến khi chốt: "Chưa có dữ liệu".
2. Kết quả thi thật gán cho GV nào (mockup giả định: GV dạy kỹ năng đó ở lớp cuối trước ngày thi).
