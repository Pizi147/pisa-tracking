# Bỏ panel Nhập điểm ở hồ sơ lớp → cuộn tới lưới điểm trong trang (chủ SP 26/11)

Ca thử: Quản trị · hồ sơ lớp **MB FT 101** · bấm "Nhập điểm" đầu trang. Ảnh cặp `cap-<rộng>.png` = TRƯỚC (origin/main) | SAU; 1440 · 1280 tối, 375 sáng. Phông Be Vietnam Pro đã nạp.
Không đổi bố cục: dùng khối "Điểm Mock Test / Test của lớp" sẵn có cuối hồ sơ lớp (không cần mockup).

| Thao tác | TRƯỚC | SAU |
|---|---|---|
| Nút "Nhập điểm" đầu trang | mở panel bên phải | mở khối điểm (đang gập thì mở), cuộn tới, đúng lượt mở sẵn (sớm nhất còn ô chờ), con trỏ vào ô trống đầu |
| Chip "Nhập điểm · n" ở Việc cần làm | mở panel | như trên |
| ⋯ dòng em › "Nhập điểm MTn" (trong hồ sơ lớp) | mở panel đúng lượt | cuộn tới lưới, sang đúng lượt |
| ⋯ dòng em ở Học viên & Lớp · chip lớp ở Học viên & Lớp | mở panel | GIỮ panel (trang không có lưới bên dưới) |
| Panel Nhập điểm ở Công việc (#2196) · `/test/diem-lop?lop=` | panel | KHÔNG ĐỔI |
| Link `?nhap-diem=<lượt\|1>[&trong=1\|cu]` ở hồ sơ lớp | (chưa có) | mở khối + sang lượt + bật "Chỉ ô còn trống" nếu `trong`; tham số bị xoá khỏi URL |
| Chọn đợt MT · "Chỉ ô còn trống" · GV chấm S · hộp nhập · ⋯ Vắng / Dời lịch / Huỷ điểm · Lưu | có | có (cùng lưới, không đổi) |
| Lọc kỹ năng Tất cả · L · R · W1 · W2 · S | chỉ ở panel | THÊM vào khối điểm (cùng `ChonMon`, 375 đã có chip riêng) |
| Đang ở tab Ý thức / Báo cáo PH rồi bấm Nhập điểm | mở panel | về tab mặc định rồi cuộn tới lưới |
| Ô L/R có điểm ở khối điểm hồ sơ lớp | một dòng "5.5 · 20/40" | HAI TẦNG như panel Công việc (#2196): band to trên, "20 câu" nhỏ dưới (chủ SP 26/11); một dòng chỉ còn ở Lịch Test tuần. Ô "Vắng · không dự thi" ở cột S rộng ra một dòng, không xuống 3 dòng |
| Đổi lượt khi còn ô chưa lưu | chặn | chặn (cùng đường `doiLuot`) |

Số request: không đổi (lưới dùng lại `diem-theo-luot` đã có).
