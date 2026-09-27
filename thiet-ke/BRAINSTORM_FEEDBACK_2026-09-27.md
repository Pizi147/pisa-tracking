# Brainstorm từ feedback đội ngũ — 27/09/2026

> **Đây là vòng brainstorm, không phải danh sách việc.** Những gì được CHỌN để làm nằm ở đặc tả
> `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md` (mục 4 và 8). File này giải thích **vì sao**.
>
> **Nguồn:** `thiet-ke/nguon-27-09/FEEDBACK_DOI_NGU.md` (feedback của đội ngũ), đối chiếu với web thật trên `main`
> @ 705ca9e, đánh giá giao diện 26/09 (`thiet-ke/DANH_GIA_GIAO_DIEN_2026-09-26.md`, 24/40 điểm), và yêu cầu chủ sản
> phẩm 27/09 (`thiet-ke/nguon-27-09/YEU_CAU_CHINH_SUA.md`).
>
> Cách đọc: mục A là kết luận (5 phút). B–F là phân tích. G–K là danh sách để quyết.
> Chỗ nào ghi **[Claude phát hiện thêm]** là vấn đề feedback không nói tới — không trộn với feedback gốc.

---

## A. Chẩn đoán — 8 vấn đề gốc

Feedback nói về "nhiều khái niệm, nhiều badge, nhiều tầng". Đó là **triệu chứng**. Dưới đây là **nguyên nhân**.

| # | Vấn đề gốc | Triệu chứng người dùng thấy |
|---|---|---|
| **G1** | **Web được dựng theo luật, không theo công việc.** Mỗi luật trong rulebook sinh ra một khái niệm riêng trên màn hình: Tín hiệu · Case · PA gợi ý · PA · Vi phạm · Biện pháp · Phối hợp SOS · Việc · Nhắc · Duyệt · Thông báo. Người dùng nghĩ "em này cần gì, ai làm", nhưng phải học 11 danh từ. | "Quá nhiều khái niệm", "giống database hơn là công cụ" |
| **G2** | **Không có "ngữ pháp trạng thái" chung.** Mỗi khu tự đặt chữ trạng thái: *Chưa xử lý, Đang xử lý, Tiếp tục xử lý, Đang chuẩn bị, Gợi ý tự động · chờ xác nhận, Chờ GVBM xác định nguyên nhân, Đã lên lịch…* Cùng một Case, hai chỗ nói hai trạng thái (đánh giá 26/09 §3.3). | "Nhiều badge", "không biết việc tiếp theo là gì" |
| **G3** | **Một việc được tính ở nhiều nơi bằng nhiều đoạn mã.** Ô đầu hồ sơ, hàng kỹ năng, Ngăn Case, Việc cần làm, Thông báo, Tổng quan đều tự tính "việc tiếp theo" → chúng lệch nhau. | "Thông tin lặp lại", số không khớp |
| **G4** | **Việc cần QL duyệt không có nhà.** Duyệt dời lịch nằm ở Công việc; đề xuất PA ở chỗ khác; sắp có thêm 4–5 loại duyệt mới. Thông báo và việc trùng nhau. | QL "phải đi nhiều nơi", mục 15 của chủ sản phẩm |
| **G5** | **Bấm vào không đi đúng chỗ.** Chưa có quy ước đường dẫn "Học viên + Lượt Test + Kỹ năng". Nhiều chữ chỉ là chữ, không bấm được ("Việc tiếp theo", "thiếu Speaking"). | "Thấy cái gì thì click phải vào đúng cái đó" |
| **G6** | **Cùng một trang cho mọi vai.** GVBM, GVCN, QL mở cùng một Tổng quan, cùng một danh sách; phạm vi mặc định đôi khi giấu dữ liệu (ví dụ thật: lớp mới tạo không hiện với QL đang dạy lớp — xem đặc tả YC-1). | "Role khác nhau nhưng nhìn cùng một logic" |
| **G7** | **Phân cấp thị giác phẳng.** Hầu hết chữ 11–13 px xám trên nền tối, nhiều nút xanh cùng cỡ, số quan trọng (điểm, Writing tổng) cỡ bằng chữ phụ. | "Thông tin quan trọng chưa nổi bật", "đơn điệu" (mục 14 của chủ sản phẩm) |
| **G8** | **Nhập liệu tốn sức.** Ba kiểu ô ngày khác nhau; ô chọn người bắt gõ 3 ký tự; form nhập bù tự đóng khi gõ 1 chữ; báo lỗi "còn thiếu Mô tả" mà không nói thiếu gì. | "Thao tác thừa", lỗi trong ảnh 4 |

**Kết luận một câu:** web đúng nghiệp vụ nhưng **nói bằng giọng của luật**. Vòng này nên dạy web **nói bằng giọng
của người làm việc**: ít danh từ hơn, một trạng thái chính cho mỗi thứ, mỗi thứ nằm một chỗ, bấm là tới đúng chỗ.

---

## B. Đánh giá từng nhóm feedback

| Nhóm feedback | Vấn đề thật | Feedback đúng? | Giải pháp họ gợi ý có ổn? | Xung đột | Sửa ở UI hay luật |
|---|---|---|---|---|---|
| §4 Incident/Warning/Case/Task | G1 + G2 | Đúng về vấn đề | Gộp entity thật (Option B) là **quá tay**: Case, Vi phạm, Biện pháp có vòng đời và hạn khác nhau thật | Không | **UI** (Option A + D: giữ dữ liệu, ẩn tầng; "tín hiệu" và "PA gợi ý chờ xác nhận" biến mất khỏi màn hình — yêu cầu 12.3.6 của chủ sản phẩm vô tình giải quyết luôn) |
| §5 Student Detail 20–30 giây | Đầu hồ sơ đã có 4 ô, nhưng không nói "em đang thế nào" bằng một câu, và Ý thức không có mặt | Đúng | 3 concept đều có ý hay → chọn **"Hiện trạng trước + việc cần làm"** (mục E) | Không | UI |
| §6 Class View vs Student View | Lớp đã là nơi làm việc chính (tốt). Thiếu: thao tác hàng loạt, giữ ngữ cảnh khi mở hồ sơ rồi quay lại | Đúng | Split-view: **chưa nên** (màn laptop 13" của GV hẹp). Giữ ngữ cảnh bằng đường dẫn là đủ | Không | UI |
| §7 Test context | G5 | **Rất đúng** | Đúng — cần một quy ước đường dẫn duy nhất | Không | UI + một chút máy chủ |
| §8 Role-based | G6 | Đúng | "Không quyền + không cần biết → ẩn" đúng; nhưng giữ **đường dẫn sâu** vẫn mở được (chỉ đọc) | Không | UI |
| §9 Attendance/BTVN/Vi phạm như sự việc | Đúng hướng, và **khớp đúng** yêu cầu 12.6 của chủ sản phẩm ("không phải lúc nào cũng cần xử lý; chỉ cần ghi nhận") | Đúng | Hệ thống tự "leo thang" → chủ sản phẩm đã chốt luật cứng: ≥ 3 lỗi / 2 tuần thì bắt buộc xử lý | Có (thay luật Y01 "không có QL duyệt", W02 "cảnh báo không bắt buộc") | **Luật** — đã có quyết định chủ sản phẩm |
| §10 Dashboard | Tổng quan QL có số không khớp, "Cần xử lý" không xếp đúng | Đúng | Mô hình **Hybrid** (trên: việc; dưới: số) là hợp | Không | UI + sửa số liệu |
| §11 Filter | Nhiều nơi 10–15 nút lọc (tab Ý thức lớp 12 nút) | Đúng | Chips nhanh + "Thêm bộ lọc" + nhớ theo đường dẫn | Không | UI |
| §12 Badge/Status | G2 | **Rất đúng** | Đúng: một trạng thái chính + hạn bằng chữ | Không | UI (hệ trạng thái mới — mục C) |
| §13 Weekly Ops/Report | Báo cáo đơn vị đếm lại, không trỏ về bản ghi gốc | Đúng một phần | "Report chỉ tham chiếu" — đúng, nhưng làm sau | Không | UI + máy chủ, **đợt sau** |
| §14 Worklist | Việc không nói lý do xuất hiện; bấm không tới đúng chỗ | Đúng | Option C (Việc chỉ khi có người + hạn) là đúng triết lý hiện tại — cần làm **triệt để** | Không | UI + một hàm "việc tiếp theo" dùng chung (G3) |
| §15 IA | Phân tích nằm dưới Tổng quan, không có trên menu | Đúng | Thêm mục menu "Phân tích" cho QL; thêm "Chờ duyệt" | Không | UI |
| §16 Micro-UX | Đúng hết | Đúng | Chọn 8 việc giá trị cao (mục G) | Không | UI |

---

## C. Mô hình trong đầu người dùng — đề xuất

### C.1. Bốn danh từ người dùng cần biết (thay cho 11)

```
 SỰ VIỆC            →   CẦN LÀM GÌ?                →   AI LÀM · HẠN      →   KẾT QUẢ
 (đã xảy ra)            (web tự suy ra từ luật)        (Việc / Duyệt)        (đóng lại)

 • Điểm Test            • Case học thuật + PA          • Việc của tôi         • Case xong: thành công?
 • Vi phạm              • Xử lý ý thức (bậc 1…5)       • Chờ duyệt (QL)       • Xử lý đã làm
 • Vắng / dời lịch      • Việc phối hợp (báo PH…)                             • Lịch thi chốt
```

| Người dùng thấy | Đằng sau (máy chủ giữ nguyên) | Ghi chú |
|---|---|---|
| **Case** + **Phương án (PA)** | `sos_cases`, `case_interventions`, `case_signals` | Giữ chữ "Case", đội ngũ đã quen. **"Tín hiệu" biến khỏi màn hình** khi lớp thường cũng tự tạo Case (quy định lớp thường 27/09) |
| **Vi phạm** · **Ghi nhận** · **Xử lý (bậc n)** | `violations`, `discipline_measures` | "Biện pháp" và "PA xử lý" gộp một chữ **"Xử lý"**, tên cụ thể là bậc: *Report 1, Report 2, WL 1…* (WL = thư cảnh cáo) |
| **Việc phối hợp** | `sos_coordination_actions` + việc báo phụ huynh lớp thường | Một checklist nhỏ gắn vào lượt Test, không phải một khu riêng |
| **Việc** (có người + hạn) | suy ra, không lưu | Không có "nhắc", "tín hiệu" riêng |
| **Yêu cầu duyệt** (chỉ QL thấy hộp) | bảng mới dùng chung | Mọi loại duyệt một kiểu thẻ |
| **Thông báo** | giữ | **Chỉ là lối tắt** tới Việc/Duyệt, không phải việc thứ hai |

### C.2. Ngữ pháp trạng thái — một bảng cho cả web

Mỗi dòng trên web có **tối đa một** nhãn trạng thái chính. Hạn viết bằng chữ, người phụ trách viết bằng tên.

| Trạng thái chính | Dùng khi | Màu |
|---|---|---|
| `Cần làm` | có việc, chưa ai bắt đầu | trung tính, viền |
| `Đang làm` | đã bắt đầu, chưa xong | trung tính, nền nhạt |
| `Chờ duyệt` | đang chờ QL | tím nhạt (đã có token `wait`) |
| `Quá hạn` | quá hạn (luôn kèm "n ngày") | cam (`late`) |
| `Xong` | đã xong | xám (`done`) |
| `Đã huỷ` | huỷ có lý do | xám, gạch mảnh |

Màu **điểm** và **mức SOS** là hệ riêng, chỉ dùng cho kết quả Test (đã chốt 26/09). Không trạng thái quy trình nào
mượn màu điểm. Ví dụ dòng cũ `SOS · Warning · Open · High Priority · Overdue` sẽ thành:
`[Quá hạn] Xác định nguyên nhân Reading · quá hạn 2 ngày · cô Trang`.

---

## D. Các phương án kiến trúc thông tin (IA)

| | **D1 — Giữ 4 khu, thích nghi theo vai** *(khuyến nghị vòng này)* | **D2 — Menu riêng theo vai** | **D3 — Không gian làm việc theo học sinh** |
|---|---|---|---|
| Menu | Tổng quan · Học viên & Lớp · Test · Công việc (+ **Phân tích** cho QL) | GV: Hôm nay · Lớp tôi · Test. QL: Tổng quan · Chờ duyệt · Lớp · Test · Phân tích | Một ô tìm lớn + danh sách lớp bên trái, hồ sơ em bên phải, mọi thứ mở ngăn |
| Trang đầu theo vai | Tổng quan đổi nội dung theo vai (đã có một phần) | Mỗi vai một trang đầu riêng | Trang đầu = lớp gần nhất |
| Đơn giản | Cao (người dùng đã quen) | Trung bình | Thấp lúc đầu |
| Mở rộng | Tốt | Tốt | Kém khi thêm báo cáo |
| Hợp vai | Khá | Rất tốt | Tốt cho GVCN, kém cho QL |
| Rủi ro code | Thấp | Trung bình (đổi đường dẫn, thông báo trỏ sai) | Cao |

**Khuyến nghị:** D1 ngay bây giờ, và thiết kế sao cho chuyển sang D2 sau này chỉ là đổi menu (các trang đã tách theo
vai bên trong).

---

## E. Ý tưởng cho từng màn chính

### E.1. Tổng quan — mô hình Hybrid (trên: việc · dưới: số)

```
GV (cô Hà, GVCN MB FT 101)                          QL (chị Vy)
┌─ Hôm nay ──────────────────────────────┐          ┌─ Cần tôi ─────────────────────────────────┐
│ 1  Nhập điểm Speaking MT2 · 4 bài · hạn T4 │          │ Chờ duyệt 5 · 2 quá hạn        [Mở hộp duyệt] │
│ 2  Xác định nguyên nhân Reading · Lan     │          │ Báo lên: 2 vi phạm quá 5 ngày chưa xử lý      │
│ 3  Xử lý vi phạm bắt buộc · Minh An       │          ├─ Chi nhánh tuần này ──────────────────────┤
│    + 4 việc khác                  [Xem hết] │          │ Bài chưa chấm quá hạn 14 bài · cô Trang 9     │
├─ Lớp tôi ──────────────────────────────┤          │ Case chờ nguyên nhân 3 · Vi phạm mở 7        │
│ MB FT 101 · 3 em cần chú ý · 21 bài chờ │          ├─ Số liệu (bấm ra danh sách) ───────────────┤
└────────────────────────────────────────┘          └───────────────────────────────────────────┘
```
- Mỗi số bấm được ra đúng tập tạo nên nó (đã có), số giữa các khối phải khớp (gói UX-F).
- Mục "Hôm nay" tối đa 3 dòng trên điện thoại (trả lời câu Q8 của đánh giá 26/09).

### E.2. Lớp (Học viên & Lớp + hồ sơ lớp)
- Ba chế độ xem cùng một danh sách: **Điểm · Cần hỗ trợ · Ý thức** (đã có hai, thêm/đổi Ý thức theo luật mới).
- Chọn nhiều em → thao tác hàng loạt: *Ghi vi phạm cho n em*, *Nhập điểm*, *Xuất Excel*.
- Mở hồ sơ một em rồi "‹ Quay lại" → về đúng lớp, đúng chế độ xem, đúng vị trí cuộn.

### E.3. Hồ sơ học viên — "Hiện trạng trước, việc cần làm ngay dưới"
```
Vũ Ngọc Lan · MB FT 101 · LT1 · target 7.0 · tuần 12/16 · thi dự kiến 03/2027
Đang cần hỗ trợ 3 kỹ năng sau MT1 (SOS 3) · 1 xử lý ý thức (Report 1) · việc gấp nhất: Xác định nguyên nhân Listening (quá hạn 9 ngày)
┌ Kết quả gần nhất ┐┌ Cần hỗ trợ ┐┌ Ý thức ┐┌ Sắp tới ┐
│ MT1 · SOS 3     ││ L R S       ││ Bậc 1   ││ MT2 W2 OCT│
└─────────────────┘└─────────────┘└─────────┘└──────────┘
[ Việc cần làm với em này: 2 ]  ← thanh mảnh, bấm ra danh sách
```
- Câu tóm tắt một dòng do máy viết từ **cùng một hàm "việc tiếp theo"** (G3), không tự ghép chữ ở từng nơi.
- Sau 1–2 năm dữ liệu: bảng kỹ năng chỉ hiện lộ trình đang học; các lộ trình cũ gập lại ở tab Hành trình.

### E.4. Test — hồ sơ Mock và Lịch Test
- Hồ sơ Mock thành **bảng điểm lớn** giống Lịch Test: 4 ô kỹ năng, số to, W và S có 4 ô tiêu chí; ai đúng quyền
  thì bấm ô là nhập luôn (yêu cầu 13.8). Mockup ở đặc tả.
- Quy ước đường dẫn (G5): mọi chỗ nhắc "MT2 · Speaking" của một em đều mở `Hồ sơ Mock của em · MT2 · cuộn tới Speaking`.

### E.5. Công việc — hai loại, không trộn
- **Việc của tôi**: mỗi dòng = động từ + đối tượng + hạn + **một dòng lý do** ("vì MT1 Listening 5.0 < kỳ vọng 6.0").
  Làm xong ở nơi khác → dòng tự biến mất (suy ra, không lưu).
- **Chờ duyệt** (QL): hộp duy nhất, **có phân loại** (chủ sản phẩm chốt 27/09): Học thuật · Ý thức · Lịch thi ·
  Cập nhật thông tin · Báo lên (quá hạn).

### E.6. Ý thức — theo luật mới 12.6
- Mỗi vi phạm có đúng hai cách đóng: **Ghi nhận** (nhẹ) hoặc **Xác nhận xử lý** (bậc tiếp theo của thang).
- Tab lớp: hai khung cạnh nhau — trái **Xử lý** (em cần xử lý / chờ duyệt / đã xử lý gần đây), phải **Vi phạm**
  (lọc theo em đang chọn bên trái). Mockup ở đặc tả.

### E.7. SOS — Case học thuật
- Không còn "PA gợi ý · chờ xác nhận". GVBM bấm **Xác nhận nguyên nhân** → một form Case quen thuộc, điền sẵn gần
  hết, PA theo quy chế đã có sẵn và không xoá được (yêu cầu 12.3).

---

## F. Luồng công việc — vẽ lại

Nhãn: **[UI]** = chỉ đổi cách trình bày · **[LUẬT]** = đổi luật nghiệp vụ (đã có quyết định chủ sản phẩm).

```
F1. SOS Fast Track  [LUẬT 12.3–12.4]
Nhập điểm MT → kỹ năng dưới kỳ vọng → Case "MT2 · Reading không đạt [SOS 2]" + PA quy chế (bắt buộc)
   → GVBM: [Xác nhận nguyên nhân] (3 ngày) ──→ Case chạy, PA quy chế + PA thêm (nếu có) → Ghi kết quả hằng tuần (hạn hết Thứ Hai) → Xong
          └ [Không cần theo dõi] + lý do → QL duyệt (5 ngày làm việc) ─ Duyệt → Case + PA huỷ, giữ lịch sử
                                                                     └ Từ chối → quay lại "Xác nhận nguyên nhân"

F2. Lớp thường · Giữa khoá  [LUẬT — quy định P. Học thuật]
Điểm < 70% ở kỹ năng → Case "Giữa khoá · Writing không đạt" + PA "Bổ trợ …buổi/tuần đến Cuối khoá" (bắt buộc)
   → GV xác nhận nguyên nhân + nộp kế hoạch bài giảng → QL duyệt → bổ trợ; song song: việc "Báo phụ huynh qua TVV"

F3. Lớp thường · Cuối khoá  [LUẬT]
% Cuối khoá → <50: học lại · 50–59: QL + GV quyết (duyệt) · 60–69: lên lớp + bổ trợ miễn phí + Mini Test · ≥70: Pass

F4. Ý thức  [LUẬT 12.6]
Ghi vi phạm → GVCN: [Ghi nhận] hoặc [Xác nhận xử lý = bậc kế tiếp]
   ≥ 3 vi phạm trong tuần này + tuần trước → chỉ còn [Xác nhận xử lý] (bắt buộc)
   quá 5 ngày chưa xử lý → Quá hạn + báo QL
   Bậc: Report 1 → Report 2 → WL 1 → Report 4 + Meeting CX/GĐCN → WL 2 → (QL duyệt) WL 3 / Đình chỉ

F5. Duyệt  [UI + máy chủ mới]
Người xin (GV) → thẻ trong "Chờ duyệt" (QL, có phân loại, hạn) → Duyệt / Từ chối (lý do) → người xin nhận kết quả
```

---

## G. Việc nhỏ, giá trị cao (quick wins)

1. "Việc tiếp theo" ở danh sách thành **liên kết** tới đúng chỗ làm.
2. Mọi thông báo và mọi dòng việc có **một dòng lý do**.
3. Toast **Hoàn tác 5 giây** cho thao tác nhẹ (đã có trong gói UX-C).
4. "Lưu và sang em tiếp theo" ở màn nhập điểm một em và Ghi kết quả PA.
5. Ô tìm đầu trang nhớ **5 học viên gần đây** và **3 lớp gần đây**.
6. Bộ lọc nhớ trong đường dẫn (đã có ở Học viên & Lớp) — áp cho Phân tích, Công việc.
7. Ô chọn người mở danh sách ngay, không bắt gõ 3 ký tự.
8. Không tự mở lớp đầu tiên; hàng tiêu đề bảng dính khi cuộn (yêu cầu 11.1).

---

## H. "Nếu không bị giới hạn bởi thiết kế hiện tại, tôi sẽ cân nhắc…" (ý tưởng lớn — CHƯA làm)

1. **Bảng lệnh Ctrl+K**: gõ "lan mt2" → mở hồ sơ Mock MT2 của Lan; gõ "ghi vp an" → mở Ghi vi phạm cho An.
2. **Dòng thời gian học viên hợp nhất**: điểm, vi phạm, xử lý, Case, PA, chuyển lớp trên một trục — thay cho ba tab.
3. **Không gian lớp (class workspace)**: lưới học viên × tuần của cả lớp, mỗi ô là tuần của một em (điểm, vắng, vi phạm).
4. **Trang đầu theo vai hoàn toàn** (IA D2).
5. **Tự động hoá nhắc**: web tự gửi email tóm tắt sáng thứ Hai cho GV "tuần này bạn có 5 việc".
6. **Báo cáo tuần tự sinh** từ dữ liệu, QL chỉ viết phần nhận định.

---

## I. Những phản xạ KHÔNG nên làm

- Thêm một ô số trên Tổng quan cho mỗi vấn đề mới (ví dụ "Vi phạm quá hạn") — đưa vào hộp **Chờ duyệt / Báo lên**.
- Thêm badge để giải thích badge (ví dụ "Thiếu 2" cạnh "Thiếu L 5.5").
- Tạo khu "Phê duyệt" riêng cho từng loại (SOS riêng, Ý thức riêng, Lịch riêng).
- Thêm tab mới vào hồ sơ học viên (đã có 3 tab là đủ).
- Chép số liệu vào báo cáo tuần rồi để hai nơi lệch nhau.
- Cho mọi vai thấy nút bị khoá kèm giải thích quyền — không có quyền và không cần biết thì **ẩn**.
- Gộp bảng dữ liệu Case và Vi phạm vào một (hai vòng đời khác nhau thật).

---

## J. Danh sách xung đột với luật / thiết kế hiện tại (không tự giải quyết âm thầm)

| # | Luật cũ | Yêu cầu / đề xuất mới | Ai quyết | Trạng thái |
|---|---|---|---|---|
| J1 | SOS v3 S04–S06: PA điền sẵn phải **xác nhận / sửa / thay** | 12.3.6: PA quy chế **không được bỏ, phải làm theo** | Chủ sản phẩm | ✅ theo yêu cầu 27/09 |
| J2 | Q-V3-4: GVBM tự đóng "Không cần theo dõi" ngay | 12.4: phải **QL duyệt** trong 5 ngày làm việc | Chủ sản phẩm | ✅ theo yêu cầu 27/09 |
| J3 | Y01: GVCN tự làm mọi biện pháp, **không có QL duyệt** | 12.6.4: Meeting CX/GĐCN, WL 3, Đình chỉ **cần QL duyệt** | Chủ sản phẩm | ✅ |
| J4 | B05: không có thứ tự biện pháp bắt buộc | 12.6.4: thang **bắt buộc theo thứ tự** | Chủ sản phẩm | ✅ chốt 27/09 (câu hỏi 1) |
| J5 | W02: cảnh báo 5 ngày chỉ là cảnh báo mềm | 12.6.1: ≥ 3 lỗi / 2 tuần **bắt buộc xử lý**; > 5 ngày **quá hạn + báo QL** | Chủ sản phẩm | ✅ |
| J6 | Chín biện pháp (có trao đổi ngắn, GV meeting, CX meeting) | Bỏ 2 loại meeting + trao đổi ngắn | Chủ sản phẩm | ✅ |
| J7 | Q-V3-1: lớp thường **không** tự tạo Case, có nút "Bỏ qua" | Quy định lớp thường: Giữa khoá trượt → bổ trợ **bắt buộc** | P. Học thuật | ✅ áp theo quy định |
| J8 | Nhập danh sách **không** lập lịch MT (chỉ QL lập) | 13.2: web **tự tạo** MT mặc định | Chủ sản phẩm | ✅ |
| J9 | Kỳ vọng MT theo số lượt (−1.0 / −0.5 / target) | RF: mọi MT = target | Chủ sản phẩm | ✅ chốt 27/09 (câu hỏi 4) |
| J10 | Chỉ GVBM đúng kỹ năng nhập điểm | 13.2: MT đã qua của HS cũ → GVCN và QL nhập đủ 4 kỹ năng | Chủ sản phẩm | ✅ |
| J11 | Không lưu ngày thi cụ thể (chỉ tháng/tuần) | 5.3: ngày thi dạng `dd/mm/yyyy` hoặc `mm/yyyy` | Chủ sản phẩm | ✅ (thêm cột ngày thi) |
| J12 | UX3 cố ý bỏ ô lịch trình duyệt, dùng danh sách thả xuống | Yêu cầu 9: mọi ô ngày **gõ được + có lịch** | Chủ sản phẩm | ✅ (lịch tự vẽ, không dùng lịch trình duyệt) |
| J13 | Bảng phân công từng cho "một môn hai người dạy" (chữ trên panel) | Yêu cầu 4: một nhiệm vụ đúng một người | Chủ sản phẩm | ✅ (máy chủ vốn đã chặn; chỉ sửa giao diện) |
| J14 | Tên lớp `MB-FT 101` | `MB FT 101`, `MB FT RF 12`, `MB FOU 12` | Chủ sản phẩm | ✅ |
| J15 | Feedback §9 muốn hệ thống "chỉ highlight, không escalate" | Chủ sản phẩm muốn **escalate cứng** (≥3 lỗi) | Chủ sản phẩm | ✅ theo chủ sản phẩm |

---

## K. Ưu tiên

| Mức | Nội dung | Ở PR nào (đặc tả §8) |
|---|---|---|
| **P0** — đang cản việc hằng ngày | Lớp tạo mất; SOS hai nút chồng nhau; ô tên PA nhập bù tự đóng; bộ lọc vi phạm sai; báo lỗi mơ hồ; màu SOS sai (UX-A) | PR-N1, PR-LOP |
| **P1** — thay đổi lớn cần có | Luật Ý thức mới; SOS xác nhận nguyên nhân + QL duyệt; hộp Chờ duyệt; lịch MT tự tạo + HS cũ; xếp lịch MT mới; hồ sơ Mock; nhập HV mới; ô ngày/người/"Khác" thống nhất; sáng/tối; luật lớp thường | Đợt 2–5 |
| **P2** — chau chuốt | Tổng quan theo vai, trạng thái một nhãn, điện thoại (UX-D), số khớp (UX-F), chữ (S3) | Đợt 6 |
| **Thăm dò** | Ctrl+K, dòng thời gian hợp nhất, không gian lớp, báo cáo tự sinh | Chưa xếp |

---

## Phụ lục — [Claude phát hiện thêm] khi đọc mã

Những điểm này **không có trong feedback**, tìm thấy khi đối chiếu yêu cầu với mã thật:

1. **Tạo lớp là hai lệnh tách rời** (tạo lớp, rồi mới phân công). Phân công hỏng thì lớp vẫn được tạo mà không có ai
   dạy. Người vừa là QL vừa dạy lớp mở trang ở phạm vi "Lớp tôi dạy" nên không thấy lớp mới → cảm giác "lớp biến mất".
2. **Panel tạo lớp cho chọn nhiều người mỗi ô** và còn ghi "một môn có hai người dạy cũng vậy", trong khi máy chủ
   chặn điều đó → chính là nguồn gốc lỗi mục 1.
3. **Form nhập bù Case tự đóng dòng PA** ngay khi có 1 chữ vì máy coi "ô có chữ" là "đã gõ xong" (ảnh 4).
4. **Bộ lọc tab Ý thức của lớp**: số đếm chỉ tính vi phạm chưa xử lý của đúng nhóm, nhưng danh sách bên dưới lại hiện
   cả vi phạm đang nằm trong phương án, của mọi nhóm → "0 vi phạm" mà vẫn có 4 dòng (ảnh 3).
5. **Có thể tạo MT3 khi chưa có MT1, MT2** — máy chủ không chặn số lượt nhảy cóc.
6. **Hai chữ "Ghi nhận" trùng nghĩa**: nút "+ Ghi nhận vi phạm" (= ghi lại) sẽ lẫn với hành động mới "Ghi nhận"
   (= đã xem, không cần xử lý). Đề xuất đổi nút thành **"+ Ghi vi phạm"**.
7. **Font Inter được khai báo nhưng không tải** → mỗi máy thấy một font khác.
8. **Chế độ sáng không thể chỉ đổi vài màu**: 866 chỗ trong giao diện gọi thẳng tên màu tối → phải chuyển toàn bộ bảng
   màu sang biến trước.
9. **Học viên chưa có email** trong dữ liệu (phải thêm cột).
10. **Học sinh cũ đã từng bị Report trước khi có web**: thang xử lý mới sẽ bắt đầu lại từ Report 1 nếu không có ô
    "số lần đã xử lý trước đây" → sai quy chế với em đã có Report 2 ngoài đời.
11. **Ô chọn người phụ trách bắt gõ đủ 3 ký tự** dù chi nhánh chỉ có 4–5 GV.
12. **17 ô ngày còn dùng lịch của trình duyệt** (hiện `mm/dd/yyyy` trên máy cài tiếng Anh) và 19 chỗ dùng danh sách
    thả xuống không gõ được.
