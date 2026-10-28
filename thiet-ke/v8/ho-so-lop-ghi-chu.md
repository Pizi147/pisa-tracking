# V8 · Hồ sơ lớp — ghi chú mockup đề xuất (29/10)

Tệp: `thiet-ke/v8/ho-so-lop.html` (link `../v5/v5-nen.css`, `../v7/bang-mau-moi.css`). Khung 1440 tối | 375 sáng, 6 trạng thái:
A GVCN có dữ liệu + mở Case dưới hàng · B QL lọc SOS + Chọn nhiều + ⋯ mở · C Ý thức & Phối hợp · D Phân tích lớp · E rỗng (lớp mới / lọc rỗng) · F ⋯ dòng + lỗi tải + đang tải.
Trạng thái: **ĐỀ XUẤT**, chờ chủ SP duyệt. Chưa sửa mã web.

## Điểm hiện tại (web, critique 29/10)
**25/40.** Lỗi chính: 375 bảng không thành thẻ, chỉ thấy Học viên · Target · MT (P1); kẻ hàng lệch giữa cột dính và phần cuộn (P1); đầu trang ~380 px (P2); hai hàng lọc, "Sửa thông tin" nằm lạc chỗ (P2); tên GVCN chữ xanh 17 là link to nhất trang (P3).

## Vấn đề bố cục chính
1. Đầu trang có 6 tầng: lưới nhãn chồng → GV bộ môn → 2 viên → 3 thẻ việc cao → "+25" → tab. Phần bảng bị đẩy xuống dưới màn đầu.
2. Hàng công cụ tách đôi: Cách xem nằm ngoài thẻ, lọc nằm trong thẻ, "Sửa thông tin" và "Chọn nhiều" bị đẩy ra rìa.
3. 375 vẫn giữ bảng cuộn ngang (`the375={false}`), nên không đọc được điểm.
4. Mỗi chỗ vẽ SOS một kiểu: "1·4 2·2 3·5" ở đầu trang, chip ở cột Kết quả, ô số ở Tổng quan.
5. ⓘ "cách tính" nằm trong `<th>` ở Phân tích lớp (trái G9). Mũi tên mở tại chỗ lại dùng "›", trùng nghĩa với "đổi trang" (G6).

## Phương án
- **Đầu trang 4 hàng, đo được 169 px** (tính từ ‹ đến trên tab):
  ① `‹ Học viên & Lớp` ……… `‹ 1/2 · Fast Track ›`
  ② **MB FT 101** + "Fast Track LT1 · 33 HV · tuần 16/24 · khai giảng 01/06" ……… Nhập điểm · + Case · ⋯
  ③ GV bộ môn một dòng, 13 px, tên chữ thường (bỏ link xanh 17)
  ④ hàng số: Lượt gần nhất · Đạt MT ⓘ · SOS (chip mức + số HV) ……… badge đổi trang có "›" (bài chờ chấm · việc quá hạn · chờ duyệt QL · thiếu GV…)
  ⑤ Việc của tôi · 28 → 3 ô việc một hàng, cao 36. Cả ô là nút mở panel việc tại trang. Vạch trái theo hạn. Cuối hàng "+25 ở Công việc ›".
- **Một hàng công cụ** ở đầu thẻ bảng: Cách xem (nút đoạn liền) │ Tất cả · SOS · Chưa đủ dữ liệu ……… Lượt của từng HV · tuần · Chọn nhiều (QL).
- **375: mỗi em một thẻ.** Đầu thẻ: tên + Kết quả + ⋯. Dưới là lưới **L R W S Overall 5 cột cố định**, nên cột thẳng giữa các thẻ: nhãn 12 ở trên, điểm 15 ở dưới, dòng phụ W1 · W2 / "vắng W1 SEP" trong cùng ô. Chân thẻ: Target · MT · lịch thi …… nút Case + PA.
- **SOS một kiểu** (MAU-MUC + quyết định 23/10): chip ghi mức, số HV đứng ngoài chip, nằm một dòng.
- Ý thức: công cụ một hàng, dải nhóm có chip đếm kèm đơn vị, mở tại chỗ dùng ▸ tam giác đặc. Phân tích: ⓘ lên hàng công cụ, ô dưới nửa ghi "✗ 8/18" (G12).

## Thao tác TRƯỚC → SAU (không mất thao tác)
| Thao tác web hiện tại | Sau (mockup V8) |
|---|---|
| ‹ Học viên & Lớp · Lớp trước / sau (`ThanhTruocSau`) | Giữ nguyên, hàng ① |
| Nhập điểm (panel nhập điểm lớp) · + Case · ⋯ đầu trang | Giữ nguyên, cuối hàng ② (375: một hàng 3 nút) |
| ⋯ đầu trang: Thông tin lớp · Sửa thông tin học viên · + Học viên · Cuối khoá… · Kết thúc lớp · Xuất Excel · Lịch sử · Lịch sử góp ý tuần · Mở lại / Xoá / Kết thúc lớp | Giữ đủ mục và nhóm (vẽ mở ở B) |
| Tên GVCN / GV bộ môn là link hồ sơ GV, "+k" mở đủ danh sách | Giữ nguyên, hàng ③ (375 "+3") |
| Badge: bài chờ chấm → Test › Lịch · việc quá hạn → HV & Lớp · chờ duyệt · Thiếu GV → Phân công · Thiếu TT · Xếp lớp · "+n" | Giữ đích, thêm "›" (G6), dời về cuối hàng ④ |
| Dải Lộ trình / Bàn giao (`DaiLopChuyen`), dải "Lớp đã kết thúc — chỉ xem" | Giữ nguyên, ngay dưới hàng ④, chỉ hiện khi có (mockup không vẽ) |
| 3 thẻ việc + nút → `PanelViec` tại trang, Việc tiếp | Ô việc gọn, cả ô là nút mở cùng panel. Giữ "+n việc khác ở Công việc ›" |
| Tab Học viên · Ý thức & Phối hợp (chấm) · Phân tích lớp · Tổng kết (lớp đã kết thúc) | Giữ nguyên |
| Cách xem Tổng hợp · Cần hỗ trợ · Kết quả đầu ra (n đợt) · Thông tin lớp (TVV / CX / Admin) | Giữ nguyên, **dời vào** hàng công cụ trong thẻ bảng |
| Nút "Sửa thông tin" (cuối hàng Cách xem) | **Dời** sang ⋯ đầu trang › Lớp › Sửa thông tin học viên. Mục này đã có sẵn, cùng mở `SuaCaLopPanel` |
| "Chọn nhiều học viên" (QL, chỉ ở Tổng hợp) + thanh Chuyển lớp… · Tạm dừng/ Kết thúc học · Huỷ chuyển lớp · Xoá · Bỏ chọn | Giữ nguyên. Chữ đổi thành **"Chọn nhiều"** (cùng chữ tab Ý thức), đặt cuối hàng công cụ |
| Lọc Tất cả / SOS / Chưa đủ dữ liệu + đếm · "Lượt của từng HV · tuần" | Giữ nguyên, cùng hàng công cụ |
| Tên em là link hồ sơ · MT là link hồ sơ đúng lượt · bấm W / S mở điểm thành phần (popover) · chip Xét lại | Giữ nguyên (popover không vẽ) |
| Case + PA mở dưới hàng: Ghi KQ PA · Sửa · Lịch sử · Thêm PA (panel Case tại trang) | Giữ nguyên (A) |
| ⋯ dòng: + Ghi vi phạm · Xác nhận xử lý · + Case · Nhập điểm · Sửa thông tin · Cuối khoá… · Chuyển lớp… / Đề xuất chuyển lớp… | Giữ nguyên (F) |
| Rỗng "Lớp chưa có học viên" + Thêm học viên | Giữ nguyên. Thêm: lọc rỗng có nút "Tất cả n" |
| Khối "Điểm Mock Test của lớp" gập + chip ô trống | Giữ nguyên, ở cuối trang |
| Ý thức: + Ghi vi phạm · nhóm vi phạm · Chỉ hiện lượt chưa xong · Chọn nhiều · nút việc mỗi hàng · Chi tiết dưới hàng · gập Đã xử lý / Nhật ký · Phối hợp SOS | Giữ nguyên, gom vào một hàng công cụ (C) |
| Phân tích: ⓘ trong đầu cột · mở dòng ra 2 bảng nhỏ | ⓘ **dời** lên hàng công cụ (G9). Mở dòng giữ nguyên |
| Lớp thường (`BangDiemLopThuong`, trang con Cuối khoá) · khối TVV "Ở lớp này" | Không vẽ. Áp cùng đầu trang và hàng công cụ, không đổi thao tác |

## Câu hỏi cho chủ SP
1. **SOS:** mockup giữ quyết định 23/10 "chip mức + số ngoài chip". Critique 29/10 mục 4 đề xuất ngược lại, "SOS 2 · 1" số trong chip. Chọn kiểu nào? Kiểu được chọn sẽ áp cho mọi màn.
2. Bỏ nút "Sửa thông tin" ở hàng công cụ, chỉ còn ⋯ › Sửa thông tin học viên. Đồng ý không?
3. Hàng ② thêm "chương trình · số HV · tuần · khai giảng". Dữ liệu đã có, trước đây chỉ nằm trong `title`. Có giữ không?
4. Ở 375, đầu trang cao ~480 px vì có 3 ô việc. Giữ 3 ô, hay gập lại thành "Việc của tôi · 28 ▾"?

## Critique mockup (Nielsen, tự chấm, một ngữ cảnh)
Đã chạy detector `impeccable`: 1 cảnh báo `dark-glow`. Đây là báo nhầm: nó lấy `--bong-noi` khai báo trong `v5-nen.css`, mockup không dùng. Không chạy được hai sub-agent tách biệt nên coi là chấm suy giảm.

| Vòng | Điểm | Đã sửa |
|---|---|---|
| 1 (bản đầu) | 30/40 | — |
| 2 | 32/40 | đầu trang 189 → 169 px · tab / nút đoạn 375 không cắt · thanh chọn 375 · ô "vắng W1 SEP" không gãy ở 1440 · bảng nhỏ Phân tích · Phối hợp SOS · thêm F (⋯ dòng, lỗi, đang tải) · rỗng bỏ lượt / KQĐR |
| 3 | **33/40** | đầu trang 375: 526 → 484 px (GV một dòng "+3", SOS một hàng) · ⓘ Đạt MT |

Điểm từng mục (vòng 3): Trạng thái 3 · Ngôn ngữ 4 · Kiểm soát 3 · Nhất quán 4 · Phòng lỗi 3 · Nhận ra 3 · Linh hoạt 3 · Tối giản 3 · Sửa lỗi 3 · Trợ giúp 4.
**Không còn P0 / P1.** P2 còn lại: trang 375 vẫn dài (33 thẻ, chưa có phân trang); ô điểm lớp thường chưa vẽ.
