# Đánh giá giao diện toàn bộ PISA Progress — 26/09/2026

Method: dual-agent (A: 4 người chấm thiết kế độc lập chia theo khu vực · B: máy dò tự động impeccable + chèn vào trình duyệt, chạy riêng, không xem kết quả của A).

> **Đọc file này thế nào.** Mục 1–3 là kết luận chung (5 phút đọc). Mục 4 là bảng chấm **từng trang và từng panel**. Mục 5 là chi tiết vấn đề theo từng khu vực, có đường dẫn file để giao cho session code. Mục 6–8 là cảm nhận người dùng, máy dò tự động, và những gì chưa xem được.
>
> **Cách chấm.** Máy demo `localhost:5173`, dữ liệu demo ngày 26/09/2026. Đã chụp **309 ảnh thật** (máy tính 1440 px và điện thoại 375 px) với đủ vai: Quản trị, Quản lý Nguyễn Khánh Vy, GVCN Trần Ngọc Hà, GVBM Phạm Thu Trang, GVBM Cao Khánh Linh. Chỉ mở panel để xem, **không bấm Lưu / Xoá / Xác nhận**, nên dữ liệu demo không bị đổi.
>
> Mức độ: **P0** chặn không làm được việc · **P1** gây rối/sai đáng kể, nên sửa trước khi báo GV dùng rộng · **P2** phiền nhưng có đường vòng · **P3** chau chuốt.

---

## 1. Điểm tổng: 24/40 — "Tạm được, cần cải thiện đáng kể"

Thang Nielsen: 36–40 xuất sắc · 28–35 tốt · **20–27 tạm được** · 12–19 kém. Phần lớn ứng dụng thật được 20–32.

| # | Tiêu chí (Nielsen) | Điểm | Vấn đề chính |
|---|---|---|---|
| 1 | Cho người dùng thấy chuyện gì đang xảy ra | 2 | Gõ sai điểm thì im lặng; SOS tạm thời mất chữ "tạm thời"; "⚠ 12 ngày" không nói quá hạn gì; hạn đã qua mà không báo |
| 2 | Nói ngôn ngữ của người dùng | 3 | L/R/W/S, W3 SEP, SOS, PA rất đúng nghiệp vụ; nhưng lọt chữ máy: "COUNT DISTINCT", `writing2`, `attempt.cancel_part`, "npm run sao-luu", "Hạn 2026-09-16" |
| 3 | Có lối thoát, hoàn tác | 3 | Esc/Huỷ gần như khắp nơi; nhưng vài nút ghi ngay không hỏi, không hoàn tác |
| 4 | Nhất quán | 2 | Màu SOS khác nhau giữa các màn (có lỗi code), 2 kiểu khung panel, 3 kiểu tab, 3 kiểu căn số, cùng một case mà hai nơi nói hai trạng thái |
| 5 | Phòng lỗi | 2 | Luật nhập điểm và xoá dữ liệu rất chặt; nhưng chọn sẵn đáp án rủi ro (Duyệt, BTVN, đợt sai), bảng quyền bấm là đổi |
| 6 | Nhìn là nhận ra, không phải nhớ | 3 | Việc viết bằng động từ, chip kỹ năng; nhưng panel quyết định lộ trình không hiện điểm của em, nhiều thông tin chỉ nằm trong tooltip |
| 7 | Nhanh cho người thạo | 2 | Có Enter/↓/Esc khi chấm, deep link, xếp lịch hàng loạt; không có chọn nhiều, "Nhắc" từng dòng, không phím tắt |
| 8 | Gọn, tối giản | 2 | Chữ phụ 10 px dày đặc, dòng phụ lặp cột khác, bảng 17 cột, nhiều nút xanh trên một màn |
| 9 | Báo lỗi dễ hiểu, dễ sửa | 2 | "Còn thiếu: …" và lỗi từng dòng khi nhập HV rất tốt; lỗi trang chỉ "Lỗi máy chủ", lỗi ô điểm chỉ trong tooltip |
| 10 | Trợ giúp | 3 | ⓘ, "Cách tính" đúng chỗ; nhưng câu trấn an quan trọng lại giấu trong ⓘ, và ⓘ không dùng được trên điện thoại |
| | **Tổng** | **24/40** | |

Điểm theo khu vực (mỗi khu một người chấm riêng):

| Khu vực | Điểm |
|---|---|
| Hồ sơ học viên · Case · Ý thức | 26/40 |
| Tổng quan · Phân tích · Công việc · Thanh đầu · Quản trị | 24/40 |
| Test · Chấm điểm · Màn một lượt Test | 24/40 |
| Học viên & Lớp · Hồ sơ lớp · Lưu trữ | 22/40 |

**Tải nhận thức:** cả bốn khu đều trượt 4/8 mục kiểm. Các mục trượt giống nhau: nhiều hơn 4 lựa chọn ở một chỗ quyết định, phân cấp không rõ (nhiều nút chính), và bắt người dùng nhớ từ màn trước.

---

## 2. Nhận xét chung

**Cái nền rất tốt, đặc biệt là cấu trúc nghiệp vụ.** Các màn không phải mẫu phần mềm chung chung. Chúng mọc ra từ cách trung tâm làm việc: học viên nằm dưới lớp, "Việc tiếp theo" cho từng em, lưới tuần theo đợt MT ở tab Hành trình, chip "L R W · W4 SEP" trong Kế hoạch Test, chấm điểm ngay dưới dòng Nợ. Số nào cũng bấm được để ra đúng danh sách tạo nên nó. Thao tác nguy hiểm (xoá học viên, xoá tài khoản, sửa điểm) được rào rất cẩn thận.

**Cái hỏng là "niềm tin vào cái mình đang nhìn".** Rất nhiều lỗi không nằm ở chuyện đẹp hay xấu. Chúng khiến người dùng **tin sai**:
- em SOS 1 hiện màu xanh dương, mà xanh dương nghĩa là "đạt kỳ vọng";
- SOS tạm thời trông như SOS chính thức;
- gõ sai điểm tưởng đã lưu;
- hạn đã qua mà không báo quá hạn;
- hai khối trên cùng màn cho hai con số khác nhau;
- nút xanh to dẫn vào ngõ cụt, còn việc thật lại nằm ở nút nhỏ.

**Cơ hội lớn nhất:** sửa **6 lỗi hệ thống** ở mục 3. Sáu lỗi này nằm ở vài component dùng chung (nhãn, khung panel, menu, hạn, bảng trên điện thoại), nên sửa một chỗ là nhiều màn cùng tốt lên. Đó là cách nhanh nhất để đưa điểm từ 24 lên khoảng 30.

---

## 3. Sáu vấn đề hệ thống, xếp theo độ ưu tiên

Mỗi vấn đề dưới đây được **từ 2 đến 4 người chấm độc lập cùng phát hiện**.

### 3.1 [P1] Màu và trạng thái nói sai sự thật
**Người dùng thấy:**
- **SOS 1 hiện màu xanh dương** ở Tổng quan (GV) và Công việc. Theo hệ giao diện, xanh dương là "bằng kỳ vọng". Ở Phân tích thì SOS 1 lại vàng.
  - **Đã xác nhận nguyên nhân:** trong `web/src/lib/format.ts:85`, biểu thức nhận dạng chữ "SOS 1/2/3" bị lẫn một **ký tự vô hình (mã 0x08)**, nên không bao giờ khớp. Sửa một ký tự là hết. Nên thêm một phép kiểm tự động.
- **SOS tạm thời mất chữ "tạm thời"**: Đỗ Minh Khôi mới có 2/4 kỹ năng mà ô đầu hồ sơ ghi "◌ SOS 2". Ở danh sách Học viên & Lớp cũng chỉ có viền đứt. HE_GIAO_DIEN §5 cấm bỏ chữ này. (`web/src/ui/KetQuaDot.tsx:53-66`, `BangHocVienLop.tsx:534-539`)
- **Đạt/chưa đạt chỉ phân biệt bằng màu chữ** ở bảng điểm lớp FT và lớp thường: in ra giấy trắng đen là mất. (`ClassRoster.tsx:255`, `BangDiemLopThuong.tsx:101`)
- **"Đạt 0/4 môn · SOS 3"** nằm trong nhãn đỏ: người đọc lướt thấy chữ "Đạt". (`cham/LuoiThuong.tsx:445-481`)
- **"Đang xử lý" (case) và "Tiếp tục xử lý" (việc) dùng xanh dương**, trùng màu của điểm "bằng kỳ vọng". Trạng thái quy trình nên dùng màu trung tính kèm chữ.

**Chủ sản phẩm đã chốt (26/09):** giữ nguyên thang SOS 1 vàng / SOS 2 cam / SOS 3 đỏ để đồng bộ. **SOS tạm thời** mang đúng màu của mức SOS đó, viền đứt, luôn có chữ "tạm thời". Đã ghi vào `thiet-ke/HE_GIAO_DIEN.md` §2 và §5. Phương án "SOS 3 khối đỏ đặc" đã xem và không chọn.

### 3.2 [P1] Hạn và con số không đáng tin
- **Hạn đã qua mà không báo quá hạn:** các dòng "Làm PA: Học tutor · hạn 30/08" không có ⚠, trong khi tiêu đề nhóm ghi "7 quá hạn". Có lẽ đây là "dự kiến kết thúc" chứ không phải "hạn", nên phải ghi đúng chữ. (`worklist/WorkList.tsx:70`)
- **"⚠ 12 ngày"** ở cột Việc tiếp theo không nói là quá hạn hay còn lại. (`ui/ViecTiep.tsx:10-13`)
- **Việc "Nhập điểm S · Giữa khoá" trễ hơn một tháng mà không có dấu cảnh báo** ở danh sách, trong khi bảng điểm lớp lại tô vàng đúng ô đó.
- **Số không khớp trên cùng một màn Tổng quan (Quản lý):**
  - "14 bài chưa nhập điểm quá hạn" so với bảng giáo viên cộng lại 38;
  - "13 case SOS" so với "14 Case";
  - "6 Chưa báo cáo" trong khi bảng chỉ có 2 đơn vị;
  - chip "Tất cả 12" trong khi các nhóm cộng lại 14;
  - bài tuần W1 OCT đã bị tính là "quá hạn" vào ngày 26/09;
  - bật lọc "Lớp thường" mà bảng giáo viên không đổi.

  Một số chỗ có thể chỉ là khác đơn vị (bài hay ô điểm), nhưng màn hình không nói ra. (`KhoiCanXuLy.tsx`, `BranchPulse.tsx`, `MeetingPage.tsx`, `HoTroHocVienTab.tsx`)
- **Dòng việc trùng hệt nhau:** "Làm PA: Học tutor – Lê Quang Huy" hiện 2 lần; "MB-FT 101 · MT3" hiện 2 dòng Nợ giống hệt (tuần thi chỉ có trong tooltip).

### 3.3 [P1] Nút chính và "việc tiếp theo" chỉ sai chỗ
- **Case SOS đang chờ xác định nguyên nhân** (hồ sơ Đỗ Minh Khôi):
  - ô đầu trang bảo "Xác định nguyên nhân Writing Task 2 · quá hạn 10 ngày";
  - hàng Writing Task 2 lại bảo "Ghi kết quả PA";
  - mở case đó trong Ngăn Case thì **không có nút xác định nguyên nhân**;
  - nhãn trạng thái là "Chưa xử lý" ở Ngăn Case nhưng "Đang xử lý" ở bảng kỹ năng.

  GVBM nhận thông báo, mở ra, và không làm được việc được giao. **Đây là lỗi nghiệp vụ nặng nhất tìm thấy.** (`cases/SkillBoard.tsx:513-529`, `cases/CasePanel.tsx`, `students/NganCase.tsx:105`)
- **Ngăn Case:** nút to ở chân là "Hoàn thành Case", nhưng bấm vào thì gặp "Còn thiếu…". Việc thật là "Ghi kết quả" (đang quá hạn 27 ngày) thì chỉ là nút nhỏ trong thẻ PA. (`NganCase.tsx:114-128`)
- **Việc chính bị giấu sau "+2":**
  - hàng lớp FOU 12 dành hai chỗ cho "4 HV chờ xếp lớp" và "4 HV chưa có lộ trình tiếp theo", gần như cùng một ý;
  - còn "13 bài chờ chấm · 3 Case mở" bị gom vào "+2", chỉ đọc được khi rê chuột (điện thoại không đọc được);
  - vì vậy GVBM không thấy việc chấm của chính mình.

  (`shared/domain/hocVienLop.ts:156-168`, `StudentsPage.tsx:287-289`, `DauTrangLop.tsx:246`)
- **Quản lý không thấy ai đang nợ bài:** mọi dòng Nợ ở Lịch Test chỉ ghi "Chờ chấm", không có tên giáo viên. (`test/lichTest/KhoiNo.tsx:20-25`)
- **"Cần xử lý" hứa "việc gấp nhất lên đầu"** nhưng thứ tự màu là đỏ-vàng-vàng-đỏ-đỏ-xanh. (`KhoiCanXuLy.tsx`)
- **Vi phạm chưa xử lý không nổi lên** ở tab Ý thức:
  - cảnh báo "Chưa xử lý 1 vi phạm · cũ nhất 17 ngày" là chữ vàng nhỏ, không có nút;
  - vi phạm chưa xử lý trông y hệt vi phạm đã xử lý;
  - nút "Tạo phương án" chỉ hiện sau khi tick, và nằm cuối danh sách.

  (`yThuc/StudentYThucSection.tsx:176, 203-213`)
- **Lỗi toàn hệ thống: lựa chọn "đang chọn" trông y hệt nút hành động chính** (xanh đặc). Ví dụ: BTVN, Duyệt, Bình thường, bộ lọc "Tất cả". Trong một panel có hai khối xanh đặc thì mắt không biết đâu là nút Lưu. Sửa một lần trong `web/src/ui/ui.tsx`: trạng thái chọn dùng viền teal + dấu ✓, đúng token "Đang chọn" ở HE_GIAO_DIEN §2.

### 3.4 [P1] Bấm một cái là ghi luôn, không hỏi, không hoàn tác
| Chỗ | Chuyện gì xảy ra | File |
|---|---|---|
| Nút "−" cạnh ô điểm trên điện thoại | Một chạm ghi "Không có bài"; ở lớp thường còn **dời môn sang tuần sau**. Nút chỉ là một dấu gạch, không có chữ | `fasttrack/ScoreEntry.tsx:195-203, 952-956` |
| Menu "Thêm" ở màn một lượt Test | "Ghi nhận vắng" và "Kỹ năng không kiểm tra…" chạy ngay, lý do ghi cứng trong code | `fasttrack/MockDetailPage.tsx:373-406` |
| Ngăn Xếp lịch hàng loạt | Chọn sẵn đợt MT2 (đang thi) thay vì MT3 (còn em chưa xếp), nên bấm Lưu mặc định là **dời bài Speaking đã xếp** | `test/keHoach/NganXepHangLoat.tsx:57-60` |
| Xác nhận PA gợi ý (case SOS) | Một chạm là ghi, nằm sát nút Sửa/Thay | `yThuc/CaseSosControls.tsx:109` |
| Trả lời đề xuất | "Duyệt" được chọn sẵn, panel không cho biết ai đề xuất, ngày nào | `cases/ThaoTacCase.tsx:234` |
| Ghi nhận vi phạm | Nhóm "BTVN" được chọn sẵn, nên ghi vội "đi muộn" sẽ vào nhầm nhóm | `yThuc/RecordViolationPanel.tsx:44` |
| Bảng quyền (Quản trị) | "Bấm một ô là đổi ngay", đổi quyền cho cả một vai | `platform/AdminPage.tsx:175-190` |
| Bỏ lưu trữ | Làm ngay, không hoàn tác | `students/LuuTruPage.tsx` |

**Cách sửa chung:** thao tác nhẹ thì hiện thông báo góc màn hình có nút **"Hoàn tác" trong 5 giây**. Thao tác đổi kết quả hay lịch thì mở hộp xác nhận ngắn. Không chọn sẵn lựa chọn nào có hệ quả.

### 3.5 [P1] Điện thoại: bảng không chuyển thành thẻ
HE_GIAO_DIEN §10 đã ghi: dưới 640 px thì mỗi dòng thành một thẻ. Hiện **hầu như không bảng nào làm vậy**. Người chấm cả bốn khu đều gặp:
- **Học viên & Lớp:** bảng cuộn ngang 780 px, cột tên không dính. Cô Hà cuộn sang phải bấm ⋯ thì không còn thấy tên em nào. (`StudentsPage.tsx:196`, `BangHocVienLop.tsx:523-563`)
- **Hồ sơ học viên:** cột Case và Việc tiếp bị đẩy ra ngoài màn (`SkillBoard.tsx:139`). Hành trình mở ở **tháng 7** chứ không ở tuần hiện tại (`HanhTrinh.tsx:170`). Dòng thời gian Ý thức giữ 3 cột, mỗi mô tả vỡ 4–5 dòng, trang dài khoảng 5000 px (`ui/DongThoiGian.tsx:34-43`).
- **Thông báo:** danh sách bị **cắt mất nửa trái**, gần như không đọc được (`platform/Header.tsx:80`).
- **Công việc / Báo cáo / Theo lớp / Quản trị:** mất cột Hạn, Trạng thái, Sửa (`MgmtTasksPage.tsx:197`, `MeetingPage.tsx:175`, `BranchPulse.tsx:84`, `AccountsAdmin.tsx:98`).
- **Lịch Test:** phải cuộn khoảng 500 px qua bộ lọc mới tới việc (`LichTestTab.tsx:210-230`).

**Làm tốt trên điện thoại (giữ nguyên):**
- chấm "một kỹ năng một lúc";
- form Ghi kết quả PA với 4 nút 2×2;
- hộp kỹ năng Kế hoạch Test dạng tấm dưới đáy;
- panel Lộ trình tiếp.

### 3.6 [P1/P2] Bàn phím, chữ nhỏ, và "cùng một thứ mà hai kiểu"
- **Bàn phím** [P1]:
  - menu ⋯ mở ra nhưng focus vẫn ở nút, không đi được bằng mũi tên;
  - panel mở ra không nhận focus, đóng xong không trả focus về chỗ cũ;
  - Esc không đóng Thông báo và menu tài khoản.

  (`ui/MenuDong.tsx:120-140`, `ui/Drawer.tsx:16-27`, `ui/KhungPanel.tsx:49`, `Header.tsx:32-68`)
- **Chữ quá nhỏ cho thông tin nghiệp vụ** [P2]:
  - máy dò đếm được `text-[10px]` 67 lần trong 28 file, `text-[10.5px]` 17 lần, `text-[11px]` 221 lần;
  - kỳ vọng, hạn, trạng thái case và nhãn trạng thái (component chung `ui/Nhan.tsx:27`) đều 10–10,5 px màu xám tối;
  - HE_GIAO_DIEN cấm cỡ nhỏ cho kết quả và hạn.
- **Hai kiểu khung panel** [P2]: một kiểu có "Đóng" và hai nút cùng phía phải (`ui/Drawer.tsx`), một kiểu có "Huỷ" trái / "Lưu" phải kèm "Còn thiếu" (`ui/KhungPanel.tsx`). Nên dùng một kiểu (KhungPanel) cho tất cả.
- **Ba kiểu tab** (gạch chân, viên bo, nút đoạn); **ba kiểu căn số** trong cùng một lưới chấm (L/R căn trái, Kỳ vọng căn phải, lớp thường căn giữa). **Hai bảng xếp chồng lệch cột 90–120 px** ở Lịch Test (`KhoiNo.tsx:86-91` với `HangLop.tsx:124-126`). Đây đúng là điểm chủ sản phẩm soi kỹ.
- **Một chữ, nhiều nghĩa:**
  - "Thiếu 2" (thiếu thông tin) nằm cạnh "Thiếu L 5.5" (dưới kỳ vọng);
  - "Lộ trình" có 3 nghĩa (LT1, nút "Lộ trình lớp" thật ra là tuần khai giảng, "Lộ trình tiếp theo");
  - mã HV có 2 dạng (000042 / PISA-000042);
  - điểm có chỗ "6", chỗ "6.0".
- **Chữ máy lọt ra màn hình:**
  - "Không đếm trùng: COUNT DISTINCT case_id";
  - tiêu đề `writing2`, `listening`;
  - nhật ký `attempt.cancel_part`, `signal.raised`;
  - "Nên sao lưu trước (npm run sao-luu)";
  - "Hạn 2026-09-16" trong thông báo.

  (`ui/SoLieu.tsx:38`, `AdminPage.tsx:147`, `XoaHocVienPanel.tsx:80`, `server/src/cases/sosAuto.ts:149`, `signals.ts:139`)

---

## 4. Bảng chấm từng trang và từng panel

Ký hiệu: 🟢 tốt, chỉ cần chau chuốt · 🟡 dùng được, có lỗi P2 · 🔴 có lỗi P1 cần sửa.

### 4.1 Khung chung và nền tảng
| Trang / panel | Ai dùng | Đánh giá | Điểm chính |
|---|---|---|---|
| Trang đăng nhập / vào nhanh demo | Mọi người | 🟡 | Email sai chỉ báo sau khi gửi; ghi "Bốn nhóm" nhưng có 3; tab gãy hàng trên điện thoại; thẻ tài khoản lặp chức danh 3 lần |
| Thanh đầu + thanh dưới điện thoại | Mọi người | 🟡 | Điều hướng 4 khu rõ; thanh dưới chỉ có chữ 11 px, không biểu tượng; viền focus mục "Công việc" bị cắt; thanh demo chiếm 2 hàng |
| Thông báo | Mọi người | 🔴 | Điện thoại cắt mất nửa trái; không có giờ, không "Đọc hết", ngày dạng máy; 25 thông báo trông như nhau |
| Ô tìm học viên (thanh đầu) | Mọi người | 🟡 | Không tìm thấy thì im lặng; không dùng được mũi tên/Esc; trùng với ô tìm của trang Học viên |
| Hồ sơ cá nhân | Mọi người | 🟡 | Nói rõ cái gì sửa được; nút Lưu ở góc trên xa chỗ sửa; ô email khoá trông như ô sửa được |
| Quản trị › Tài khoản, Sửa/Tạo tài khoản | Quản trị | 🟡 | Chi nhánh chỉ ghi mã MB/BC/CP; 2 cột toàn "—"; điện thoại mất nút Sửa |
| Quản trị › Xoá tài khoản | Quản trị | 🟢 | Nói trước hậu quả, chặn tới khi đổi GVCN xong |
| Quản trị › Lộ trình & loại lớp | Quản trị | 🟢 | Cảnh báo cách chấm với loại gốc; nhãn trộn tiếng Anh ("lớp Normal") |
| Quản trị › Quyền & nhật ký | Quản trị | 🔴 | Bấm ô là đổi quyền ngay; nhật ký hiện mã thô `attempt.cancel_part` |

### 4.2 Tổng quan, Phân tích, Công việc
| Trang / panel | Ai dùng | Đánh giá | Điểm chính |
|---|---|---|---|
| Tổng quan (Quản lý) | QL | 🔴 | Số bấm được ra đúng danh sách (rất tốt); nhưng số giữa các khối không khớp, "Cần xử lý" không xếp theo mức gấp, ba chữ "Tổng quan" chồng nhau |
| Ngăn danh sách sau một con số | QL | 🔴 | Chữ máy "COUNT DISTINCT", `writing2`; trên điện thoại khối định nghĩa chiếm nửa màn |
| "Cách tính" | QL | 🟡 | Mở ra đẩy giãn cả hàng 4 ô số |
| Tổng quan (Giáo viên) | GV | 🔴 | 4 nhóm việc có số, động từ đứng đầu (tốt); SOS 1 xanh dương; "hạn 30/08" không báo quá hạn; nút "Đã làm" đọc như nhãn |
| Học viên cần hỗ trợ (khối) | GV | 🟡 | Dòng không bấm được cả dòng; trên điện thoại bị đẩy xuống khoảng 1.300 px |
| Form Tạo Case từ tín hiệu SOS | GV | 🟡 | Ô "Kỹ năng" là nút xanh to ghi "S" trông như nút chính; không hiện điểm gây ra tín hiệu; ví dụ gợi ý sai kỹ năng |
| Phân tích › Tổng hợp Test + SOS | QL | 🔴 | Hơn 15 điều khiển trên thanh công cụ, bảng 17 cột, tiêu đề bị cắt; Phân tích không có trên menu, vào rồi tiêu đề vẫn ghi "Tổng quan" |
| Phân tích › Tổng hợp vấn đề HV | QL | 🟡 | "Chưa phân loại: 4 Case → Mở danh sách" là lời gọi hành động tốt; ô trống lớn phía trên |
| Phân tích › Hiệu quả PA | QL | 🟡 | Gần như trống, cần câu "chưa đủ dữ liệu" tử tế |
| Phân tích › Ý thức & Phối hợp | QL | 🟢 | Có "Bước tiếp theo"; "Thư CC" chưa giải thích |
| Phân tích › Danh sách Case | QL | 🟡 | Khung "Lọc" rỗng; 3 nhãn chồng nhau; "Bình thường" tô màu cảnh báo |
| Công việc › Hỗ trợ học viên | QL/GV | 🔴 | Dòng trùng; chip đếm không khớp; "Nhắc" phải bấm 13 lần; khoảng trống 600 px giữa tên việc và hạn |
| Chọn phụ trách | QL | 🟡 | Bắt gõ 3 ký tự dù chi nhánh chỉ có 4–5 GV |
| Công việc › Vận hành + chi tiết việc | QL | 🟡 | Tạm ngưng bắt ghi lý do và ngày xem lại (tốt); điện thoại mất cột Hạn/Trạng thái; "Việc con" toàn "—" |
| Cập nhật tiến độ | QL | 🟡 | 5 trạng thái gãy 2 hàng; chữ gợi ý giọng giảng giải |
| + Công việc / + Giao việc | QL | 🟡 | Hai luồng tạo việc với hai tên, không rõ dùng khi nào |
| Công việc › Báo cáo đơn vị | QL | 🔴 | "6 Chưa báo cáo" mà bảng có 2 dòng; bộ chọn tuần gãy hàng (đúng lỗi HE_GIAO_DIEN §9 đã tả) |
| Ngăn báo cáo một ô | QL | 🟡 | Ô nhập không có nhãn; nút Lưu nháp/Nộp lơ lửng giữa ngăn |

### 4.3 Học viên & Lớp, Hồ sơ lớp, Lưu trữ
| Trang / panel | Ai dùng | Đánh giá | Điểm chính |
|---|---|---|---|
| Học viên & Lớp (danh sách) | Mọi người | 🔴 | Một bảng đúng nghiệp vụ, chip có số, "Cần chú ý trước" (rất tốt); điện thoại cuộn ngang mất tên; badge "+2" giấu việc chấm; "⚠ 12 ngày"; dòng phụ bị cắt "…"; đang tải thì chip báo "0" |
| Menu ⋯ dòng học viên | GV/QL | 🔴 | Không dùng được bằng bàn phím; 5–6 mục phẳng, "Hồ sơ" thừa |
| Badge "Thiếu n" | GV/QL | 🟡 | Không có nút "Bổ sung ngay"; không đóng bằng Esc |
| Thêm học viên / nhập Excel | QL | 🔴 | Lỗi từng dòng rất cụ thể (tốt); nhưng ngày sinh 31/02/2010 được chấp nhận; 3 đoạn ghi chú dài giọng kỹ thuật |
| Tạo lớp mới | QL | 🟡 | Bộ chọn tuần đúng mẫu; QL chỉ có 1 chi nhánh vẫn phải tự chọn; cảnh báo vàng hiện ngay khi vừa mở |
| Lộ trình tiếp theo | GVCN | 🔴 | 6 hướng mà không hiện điểm/SOS của em; câu trấn an "Chỉ là dự định" giấu sau ⓘ |
| Chuyển lớp | GVCN/QL | 🟡 | Bàn giao từng Case và hộp xác nhận rất tốt; cho chọn cả 5 chi nhánh; không nhắc khi chuyển khác chương trình |
| Hồ sơ lớp (đầu trang) | Mọi người | 🟡 | Gọn, GV gom theo người; QL không có nút chính, 4–5 nút ngang nhau |
| Tab Học viên › Điểm (FT) | Mọi người | 🔴 | Đạt/chưa đạt chỉ bằng màu; "6" và "6.0"; "▶ Đang theo dõi" trông như nút |
| Tab Học viên › Điểm (lớp thường) | Mọi người | 🔴 | Đạt/chưa đạt chỉ bằng màu; số căn giữa; ô vàng "Chưa có điểm" thật ra là trễ nhập |
| Tab Học viên › Cần hỗ trợ | GVCN | 🟢 | Đúng thứ cần khi họp nhanh; còn "⚠ 5 ngày", "Đề ra PA" |
| Tab Ý thức & Phối hợp (lớp) | GVCN/QL | 🟡 | 12 nút lọc trên 3 hàng trước khi thấy nội dung |
| Tab Phân tích lớp | GVCN/QL | 🟡 | Lưới kỹ năng × MT rất đặc thù (tốt); "0/1" đỏ đậm không ghi "mẫu nhỏ" |
| Lịch kiểm tra (lớp thường) | QL | 🟡 | Khung đỏ cho chuyện bình thường; hướng dẫn trái với nút Chuyển tiếp lớp |
| Lộ trình lớp (FT) | QL | 🟡 | Tên nút sai nghĩa: thực chất chỉ đổi tuần khai giảng |
| Chuyển tiếp lớp | QL | 🔴 | Mở ra đã có 4 lỗi đỏ; 7 hướng/em không kèm kết quả; nhãn khác panel Lộ trình tiếp |
| Sửa phân công | QL | 🟡 | Thấy số lớp mỗi GV đang dạy (tốt); ô chọn lệch cột |
| Sửa thông tin lớp | QL | 🟡 | Ô Chương trình bị khoá trông như ô thường, lý do giấu sau ⓘ |
| Kết thúc lớp / Xoá lớp | Quản trị | 🟢 | Nói rõ hệ quả, gõ lại mã; lời khuyên "chuyển tiếp lớp" sai với lớp FT |
| Lớp không tồn tại / lỗi tải | Mọi người | 🟡 | Chỉ "Lỗi máy chủ" / "Thử lại"; nên có "‹ Về Học viên & Lớp" |
| Lưu trữ | QL/GVCN | 🟡 | Cả thẻ mờ 70% nên khó đọc; "Bỏ lưu trữ" không hoàn tác |

### 4.4 Hồ sơ học viên, Case, Ý thức
| Trang / panel | Ai dùng | Đánh giá | Điểm chính |
|---|---|---|---|
| Đầu hồ sơ + 4 ô số | Mọi người | 🔴 | Ô "Việc cần làm tiếp" là trọng tâm thật (rất tốt); SOS tạm thời mất chữ "tạm thời"; nút ⋮ không có nhãn cho trình đọc màn hình |
| Bảng kỹ năng (SkillBoard) | Mọi người | 🔴 | Mở hàng tại chỗ, 2 lần bấm tới Ghi kết quả (rất tốt); chữ 10 px cho kỳ vọng/hạn; việc tiếp sai với case SOS; điện thoại giấu cột |
| Bảng Mock Test trong hồ sơ | Mọi người | 🟡 | Số căn trái, không tô màu; đợt có 2/4 điểm vẫn ghi "Đã lên lịch" |
| Tab Hành trình | Mọi người | 🟡 | **Màn đặc thù nhất sản phẩm**; điện thoại mở ở tháng 7; chú giải khoảng 15 ký hiệu; Xem gọn mất nhãn SOS |
| Ngăn Case › xem case | GV/QL | 🔴 | Một khung, có "← Case" (tốt); nút chính sai việc; case SOS không có nút xác định nguyên nhân |
| Ngăn Case › Ghi kết quả PA | GV | 🟡 | Trên điện thoại rất ổn (4 nút 2×2, nút đổi chữ theo quyết định); 5 quyết định + 5 thẻ mờ "Chọn kết quả trước"; tiêu đề "tuần này" khi đang ghi bù; "Chưa đủ dữ liệu" chỉ là liên kết nhỏ |
| Ngăn Case › Thêm PA | GV | 🟢 | Mặc định hợp lý; chọn tuần là danh sách 13 dòng |
| Ngăn Case › Hoàn thành Case | GV/QL | 🟢 | Câu hỏi viết như người nói, có cảm giác "xong" rõ |
| Ngăn Case › Trả lời đề xuất | QL | 🔴 | "Duyệt" chọn sẵn, không có ngữ cảnh người/ngày đề xuất |
| Trang case đầy đủ | Mọi người | 🟡 | "← Tổng quan" thay vì về hồ sơ học viên; tên HV không bấm được |
| Form + Case | GV | 🟡 | Tách "Đang gặp / Đã xong" (tốt); tab "Đã xong từ trước" khó hiểu; ô PA không có nhãn |
| Menu ⋮ quản lý học viên | GVCN/QL | 🟡 | 6 mục phẳng; Tạm dừng / Kết thúc học không nói hệ quả |
| Thông tin HV · Lộ trình · Kết luận lộ trình | GVCN/QL | 🟡 | Panel Lộ trình khác kiểu, ô tháng hiện tiếng Anh "February 2027"; Kết luận lộ trình rất tốt |
| Xoá học viên | Quản trị | 🟢 | Bảng "Những gì sẽ mất" + gõ mã; chỉ cần bỏ chữ "npm run sao-luu" |
| Tab Ý thức › Vi phạm & xử lý | GVCN | 🔴 | Vi phạm chưa xử lý không nổi lên; điện thoại vỡ chữ, trang khoảng 5000 px; bộ lọc 6 + 3 |
| Chi tiết vi phạm + hỏi xoá | GVCN | 🟢 | Nói rõ "gỡ khỏi 2 phương án" |
| Ghi nhận vi phạm | GV | 🟡 | Ngắn, chọn ngày nhanh (tốt); BTVN chọn sẵn |
| Tạo PA xử lý / PA đang chuẩn bị / Xác nhận / Xem PA | GVCN | 🟡 | Luồng rõ; "Loại" 9 mục không theo mức nặng; chữ nút lệch từ điển |
| Phối hợp SOS | GVCN | 🟡 | Thẻ lượt dễ quét; 4 nút xanh trên một màn; việc không có hạn; ô ngày khác kiểu |
| Xác nhận PA gợi ý (trong hàng kỹ năng) | GV | 🔴 | Một chạm là ghi, không hoàn tác |

### 4.5 Test và chấm điểm
| Trang / panel | Ai dùng | Đánh giá | Điểm chính |
|---|---|---|---|
| Lịch Test | GV/QL | 🔴 | Chấm ngay dưới dòng Nợ (điểm mạnh nhất khu); QL không thấy tên người nợ; hai ô số luôn bằng nhau; 2 bảng lệch cột; điện thoại cuộn 500 px mới tới việc |
| Lưới chấm nhúng / Bảng nhập điểm FT | GVBM | 🔴 | Cột cố định, hàng đều, Enter/↓/Esc (tốt); gõ sai không báo lỗi; ô chỉ đọc trông như ô nhập; "— (—)"; 3 kiểu căn số |
| Bảng điểm lớp thường | GVBM/GVCN | 🔴 | "Đạt 0/4 môn" trong nhãn đỏ; ô "tổng" và nút "↓" khó hiểu; gõ thiếu tổng thì lỗi vô hình |
| Hộp 4 tiêu chí Speaking | GVBM | 🟢 | Báo lỗi bằng chữ ngay trong hộp, giải thích "-" rõ; là mẫu cho các ô khác |
| Chấm trên điện thoại (một kỹ năng một lúc) | GVBM | 🔴 | Thiết kế đúng nghiệp vụ; nhưng nút "−" một chạm dời lịch; chip "S 0/3" mà có 4 ô "sửa" |
| Kế hoạch Test (lưới) | QL | 🟡 | Chip "L R W · W4 SEP", ô cao đều (rất tốt); bài đã quá tuần mà chưa có điểm vẫn tô như bài chưa tới |
| Hộp kỹ năng (neo cạnh chip) | QL | 🟢 | Cảnh báo "Vẫn xếp vào tuần này" rất đúng; ô tích không nói bỏ tích sẽ làm gì |
| Ngăn Xếp lịch hàng loạt | QL | 🔴 | Có xem trước từng em (tốt); chọn sẵn đợt sai nên dời bài đã xếp; 14 điều khiển; điện thoại hiện nút Lưu trước phần xem trước |
| Màn một lượt Test | GV/QL | 🔴 | Mỗi dòng một nút theo việc đang chặn (tốt); menu "Thêm" ghi ngay; đợt đủ điểm có 5 nút xanh "Sửa điểm"; "0/4 kỹ năng" lặp hai lần |

**Tổng đếm:** 🔴 27 · 🟡 39 · 🟢 11 (trên 77 trang, tab và panel).

---

## 5. Chi tiết theo khu vực: những gì chưa nêu ở mục 3

### 5.1 Tổng quan · Phân tích · Công việc · Khung · Quản trị
- **Thông báo:** cần thêm "x giờ trước", nút "Đọc hết", nhóm Chưa đọc. Tiêu đề "Lịch thi cần xử lý" nhưng nội dung "Đã huỷ phần thi Speaking" không nói lớp nào. Số chưa đọc bị `aria-label` che (trình đọc màn hình không nghe được). (`Header.tsx:73-103`)
- **Tổng quan QL:**
  - ô "Chờ xác minh quá hạn = 0" nằm ngay trên "3 Case quá hạn xác định nguyên nhân", nghe như cùng một thứ;
  - "Điểm đáng chú ý · tối đa 3" là chữ lập trình viên;
  - câu tốt và câu xấu trình bày giống hệt nhau;
  - bảng Theo lớp có cột SOS trùng cột "Dưới kỳ vọng";
  - bật chế độ Theo giáo viên thì tiêu đề vẫn là "Theo lớp".

  (`MetricTiles.tsx`, `Highlights.tsx`, `BranchPulse.tsx`)
- **Đổi tên đề xuất:** tab "Tổng quan / Phân tích" → "Việc hôm nay / Phân tích"; bộ lọc Lớp thường/FT đặt ngay trên các ô số. (`OverviewPage.tsx:95-108`)
- **Công việc:**
  - dòng phụ "· Bạn" thừa ở màn GV;
  - "Loại việc:" gãy dòng, hộp chọn có 9 mục;
  - dòng số đầu tab Vận hành nên thành chip lọc bấm được;
  - "Việc đã giao (1)" lặp tiêu đề hai lần.
- **Phân tích:** mặc định chỉ hiện 4 nhóm cột (Lượt, Đạt, SOS 1–3, Case), phần còn lại cho vào "Cột hiện". (`phanTich/TongHopTestSos.tsx`)
- **Quản trị:** chi nhánh ghi tên đầy đủ; nhật ký dùng nhãn tiếng Việt ("Huỷ phần thi", "Tự tạo Case từ SOS").

### 5.2 Học viên & Lớp
- **Việc chung của lớp** ("Nhập điểm L, R · Cuối khoá") đang lặp ở cả 4 dòng học viên. Nên đưa lên hàng lớp thành một việc: "Nhập điểm Cuối khoá L, R · 4 HV". (`BangHocVienLop.tsx:544-548`)
- **"Việc tiếp theo" chỉ là chữ, không bấm được.** Nên cho mỗi việc là liên kết tới đúng chỗ làm. (`ViecTiep.tsx:8-15`)
- **Dòng phụ bị cắt "…"**: bỏ "Giữa khoá ·" (đã có ở cột khác); "còn 1 môn chưa có điểm" → "1/4 chưa chấm". (`BangHocVienLop.tsx:541`)
- **Lỗi tải:** ghi "Không tải được danh sách lớp. Thử lại" thay cho "Lỗi máy chủ". Tìm không ra thì có nút "Xoá từ khoá". (`StudentsPage.tsx:184-192`)
- **Bảng điểm FT:** bỏ lựa chọn "Gọn / Đầy đủ" (chỉ thêm một mốc cho một em); luôn ghi một chữ số thập phân. (`ClassRoster.tsx:106, 256`)
- **Panel Thêm học viên:** rút 3 đoạn ghi chú còn 2 câu: "Ô trống hoặc '-' = chưa có, không phải 0" · "Em đã có hồ sơ thì dùng Chuyển lớp". (`IntakePanel.tsx:356-368`)
- **Chuyển tiếp lớp:** không báo lỗi trước khi người dùng làm gì; thêm cột "Kết quả" nhỏ cho từng em; lấy sẵn hướng GVCN đã ghi ở Lộ trình tiếp theo. (`TransitionPanel.tsx:83`)

### 5.3 Hồ sơ học viên · Case · Ý thức
- **SkillBoard:** bỏ dòng "Tăng 0.5 so với MT1" vì trùng với dải "5.0 → 5.5". Chữ tối thiểu 12 px, màu `slate-400`. (`SkillBoard.tsx:230, 435-557`)
- **Ghi kết quả PA:**
  - ẩn khối quyết định cho tới khi chọn kết quả;
  - gợi ý sẵn quyết định theo kết quả;
  - "Xin hỗ trợ QL" thành liên kết phụ, để còn 4 lựa chọn;
  - tiêu đề ghi đúng tuần đang ghi bù ("Kết quả tuần W5 AUG · 24–30/08");
  - "Chưa đủ dữ liệu" thành nút thứ 5 cùng hàng.

  (`CapNhatTuan.tsx:236+`)
- **Tab Ý thức:** câu cảnh báo thành thanh có nút "Xử lý {n} vi phạm" (tick sẵn rồi mở Tạo PA); vi phạm chưa xử lý đổi nhãn thành "Chưa xử lý · 17 ngày"; thanh thao tác dính đáy khi đã tick.
- **Menu ⋮:** nhóm "Thông tin · Lộ trình" / "Chuyển lớp · Kết luận" / (vạch ngăn) "Tạm dừng · Kết thúc"; hai panel cuối phải nói hệ quả. (`shared/domain/quanLyHocVien.ts:39-57`)
- **Trang case đầy đủ:** breadcrumb "Lê Quang Huy › Case Listening". (`CasePanel.tsx:122`)

### 5.4 Test · Chấm điểm
- **Ô gõ sai:** hiện câu lỗi dưới ô, thêm `aria-invalid`, và đếm vào "n ô chưa lưu". Lấy hộp 4 tiêu chí làm mẫu. (`ScoreEntry.tsx:286, 337-343, 927-928, 1083-1110`)
- **Ô chỉ đọc** hiện như chữ, không viền; cột mình được nhập có nền nhạt. (`ScoreEntry.tsx:408-418`, `LuoiFT.tsx:106`)
- **Luật "vắng" thống nhất:** màn một lượt đòi "Xử lý vắng", trong khi lưới vẫn cho "sửa". (`MotKyNang.tsx:131, 145-148`)
- **Lớp thường:** trên máy tính cũng lấy sẵn tổng của cột như trên điện thoại; "↓" → "Điền cả cột". (`LuoiThuong.tsx:309-321`)
- **Kế hoạch Test:** thêm trạng thái "quá tuần" cho chip đã qua tuần mà chưa có điểm; nút hàng loạt bị tắt thì ghi lý do cạnh nút. (`ChipKyNang.tsx:94-99`, `KeHoachTestTab.tsx:75`)
- **Màn một lượt:** đợt đã đủ điểm thì "Sửa điểm" là nút phụ; bỏ câu "0/4 kỹ năng" lặp; "← Quay lại" về `/test` khi mở thẳng từ đường dẫn. (`MockDetailPage.tsx:182-186, 367, 477-488`)

---

## 6. Người dùng sẽ vấp ở đâu

**Cô Hà — GVCN, mở điện thoại giữa hai tiết**
- Thông báo bị cắt nửa trái.
- Bảng học viên cuộn ngang mất tên.
- Hồ sơ học viên giấu cột Việc tiếp.
- Hành trình mở ở tháng 7.
- Tab Ý thức dài 5000 px.
- Nút "−" sát ô điểm dời lịch chỉ với một chạm.
- Gõ thiếu tổng thì không thấy lỗi (điện thoại không có tooltip).
- Mở app ra là một bức tường đỏ "quá hạn 34 ngày", không có chỗ nào nói "bắt đầu từ việc này".

**Chị Vy — Quản lý, cần nhìn tổng thể**
- Số giữa các khối không khớp nên mất niềm tin vào cả trang.
- Không thấy ai đang nợ bài.
- Kế hoạch Test không đánh dấu bài đã trễ.
- Ngăn hàng loạt chọn sẵn đợt sai.
- Trả lời đề xuất đã chọn sẵn "Duyệt" mà không có ngữ cảnh.
- Phân tích nằm dưới Tổng quan, không có trên menu.
- "Nhắc" phải bấm 13 lần.

**Người dùng thạo (muốn nhanh)**
- Không chọn được nhiều em một lúc.
- "Việc tiếp theo" không bấm được.
- Không có phím tắt.
- Ghi xong một PA không có "PA quá hạn kế tiếp".
- Chọn phụ trách bắt gõ 3 ký tự.

**Người dùng bàn phím / trình đọc màn hình**
- Menu ⋯ và panel không giữ focus.
- Đạt/chưa đạt chỉ bằng màu.
- Chữ 10 px màu xám tối tương phản thấp.
- Nhiều thông tin chỉ nằm trong `title` (tooltip).
- Bộ lọc thiếu `aria-pressed`.
- Nút ⋮ không có nhãn.

**Cảm xúc chung.** Chỗ được trấn an tốt:
- xoá học viên / tài khoản;
- Kết luận lộ trình ("chưa có căn cứ là hợp lệ");
- hộp kỹ năng "Vẫn xếp vào tuần này";
- "Chưa xác nhận thì chưa đổi gì" ở Chuyển tiếp lớp.

Chỗ **thiếu**:
- một khoảnh khắc "xong" ở cấp tuần, ví dụ "Tuần này đã chấm 9/9 ✓", "Cả lớp đã có lộ trình ✓";
- câu trấn an đúng lúc ngại bấm nhất ("Chỉ là dự định, chưa đổi lớp") lại bị giấu sau ⓘ.

---

## 7. Máy dò tự động nói gì (Assessment B)

- **Quét mã nguồn:** chỉ 1 phát hiện, là font Inter ở `web/src/index.css:70`. Đây là **báo nhầm**: Inter chỉ được khai báo chứ không tải về, nên chữ thật hiển thị bằng font hệ thống (Segoe UI). Có một điểm phụ đáng ghi: vì không tải font, mỗi máy sẽ thấy một font khác nhau (P3).
- **Chèn máy dò vào trang thật** (5 trang, 7 lần chụp):

  | Trang | Số phần tử bị gắn cờ |
  |---|---|
  | Tổng quan (QL) | 6–7 |
  | Học viên & Lớp | 21 |
  | Hồ sơ học viên | 20 |
  | Lịch Test | 15 |
  | Công việc | 4 |

  Gần hết là **chữ quá nhỏ** (10 px và 10,5 px):
  - nhãn "Bản demo nội bộ" (`App.tsx:85`);
  - nhãn trạng thái dùng chung (`ui/Nhan.tsx:27`), chiếm 11/13 phát hiện ở Lịch Test;
  - mã học viên, "Hồ sơ đợt ›", chữ "sửa".
- **Máy dò và người chấm đồng ý nhau** ở chữ nhỏ. Người chấm A3 và A4 cùng nêu chữ 10 px cho kỳ vọng, hạn và nhãn.
- **Máy dò không bắt được** những lỗi nặng nhất: logic trạng thái (case SOS, việc tiếp theo), số không khớp, lỗi ký tự trong biểu thức màu SOS, bảng tràn trên điện thoại, và thao tác một chạm. Đây là loại lỗi chỉ người dùng thật hoặc người chấm bằng mắt mới thấy.
- **Báo nhầm khác:** sọc trái 3 px của nhóm lớp đang mở là thông tin trạng thái, không phải trang trí; "lạm dụng gạch ngang" thực ra là ô trống "—" trong bảng.

---

## 8. Những gì chưa xem được

- **Màn sau khi lưu**: toast, "Đã lưu ✓", "Lưu lại" khi hỏng. Muốn xem phải lưu thật, mà lần chấm này cấm đổi dữ liệu.
- **Đang tải, lỗi, rỗng thật**: chỉ đọc code (có `Skeleton` và `ErrorState` kèm Thử lại) hoặc giả lập ở trình duyệt. Công cụ "Kịch bản giao diện" ghi vào máy chủ dùng chung nên không bật.
- **Lịch sử điều chỉnh PA**: dữ liệu demo không có PA nào từng điều chỉnh.
- **Xoá lớp**: không có lớp trống.
- **Các hộp Sửa điểm có lý do, Xử lý vắng, Đổi lịch, Hẹn xử lý, Huỷ lượt**: chỉ thấy nút, vì một số mục menu chạy ngay khi bấm.
- **Dán từ Excel thật**: chỉ gõ tay vào lưới.

Để xem những phần này, cần một lần chấm trên dữ liệu thử có thể làm hỏng (chạy `npm run seed` lại sau đó).

---

## 9. Câu hỏi cho chủ sản phẩm

1. "Làm PA … hạn 30/08" là **hạn phải làm** hay **ngày dự kiến kết thúc**? Nếu là dự kiến thì có nên nằm trong "Việc cần làm" không?
2. "Bài chưa nhập điểm quá hạn" đếm theo **bài thi** hay **ô điểm**? Vì sao bài tuần W1 OCT đã bị tính quá hạn vào 26/09?
3. ~~Thang màu SOS~~ **Đã chốt 26/09:** giữ vàng / cam / đỏ; SOS tạm thời theo màu mức đó, viền đứt.
4. Với Quản lý, Lịch Test nên nhóm theo **giáo viên đang nợ** hay theo **lớp** như hiện nay?
5. Hai badge "HV chờ xếp lớp" và "HV chưa có lộ trình tiếp theo" có gộp thành một không? Với GV, "bài chờ chấm" có luôn đứng đầu không?
6. Môn đã xác nhận vắng có được nhập điểm làm bù trong lưới không? Hai màn đang trả lời khác nhau.
7. Phân tích có nên thành mục riêng trên menu của Quản lý không?
8. Khi mở app trên điện thoại, cô Hà cần thấy **mấy việc**? Có nên có màn "hôm nay chỉ cần làm 3 việc này"?

---

## 10. Đề xuất chia việc cho session code

> **Kế hoạch chi tiết:** `docs/superpowers/plans/2026-09-26-ux-sau-danh-gia.md`. Kế hoạch có mã từng mục (A1…F8), nghiệm thu, model khuyến nghị và bảng "File → mục" để ghép vào các prompt UI sắp tới. Chủ sản phẩm chốt 26/09: **làm UX-A và UX-B trước**, nhưng **chưa sửa ngay**; sẽ ghép khi có prompt UI mới.

| Gói | Nội dung | Gồm các mục | Ghi chú |
|---|---|---|---|
| **UX-A: Sửa sai sự thật** (nhỏ, làm ngay) | Ký tự 0x08 trong regex SOS; chữ "tạm thời"; nhãn "Đạt 0/4"; hạn quá hạn/dự kiến; "⚠ n ngày" ghi "quá hạn"; chữ máy lọt ra (COUNT DISTINCT, `writing2`, mã nhật ký, npm, ngày ISO) | 3.1, 3.2 (phần hiển thị), 3.6 (chữ máy) | Rủi ro thấp, nhiều file nhỏ |
| **UX-B: Việc tiếp theo và nút chính** | Case SOS chờ nguyên nhân (Ngăn Case + SkillBoard); nút chính Ngăn Case; badge "+2"; tên GV ở dòng Nợ; thứ tự "Cần xử lý"; vi phạm chưa xử lý; kiểu "đang chọn" ≠ nút chính | 3.3 | Cần máy chủ trả thêm tên người chấm |
| **UX-C: Chống bấm nhầm** | Toast Hoàn tác dùng chung; hỏi lại ở "−", menu "Thêm", Xác nhận PA gợi ý, bảng quyền; bỏ chọn sẵn Duyệt/BTVN; ngăn hàng loạt chọn đúng đợt | 3.4 | |
| **UX-D: Điện thoại** | Bảng → thẻ dưới 640 px (một mẫu dùng chung); Thông báo neo mép màn; Hành trình mở ở tuần này; dòng thời gian 1 cột; Lịch Test gọn bộ lọc | 3.5 | Gói lớn nhất |
| **UX-E: Nhất quán và bàn phím** | Một khung panel; focus panel/menu; Esc cho popover; chữ tối thiểu 12 px cho kết quả/hạn; căn số một kiểu; hai bảng Lịch Test chung độ rộng cột; một kiểu tab | 3.6 | |
| **UX-F: Số liệu khớp nhau** | Rà lại 6 cặp số lệch ở Tổng quan/Công việc; ghi đơn vị lên số; lọc chương trình áp cho bảng giáo viên | 3.2 (phần số) | Cần trả lời câu hỏi 1–2 trước |

---

*Báo cáo chi tiết của từng người chấm và 309 ảnh chụp nằm ở `.impeccable/tmp/` (A1.md–A4.md, B.md, `shots/`). Thư mục này chỉ có trên máy này, không đưa lên GitHub.*
