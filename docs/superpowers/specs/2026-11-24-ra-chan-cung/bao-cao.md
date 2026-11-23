# Rà 24/11 — chặn cứng · workflow · tốc độ · panel · luật · hổng logic

Chủ SP 24/11: "kiểm tra lại 1 lần nữa xem có chỗ nào bị chặn cứng, không hoàn toàn được, không hủy/ xóa được, chỗ nào workflow đang bị hạn chế hoặc có thể cải thiện tốc độ được, panels nào đang hiện lên mà không thể hiện đủ thông tin cần thiết. Luật nào đang hơi có vấn đề cần cải thiện thì đề xuất, có hổng logic ở đâu không."

Cách rà: 4 mảng song song, chỉ đọc mã (không bấm thử). PTA đọc lại mã xác nhận các điểm nặng (đánh ✔). Khoá đúng luật nghiệp vụ (H03, H06, H21/H22, H25, H26, N5 thu hồi, N15 khoá cuối tuần, N28 thùng rác 30 ngày, H28) KHÔNG tính.

## 1. Hổng logic (máy chủ) — gói R1, rà sâu

| # | Mức | Chỗ | Tình huống | Sửa |
|---|---|---|---|---|
| L1 ✔ | nặng | `platform/xoaTaiKhoan.ts:250–262`, `cases/owner.ts:79, 168` | Xoá / gỡ vai người dùng: Case, PA, tín hiệu, lần xử lý `owner` vẫn trỏ người đã xoá; "Case chưa có người" chỉ bắt `owner IS NULL` → Case không ai nhận | Cùng giao dịch: chọn lại người theo luật (`chonChuCase` / như N29 "Ngay hôm nay"), có lịch sử; hoặc câu "chưa có người" coi chủ không còn hoạt động (`HOAT_DONG_O`) là chưa có |
| L2 | nặng | `hanBaoPhHieuLuc` gọi với `[]` ở `worklist/giaoViec.ts:1150`, `yThuc/phoiHop.ts:384/387`, `phanTich/viecDaXong.ts:97` | Em Tạm dừng rồi quay lại: panel báo đúng hạn, tab Đang theo dõi / Phân tích báo quá hạn (trái N34 ③ một hàm hạn) | Ba chỗ đọc `khoangTamDung` theo lô |
| L3 ✔ | vừa | `yThuc/phoiHop.ts:748–783` `confirmCoordination` | Hai người bấm cùng lúc: đè ghi chú, tin gửi 2 lần; việc hệ thống bỏ (`system_sos_changed`) vẫn xác nhận được (moLai thì chặn) | So trạng thái + `updated_at` → 409; chặn lý do hệ thống như `moLaiCoordination` |
| L4 | vừa | `phanTich/viecDaXong.ts:95, 109` | Lọc chi nhánh theo `students.branch_id`, Công việc theo lớp đang học (`CHI_NHANH_EM`) — em chuyển chi nhánh lệch số (chưa chắc) | Dùng `CHI_NHANH_EM` |
| L5 | nhẹ | `fasttrack/absence.ts:801` | Báo vắng: khôi phục lượt trước khi kiểm xong, kiểm lỗi → lượt đã mở mà vắng không ghi | Dời vào cùng `tx`, sau kiểm |
| L6 | nhẹ | `hvCuaToi.ts:102`, `tongQuanV5.ts:118`, `viecDaXong.ts:154`, `cases.ts:441, 2302` | So ISO giờ UTC với ngày VN: việc tạo 00:00–07:00 VN tính sang ngày / tháng trước | `ngayTheoGioVN` hoặc mốc `T17:00:00Z` ngày trước |

## 2. Chặn cứng / không Hoàn tác — gói R2

| # | Chỗ | Tình huống | Sửa |
|---|---|---|---|
| C1 ✔ | `classes/ClassProgressPanel.tsx:92`, `schedule.ts:777` | Đổi mốc lớp → dời bài + việc cả lớp, chỉ "Đã lưu" | `toast.hoanTac` gửi lại mốc cũ (PATCH sẵn dời về) |
| C2 | `NganXepHangLoat.tsx:171`, `NganXepLichMt.tsx:210`, `XepTheoHocVien.tsx:246` | Xếp lịch lô N em sai → xoá từng em; từ T6 khoá N15 | Máy chủ trả id vừa tạo, Hoàn tác xoá đúng lô (miễn N15 ngay sau lưu) |
| C3 ✔ | `tutors/trang.ts:352, 408` | Xoá tutor / nhận xét = DELETE cứng, mất hẳn nhận xét | Thùng rác (N28) + Hoàn tác |
| C4 | `SuaCaLopPanel.tsx:185` | Sửa cả lớp N em (Target, môn, TVV, tuần → MT dời) không Hoàn tác | Hoàn tác gửi lại bản trước |
| C5 | `IntakePanel.tsx:151` | Thêm nhầm lô HV → phải Xoá hàng loạt gõ XOÁ | Hoàn tác = xoá mềm `hangDaThem` (`hoanTacXoaLo` có sẵn) |
| C6 | `PanelBuocTiep.tsx:118` | Học tiếp có đổi lớp: không Hoàn tác | Dùng `/hoan-tac-chuyen-ngay` |
| C7 | `StudentPlanPanel.tsx:39` | Áp lịch đề xuất tạo / dời nhiều lượt, không Hoàn tác | Trả danh sách lượt → Hoàn tác |
| C8 | `routes/index.ts:3254` (mgmt-tasks), `:3193` (`/tasks`) | Giao nhầm việc: chỉ "Dừng hẳn" + lý do, nằm bảng mãi | Hoàn tác sau tạo + Xoá (Thùng rác) khi chưa có cập nhật |
| C9 | `tutors/trang.ts:391` | Nhận xét tutor chỉ người ghi sửa; GV nghỉ → kẹt | Head cùng chi nhánh sửa, có lịch sử |
| C10 | `fasttrack/ketQuaHuy.ts:129` | Khôi phục KQ MT khi kỹ năng đã huỷ: chặn, không nói bước tiếp | Hỏi rồi mở lại kỹ năng cùng giao dịch (như lượt) |
| C11 | `normal/cuoiKhoa.ts:851`, `KetLuanKhoa.tsx` | Kỳ vọng FT chỉ Đạt ↔ Không đạt, không về "chưa kết luận" | `dat: null` + Hoàn tác |
| C12 | `cases/DoiNguoiPhuTrach.tsx:26` | Đổi phụ trách Case không Hoàn tác (chỗ khác có) | Hoàn tác gửi lại người cũ |
| C13 | `worklist/giaoViec.ts:573` | Việc đã kết thúc không sửa được mô tả (lỗi chính tả) | Cho sửa mô tả có lịch sử; hạn / phụ trách giữ chặn |

## 3. Tốc độ + workflow — gói R3

| # | Chỗ | Hiện | Sửa · lợi |
|---|---|---|---|
| T1 | `/students/:id` đã tính `skillSupportBoard`, web gọi thêm `/skill-board` | +~28 câu, +1 GET mỗi lần mở hồ sơ HV và sau mỗi việc | Trả kèm, nạp sẵn (`taiTruocKem`) |
| T2 | Công việc › Xét lại lộ trình → mở cả trang lớp | ~125 câu, 2 GET, chuyển trang | Mở `PanelXetLai` tại chỗ (`lamTaiCho`) |
| T3 | Hồ sơ lớp: GET `ho-so` phần 2 chờ phần 1 | chờ nối tiếp ~1–2,5 s | Gửi song song, máy chủ tự bỏ phần không áp dụng |
| T4 | Hồ sơ lớp sau lưu `invalidate('/classes')` | ~135 câu, 6 GET mỗi lần lưu | Làm mới đúng đường vừa đổi; gộp qua `ho-so` |
| T5 | `DUONG_LAM_MOI_Y_THUC` 8 tiền tố; `lamMoiGiaoViec` cũng vậy | ~124 câu mỗi "Đã xem"; 5 em ~600 câu | Chỉ y-thuc lớp / em, viec-theo-em, my-work; gộp |
| T6 | Hồ sơ GV của mình gọi `/giao-vien/:id/viec` = dựng lại `/my-work` | +47 câu | Đếm từ `/my-work` đã có |
| T7 | Hồ sơ GV `hai-khoi` chờ hồ sơ | thêm một tầng chờ | Gọi song song |
| T8 | Công việc: mỗi "Lưu · việc tiếp" tải lại `/my-work` | 5 việc QL ~220 câu | **Hỏi chủ SP:** đánh dấu cũ, tải lại khi đóng panel (số chip lệch tạm) |
| W1 | `xem_nx_s` (Xác nhận Case · Speaking) → sang hồ sơ HV | ~123 câu, mất danh sách | Làm tại chỗ bằng panel Case như Mô tả Case |
| W2 | `moc:` Xếp lịch MTn / Nhập ngày thi → hồ sơ trơn | phải tự tìm chỗ | Ngày thi dùng panel Chốt ngày thi; Xếp lịch mở sẵn (`?mo=`) |

## 4. Panel thiếu thông tin — gói R4 (web, dữ liệu đã có)

| # | Panel | Thiếu |
|---|---|---|
| P1 | Đã thực hiện (`DaThucHienPanel`) | hạn, lớp, tên em không link; lỗi chỉ toast |
| P2 | Tình hình học tập · TVV hỏi (`TinhHinh.tsx:311`) | đầu panel: "quá hạn n ngày", link em |
| P3 | Sau thi · Chọn bước tiếp (`PanelSauThi`) | hạn ở đầu panel |
| P4 | Meeting CX/GĐCN (`PanelMeeting`) | "quá hạn n ngày" ở đầu |
| P5 | Báo PH kết quả Test (`PanelViec.tsx:302`) | hạn ở đầu khi đã giao |
| P6 | Khai / sửa cấp bậc một em | lớp; lỗi / 409 chân không nói |
| P7 | Lô Ý thức, Khai bậc lô | tải lỗi không Thử lại, không đầu panel |
| P8 | Bổ sung hồ sơ (TVV) | tên em lúc tải, lớp không bao giờ có |
| P9 | Xem vi phạm → Xác nhận xử lý | mất lớp khi chuyển |
| P10 | Đã thực hiện / Xác nhận xử lý / Khai bậc lúc tải | đầu panel trống (dựng từ WorkItem trước) |
| P11 | Phân công GV môn / Chọn người phụ trách | lý do phát sinh (`it.reason`) |

## 5. Luật — PTA tự sửa chữ (không đổi nghiệp vụ)

- N30: gắn "[ĐÃ THAY 23/11]" phần Turso.
- N4, N15, N32 ⑤: gắn "[ĐÃ THAY — N38]" (thẻ Dời lịch Test đã bỏ); mã thẻ cũ (`decideAbsenceMove`, `sweepExpiredMoves`) gỡ sau khi kiểm bản chính không còn thẻ `pending`.
- Gắn "[SỬA bởi Nxx]": N12 ← N51 · N46 ← N51 · N33 ③ ← N56 ① / N64 · N52 ← N63 ① · N57 ← N63 ② · N34 ② ← N58.
- N5: viết lại một câu theo mã (Hoàn tác 60 s, sau đó Thu hồi qua QL duyệt).
- N40: bỏ cụm "mã đang + 6" (mã đã + 8).

## 6. Luật — cần chủ SP quyết

1. **N58 Xếp lịch họp:** ngày giờ tuỳ chọn → việc "Xếp lịch" bấm xong được với ô trống, mỗi Meeting thành 3 việc đếm 3 lần. Đề xuất: phần Xếp lịch tự xong khi Kết quả meeting xong; BPXL vẫn đặt giờ được nhưng không thành việc / quá hạn riêng.
2. **N29 vs N48:** GV cũ xem chỉ đọc — hai mốc ("≥ 1 tuần, tới khi bàn giao xong" và "30 ngày"). Đề xuất một luật: 30 ngày hoặc tới khi bàn giao xong, lấy mốc muộn hơn.
3. **Người nghỉ còn đứng tên Case / PA / lần xử lý** (đi cùng L1): đề xuất luật mới — tự chuyển về người theo luật (GV môn hiện tại → GVCN → Head), có lịch sử.
4. **T8:** Công việc chỉ tải lại khi đóng panel (số chip / tab lệch tạm trong lúc làm chuỗi việc).
