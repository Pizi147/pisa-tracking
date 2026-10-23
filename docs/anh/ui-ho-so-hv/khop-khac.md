# UI-HO-SO-HV — bảng KHỚP / KHÁC (ảnh cặp `cap-*.png`)

Nguồn: `thiet-ke/v5/dieu-chinh-cuoi.html` khu c (bản chốt 22/10, `10` mục 5) + `ho-so-hv.html` / `ho-so-hv-truy-vet.md` + `08` dòng UI-HO-SO-HV + GIỮ V4 (`10` mục 8).
Vai: cô Trần Ngọc Hà (GVCN, id 7) · seed nguyên (+ 4 dòng Tiến độ trên lớp ghi qua API cho Lê Quang Huy, chỉ máy chụp).
Em: Lê Quang Huy (id 3, SOS 1 + Case / PA) · Lê Minh Đức (id 74, thiếu dữ liệu, KCK) · Vũ Hải Đăng (id 5, đã đạt).

| Ảnh | Em · cỡ |
|---|---|
| `cap-1440-sang.png` · `cap-1440-toi.png` · `cap-1280.png` · `cap-375.png` | Lê Quang Huy (khu c) |
| `cap-thieu-du-lieu-1440.png` | Lê Minh Đức ↔ `ho-so-hv.html?hv=moi` |
| `cap-da-dat-1440.png` | Vũ Hải Đăng ↔ `ho-so-hv.html?hv=lam` |

## Khu c (`dieu-chinh-cuoi.html`)

| # | Khung → thành phần | Kết quả |
|---|---|---|
| C1 | Đầu 2 dòng: tên + nhãn trạng thái · nhãn nhỏ / giá trị đậm Lớp · Target · Ngày thi · TVV → `StudentDetailPage` header + `DongThongTin` (`NhanGt` của hồ sơ lớp) | KHỚP (+ Lộ trình · Tuần học · GVCN — GIỮ V4) |
| C2 | Ô điểm to Overall · L · R · W1 · W2 · S, đang chọn viền + gạch dưới, dòng phụ "MT2 5.0 · +0.5" / "= MT2" → `DiemDau` | KHỚP |
| C3 | Bấm ô điểm đổi kỹ năng của Hành trình + Case & PA | KHỚP (mặc định = kỹ năng có Case gấp nhất, không có → Overall; `?kn=` vẫn mở đúng ô) |
| C4 | "Hành trình · {kỹ năng}" + "?" (P1) → `DauHanhTrinh` (`NutLuat`) | KHỚP (bỏ chữ phụ "bấm ô điểm…" theo P1) |
| C5 | Biểu đồ chỉ MT chính thức, chấm màu theo kỳ vọng lượt, kỳ vọng bậc thang mờ, mốc tuần, tuần này hồng → `BieuDoHanhTrinh` (SVG) | KHỚP |
| C6 | Khoảng thiếu để trống có nhãn | KHỚP ("MT3 chưa có điểm", vòng đứt, không nối qua; dời do vắng → "MT3 · vắng W3 SEP") |
| C7 | Tiến độ trên lớp = bảng dưới biểu đồ, 3 dòng mới nhất + "Xem thêm n dòng", + Ghi tiến độ → `TienDoTrenLop` + panel `PanelTienDo` | KHỚP |
| C8 | Kết quả ghi nguyên văn (KT · 32/40) | KHÁC nhỏ — máy chủ lưu `tên bài` + `điểm / thang` (SV-BAI-LOP), nên hiện "KT nghe Unit 4 · 7/10"; chip vàng "BTVN 5/8 bài" của mockup không có luật màu → không tô |
| C9 | Case & phương án · {kỹ năng}, chỉ của kỹ năng đang chọn → `CaseKyNang` (hàng Case / PA của bảng kỹ năng) | KHỚP |
| C10 | Cột PA cố định (nút không đẩy chữ) | KHỚP (`table-fixed`, 4 cột) |
| C11 | Đầu Case dạng lưới Từ · Nguyên nhân · Phụ trách · Mở · Mục tiêu + Sửa Case · Lịch sử | KHÁC [XM] — giữ hàng Case V4 (tên · nhóm nguyên nhân · nhận xét · trạng thái · Mở Case); Sửa / Lịch sử ở ngăn Case. Đổi lưới = sửa `HangCase` dùng chung với Hồ sơ lớp → PR riêng nếu PTA Plan duyệt |
| C12 | "+ Phương án" cuối khối | KHÁC — "+ Thêm PA" ở hàng Case khi Case chưa có PA (luật V4); Case đã có PA thêm qua ngăn Case |

## Truy vết `ho-so-hv.html`

| # | Yêu cầu | Kết quả |
|---|---|---|
| T1 | Brief 11 đầu gọn (tên + trạng thái + SOS; lớp ↗ · CT · Target · lịch thi · GVCN · liên hệ) | KHỚP (SOS ở ô điểm / Case; liên hệ một dòng nhỏ — GIỮ OV-10b) |
| T2 | Thanh Việc cần làm trước bảng, chỗ DUY NHẤT có việc, làm tại chỗ | KHỚP — `ThanhViec` dạng ô (tên · hạn `dd/mm` · nút), việc gấp nhất nút chính, "+n việc khác của tôi", "n việc của người khác" gập; bấm = ngăn Case / tab Ý thức / panel tại trang |
| T3 | Hành trình riêng L / R / W (W1 / W2) / S | KHỚP theo khu c (W1, W2 là hai ô riêng — không vẽ hai đường) |
| T4 | Kỳ vọng đổi theo thời gian, không tô lại lịch sử | KHỚP (kỳ vọng từng lượt = `expectation` máy chủ) |
| T5 | Khoảng trống ≠ không tiến bộ | KHỚP (biểu đồ + rỗng: "Chưa có điểm MT nào ở … — MT1 W1 SEP (chưa có điểm) · … chưa có điểm không phải là không tiến bộ") |
| T6 | Chú giải loại dữ liệu | KHÁC — khu c bỏ hàng chú giải; cách đọc ở "?" (P1) |
| T7 | C11 / T18 Tiến độ trên lớp tuỳ chọn, thang riêng | KHỚP (panel "GHI NHẬN · TUỲ CHỌN": Kỹ năng · Tên bài · Điểm / Thang · Tuần · Nhận xét; sửa / xoá dòng mình ghi được) |
| T8 | Chỉ xem / tải / lỗi | KHỚP (dải chỉ xem + ẩn nút theo quyền máy chủ; khung xương; lỗi tải có Thử lại; lỗi lưu panel giữ chữ — bấm thử mạng tắt) |
| T9 | S Ex cạnh điểm S ở Hành trình (LUAT-NX-MT 7.1) | KHỚP (thoi hồng "S Ex 6.5", không tính) |
| B1 | BỎ câu tóm tắt + bốn ô ở đầu | KHỚP (gỡ `CauTomTat`, `BonO`) |
| B2 | BỎ lưới tuần CSS + chú giải 9 ký hiệu (`HanhTrinh.tsx`) | KHÁC [XM] — tab cũ đổi tên "Lộ trình & lớp" (Các lộ trình · chương theo lớp · trục tuần Case / PA) vẫn GIỮ: chương theo lớp + lịch sử Case / PA theo tuần chưa có chỗ khác. Bỏ hẳn nếu PTA Plan duyệt |
| B3 | BỎ bỏ qua lượt thiếu điểm | KHỚP (vẽ khoảng trống) |
| G1 | GIỮ kỳ vọng theo lượt (`target_at_attempt`) | KHỚP |
| G2 | GIỮ FT tách W1 / W2 | KHỚP |
| G3 | GIỮ Ý thức, Thông tin, Case / PA chi tiết | KHỚP |

**Đếm:** 12 + 15 = 27 dòng — KHỚP 22 · KHÁC 5 (C8 nhỏ, C11 [XM], C12, T6 theo P1, B2 [XM]). **22/27 = 81 %**; nếu chủ SP chấp nhận C8, C12, T6 (theo luật đã chốt / dữ liệu máy chủ): 25/27 = 93 %.

## Thao tác TRƯỚC → SAU PR (CLAUDE.md "PR giao diện V5 = nâng cấp")

| Thao tác (V4 / main) | Sau PR | Ghi chú |
|---|---|---|
| + Case · ⋯ (Sửa thông tin, Tạm dừng / Thôi học, Lộ trình, Chuyển lớp, Lưu trữ, Xoá, Đề xuất sửa…) · nút thẳng của TVV / CX / Admin | GIỮ — cùng chỗ (phải dòng tên) | |
| Trước / Sau · ‹ Học viên & Lớp | GIỮ | |
| Gia hạn sau thi · nhãn Đã thi / Đã xong | GIỮ | |
| Dải Tạm dừng (Quay lại học) · dải chuyển lớp · dải Chờ duyệt (QL) · Đang xử lý (TVV / CX) | GIỮ | |
| Câu tóm tắt + bốn ô (Kết quả gần nhất · Học thuật · Ý thức · Sắp tới) | ĐỔI → ô điểm to (Overall · L · R · W1 · W2 · S) + Hành trình (lượt sắp tới = vạch mờ "MT4") + chấm ⚠ ở tab Ý thức | B1 |
| Thanh "Việc của tôi" (một việc + gập) | ĐỔI → thanh Việc cần làm dạng ô, 3 ô + "+n", cùng nút mở chỗ làm | T2 |
| Bảng "Tiến độ và hỗ trợ theo kỹ năng" (bấm hàng mở Case; + Case cho kỹ năng; Mở Case · + Thêm PA · Xác nhận Case / PA · Kết quả · Không cần theo dõi…) | ĐỔI → ô điểm chọn kỹ năng + "Case & phương án · {kỹ năng}" — cùng hàng Case / PA, cùng mọi nút | C9 |
| Khối Mock Test / Kết quả Test (MT{n} → hồ sơ MT, điểm kỹ năng → hồ sơ MT cuộn tới kỹ năng, nhãn dời / huỷ phần) | GIỮ — cuối tab Học thuật | |
| Mini Test · Kết luận khoá | GIỮ | |
| Tab Ý thức & Phối hợp | GIỮ | |
| Tab Hành trình (Các lộ trình · Tổng kết · Bước tiếp · chương theo lớp · trục tuần) | GIỮ — tên tab "Lộ trình & lớp" | B2 [XM]; "Hành trình" nay là biểu đồ theo kỹ năng |
| `?kn=` · `?dot=` · `?case=` · `?tong-ket=` · `?buoc-tiep=` · `?viec=` · `?mo=lo-trinh` | GIỮ (`?kn=` chọn ô điểm + cuộn tới Hành trình) | |
| — | MỚI: Tiến độ trên lớp (đọc / ghi / sửa / xoá, API SV-BAI-LOP #513) · S Ex cạnh S · "vắng W3 SEP" dưới ô điểm / ở khoảng trống | |

Không mất thao tác nào.

## Máy chủ (số liệu một nguồn)

- `GET /students/:id` thêm `attempts[].vangCu` (`tuanVangCu`, một câu) và `sEx` (`sExCuaHv`, chỉ lượt đã chấm) — chỉ để hiện, không vào tính toán.
- Nợ #515: việc "Chọn bước tiếp" ở đầu hồ sơ nay là "Chọn bước tiếp · OVR 6.5 · Đạt Target" (động từ trước); bỏ miễn ở `hoSoHocVien.tests.ts`.

## Đo số bước (GVCN, kịch bản thật)

| Việc | Trước | Sau |
|---|---|---|
| Xem điểm Reading qua các lượt | 1 bấm hàng Reading (bảng kỹ năng) → đọc dãy số | 1 bấm ô R → biểu đồ + Case R |
| Ghi KQ PA Listening | 1 bấm hàng L + 1 Kết quả → ngăn Case | 1 bấm ô việc "Kết quả" (hoặc 1 bấm ô L + 1 Kết quả) |
| Ghi một bài trên lớp | không có trên web | 1 bấm "+ Ghi tiến độ" · gõ tên + điểm · 1 Lưu |
