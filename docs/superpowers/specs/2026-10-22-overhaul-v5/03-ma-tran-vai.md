# 03 — Ma trận vai × trang × thông tin × hành động

> V5-A, 22/10. **Xác minh trong mã** — không cấp quyền mới. Nguồn: vai `shared/domain/people.ts:19-24`; quyền mặc định `server/src/seed/data.ts:49-108`;
> kiểm quyền `server/src/permissions.ts`; menu `server/src/platform/nav.ts:14-51`.
> Lưu ý: danh sách quyền là **mặc định của seed**; bản chính có thể đã chỉnh ở Quản trị › Quyền & nhật ký (chưa kiểm DB thật — không chạm Turso).
> Quyền thật = quyền vai × phạm vi chi nhánh của grant (`branch_id NULL` = toàn hệ thống, `permissions.ts:349-354`) × phân công lớp / kỹ năng.

## 1. Vai trong mã

| Mã | Tên trên web | Phạm vi |
|---|---|---|
| `system_admin` | Quản trị hệ thống (QT) | toàn hệ thống |
| `manager` | Quản lý (QL) | chi nhánh |
| `teacher` | Giáo viên (GV) — GVCN là **gán lớp** (`is_core`), không phải vai | lớp / kỹ năng được phân công |
| `office_admin` | Admin (Admin VP) | chi nhánh; Mock Test |
| `consultant` | Tư vấn viên (TVV) | chi nhánh |
| `cx` | CX | toàn hệ thống |
| `head_tutor` | Head tutor | toàn hệ thống; chỉ trang Tutor |
| `branch_admin` | (đã bỏ, chỉ đọc — `people.ts:41`) | — |

## 2. Quyền chính (đã xác minh)

| Năng lực | QT | QL | GV | Admin | TVV | CX | HT |
|---|---|---|---|---|---|---|---|
| Nhập điểm kỹ năng **mình được phân công** (`score.edit`) | – | – | ✓ chỉ kỹ năng phân công (`permissions.ts:363-365`) | – | – | – | – |
| **Nhập điểm hộ** (ngoài phân công) | ✓ | ✓ | GVCN chỉ ở MT cũ `lich_su` (`:556`, `:616`) | ✓ | – | – | – |
| Sửa điểm đã có (phải ghi lý do — RB-5) | ✓ | ✓ | ✓ ô của mình | ✓ | – | – | – |
| Kế hoạch Test / xếp lịch (`plan.week`) | ✓ | ✓ | dời lịch lớp thường (`schedule.move`, `:432-436`) | ✓ | – | – | – |
| Huỷ lượt (`attempt.cancel`) | ✓ | ✓ | – | – | – | – | – |
| Xem hồ sơ / số liệu GV khác (`analysis.view_teacher`) | ✓ | ✓ | chỉ hồ sơ mình | ✓ | – | – | – |
| Duyệt (`request.approve`, `case.approve`) | ✓ | ✓ | – | – | – | – | – |
| Menu Công việc (`work.view`) | ✓ | ✓ | ✓ | ✓ chỉ nhóm Chấm điểm | **✗** | ✗ | ✗ |
| Báo Case (`sos.report`) | ✓ | ✓ | ✓ lớp có dạy (`:380`) | – | – | – | – |
| Xử lý Case / PA (`sos.edit`) | ✓ | ✓ | đúng kỹ năng; GVCN cho Ý thức (`:393-399`) | xem | xem | xem | – |
| Ghi vi phạm / xử lý Ý thức (`violation.record`, `discipline.manage`) | ✓ | ✓ | ✓ (GVCN xử lý) | – | – | – | – |
| Chọn bước tiếp sau thi (`coQuyenBuocTiep`) | ✓ (`cycle.edit`) | ✓ | – | – | ✓ (`student.edit_more`, `:653-656`) | ✓ (`student.edit_more`) | – |
| Xuất Test (`server/src/phanTich/xuatMt.ts:31-42`) | ✓ | ✓ | lớp GVCN | ✓ | ✗ | ✗ | – |
| Phân tích (`analysis.view`) | ✓ | ✓ | – | ✓ | ✓ | ✓ | – |
| Tutor (`tutor.view` / `tutor.manage`) | ✓ / ✓ | ✓ / – | – | – | – | – | ✓ / ✓ |

### Brief 17.1 — QL / Admin / QT có nhập điểm hộ không? **CÓ, cả ba.**

- `editableSkills` (`server/src/permissions.ts:550-566`) mở kỹ năng khi có `score.override` (QT, Admin — `:560`) **hoặc** `plan.week` (QT, QL, Admin — `:562`, chú thích "Quản lý sửa/xoá điểm có lý do (RB-5) ở MỌI lúc").
- `scoreEditPath` (`:611-620`) trả `'override'` → ghi nhật ký `score.override` (`server/src/fasttrack/attempts.ts:1435`, `:2329`); sửa điểm đã có bắt lý do (`attempts.ts:1747`, `:2235`; `server/src/normal/regular.ts:679-684`).
- Điểm nhập hộ **không** tính là việc của người nhập (`mySkills` chỉ dùng `score.edit` — `:587-589`).
- Hệ quả thiết kế (brief 4 "cùng quyền cùng hành vi ở mọi lối vào"): QL / Admin / QT thấy ô điểm **sửa được** ở Lịch tuần, hồ sơ lớp, hồ sơ HV như nhau, nhưng ô là "**Nhập hộ**" (nhãn + bắt lý do khi sửa điểm có sẵn), và **không** hiện trong Công việc của họ như nợ.
- Ghi chú (không đổi): quyền nhập hộ của QL đến từ `plan.week`, không từ `score.override` — gỡ `score.override` của QL ở Quản trị không tắt được nhập hộ; nhãn quyền "Nhập bù điểm ngoài phân công" (`people.ts:192`) không nói điều này. → ghi vào `06` để chủ SP biết, không sửa ở đợt này.

## 3. Vai × trang × thông tin × hành động (V5)

Cột "Hiện có" = menu thật theo `nav.ts`. **[CHỐT]** = brief / quyết định; **[ĐX]** = đề xuất giao diện không đổi quyền; **[CẦN QUYỀN]** = brief chốt nhưng mã chưa có quyền / cờ — giai đoạn C phải làm và chủ SP đã chốt nhu cầu.

| Vai | Trang (V5) | Thông tin thấy | Hành động (nút động từ) | Không thấy |
|---|---|---|---|---|
| **QL** | Tổng quan · HV & Lớp · Test (Lịch tuần, Kế hoạch) · Công việc · Phân tích · Tutor (chỉ đọc) | Chi nhánh mình: đạt MT %, Case có PA %, chờ duyệt, thi tuần này; lớp / GV cần chú ý; tình trạng chấm trong Lịch tuần; hồ sơ GV | Duyệt · Từ chối · Nhập hộ (lý do) · Thêm MT (Kế hoạch Test) · Huỷ lượt · Xử lý Case / Ý thức · Chốt bước tiếp · Xuất | chi nhánh khác (trừ grant toàn hệ) |
| **QT** | như QL + Quản trị | Theo chi nhánh trước, chọn chi nhánh → mức QL; tổng = Σ tử / Σ mẫu | như QL + cấu hình | — |
| **GV** | **Tổng quan [ĐX]** · HV & Lớp · Test (Lịch tuần, Chấm Test) · Công việc | Việc của mình (đúng kỹ năng phân công); "Kỹ năng tôi dạy" ↔ "Lớp tôi chủ nhiệm" tách; Bài thi Speaking tuần này (nếu hồ sơ có S — chi nhánh được phép, C12); hồ sơ GV của mình | Nhập điểm (kỹ năng mình) · Ghi kết quả PA · Báo Case · Xử lý vi phạm (GVCN) · Đánh giá đầu ra (GVCN, trong hồ sơ lớp) · Ghi nhận tiến bộ trên lớp (tuỳ chọn, C11) · Dời lịch lớp thường | Hồ sơ GV khác; nút Duyệt; nhập hộ (trừ GVCN ở MT cũ) |
| **Admin** | Tổng quan · HV & Lớp · Test · Công việc (Chấm điểm) · Phân tích | Độ đủ lịch Test, phân công, ô điểm thiếu | Chốt ngày · Xếp lịch · Nhập hộ (lý do) · Xuất | Duyệt; xử lý Case |
| **TVV** | Tổng quan · HV & Lớp · **Công việc [CHỐT C05 — CẦN QUYỀN]** · Phân tích | Báo PH (bối cảnh GVCN, hạn, liên hệ PH); Sau thi: kết quả thi thật → bước tiếp; HV thi tuần này | **Ghi báo PH** (Đã báo PH / Chưa liên hệ được + Ngày + Ghi chú — C15) · **Ghi KQ thi thật** · **Chốt bước tiếp** (đã có quyền `coQuyenBuocTiep`) | Điểm Test sửa được; Case; duyệt |
| **CX** | Tổng quan · HV & Lớp · Phân tích | HV cần theo dõi / phối hợp trong phạm vi (không thêm trách nhiệm — brief 6.6) | Chốt bước tiếp (đã có `student.edit_more`) · Sửa thông tin HV | Công việc; điểm |
| **Head tutor** | Tutor | Buổi / tutor cần chú ý, độ đủ feedback | Ghi nhận xét tutor | mọi trang khác |

### Hai chỗ "CẦN QUYỀN" đã có căn cứ chốt (không phải tự cấp)

1. **TVV có Công việc** [CHỐT C05]: hiện `consultant` không có `work.view` (`data.ts:99-103` ghi "Không Test, không Công việc"). Giai đoạn C: cờ nav `work` cho TVV + danh sách chỉ việc **của chính TVV** (Báo PH, Sau thi). Không mở nhóm Chấm điểm / Case.
2. **Việc Báo PH thuộc TVV, có hạn** [CHỐT brief 3 + quyết định 22/10]: hiện việc `bao_ph_tvv` **do GVCN sở hữu, không hạn** (`server/src/yThuc/phoiHop.ts:97-135`, `mywork.ts:201`) và chỉ sinh từ Progress / Final rớt, **không** từ xử lý vi phạm. Đây là thay đổi nghiệp vụ lớn hơn giao diện → `06` điểm 1 + 6.

GV Tổng quan [ĐX] chỉ bật cờ nav `overview` cho GV với dữ liệu phạm vi của chính GV — không thêm quyền đọc mới; nếu chủ SP muốn giữ GV vào thẳng Công việc thì bỏ đề xuất này (không ảnh hưởng màn khác).
