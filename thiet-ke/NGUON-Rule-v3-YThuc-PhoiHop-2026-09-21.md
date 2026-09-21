# PISA CRM — RULEBOOK MỚI v3
# ACADEMIC SOS + Ý THỨC & PHỐI HỢP
# CẬP NHẬT: VI PHẠM MẶC ĐỊNH THEO HỌC SINH + HỒ SƠ HỌC VIÊN

> **SOURCE OF TRUTH MỚI — 21/09/2026**
>
> Tài liệu này thay thế các mô tả cũ liên quan đến:
>
> - Academic Case phát sinh từ SOS;
> - Violation + Biện pháp xử lý;
> - Phối hợp SOS;
> - vị trí và cách hiển thị của các phần này trên hồ sơ lớp và hồ sơ học viên.
>
> Mục tiêu xuyên suốt:
>
> - workflow ngắn;
> - ít click;
> - không thêm module SOS riêng;
> - không làm dày UI;
> - GVCN nhìn theo **học sinh trước**, không phải theo một dòng sự kiện dài của cả lớp;
> - vẫn giữ được góc nhìn **theo thời gian** khi cần tra cứu.

---

# 0. CONTEXT VỚI `plan.md`

Các quyết định nền vẫn giữ:

- bỏ mô hình Case Ý thức cũ;
- Ý thức dùng **Violation** + **Biện pháp xử lý** quan hệ nhiều–nhiều;
- Ý thức là module riêng, không nhét trở lại vào `cases`;
- hồ sơ lớp vẫn có 4 tab cấp chính;
- hồ sơ học viên có một tab Ý thức gọn;
- không thêm khu vực cấp chính thứ 5.

## Quyết định navigation mới

Đổi tab:

> `Ý thức`

thành:

> **`Ý thức & Phối hợp`**

Hồ sơ lớp:

> **Học viên | Ý thức & Phối hợp | Phân tích lớp | Giáo viên**

Bên trong `Ý thức & Phối hợp` có đúng 2 sub-tab:

1. **Vi phạm & xử lý**
2. **Phối hợp SOS**

Hồ sơ học viên cũng có tab:

> **Ý thức & Phối hợp**

với cùng hai ngữ cảnh nhưng thiết kế compact hơn vì chỉ có một học sinh.

---

# 1. BA LUỒNG NGHIỆP VỤ PHẢI GIỮ RIÊNG

## 1.1. Academic Case

Theo dõi vấn đề chuyên môn:

- Listening
- Reading
- Writing Task 1
- Writing Task 2
- Speaking

Bản chất:

> vấn đề → nguyên nhân → phương án → tiến trình → kết quả → đóng Case

---

## 1.2. Violation + Biện pháp xử lý

Theo dõi hành vi/ý thức:

> GV ghi Violation → GVCN xem theo HS → gom Violation → Biện pháp xử lý → xác nhận → lịch sử

Không còn Case Ý thức.

---

## 1.3. Phối hợp SOS

Theo dõi hành động phối hợp sau một Mock Test có SOS:

- Trao đổi với HS
- Trao đổi với gia đình
- GVCN meeting với HS
- CX/GĐCN meeting với HS
- CX/GĐCN meeting với HS/PH
- Khác

Phối hợp SOS:

- không phải Violation;
- không phải Discipline Measure;
- không phải Academic Case;
- không có trang riêng;
- được đặt trong cùng workspace `Ý thức & Phối hợp`.

---

# 2. SOS EVENT

Mock Test phát sinh SOS tạo một **SOS Event** làm record nguồn.

Ví dụ:

> MT2 · SOS2 · Writing + Speaking

SOS Event chỉ dùng để liên kết:

- Academic Cases liên quan;
- một SOS Coordination record cho lần Mock đó.

Không tạo workflow Open/Processing/Reopen cho SOS Event.

---

# 3. SOS LEVEL

Tính theo 4 kỹ năng:

- Listening
- Reading
- Writing
- Speaking

- SOS1 = 1 skill fail
- SOS2 = 2 skill fail
- SOS3 = từ 3 skill fail

Writing tính là **1 skill** ở tầng SOS.

---

# 4. WRITING TÁCH W1 / W2 Ở ACADEMIC CASE

Academic tracking phải tách:

- Writing Task 1
- Writing Task 2

Nếu Writing fail ở tầng SOS nhưng:

- chỉ W1 fail → chỉ tạo/gắn W1 Case;
- chỉ W2 fail → chỉ tạo/gắn W2 Case;
- cả W1 + W2 fail → tạo/gắn cả hai.

Không tạo Writing Case tổng.

SOS Level vẫn chỉ tính Writing là 1 skill.

---

# 5. ACADEMIC CASE TỪ SOS

Với mỗi skill/sub-skill thực sự fail:

1. tìm Case đang mở;
2. có → gắn SOS mới vào Case cũ;
3. chưa có → tạo Case mới.

Không tạo một Case mới cho mỗi Mock nếu cùng kỹ năng vẫn đang được theo dõi.

---

# 6. PHƯƠNG ÁN MẶC ĐỊNH CHO CASE TỪ SOS

Academic Case sinh từ SOS phải preload Phương án.

GVBM phải:

1. xác định nguyên nhân;
2. review/xác nhận/chỉnh PA.

Trong vòng:

> **3 ngày từ khi Case/SOS phát sinh**

Không thêm deadline 3/5 ngày để tạo PA vì PA đã preload.

---

# 7. ACADEMIC CASE TẠO THỦ CÔNG

Không từ SOS:

- Bình thường → PA trong 5 ngày
- Gấp → PA trong 3 ngày

---

# 8. DEFAULT ACADEMIC SUPPORT

## MT1
- SOS1 / SOS2 → Tự học 1 tháng
- SOS3 → Tutor đến MT2

## MT2
- SOS1 / SOS2 → Tự học 1 tháng
- SOS3 → Tutor đến MT3

## MT3 / MT4
- skill fail → Tutor đến lúc thi

## MT5
Không hard-code một PA cụ thể.
Có thể preload:

> Hỗ trợ chuyên môn — cần GVBM/P. Học thuật xác nhận

Không đưa RETAKE/REFIRE/chính sách hỗ trợ phức tạp vào scope.

---

# 9. PA MẶC ĐỊNH CÓ THỂ CHỈNH

GVBM được:

- xác nhận;
- chỉnh;
- bổ sung;
- thay thế.

Nhưng Case từ SOS phải có ít nhất một PA đang hoạt động.

---

# 10. SAU KHỞI TẠO, ACADEMIC CASE QUAY VỀ WORKFLOW BÌNH THƯỜNG

- update tiến trình;
- update kết quả PA;
- điều chỉnh PA;
- bằng chứng nếu cần;
- đóng Case khi phù hợp.

Không thêm lớp SOS Progress riêng.

---

# 11. WORKSPACE `Ý THỨC & PHỐI HỢP`

Hồ sơ lớp:

```text
Học viên | Ý thức & Phối hợp | Phân tích lớp | Giáo viên
```

Trong tab:

```text
[ Vi phạm & xử lý ]   [ Phối hợp SOS ]
```

Hai sub-tab dùng chung workspace nhưng khác entity/data model.

---

# 12. SUB-TAB `VI PHẠM & XỬ LÝ` — NGUYÊN TẮC HIỂN THỊ MỚI

## Quyết định mới

**Mặc định phải xem theo HỌC SINH, không phải theo thời gian.**

Lý do:

GVCN cần trả lời nhanh:

- em nào đang có vấn đề;
- em đó đang có bao nhiêu Violation;
- loại nào;
- đã xử lý đến đâu;
- có Biện pháp đang chuẩn bị không.

Không nên bắt GVCN đọc một feed dài của cả lớp rồi tự ghép các sự kiện của cùng một HS.

---

# 13. HAI CHẾ ĐỘ XEM Ở HỒ SƠ LỚP

Ngay cạnh filter category cần có một control chuyển chế độ xem:

> **Theo học sinh | Theo thời gian**

Có thể dùng segmented control / toggle / hai nút nhỏ.

## Default

> **Theo học sinh**

Hệ thống phải nhớ hoặc default lại theo học sinh khi vào tab.

---

# 14. VIEW `THEO HỌC SINH`

Mỗi học sinh là một row/card summary.

Ví dụ:

```text
Lê Quang Huy
5 Violation · 3 BTVN · 2 Chuyên cần
Biện pháp đang chuẩn bị: Report gia đình
Vi phạm cũ nhất chưa xử lý: 6 ngày
[ Mở ]
```

Bấm mở inline hoặc drawer nhẹ để thấy:

- danh sách Violation của HS;
- category;
- ngày;
- GV ghi;
- trạng thái xử lý;
- Biện pháp đang chuẩn bị;
- lịch sử Biện pháp gần đây.

Không cần chuyển sang một page mới chỉ để xem vài record.

---

# 15. FILTER TRONG VIEW `THEO HỌC SINH`

Filter category vẫn dùng được:

- Tất cả
- Chuyên cần
- BTVN
- Thái độ / hành vi
- Kỷ luật lớp học
- Khác

Ví dụ chọn `BTVN`:

- chỉ hiện học sinh có BTVN phù hợp;
- count trên từng HS phản ánh đúng filter hiện tại.

Có thể thêm:

- Chưa xử lý
- Có Biện pháp đang chuẩn bị
- Cảnh báo >5 ngày

nếu không làm UI quá dày.

Không bắt buộc ngay trong version đầu nếu không cần.

---

# 16. VIEW `THEO THỜI GIAN`

Đây là view phụ để tra cứu.

Hiển thị Violation theo:

- mới nhất → cũ nhất;
- hoặc range thời gian nếu có filter.

Người dùng vẫn được filter theo category.

Ví dụ:

```text
20/09 · Nguyễn Minh Anh · Thái độ · Nói chuyện nhiều
18/09 · Lê Quang Huy · BTVN · Thiếu Reading
17/09 · Lê Quang Huy · Chuyên cần · Đi muộn
```

Mục đích:

- xem hôm nay/tuần này có gì;
- review theo category;
- tìm sự kiện theo thời gian.

Không dùng đây làm default workspace xử lý của GVCN.

---

# 17. FIVE VIOLATION CATEGORIES

1. Chuyên cần
2. BTVN
3. Thái độ / hành vi
4. Kỷ luật lớp học
5. Khác

---

# 18. VIOLATION RECORD

Mỗi Violation tối thiểu:

- student
- date
- category
- subject nếu có
- description
- reporting teacher
- attachment/link nếu có

Mọi GV được ghi theo quyền hiện tại.

---

# 19. SỬA / XÓA VIOLATION

Nếu ghi sai:

- sửa trực tiếp;
- hoặc xóa.

Không có correction workflow.

Cho phép sửa/xóa:

- class view;
- student profile;
- từ Biện pháp đang chuẩn bị;
- kể cả khi Violation đã nằm trong Biện pháp đã thực hiện.

Xóa Violation:

- remove relation khỏi Measures;
- count/statistics cập nhật.

---

# 20. BIỆN PHÁP XỬ LÝ

1. GV trao đổi ngắn với HS
2. GV meeting với HS
3. Report cho gia đình
4. Thư cảnh cáo lần 1
5. CX / GĐCN meeting với HS / PH
6. Thư cảnh cáo lần 2
7. Đình chỉ học
8. Thư cảnh cáo lần 3
9. Khác

Không có sequence bắt buộc ngoại trừ Warning Letter 1 → 2 → 3 theo learning cycle.

---

# 21. MANY-TO-MANY

Violation ↔ Measure = many-to-many.

Một Measure:

- có thể gom nhiều Violation;
- khác category;
- khác môn;
- khác ngày;
- khác GV.

Một Violation có thể nằm trong nhiều Measure.

---

# 22. MEASURE STATUS

Tối thiểu:

- Đang chuẩn bị
- Đã thực hiện

Đang chuẩn bị:

- thêm/bớt Violation;
- sửa nội dung.

Đã thực hiện lưu:

- type;
- actual date;
- actor;
- note;
- linked violations;
- evidence nếu cần.

---

# 23. CẢNH BÁO 5 NGÀY

Chỉ là soft warning.

Nếu Violation mới kể từ Measure gần nhất và oldest unresolved >5 ngày:

> warning GVCN

Trong view theo HS, warning nên xuất hiện ngay trên row/card của đúng HS.

Ví dụ:

> `⚠ 4 lỗi mới · cũ nhất 6 ngày`

Điều này hữu ích hơn một banner chung duy nhất ở đầu trang.

Có thể vẫn có tổng count ở đầu tab nhưng không thay thế warning theo HS.

---

# 24. HỒ SƠ HỌC VIÊN — `Ý THỨC & PHỐI HỢP`

`plan.md` đã có định hướng tab Ý thức gọn ở hồ sơ học viên.

Rule mới đổi thành:

> **Ý thức & Phối hợp**

Vì profile đã scope sẵn một HS:

- KHÔNG cần toggle `Theo học sinh`;
- mặc định hiển thị lịch sử/record của HS này;
- vẫn có category filter;
- có thể sort/filter theo thời gian.

---

# 25. STUDENT PROFILE — SUB-TAB `VI PHẠM & XỬ LÝ`

Nên là một view compact gồm:

## Summary nhỏ

Ví dụ:

- 5 Violation trong lộ trình
- 3 BTVN
- 2 Chuyên cần
- 1 Measure đang chuẩn bị
- Warning Letter hiện tại: lần 1 nếu có

Không cần nhiều metric card lớn.

## Filters

Category:

- Tất cả
- Chuyên cần
- BTVN
- Thái độ / hành vi
- Kỷ luật lớp
- Khác

Time:

- Tất cả thời gian
- 7 ngày
- 30 ngày
- khoảng ngày custom nếu thực sự cần

## Timeline/List

Hiển thị Violation và Measure theo timeline của riêng HS.

Có thể phân biệt bằng icon/badge:

- Violation
- Measure
- Measure đã thực hiện

Không cần group lại theo HS.

---

# 26. STUDENT PROFILE — ACTIONS

Trong profile HS, GVCN có thể:

- + Ghi nhận Violation
- chọn nhiều Violation của HS → tạo Measure
- sửa/xóa Violation
- mở/chỉnh Measure đang chuẩn bị
- xem history/evidence

Không cần quay lại hồ sơ lớp cho các thao tác nhỏ.

---

# 27. SUB-TAB `PHỐI HỢP SOS` Ở HỒ SƠ LỚP

Không hiển thị Academic PA ở đây.

Mỗi row:

```text
Lê Quang Huy
MT2 · SOS2 · Writing + Speaking
2/3 hoàn thành
[ Mở ]
```

Mở inline:

- Trao đổi HS
- Trao đổi gia đình
- Meeting tương ứng

---

# 28. SUB-TAB `PHỐI HỢP SOS` Ở HỒ SƠ HỌC VIÊN

Vì chỉ có một HS, hiển thị theo lần Mock:

```text
MT3 · SOS3       3/3 · Hoàn thành
MT2 · SOS2       2/3 · Đang xử lý
MT1 · SOS1       2/2 · Hoàn thành
```

Bấm một lần Mock để bung actions.

Không cần list student name.

---

# 29. PHỐI HỢP SOS ACTION TYPES

- Trao đổi ngắn với HS
- Trao đổi với gia đình
- GVCN meeting với HS
- CX / GĐCN meeting với HS
- CX / GĐCN meeting với HS / PH
- Khác

Không dùng `Report cho gia đình` cho SOS.

---

# 30. MAPPING PHỐI HỢP SOS

## MT1
- SOS1/2: Trao đổi HS + Trao đổi gia đình
- SOS3: + GVCN meeting HS

## MT2
- SOS1: Trao đổi HS + Trao đổi gia đình
- SOS2: + GVCN meeting HS
- SOS3: + CX/GĐCN meeting HS

## MT3
- SOS1: Trao đổi HS + Trao đổi gia đình
- SOS2: + GVCN meeting HS
- SOS3: + CX/GĐCN meeting HS/PH

## MT4
- SOS1: Trao đổi HS + Trao đổi gia đình
- SOS2: + GVCN meeting HS
- SOS3: + CX/GĐCN meeting HS

## MT5
- SOS1: Trao đổi HS + Trao đổi gia đình
- SOS2: + GVCN meeting HS
- SOS3: + CX/GĐCN meeting HS

---

# 31. DEFAULT SOS ACTION CÓ THỂ BỎ

GVCN được thêm/bớt.

Nếu bỏ default action:

- inline quick reason;
- không mở modal riêng;
- quick options:
  - Không cần trong trường hợp này
  - Đã xử lý theo cách khác
  - Trùng với Biện pháp khác
  - Khác
- `Khác` mới hiện text nhỏ;
- history lưu trace.

---

# 32. COMPLETE SOS COORDINATION

Hoàn thành khi mọi action đã chốt đều:

- done;
- hoặc removed với reason.

Độc lập với Academic Case.

---

# 33. SHARE COMPONENT, KHÔNG SHARE ENTITY

Có thể share:

- note input
- actual date
- attachment
- done confirmation
- row/card component

giữa:

- Discipline Measure
- SOS Coordination Action

Nhưng data model giữ riêng.

---

# 34. CLASS UX — ĐỀ XUẤT INFORMATION HIERARCHY

```text
Ý thức & Phối hợp

[ Vi phạm & xử lý 5 ] [ Phối hợp SOS 2 ]

VI PHẠM & XỬ LÝ

Category:
[Tất cả] [BTVN] [Chuyên cần] [Thái độ] [Kỷ luật] [Khác]

View:
[ Theo học sinh ] [ Theo thời gian ]

Theo học sinh — DEFAULT
----------------------------------
Lê Quang Huy        5 lỗi   ⚠ 6 ngày
Nguyễn Minh Anh     2 lỗi
Trần Hoàng Nam      1 lỗi
...
```

Không lấy chronological feed làm màn mặc định.

---

# 35. STUDENT PROFILE UX — ĐỀ XUẤT INFORMATION HIERARCHY

```text
Hồ sơ học viên
...
[ Học thuật ] [ Ý thức & Phối hợp ] [...]

Ý thức & Phối hợp

[ Vi phạm & xử lý ] [ Phối hợp SOS ]

Vi phạm & xử lý
[Tất cả] [BTVN] [Chuyên cần] ...
[7 ngày] [30 ngày] [Tất cả]

20/09  Violation · Nói chuyện nhiều
18/09  Violation · Thiếu Reading
18/09  Measure · Report gia đình
...
```

Profile HS là nơi tốt nhất để xem lịch sử sâu của một em.

Class view là nơi tốt nhất để triage theo danh sách HS.

---

# 36. KHÔNG OVER-DASHBOARD

Không cần thêm nhiều metric card chỉ để lấp màn hình.

Ưu tiên:

- per-student summary;
- badge count;
- warning theo HS;
- filter;
- expand inline.

---

# 37. DATA MODEL KHÔNG ĐỔI VÌ VIEW MODE

`Theo học sinh` và `Theo thời gian` chỉ là cách query/render.

Không tạo bảng aggregate mới chỉ để hỗ trợ view.

Một nguồn dữ liệu duy nhất.

---

# 38. FILTER PHẢI NHẤT QUÁN

Khi category filter = BTVN:

- View Theo học sinh → chỉ HS có BTVN, count là count BTVN;
- View Theo thời gian → chỉ timeline item BTVN.

Không được để cùng một filter nhưng hai mode trả tập khác logic.

---

# 39. DEMO DATA

Prototype/demo phải có:

- HS có nhiều category;
- HS chỉ có 1 Violation;
- HS có warning >5 ngày;
- Measure đang chuẩn bị;
- Measure đã thực hiện;
- Warning Letter 1;
- cùng HS có SOS Coordination;
- nhiều HS có SOS khác nhau;
- filter BTVN;
- switch Theo HS / Theo thời gian.

---

# 40. YÊU CẦU CẬP NHẬT `plan.md`

Khi implement:

1. giữ quyết định bỏ Case Ý thức;
2. thay label `Ý thức` → `Ý thức & Phối hợp`;
3. ghi 2 sub-tab;
4. thêm quyết định mới:
   - class view Vi phạm mặc định **Theo học sinh**;
   - có toggle **Theo học sinh | Theo thời gian**;
   - category filter áp cho cả hai view;
   - hồ sơ học viên giữ compact tab riêng;
5. Phối hợp SOS không phải Violation;
6. không thêm module SOS riêng.

Không xóa quyết định cũ; ghi rõ quyết định mới thay thế label/layout cũ.

---

# 41. YÊU CẦU CHO CLAUDE TRƯỚC KHI CODE

- đọc `plan.md` + rulebook này;
- review UI hiện tại;
- tận dụng StudentDetailPage hiện có;
- không tạo page mới nếu expand inline/drawer đủ;
- không tạo aggregate data model chỉ để group by student;
- dùng cùng filter logic cho hai view;
- nếu có UX gọn hơn prototype, đề xuất;
- business rule khác prototype → rulebook thắng;
- muốn đổi business rule → đánh dấu `PROPOSAL`, chờ duyệt.

---

# 42. FLOW CUỐI

## Class — Vi phạm

```text
Ý thức & Phối hợp
→ Vi phạm & xử lý
→ DEFAULT: Theo học sinh
→ filter category
→ mở HS
→ xem Violation + Measure
→ xử lý
```

Khi cần tra cứu:

```text
→ Theo thời gian
→ filter category/time
→ chronological feed
```

## Student Profile

```text
HS cụ thể
→ Ý thức & Phối hợp
→ Vi phạm & xử lý
→ category/time filter
→ timeline của riêng HS
```

## SOS

```text
Academic:
Mock → SOS → skill case → preload PA → GVBM xác định nguyên nhân

Coordination:
Mock → SOS → Phối hợp SOS
→ action preload
→ GVCN xác nhận
```

---

# 43. MỤC TIÊU CUỐI CÙNG

GVCN vào hồ sơ lớp phải nghĩ:

> “Học sinh nào đang cần tôi chú ý?”

chứ không phải:

> “Hôm nào đã xảy ra sự kiện gì rồi tự ghép lại theo tên học sinh.”

Khi đã chọn một HS, hồ sơ học viên mới là nơi phù hợp để đọc timeline chi tiết theo thời gian.
