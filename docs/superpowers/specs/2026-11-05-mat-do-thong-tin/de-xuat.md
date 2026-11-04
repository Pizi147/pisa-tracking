# Mật độ thông tin — đề xuất (THIET-KE-GON, 05/11)

**Trạng thái: ĐỀ XUẤT, chưa phải luật.** Chủ SP duyệt mockup `thiet-ke/v12/cong-viec.html` trước. Duyệt xong thì
mới chép các luật M1–M8 vào `DESIGN.md` và làm lần lượt các màn ở mục 3.

## 0. Bối cảnh, việc đã bỏ

- **Chủ SP 05/11:** trang Công việc "quá ngợp, dàn trải, nhiều chữ, không phân biệt được các trường thông tin — tình trạng chung cả website".
- **Rà trang thật** trên main (dev server, dữ liệu demo, 5 vai, 1440 và 375):
  - critique **25/40**, Tối giản chỉ **1/4**;
  - một việc cao 70–92 px, cao nhất 125 px;
  - trên một dòng có 4 mức độ đậm;
  - khoảng 100 viên thẻ phụ mỗi trang.
- **Hướng đã bỏ (chủ SP bác 05/11):** làm lại thành bảng rộng hết màn, mỗi việc một dòng, bỏ tầng học viên. Chủ SP nói: "còn loạn và xấu và dày đặc kinh khủng hơn… thà như cũ còn hơn, cải thiện cái cũ thôi".
- **Hướng theo từ đó:**
  - giữ bố cục đã có và các mockup đã duyệt;
  - chỉ sửa chữ, độ đậm, chữ thừa, lặp;
  - **không** đổi bố cục, cột, nhóm hay luồng.

## 1. Luật đề xuất (mỗi luật một dòng; áp khi sửa từng màn, không làm lại màn)

| # | Luật | Ví dụ ở Công việc (v12) |
|---|---|---|
| M1 | **Một chữ đậm mỗi khối dòng.** Chỉ cái người dùng tìm trước mới đậm (600), ví dụ tên em hay tên lớp. Tên việc 500. Nhãn, thẻ phụ, người, hạn thường dùng chữ thường 400–500, màu mờ (`text-dim` / `text-faint`). Chỉ trạng thái cần làm ngay (quá hạn, hôm nay) mới đậm và có màu. | S1 |
| M2 | **Không xuống dòng vô cớ.** Nút, thẻ phụ, chip luôn một hàng. Thiếu chỗ thì cắt "…" và rê chuột thấy đủ. Riêng tên (việc, em) được xuống dòng, không cắt. | S2, S5 |
| M3 | **Không lặp điều đã biết.** Thông tin giống nhau ở mọi dòng thì bỏ khỏi dòng, vì bộ lọc, tiêu đề nhóm hay dải đầu trang đã nói. Ví dụ: tên GV khi đã lọc một GV; "GV chấm chéo" trong nhóm Speaking chấm chéo; lớp khi đang ở hồ sơ lớp; số của dải nhóm lặp lại ở vạch con. | S3, S10 |
| M4 | **Bỏ chữ không đổi quyết định.** Gồm: dòng / vạch "· 0", câu giải thích cách dùng ("Làm tại đây…"), câu báo trái với dữ liệu ("Xong hết hôm nay" khi còn việc), dòng lặp ý tiêu đề ("Nếu duyệt: R làm bài W2 NOV" ngay dưới "Duyệt = R làm bài W2 NOV"), lối tắt "+ n việc ở …". Hậu quả hay lý do cần xem thì để ở panel hoặc khi rê chuột. | S4 |
| M5 | **Một tên một thứ.** Ví dụ "không hạn" thay cho cả "Chưa có hạn" và "không hạn". | S9 |
| M6 | **Đúng phạm vi.** Khối của người xem (Chờ bạn duyệt) không hiện khi đang xem việc của người khác. | S6 |
| M7 | **Chữ chờ, chữ rỗng ở đầu khung.** Không căn giữa một khung cao theo trang dài. Một câu, không câu phụ. | S7 |
| M8 | **375: đầu khối một hàng.** Số đếm cùng hàng với tên. Bỏ số phụ thứ hai (như "39 bài") nếu không vừa. | S8 |

Không thuộc đề xuất (giữ như đã duyệt): bố cục, thứ tự, màu, phông, vòng chữ đầu, nét cây, viên SOS, nút, panel.

## 2. Công việc — sửa S1–S10 (mockup `thiet-ke/v12/cong-viec.html`)

| # | Hiện trạng (main + ảnh chủ SP) | Sửa |
|---|---|---|
| S1 | Mọi chữ gần như cùng độ đậm: tên em 600, tên việc 600–700, thẻ phụ 600, hạn 600; tên người chữ sáng | Chỉ tên em 600. Tên việc 500 (V18 đã ghi 500, code đang 600). Thẻ phụ 500 mờ. Người 400 mờ. Hạn thường 400 mờ. |
| S2 | Thẻ phụ xuống dòng 3 ("1 bài" một mình một hàng) | Thẻ phụ một hàng, đệm 6 px, cắt "…" |
| S3 | Lọc một GV mà dòng nào cũng ghi tên GV đó; nhóm chấm chéo ghi "GV chấm chéo" ở mọi dòng | Ẩn tên người ở dòng khi lọc một GV và ở Của tôi. Bỏ "GV chấm chéo" ở dòng. |
| S4 | Có "+ 1 việc ở …", vạch "Quá hạn · 0", thẻ "Xong hết hôm nay ✓", dòng "Nếu duyệt: …" (bị cắt, lặp), câu "Làm tại đây, không đổi trang." | Bỏ hết. Vạch hạn ẩn khi bằng 0. "Nếu duyệt" chuyển vào `title` và panel duyệt. |
| S5 | Nút hai dòng: "Chấm Speaking", "Mở Phối hợp SOS" | Đổi thành "Chấm", "Phối hợp". Nút `nowrap`. |
| S6 | Khối "Chờ bạn duyệt" của QL hiện cả khi xem việc của một GV | Chỉ hiện ở Của tôi / Tất cả. Phần dữ liệu do SUA-LOI-CV sửa. |
| S7 | Chữ "Chọn một việc…" rơi giữa trang dài 4 300 px | Đặt chữ ở đầu khung |
| S8 | 375: dải nhóm xuống hai hàng | Đưa về một hàng, ẩn số phụ |
| S9 | Vừa "Chưa có hạn" vừa "không hạn" | Chỉ dùng "không hạn" |
| S10 | Vạch "Quá hạn · 7 việc · 12 bài" lặp số đã có ở dải nhóm | Vạch đang mở chỉ ghi tên ("Quá hạn", "Hạn đến 20/09"). Vạch đang gập giữ số ("Hạn sau 20/09 · 9 việc ▸"). |

- **Thao tác:** giữ hết. Không đổi chỗ nút nào. "Nếu duyệt" vẫn xem được: khi rê chuột, hoặc bấm dòng để mở panel duyệt.
- **Dòng đọc Turso:** không đổi, vì cùng dữ liệu `/my-work`, không thêm request.
- **Mã sẽ chạm:** `web/src/modules/congViec/DanhSachViec.tsx` (độ đậm, thẻ phụ, `+ n việc`, `Chưa có hạn`, nhãn nút) và `HoTroHocVienTab.tsx` (khung chờ, "Xong hết hôm nay", khối duyệt theo góc nhìn). Một PR, không cần migrate.

## 3. Màn cùng bệnh — xếp theo mức ngợp (đo màn đầu 1440, QL Monbay, dữ liệu demo)

**Cách đo:**
- **Từ:** số từ trong vùng nội dung ở màn đầu.
- **Đậm:** tỉ lệ phần tử chữ có độ đậm ≥ 600.
- **Nút / ô:** số nút và ô chọn ở màn đầu.

| Hạng | Màn | Từ | Đậm | Nút / ô | Bệnh chính (sửa nhỏ theo M1–M8) |
|---|---|---|---|---|---|
| 1 | **Công việc** (mọi vai) | 262–283 | 51–77 % | 18–29 | Trang dài 2 500–4 300 px, các lỗi S1–S10. **Mockup v12.** |
| 2 | **Tổng quan** (QL, GV) | 346 | 48 % | 32 | Mỗi ô chỉ số có 2–3 dòng phụ ("2/3 HV · 8 chưa đủ dữ liệu / trong kỳ / hiện tại"). Số gạch chân khắp nơi. "Chờ bạn duyệt" mỗi dòng 2 dòng. "Điều hướng" có câu phụ. Có dải "Mới dùng". |
| 3 | **Chờ duyệt** (hộp duyệt, khối ở hồ sơ HV, Công việc) | — | — | — | Mỗi yêu cầu 3–4 dòng. "Nếu duyệt: …" lặp tiêu đề và bị cắt. Tên người không có vai. |
| 4 | **Hồ sơ lớp** | 290 | 53 % | 56 | Đầu trang có 4 viên, 2 hàng thông tin và viên "10 chờ duyệt ›", "65 bài chờ chấm ›", "+1". "TVV Lê Thu" lặp ở gần mọi dòng em (M3). |
| 5 | **Test · Lịch Test tuần** | 214 | 55 % | 47 | "Chờ L, R, W, S" lặp ở mọi dòng. Dải lớp nhiều chữ ("vắng · chờ Quản lý duyệt dời"). |
| 6 | **Hồ sơ HV** | 220 | 52 % | 19 | 6 thẻ kỹ năng đều lặp "MT1 · kỳ vọng 6.0". Khối Chờ duyệt 4 dòng. |
| 7 | **Quản trị · Sửa tài khoản** | 189 | 35 % | 31 | Có đoạn giải thích dài dưới "Quyền cấp riêng" (M4 → ⓘ). |
| 8 | **Phân tích** | 239 | 33 % | 41 | Nhẹ hơn, chỉ cần rà M1 và M4. |
| 9 | **HV & Lớp** (danh sách) | 144 | 52 % | 34 | Nhẹ nhất. Rà M1. |

**Cách làm sau khi chủ SP duyệt v12:**
- Mỗi màn một PR nhỏ, theo thứ tự hạng ở bảng trên.
- Mỗi PR có ảnh trước | sau và chỉ sửa theo M1–M8.
- Màn nào cần đổi bố cục thì dừng, hỏi chủ SP trước.
