# Công việc · vai QL — ghi chú mockup V8 (`cong-viec-ql.html`)

Trạng thái: **đề xuất, chờ chủ SP**. Nền: khung C1 đã duyệt (`v7/cong-viec-2.html`) + critique 29/10 (`critique-a…`, mục 10–14).
Khung: A1–A4 1440 tối · B1–B5 375 sáng · C1–C4 trạng thái 375.

## Điểm hiện tại (web 29/10)
**26 / 40** (critique A).

## Vấn đề bố cục chính
1. **P1** "Chờ bạn duyệt" là khối full width TRƯỚC lưới hai cột → thẻ dài 1400 px, panel phải bị đẩy xuống hàng 2 (mục 10).
2. **P2** Hai nhóm nút đoạn cạnh nhau cùng chữ "✓ Tất cả" (phạm vi + khung) — đọc như trùng (mục 11).
3. **P2** Panel trống là hộp 100 px, không cao hết cột (mục 12).
4. **P2** Thẻ duyệt 3–5 dòng, nhãn loại + câu trích + "Nếu duyệt" + hạn hai dòng; thẻ duyệt không mở panel trong khi việc thì mở → hai kiểu mở trong một danh sách (G4).
5. **P3** Câu giải thích "Đánh dấu ô ở thẻ để duyệt nhiều cùng loại." nằm trên màn (V6).

## Phương án
- "Chờ bạn duyệt" = **nhóm đầu cột trái 600 px**, cùng ba tầng V18 (khối em / đối tượng lớp → dòng việc). Dòng duyệt: tên · "loại · người đề xuất · ngày" · "Nếu duyệt: …" (một dòng, đủ chữ ở title + panel) · hạn cột 136 · nút 112 (Duyệt / Từ chối… · Mở ›).
- **Bấm chữ dòng duyệt = mở panel duyệt** bên phải (như Hộp duyệt đầy đủ): bối cảnh, khối "Sau khi duyệt", Lịch sử, chân Từ chối… / Duyệt. Sau duyệt theo V12: "✓ Đã duyệt · Hoàn tác" + **Yêu cầu tiếp ›**.
- Ô tích chỉ ở loại duyệt nhiều được, nằm trong rãnh cây; thanh chọn dính chân cột trái (Đã chọn n · loại · Chọn hết · Bỏ chọn · Từ chối n… · Duyệt n yêu cầu); Từ chối n… mở ô lý do chung ngay trong thanh. Câu hướng dẫn → ⓘ ở dải nhóm.
- Bộ lọc: **một "Tất cả"** (phạm vi Của tôi · Của GV · Tất cả, có số) · Một GV ▾ · **Mọi khung ▾** (thay nút đoạn Tất cả / FT / Lớp thường) · chi nhánh ▾ · Mọi hạn ▾. 375: phạm vi một khối liền full bề rộng + lưới 2 × 2 ô 44 px.
- Panel phải **cao hết cột**; trống = khung viền đứt "Chọn một việc hoặc yêu cầu ở danh sách."
- Tải / lỗi / hết việc: ẩn badge menu và số ở ô phạm vi (không nơi nào báo chờ khi đã hết). Hết việc vẫn còn nhóm "Việc quản lý" (+ Giao việc).

## Thao tác TRƯỚC → SAU (không mất thao tác)
| Thao tác | Trước (web) | Sau (mockup) | Ghi |
|---|---|---|---|
| Duyệt một yêu cầu | nút Duyệt / Duyệt… trên thẻ | nút ở dòng (giữ) **và** ở chân panel | thêm đường panel |
| Từ chối… (lý do) | ô lý do mở dưới thẻ | mở panel duyệt, ô lý do trong panel | **dời chỗ** (G4: list có panel phải → mở ở panel) |
| Mở trang gốc của yêu cầu | "Mở" | "Mở ›" (chữ › = đổi trang, G6) | đổi dáng |
| Xem lý do đầy đủ / Xem thêm · Thu gọn | mở rộng trên thẻ | panel duyệt (bối cảnh đầy đủ) | **dời chỗ** |
| Trả lời… · + Thêm PA (loại Báo QL / Case) | trên thẻ | chân panel duyệt (mockup không vẽ loại này) | dời chỗ |
| Huỷ quyết định / Hoàn tác | Hộp duyệt › Đã xử lý | giữ + "Hoàn tác" ngay sau duyệt (V12) | thêm |
| Duyệt nhiều: tích · Chọn hết n · Bỏ chọn · Từ chối n… · Duyệt n yêu cầu | thanh dính đáy | như cũ, dính chân cột trái | = |
| Xem thêm n · Mở hộp duyệt › · n ở chi nhánh khác · Xem | chân khối duyệt | chân nhóm (chữ "thẻ" → "yêu cầu") | đổi chữ |
| Gập / mở nhóm · Xem thêm 10 việc · vạch hạn | có | như cũ | = |
| Việc của tôi / Của GV / Tất cả · Một GV | nút đoạn + ô chọn | như cũ (QL mặc định **Tất cả**) | = |
| Lọc khung FT / Lớp thường | nút đoạn "✓ Tất cả · FT · Lớp thường" | ô chọn "Mọi khung ▾" (số trong mục chọn) | đổi dáng |
| Chi nhánh · Mọi hạn · chip lọc từ link (✕) · Xoá lọc | có | như cũ | = |
| Theo dõi GV · Làm thay · Nhập hộ | dải 👁 + nút | như cũ (A4) | = |
| Mở việc · Lưu · Lưu · việc tiếp › · Em này còn · Hết việc nhóm | panel phải | như cũ | = |
| + Giao việc · Vận hành › · Họp đơn vị › | chân "Việc quản lý" (gập) | như cũ | = |
| Gia hạn (Sau thi) · Hồ sơ em (tên = link) | có | như cũ, không ↗ | = |
| "n chờ bạn duyệt" đầu trang | chữ cạnh số đếm | bỏ — cùng số đã ở chip dải nhóm ngay dưới | **bỏ chữ trùng**, thông tin còn |

## Câu hỏi cho chủ SP
1. **QL mặc định "Tất cả"** (giữ như web) hay **"Của tôi"** (mockup C1, luật "việc của tôi ở trang đầu vai")?
2. Khung FT / Lớp thường thành **ô chọn "Mọi khung"** (khuyến nghị — hết hai chữ "Tất cả") — đồng ý?
3. Bấm dòng duyệt mở **panel duyệt** (khuyến nghị, một kiểu mở — G4); Từ chối… nhập lý do trong panel thay vì dưới thẻ — đồng ý? [XM]
4. Sau Duyệt: "✓ Đã duyệt · Hoàn tác" + **Yêu cầu tiếp ›** (theo V12) — thêm được không?
5. Dòng "Nếu duyệt: …" một dòng (cắt bằng "…", đủ chữ ở panel) hay cho xuống 2 dòng?

## Critique (Nielsen 10 × 0–4, tự chấm khắt khe)
| Vòng | Điểm | P0/P1 | Sửa sau vòng |
|---|---|---|---|
| 1 | 30 / 40 | 0 / 1 (nút "Duyệt" 375 chữ tối trên nền xanh — lỗi CSS mockup) | sửa CSS; tên "thẻ" / "yêu cầu" → một tên; nút dòng một kiểu ở 1440 / 375; bỏ gợi ý phím không có thật; lỗi tải thêm nguyên nhân; ẩn số khi tải / lỗi / hết việc; "Nếu duyệt" một dòng |
| 2 | **35 / 40** | 0 / 0 | — |

Vòng 2: H1 4 · H2 4 · H3 3 · H4 4 · H5 3 · H6 3 · H7 4 · H8 3 · H9 4 · H10 3.
Còn P2: thanh chọn nhiều che 1–2 dòng cuối cột (cần đệm đáy khi thanh hiện) · dòng duyệt vẫn 3 dòng chữ + 3 điều khiển · chưa vẽ hộp xác nhận "Bỏ chữ đang gõ?" (giữ như web).
