# Thư mục `thiet-ke/` — tài liệu bên thiết kế

Ngày tạo: 20/09/2026. Cập nhật: 21/09/2026. Chủ sở hữu: bên design.
Trạng thái: **đặc tả để triển khai**, chưa phải mô tả web hiện tại.

## Mockup hết hiệu lực / phải sửa — 21/10/2026 (chủ SP duyệt kế hoạch overhaul #486)

Luật: khung mockup đã duyệt thắng kế hoạch / luật giao diện cũ hơn; **quyết định mới hơn trái khung → sửa mockup** (`CLAUDE.md`). Danh sách đủ (kể cả khung GIỮ) và mockup mới phải vẽ:
`docs/superpowers/specs/2026-10-20-ke-hoach-overhaul/06-mockup-gap.md` mục 3, 4. Năm tệp đầu bảng đã có dải đánh dấu đầu trang + chú thích HTML tại khung.

| Tệp | Khung | Tình trạng | Vì sao (quyết định) |
|---|---|---|---|
| `mockup-ov14-6-sua-19-10-2026-10-19.html` (m6) | §10 tên trang "Báo cáo" thay "Tổng quan" | **HẾT HIỆU LỰC** | thứ tự menu V1 I.2; Báo cáo là tab đầu Phân tích |
| m6 | §3 lưới FT căn trái · §6 tab "Kết quả thi" | **SỬA** (căn giữa + ký hiệu trước số; "Kết quả Test") | 02 X-01, X-37 |
| `mockup-lich-test-ba-khoi-2026-10-06.html` | cả tệp (ba khối Lịch Test) | **SẼ HẾT HIỆU LỰC** khi mockup M5a "Chấm Test theo hạn" được duyệt | Q-C1 21/10; 02 X-08 (luật chia khối T15 giữ) |
| `mockup-ov14-2-luoi-diem-cong-viec-2026-10-17.html` (m2) | §1a lớp thường "✗ 16/25 64%" · §1d Dán Excel mọi lưới | **SỬA** ("✗ 17/25", nhận xét trong hộp chấm; Excel chỉ lớp × lượt) | 02 X-02, X-15, X-33 |
| m2 | §1 "Sau", §2, §2b, §3 Công việc | **SỬA** (vẽ lại — 06 mục 4 M2) | 02 X-64, Q-A1 ①; S chéo 21/10 |
| `mockup-ov14-3-tong-quan-bao-cao-phan-tich-2026-10-17.html` (m3) | §3 Báo cáo | **SỬA + nâng cấp** (Chiếu, chấm trễ trong kỳ, Theo chi nhánh) | Q-C2 ① 21/10 |
| m3 | §1 Tổng quan A + khối Trễ chấm + dải "HV cần chú ý" · §4 bộ chọn thời gian | **SỬA** (bố cục B) · Trễ chấm **HẾT HIỆU LỰC** · [Toàn bộ \| Khoảng tuần] | Q-A1 ①, Q-A2 ①; V1 II.4; V3 II.5 |
| `mockup-ov14-5-lich-thi-xuat-ds-2026-10-19.html` (m5) | §1 Lịch thi (4 nút Kết luận) · §2 Xuất DS (cột tick) | **SỬA** (nhóm trạng thái, chip A / B, "Chưa kết luận"; bỏ cột tick) | Q-C3 ①, Q-C4 ①, Q-E2 ① |
| `mockup-ov14-1-he-thiet-ke-hoc-vien-lop-2026-10-17.html` (m1) | §1a, §1d, §1g, §2a, §4 · §1e thang chữ | **SỬA** · §1e **HẾT HIỆU LỰC** (chưa gắn dải — làm khi vẽ sân mẫu) | 06 mục 3 |

> **MỚI NHẤT (tối 21/09/2026):** `NGUON-Rule-v3-YThuc-PhoiHop-2026-09-21.md` (nguồn) → `SOS_VA_PHOI_HOP_V3.md`
> (đặc tả, **thắng** `Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` ở chỗ khác nhau). UX tham khảo: `tham-khao/*.html`.
>
> **MỚI 21/09/2026 — đọc ba file này trước mọi file khác:**
>
> | File | Vì sao đọc trước |
> |---|---|
> | `NGUON-Rule-Y-thuc-2026-09-21.md` | Nguồn do chủ sản phẩm gửi. **Bỏ hẳn mô hình Case Ý thức** |
> | `Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` | Đặc tả đủ chi tiết để code phần Ý thức mới |
> | `BAN_DO_OVERHAUL.md` | Bản đồ *"yêu cầu nào của design plan đã có, cái nào chưa"*. Không có nó thì đọc `plan.md` sẽ tưởng chỉ còn vài việc dọn |
>
> Rule book **mục 18** là luật mới nhất và ưu tiên hơn mục 6, mục 17.2 và mọi đoạn nói về
> Case Ý thức, đợt Ý thức, cửa sổ gộp ba ngày, hạn 3/5/7 ngày của Ý thức.

> Bốn file trong thư mục này là **nơi tra cứu**, không phải nơi giao việc. Việc giao ở
> `plan.md`. Khi hai bên khác nhau, `plan.md` thắng về *làm gì trước*, thư mục này thắng về
> *làm cho giống nhau thế nào*.

| File | Trả lời câu hỏi | Ai đọc |
|---|---|---|
| `Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` | Vi phạm và Biện pháp xử lý: bảng dữ liệu, luật V/B/W, quyền, bảy màn, tám chỉ số, 24 mục nghiệm thu | Ai làm phần Ý thức — **máy chủ và UI** |
| `BAN_DO_OVERHAUL.md` | Yêu cầu nào của design plan đã có, cái nào chưa, PR nào làm | Ai lập kế hoạch, và ai định "dọn nốt" |
| `HE_GIAO_DIEN.md` | Màu, cỡ chữ, khoảng cách, component dùng chung, bốn trạng thái dữ liệu, mobile, bàn phím | Người code UI, trước khi dựng bất kỳ màn nào |
| `HOP_DONG_SO_LIEU.md` | Mỗi con số trên web nghĩa là gì, đếm đơn vị nào, bấm vào ra tập nào | Người code cả máy chủ lẫn UI của dashboard/báo cáo |
| `TU_DIEN_VA_CHU.md` | Một khái niệm gọi bằng đúng một chữ; toàn bộ nhãn tiếng Việt | Người code UI và người biên tập |
| `LUAT_CHO_CHOT.md` | C01–C10 và Y01–Y04: điểm nào đã chốt, điểm nào còn chờ. **Nay chỉ còn C08 chưa chốt** | Người code nghiệp vụ |

Kèm theo **hai file nguồn** do chủ sản phẩm gửi, chép nguyên văn vào repo ngày 20/09/2026 để
session code đọc được mà không cần hỏi lại:

| File | Vai trò |
|---|---|
| `PISA-Rulebook-2026-09-19.md` | **Luật sản phẩm.** **Mục 20 (02/10) ưu tiên hơn mọi mục khác** — đã đối chiếu với code `main`; mục 18 ưu tiên hơn mục 17 |
| `PISA-Design-Plan-after-PR28.md` | **Đặc tả thiết kế.** Mục 17–22 là bản mới nhất |

Hai file này là **nguồn**, không phải nơi ghi tiến độ. Đừng đánh dấu đã làm vào chúng — tiến độ
ghi ở `plan.md`.

## Nguồn luật, theo thứ tự ưu tiên

1. `thiet-ke/NGUON-Rule-Y-thuc-2026-09-21.md` — nguồn mới nhất do chủ sản phẩm gửi.
2. `thiet-ke/PISA-Rulebook-2026-09-19.md` — luật sản phẩm. **Mục 20 (02/10) ưu tiên hơn mọi mục; mục 18 ưu tiên hơn mục 17, mục 17
   ưu tiên hơn mọi mô tả cũ mâu thuẫn.**
3. `thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` — đặc tả phần Ý thức, chi tiết tới mức DDL.
4. `thiet-ke/PISA-Design-Plan-after-PR28.md` — đặc tả thiết kế, mục 17–22 là bản mới nhất.
   **Đọc kèm `BAN_DO_OVERHAUL.md`** để biết mục nào đã hết hiệu lực vì rule Ý thức mới.
5. `plan.md` — kế hoạch đang chạy, có ô đánh dấu.
6. Thư mục này — chi tiết trình bày.
7. Mã nguồn hiện tại — **hiện trạng, không phải luật**. Không dùng code để chứng minh một
   quyết định đã được duyệt.

> **Bẫy đã sập một lần, đừng sập lần nữa:** `plan.md` từng chỉ chép design plan mục 18 vào
> **một** PR (hồ sơ Test), nên bảy trang còn lại của mục 18 không bao giờ thành việc. Đọc
> `plan.md` thì tưởng gần xong. Từ nay, mọi yêu cầu của design plan phải có **một dòng trong
> `BAN_DO_OVERHAUL.md`** với nhãn tình trạng và PR phụ trách.

## Quy tắc cập nhật

- Sửa file ở đây thì ghi một dòng vào `plan.md` mục 11 trong **cùng commit**.
- Không thêm component mới vào `HE_GIAO_DIEN.md` nếu chưa có ít nhất hai màn dùng tới nó.
- Không viết "TBD". Chưa chốt thì đưa vào `LUAT_CHO_CHOT.md` có mã C, không để trống ở đây.
