# V9 · Phân công GV — ghi chú mockup (30/10, chờ chủ SP duyệt)

Mockup: [phan-cong-gv.html](phan-cong-gv.html) · đặc tả: `docs/superpowers/specs/2026-10-30-phan-cong-gv-design.md` (mục 2, 2b).
Hình ảnh theo v8 (`../v5/v5-nen.css` + `../v7/bang-mau-moi.css`, khối `.sau` như `v8/ho-so-lop.html`). Khung 1440 TỐI · 375 SÁNG. Số ở hai bảng tổng hợp do script trong tệp đếm từ chính dữ liệu bảng lớp (một nguồn: Ms. Hà Hoàng FT = 7; Giảng dạy 47 / 18 / 65; GVCN 10 / 6 / 16).

## Trạng thái đã vẽ (23 khung)
| Khu | 1440 tối | 375 sáng |
|---|---|---|
| 1 Bình thường (QL) | đủ 16 lớp: Fast Track 10 + Lớp thường 6 (Foundation · Beginner · Pre Foundation), 2 bảng tổng hợp dưới | thẻ lớp gom người theo GV + Sửa, 2 bảng tổng hợp |
| 2 Tô sáng một GV | bấm Ms. Hà Hoàng ở Giảng dạy → ô của cô được tô, dải "Đang tô" | dải dính đầu bảng + thẻ được tô |
| 3 Dòng nháp | CP FT 137: L đổi, ô GVCN lỗi "GVCN phải dạy ít nhất một môn", danh sách chọn mở, Lưu tắt | lớp thường CP BE 07: Sửa → ô từng môn, S đổi, hợp lệ |
| 4 GV đã nghỉ · 409 | ô "Ms. Liên Vũ · ⚠ đã nghỉ" chặn Lưu; người khác vừa đổi (409) giữ ô đang sửa | — |
| 5 Hộp Lưu + hỏi bàn giao | CP FT 137 hai cặp → 1 việc 2 cột, hiệu lực Từ tuần W1 NOV · sau lưu: dòng "Chờ đổi" + hộp Chờ đổi (Đổi mốc / Huỷ lịch đổi) + CP BE 07 "✓ Đã lưu" + toast Hoàn tác · [đề xuất] lưu nhiều dòng (3 lớp, có GV đã nghỉ) | lớp thường CP BE 07, tấm dưới, Ngay hôm nay |
| 6 Việc + panel bàn giao | việc ở Công việc (nhóm Vận hành) · panel 2 cột L + GVCN 8/12 em · panel 1 kỹ năng lớp thường CP BE 07 Speaking 14/14 · GV mới đọc bàn giao | panel toàn màn, danh sách trên phiếu dưới |
| 7 CX chỉ xem | không ô ▾, không Lưu, tên GV là link | thẻ không có Sửa |
| 8 Rỗng | chi nhánh chưa có lớp (+ Lớp mới, GV vẫn liệt kê với 0) | tìm không ra (Xoá tìm) |
| 9 Hồ sơ lớp | ⋯ › Thông tin lớp › Phân công › Sửa → Lưu phân công → CÙNG hộp | — |
| 9 GV cũ chỉ xem | hồ sơ CP BE 07 nhìn từ Ms. Gemino Thea: dải "Chỉ xem · … còn xem tới khi xong bàn giao, ít nhất tới 06/11" + nút Bàn giao | cùng dải |

Không vẽ (ghi trong ghi chú vàng): đang tải / lỗi tải (như mọi góc), Quản trị ở phạm vi "toàn hệ thống" (chọn chi nhánh trước), QL Điền thay, 768–1023 px, quá hạn.

## Quyết định của người vẽ (ngoài đặc tả) — PTA duyệt
1. **1440: tổng hợp XUỐNG DƯỚI bảng lớp, hai bảng cạnh nhau** (đặc tả 2.2 cho phép khi chật): 6 ô FT × ~184 px để tên đầy đủ ("Ms. Thanh Hằng Trần") không cắt → bảng lớp ~1 300 px. Bù lại: dải "Đang tô" dính đầu bảng.
2. **Cột GVCN luôn ở cột cuối** mọi nhóm (dò dọc một cột); FOU / BE để trống cột thứ 5; Pre FOU một dòng "Không chia môn — GVCN dạy luôn" (chữ web sẵn có).
3. **FOU tách 4 cột L · R · G+V · P** (không ô gộp "L · R · G+V" như Thông tin lớp): mỗi ô một người, đếm theo môn rõ. Hồ sơ lớp giữ nút Tách / Gộp.
4. **Pre FOU tính 1** ở Giảng dạy (ô `tong_hop`, GVCN dạy luôn) và 1 ở GVCN.
5. **Tab góc: Tất cả · Đang SOS · Lịch thi · Phân công GV** — không vẽ "Cần làm" vì web đã bỏ (`StudentsPage.tsx`).
6. **Tô sáng**: hồng chỉ ở vạch 3 px + chấm (nhận diện, V2 / V14), nền trung tính — không lẫn nền lỗi. Tên ở tổng hợp là nút bật tô; link hồ sơ = "Hồ sơ GV ›" trong dải (G6). "Chỉ hiện n lớp" = điền ô tìm bằng tên GV.
7. **Xếp bảng tổng hợp** bằng ô "Xếp: Tổng ▾" ngoài tiêu đề bảng (G9 cấm điều khiển trong `th`).
8. **375: thẻ lớp gom người theo GV** ("L · R · GVCN  Ms. Hà Hoàng"), bấm **Sửa** mới ra ô từng môn 44 px — tránh trang ~5 000 px và đổi nhầm khi cuộn.
9. **Danh sách chọn** = ChonNguoi đang có; thêm dòng phụ "dạy n · GVCN n" (cùng số tổng hợp); ô GVCN: người đang dạy lớp này lên đầu (luật GVCN dạy ≥ 1 môn).
10. **Hộp Lưu**: một hộp cho cả dòng; ô tích "Tạo việc bàn giao" CHỈ quyết tạo việc; dòng "Luôn chuyển sang B: n Case · n PA · n việc" ngoài vùng bấm (việc đang mở luôn chuyển — 2b); nêu tải "n cột × N em = n góp ý"; nút chính nói kết quả ("Lưu · tạo 1 việc bàn giao"). Mặc định hiệu lực = Ngay hôm nay; hộp nhớ hiệu lực vừa chọn trong phiên.
11. **Chờ đổi** (hiệu lực tương lai): ô nền xanh nhạt viền đứt "A / → B", dòng "Chờ đổi · W1 NOV", nút **Chờ đổi** cuối dòng → Đổi mốc… · Huỷ lịch đổi (huỷ cả việc bàn giao; phần đã viết giữ ở lịch sử lớp, Hoàn tác được). Tổng hợp đếm người dạy HÔM NAY.
12. **Panel bàn giao**: hai cột cạnh nhau ở 1440, chồng ở 375; "Nhận xét chung cả lớp" gập ▸ (tuỳ chọn); Xác nhận tắt thì chân nói "Còn n em thiếu góp ý ↑"; GV mới đọc cùng khung, chỉ đọc.
13. **GV cũ chỉ xem**: dải xám "Chỉ xem · {môn} đã giao cho {GV mới} từ {ngày} · còn xem tới khi xong bàn giao, ít nhất tới {ngày}" + nút việc "Bàn giao · n/N em".
14. **"13 GV (1 đã nghỉ)"**: GV đã nghỉ còn giữ ô vẫn có dòng ở Giảng dạy (thấy việc cần thay); GVCN chỉ liệt kê khi có lớp.

## Đề xuất / câu hỏi cho PTA (chưa có trong đặc tả)
1. **[đề xuất] Lưu nhiều dòng**: từ 2 dòng nháp → thanh "n lớp đang sửa · Huỷ hết · Lưu cả n lớp…" → MỘT hộp (một hiệu lực, cặp gom theo lớp). Ca GV nghỉ 7 lớp: 7 chọn + 1 lưu thay vì 7 hộp. Không duyệt → còn đường từng dòng.
2. **[đề xuất] Số "cũ → mới (tính cả nháp)"** khi có dòng nháp, ở MỌI chỗ có số (tổng hợp, danh sách chọn, dải tô) — một nguồn (G7). Mockup đang vẽ ở dải tô; bảng tổng hợp đếm bản đã lưu.
3. **Hạn việc bàn giao**: đặc tả "5 ngày từ khi tạo". Khuyến nghị **hiệu lực + 5 ngày** (Ngay hôm nay thì như cũ) — hiệu lực W3 NOV mà hạn 04/11 thì việc quá hạn trước khi đổi người.
4. **[đề xuất] Lọc "Thiếu GV · n ô"** (ô Chưa có + ô của GV đã nghỉ) và **Xuất Excel · n lớp** ở góc này (thay Google Sheet).
5. GV cũ đã nghỉ: mặc định vẫn tạo việc (giao GVCN — 2b). Có nên mặc định KHÔNG tích (GVCN phải viết góp ý môn mình không dạy)?
6. Ô GV đã nghỉ chặn Lưu cả dòng (2b) — khi QL chỉ sửa ô khác mà chưa có người thay, đường ra là "Bỏ trống" (đã ghi trong lỗi). Giữ chặn hay chỉ báo?
7. Góp ý bắt buộc không có độ dài tối thiểu (bàn giao chuyển lớp: nhận xét chung ≥ 15 ký tự). Có cần?
8. [XM] "Ngay hôm nay / Từ tuần" vs G10 (cấm hàng chip "hôm nay · tuần trước"): vẽ là MỘT ô chọn kiểu radio, theo quyết định chủ SP 30/10 (mới hơn G10).

## Thao tác TRƯỚC → SAU (so với hồ sơ lớp › ⋯ › Thông tin lớp › Phân công › Sửa)
| Thao tác | Trước | Sau |
|---|---|---|
| Xem ai dạy một lớp | hồ sơ lớp → ⋯ → Thông tin lớp (hoặc hàng GV đầu hồ sơ) | Giữ nguyên + góc Phân công GV: cả chi nhánh một bảng |
| Xem GV nào nhiều / ít lớp | không có (Google Sheet) | Giảng dạy + GVCN (FT · Lớp thường · Tổng), GV 0 lớp vẫn hiện |
| Thấy mọi ô của một GV | không có | bấm tên ở tổng hợp → tô; "Chỉ hiện n lớp" |
| Đổi GV một môn | hồ sơ lớp → ⋯ → Thông tin lớp → Sửa → chọn → Lưu phân công (5 bước, đổi trang) | Bảng: chọn ô → Lưu → hộp → Lưu (3 bấm, tại chỗ). Hồ sơ lớp: GIỮ đường cũ, thêm cùng hộp |
| Gợi ý người dạy được | ChonNguoi: người khai kỹ năng lên đầu, "n lớp · dạy được …" | Giữ; dòng phụ thêm "dạy n · GVCN n"; ô GVCN: người đang dạy lớp lên đầu |
| Kiểm 3 luật (mỗi môn một người · một GVCN dạy ≥ 1 môn · GV chi nhánh) | lỗi tại ô, khoá Lưu (`kiemPhanCong`) | Giữ, kiểm trên cả dòng khi chọn |
| Đổi 2 ô cùng lúc (thay A ở GVCN + L) | được (một lần Lưu cả lưới) | Giữ: sửa theo dòng, một lần Lưu |
| Dữ liệu cũ nhiều người một ô | "Ô này đang có n người — chọn lại" | Giữ (không vẽ) |
| GV đã nghỉ còn giữ ô | tên hiện, không báo | ô vàng "⚠ đã nghỉ", Lưu dòng khi đã đổi ô đó |
| FOU Gộp / Tách | nút ở hồ sơ lớp | Giữ ở hồ sơ lớp; bảng luôn tách |
| GVCN (không phải QL) đổi ô bộ môn | được, ở hồ sơ lớp | Giữ ở hồ sơ lớp; góc mới chỉ QL + Quản trị sửa, CX chỉ xem, GV / TVV không thấy |
| "Đã từng dạy lớp này" | ở Thông tin lớp | Giữ ở hồ sơ lớp (bảng không lặp) |
| Người khác vừa đổi (409) | gộp bản + báo | Giữ (`gopChonSau409`), dải lỗi dưới hàng + ô viền đứt |
| Sau lưu | toast "Đã lưu phân công" | toast + **Hoàn tác** (đảo cả việc vừa chuyển / việc bàn giao vừa tạo) |
| Bàn giao khi đổi người | không có | hộp hỏi (mỗi cặp một ô tích, mặc định có) → việc của GV cũ, panel mẫu F |
| Case / PA / việc đang mở của GV cũ | ở lại người cũ | luôn chuyển sang GV mới từ hiệu lực, ghi lịch sử, báo GV mới; điểm đã chấm giữ tên GV cũ |
| Hiệu lực | đổi ngay | Ngay hôm nay / Từ tuần; ô "Chờ đổi" + Đổi mốc / Huỷ lịch đổi |
| GV cũ xem lớp sau đổi | mất quyền ngay | chỉ xem ≥ 1 tuần và tới khi xong bàn giao |

Không mất thao tác nào.

## Critique (impeccable, hai đánh giá độc lập A thiết kế + B máy dò mỗi vòng)
| Vòng | Điểm /40 | P0 / P1 | Sửa chính sau vòng |
|---|---:|---|---|
| 1 | 29 | 0 / 3 | trạng thái Chờ đổi + Huỷ lịch đổi; chân hộp bị cắt; Lưu nhiều dòng (đề xuất); ▾ rõ hơn, focus, aria; GV mới đọc; GV cũ đã nghỉ trong hộp |
| 2 | 29 | 0 / 1 | Huỷ lịch đổi nói hậu quả + giữ bản viết; tô nền trung tính; aria đủ trạng thái; tải "n góp ý"; số nháp ở dải tô |
| 3 | 31 | 0 / 1 | ô tích chỉ "Tạo việc bàn giao", dòng "Luôn chuyển" ngoài vùng bấm |
| 4 | 31 | 0 / 1* | nút Chờ đổi cuối dòng (Đổi mốc / Huỷ); bớt chữ lặp trong hộp; aria hồ sơ lớp; GV mới đọc bỏ chip |
| 5 | **32** | **0 / 0** | dừng (luật cổng: chạm 30 + 2 vòng, không còn P0 / P1); sửa nhỏ: lỗi "đã nghỉ" chỉ đường Bỏ trống, Huỷ trước Lưu, "13 GV (1 đã nghỉ)" |

\* Vòng 4: P1 là "ca GV nghỉ phụ thuộc đề xuất chưa duyệt" + ảnh chụp cắt chân hộp (máy dò B xác nhận không cắt) → thêm đường dự phòng (hộp nhớ hiệu lực) và câu hỏi 1 ở trên.
Máy dò (`impeccable detect`): 20 phát hiện, đều là mẫu đã duyệt (vạch trái 3 px G14 / V21, hồng nhận diện, màu ghi chú vàng, cỡ 16 ô nhập 375) — 0 lỗi thật; tương phản đo thật 0 lỗi; không khung nào tràn.
