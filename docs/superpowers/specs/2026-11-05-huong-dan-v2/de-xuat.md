# HD-V2 — Làm lại Hướng dẫn: nút "?" và hướng dẫn theo việc của từng vai

Ngày 05/11/2026. Người viết: PTA Plan. Trạng thái: **chờ chủ SP duyệt mockup** (`thiet-ke/v14/huong-dan.html`, chưa vẽ).

## 1. Vì sao làm

Chủ SP 05/11 (nguyên văn):
- "Tôi cần overhaul và làm lại hệ thống hướng dẫn, cần có dấu '?' ở trên thanh trên cùng của website và hướng dẫn thật kĩ từng vai trò để họ biết họ đang ở đâu, họ cần làm gì. Hướng dẫn cần đi đúng workflow của từng vai trò, hướng dẫn cụ thể, mỗi khi bấm '?' ở mỗi màn hình tương ứng thì hướng dẫn cần phải rõ ràng, phân loại cụ thể và chỉ đúng hướng."
- "Chủ yếu họ đang bị loạn vì có nhiều chỗ để nhập điểm, có nhiều chỗ để xem case/ cập nhật case/ phương án/ kết quả, và không biết navigate như thế nào. Cố gắng để hướng dẫn rõ ràng theo đúng workflow và những công việc mà họ thường làm."
- Duyệt nguyên tắc "mỗi việc một lối chính, lối khác là lối tắt" ("Đúng, làm tiếp") và ý tưởng panel 3 tab ("ok").

**Gốc của việc bị lạc (PTA rà mã 05/11):**
- Nhập điểm MT / Progress / Final có khoảng **12 lối vào**: Công việc, Lịch Test tuần, Chấm Test, Hồ sơ lớp, Học viên & Lớp ⋯, ⋯ dòng em, hồ sơ lượt MT / lượt Test, Lộ trình, Tổng quan "Bài chấm quá hạn"… Tất cả mở **cùng một ô điểm** (`LuoiChamLop` / `HopNhapDiem`) và lưu cùng một chỗ (`saveScore`, `saveRegularScore`).
- Case · PA · Kết quả PA có khoảng **18 lối vào**, tất cả mở **cùng một panel Case** (`NganCase`). Hoàn thành, Mở lại, Xoá Case chỉ có trong panel đó.
- Người dùng tưởng mỗi lối là một chỗ khác nhau. Hướng dẫn hiện có (`shared/huongDan/`) lại viết theo từng màn, không nói "chỗ này giống chỗ kia". Một số mục đã cũ (vd GV nhập điểm còn chỉ vào Test › Chấm Test, PR sau đã đổi).

**Đầu ra mong muốn:** người dùng mở "?" ở bất kỳ màn nào cũng biết: mình đang ở đâu, ở đây làm được việc gì, việc mình định làm nằm ở đâu (một lối chính). Thà ít chữ mà đúng hướng còn hơn đủ chữ mà vẫn lạc.

## 2. Mục tiêu · Không làm · Làm vậy là hỏng

**Mục tiêu**
1. Nút **"?"** cố định trên thanh trên cùng, mọi trang, mọi vai, cả 375.
2. Bấm "?" mở hướng dẫn **của màn đang đứng, đúng vai** của người xem.
3. Mỗi việc của mỗi vai có **một lối chính**. Các lối khác ghi một dòng "lối tắt — mở cùng chỗ".
4. Có cách tìm theo việc ("Tôi muốn nhập điểm") và xem việc theo nhịp tuần của vai.
5. Nội dung đúng với web hiện tại (main mới nhất), có phép kiểm để lệch thì đỏ.

**Không làm**
- Không đổi bố cục các màn khác, không bớt lối vào (giữ mọi thao tác cũ — luật "nâng cấp, không bỏ tính năng").
- Không làm tour tự chạy nhiều bước, không video.
- Không tự mở hướng dẫn khi đăng nhập (không thêm bước — luật cứng 08/10).
- Không thêm câu đọc Turso (nội dung là dữ liệu tĩnh trong mã).

**Làm vậy là hỏng (dù chạy được)**
- Panel dài, nhiều chữ, giống sổ tay — chủ SP đã chê "quá ngợp, nhiều chữ" (05/11) và luật "những gì thừa thì đừng thêm text".
- Chỉ sai chỗ (lối chính không có thật, nhãn khác chữ trên web).
- Mở "?" làm mất panel đang làm hoặc mất chữ đang gõ.
- GV thấy việc của QL như việc của mình.

## 3. Thiết kế (đã chốt với chủ SP)

### 3.1 Nút "?"
- Thanh trên cùng, bên trái chuông thông báo. Tròn, chữ "?", nhãn đọc màn hình "Hướng dẫn". 375: cùng chỗ, vùng bấm 44 px.
- **Thay quyết định OV-15a C11** (hướng dẫn vào menu Tài khoản). Mục "Hướng dẫn" trong menu Tài khoản bỏ (một chức năng một chỗ), trang `/huong-dan` vẫn mở được từ cuối panel.
- Tài khoản chưa mở hướng dẫn lần nào (`daXemHuongDan = false`, đã có): chấm nhỏ trên "?" tới lần mở đầu. Không bật hộp, không tự mở.

### 3.2 Panel Hướng dẫn
Mở bên phải như mọi panel (thành phần `KhungPanel`). Đầu panel: "Hướng dẫn" + tên vai (QL / QT có "Xem vai khác" như hiện nay). Dưới đầu: ô tìm, rồi **3 tab**:

| Tab | Nội dung | Mở sẵn khi |
|---|---|---|
| **Màn này** | hướng dẫn của màn đang đứng | luôn mở sẵn |
| **Tôi muốn…** | danh sách việc của vai, mỗi việc chỉ một lối chính | — |
| **Tuần của tôi** | việc theo nhịp (mỗi sáng · sau tuần Test · 2 tuần · khi có · cuối khoá) | — |

Gõ vào ô tìm: lọc cả 3 tab, hiện kết quả một danh sách (giữ cách tìm bỏ dấu hiện có `locHd`). Cuối panel: "Mở trang Hướng dẫn ›".

### 3.3 Tab "Màn này" — ba khối
1. **Bạn đang ở** — tên màn (đúng chữ trên web) + **một câu** màn này dùng để làm gì với vai này + dải nhỏ **Trước → Màn này → Sau** (màn trước / sau trong luồng việc của vai; bấm được, đổi trang).
2. **Việc làm ở đây** — mỗi việc một dòng gập/mở: tên việc · 2–4 bước (mỗi bước một câu, nhãn **đậm** đúng chữ nút) · nút **Chỉ cho tôi** (đã có: khoanh phần tử `data-hd`). Nếu màn này chỉ là **lối tắt** cho việc đó: thêm một dòng nhạt "Lối chính: Công việc › Nhập điểm. Ở đây mở cùng ô điểm." Việc đầu mở sẵn.
3. **Không làm ở đây** — 2–4 việc người dùng hay tìm nhầm ở màn này. Mỗi dòng: tên việc → link đúng chỗ ("Công việc › Case ›"), hoặc chữ nhạt "việc của QL" nếu vai này không làm.

Màn chưa có mục riêng: một câu "Màn này chưa có hướng dẫn riêng" + mở sẵn tab Tôi muốn….

### 3.4 Tab "Tôi muốn…"
Việc của vai, chia nhóm cố định: **Điểm · Case và PA · Học viên và lớp · Lịch Test · Duyệt · Khác** (nhóm trống thì ẩn). Mỗi việc: tên · **Lối chính** (link "Đi tới ›" + Chỉ cho tôi) · 2–4 bước · một dòng "Lối tắt: Lịch Test tuần, Hồ sơ lớp, ⋯ dòng em — mở cùng chỗ".

### 3.5 Tab "Tuần của tôi"
Thay phần "Việc hằng tuần" hiện có. Việc theo nhịp, mỗi dòng: nhịp (chữ nhạt) · tên việc · bấm mở đúng mục ở tab Tôi muốn…. Không lặp bước.

### 3.6 Theo vai
- Bảy vai có nội dung riêng: **GV, QL, QT, TVV, CX, Admin, Head tutor** (đã có khung `VaiHd`).
- Trong vai GV: phần **chỉ GVCN** (MT cũ, Vắng, Mini Test, kết quả thi thật, đổi người phụ trách, Case không kỹ năng…) gắn nhãn và **chỉ hiện với GV đang chủ nhiệm ít nhất một lớp**; phần **GV Speaking** (chấm chéo) chỉ hiện với GV có kỹ năng S. Lấy từ dữ liệu phiên đã nạp, không thêm request (builder kiểm phiên có đủ thông tin; thiếu thì thêm vào `/me` cùng câu đang có).
- QL dạy lớp vẫn đọc hướng dẫn QL (giữ `vaiHdCua`), có "Xem vai khác" để xem GV.

### 3.7 Trang `/huong-dan`
Giữ. Cùng nội dung, ba phần như ba tab, đọc / in cả trang. Không có nội dung riêng.

### 3.8 Chữ
- Đúng nhãn trên web, một khái niệm một tên (CLAUDE.md). Mỗi bước ≤ 1 câu. Không giải thích luật dài — luật để ở ⓘ của màn.
- Tiếng Anh đủ (mọi chữ qua `t()`, như hiện nay).

## 4. Lối chính theo vai (bản nháp — builder đối chiếu mã main, sửa nếu lệch rồi ghi lại)

| Vai | Việc | Lối chính | Lối tắt (cùng chỗ) |
|---|---|---|---|
| GV | Nhập điểm MT · Progress · Final môn mình | Công việc › dòng "Nhập điểm {môn}" | Lịch Test tuần, Test › Chấm Test, Hồ sơ lớp › Nhập điểm, ⋯ dòng em, hồ sơ lượt |
| GV Speaking | Chấm Speaking chéo | Công việc › "Chấm Speaking · n bài" | Lịch Test tuần (cột S), Chấm Test |
| GV | Xác nhận Case · Mô tả Case · Xác nhận PA · Thêm PA · Ghi kết quả PA | Công việc › nhóm "Case học thuật" | Hồ sơ HV › Case và phương án, hồ sơ lớp, hồ sơ lượt MT, chuông |
| GV | Xem mọi Case của một em | Hồ sơ HV › tab Học thuật › Case và phương án | Học viên & Lớp › panel một em |
| GV | Tạo Case tay | Hồ sơ HV › "+ Case" | ⋯ dòng em, Hồ sơ lớp "+ Case" |
| GV | Hoàn thành · Mở lại · Xoá Case / PA | trong panel Case (nút chân, ⋯) | — |
| GVCN | Nhập điểm MT cũ | Công việc › "Nhập điểm MT cũ" | Lịch Test tuần › link "MT cũ chưa nhập" |
| GVCN | Ghi Mini Test | Công việc › "Ghi Mini Test" | Hồ sơ HV › Học thuật › ô Mini Test |
| GVCN | Đổi người phụ trách Case | panel Case › "Đổi người…" | Công việc › "Chọn người phụ trách" |
| GVCN | Kết quả thi thật | Hồ sơ HV › ⋯ › Kết quả thi thật | Hành trình › Tổng kết lộ trình |
| QL | Duyệt yêu cầu | Công việc › "Chờ bạn duyệt" | Tổng quan › Cần xử lý, hồ sơ HV |
| QL | Nhập hộ bài quá hạn | Tổng quan › "Bài chấm quá hạn" › Nhập hộ | Công việc › Của GV, Lịch Test tuần |
| QL | Xếp / dời MT, thi lại | Test › Kế hoạch Test | — |
| QL | Xem điểm tuần cả chi nhánh | Test › Lịch Test tuần | — |
| QL | Khôi phục thứ đã xoá | Hoàn tác (5 giây) · Quản trị › Đã xoá | — |
| TVV | Cập nhật kết quả thi thật · Chọn bước tiếp | Công việc › "Cập nhật kết quả thi thật" | Hồ sơ HV › Kết quả thi thật |
| TVV / CX | Xem Case (chỉ đọc), gọi PH | Hồ sơ HV › Case và phương án | Học viên & Lớp › panel một em |
| Admin | Chấm điểm / nhập hộ | Công việc › nhóm Chấm điểm | Lịch Test tuần |

QT = QL + Quản trị. Head tutor: Tổng quan, Hồ sơ cá nhân (như hiện nay).

## 5. Ràng buộc kỹ thuật
- Dựng trên `shared/huongDan/` + `web/src/modules/huongDan/` (sửa nền, không làm lại): đổi kiểu `HuongDan` để có `dangO` (một câu + trước / sau) và `khongLam` cho mỗi màn, `lam` (Tôi muốn…) có `loiChinh` + `loiTat`, `tuan` thay `viec`; `MucHd` thêm cờ `chiGvcn` / `chiS`.
- Phép kiểm (mở rộng `server/src/tests/prHd.tests.ts`): giữ HD-NAV, HD-CHI; thêm — mọi `loiChinh` / link "Không làm ở đây" / Trước–Sau trỏ đường có thật trong `App.tsx` và vai đó vào được; mỗi việc trong bảng mục 4 có đúng một lối chính; mọi chữ có bản EN.
- Turso: 0 câu thêm. Panel không gọi API (trừ ghi `daXemHuongDan` đã có).
- Giữ "Chỉ cho tôi" như hiện nay (đóng panel rồi khoanh).

## 6. Builder tự quyết (ghi lại trong PR)
- Câu chữ từng bước, thứ tự việc trong nhóm, biểu tượng nhỏ.
- Cách gói kiểu dữ liệu, tên trường.
- Chia PR: gợi ý (a) khung — nút "?", panel 3 tab, kiểu dữ liệu, phép kiểm + nội dung GV · (b) nội dung QL / QT / Admin · (c) TVV / CX / Head tutor + trang `/huong-dan`.

## 7. Mockup cần duyệt trước khi code
`thiet-ke/v14/huong-dan.html`, 1440 + 375, tối + sáng, chữ thật:
1. GV ở Lịch Test tuần, tab Màn này (việc đầu mở, có dòng "Lối chính").
2. QL ở Hồ sơ HV khi panel Case đang mở → bấm "?" (xem mục 8).
3. Tab Tôi muốn… đang gõ "nhập điểm".
4. TVV tab Tuần của tôi.
5. Màn chưa có mục riêng.
6. 375: nút "?" trên thanh, panel toàn màn.

## 8. PTA tự quyết (chủ SP xem khi duyệt mockup)
- **Đang mở panel làm việc (vd panel Case) mà bấm "?":** hướng dẫn mở **chồng lên trên** panel đang làm (như mọi `KhungPanel` hiện nay, không thêm kiểu xếp mới); panel làm việc vẫn gắn trên trang nên chữ đang gõ còn nguyên; Esc / ✕ chỉ đóng hướng dẫn, về đúng panel cũ. "Chỉ cho tôi" đóng hướng dẫn rồi khoanh trong panel làm việc. Tab Màn này lúc đó hiện mục **của panel đang mở** trước, rồi tới màn nền. Lý do: cách đơn giản nhất không mất chữ; đặt hai panel cạnh nhau phải sửa `KhungPanel` cho mọi panel và không vừa 768–1180 px.
- **Panel có mục riêng:** chỉ hai — **panel Case** (`NganCase`) và **panel / hộp Nhập điểm** (lưới `LuoiChamLop`, `HopNhapDiem`, `PanelNhapDiemLop`, panel Nhập điểm của Công việc). Cách biết panel nào đang mở: `KhungPanel` nhận thêm thuộc tính tuỳ chọn (vd `hd="case"`), panel trên cùng có thuộc tính đó thì hướng dẫn dùng (builder chọn cách gói: kho nhỏ / context).
- Lối chính của GV cho nhập điểm là **Công việc** (không phải Test › Chấm Test như hướng dẫn cũ): luật "việc của tôi ở trang đầu vai".
- Không phím tắt "?" (tránh bấm nhầm khi gõ điểm); thêm sau nếu chủ SP muốn.
- Bỏ mục "Hướng dẫn" trong menu Tài khoản (một chức năng một chỗ).

## 9. Trả lời soát của builder (PTA chốt 05/11)
1. **Xếp panel:** chồng lên trên (mục 8), không thêm kiểu xếp mới cho `KhungPanel`.
2. **Panel có mục riêng:** chỉ panel Case + Nhập điểm, qua thuộc tính tuỳ chọn của `KhungPanel` (mục 8).
3. **GVCN / S:** GVCN = đang có phân công `is_core = 1` còn hiệu lực ở ít nhất một lớp; "có S" = phân công kỹ năng S còn hiệu lực ở bất kỳ lớp nào, hoặc là GV Speaking của chi nhánh. Thêm hai cờ vào `/me` được nếu là **một câu** theo `user_id` có chỉ mục, ít dòng (ghi số đo vào `tocDoDuong.ts`). Xem vai khác (QL xem GV): hiện cả phần GVCN và S, có nhãn.
4. **Độ mịn màn:** theo đường dẫn, khớp tiền tố dài nhất (`manCuaDuong` hiện có). Tab là đường riêng (Test › Lịch / Kế hoạch / Chấm) thì mục riêng; tab theo tham số (Hồ sơ HV) thì một mục, chia khối theo tab trong "Việc làm ở đây".
5. **Dòng "Lối chính" ở màn lối tắt:** sinh từ dữ liệu, một nguồn — mỗi việc ở Tôi muốn… khai `loiChinh` + `loiTat` (danh sách id màn); màn nằm trong `loiTat` của việc nào thì "Việc làm ở đây" tự có việc đó + dòng "Lối chính: …". Không viết tay ở từng màn.
6. **`data-hd`:** được thêm thuộc tính `data-hd` vào thành phần khác (không đổi hình) cho Chỉ cho tôi.
7. **Vai → đường:** dùng `server/src/platform/nav.ts` (HD-NAV đang dùng) + quyền hiện có; thiếu thì builder tự thêm bảng nhỏ trong phép kiểm.
8. **Cổng mockup:** chủ SP duyệt mockup (khung + ví dụ nội dung GV, QL, TVV) trước mọi PR HD-V2. Sau đó PR (a) chạy được; nội dung vai khác ở PR sau theo cùng khung, không cần mockup lại.
