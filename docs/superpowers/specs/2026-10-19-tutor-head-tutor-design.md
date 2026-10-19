# Tutor — vai Head tutor, danh sách tutor, đánh giá buổi tutor (19/10/2026)

Mockup: `thiet-ke/mockup-tutor-1-head-tutor-2026-10-19.html` (#468 + sửa #470). Trạng thái: **chờ chủ SP duyệt đặc tả + mockup**. Đã qua đọc thử (builder check) 19/10 — 4 điểm planning tự quyết ghi ở mục 12.
Nguồn: hỏi đáp chủ SP 19/10 (4 vòng + góp ý mockup) trong chat PTA Plan. Hiện trạng mã: rà 19/10 trên `main` (mục 2).

## 0. Vì sao, và cái gì KHÔNG đổi

- PISA là app **theo dõi tiến bộ học viên**. Ghi kết quả PA Tutor vẫn xoay quanh **kết quả của em** (Tiến triển, Số buổi, Nhận xét buổi).
  Đánh giá tutor là phần **phụ**: 3 ô Có · Không bắt buộc (một chạm mỗi ô, có "Cả 3 Có"), còn lại tuỳ chọn và gập.
- Trung tâm có tutor part-time dạy PA Tutor ở nhiều chi nhánh, offline hoặc online. Hiện tên tutor là chữ gõ tự do ở mỗi buổi (OV-12h) — không ai tổng hợp được
  tutor nào làm tốt / kém. Cần một người (**Head tutor**) rà soát tutor dựa trên dữ liệu GV đã ghi sẵn khi ghi kết quả.
- **Không** thêm việc, hạn, thông báo cho ai. **Không** đổi luật PA, Case, quyền ghi kết quả. Tutor **không** đăng nhập web.

## 1. Quyết định của chủ SP (19/10)

| # | Chốt |
|---|---|
| Q1 | Head tutor xem **toàn hệ thống** (grant không chi nhánh, như CX). |
| Q2 | Head tutor: **quản lý danh sách tutor** + **ghi nhận xét / kết luận về tutor**. Không ghi kết quả PA, không mở hồ sơ HV / Case / điểm. |
| Q3 | 3 tiêu chí mỗi buổi: **Có chuẩn bị bài** · **Xin tài liệu đúng hạn** · **Gửi feedback về HV cho GV** (tutor gửi lại GV phụ trách nhận xét về em). Mỗi ô **Có / Không, bắt buộc chọn**. |
| Q4 | **Đánh giá 1–5** (hiển thị sao) + **Nhận xét về tutor**: **tuỳ chọn**, nằm trong khối "Đánh giá tutor" **mặc định gập**. |
| Q5 | Chọn tutor từ danh sách; chưa có thì **"Tutor khác"** gõ tên (không chặn GV). Buổi sau tự điền tutor buổi trước. Người dạy PA chọn được tutor. |
| Q6 | **Offline / Online** tự suy, người ghi bấm đổi được. |
| Q7 | Không tạo việc: tutor có buổi chưa đạt lên nhóm **"Cần chú ý"** của trang Tutor. **Đánh giá ≤ 2/5 cũng tính** (khi có đánh giá). |
| Q8 | Danh sách tutor từ **Excel** (tải tệp + dán), cột **Tên · SĐT · Nơi dạy chính · Kỹ năng**; **SĐT** chống trùng. |
| Q9 | Trang **"Tutor"** trên thanh trên. Head tutor + Quản trị: toàn hệ thống, sửa được. **QL: chỉ xem**, thấy tutor **có ca dạy em chi nhánh mình trong khoảng thời gian đang chọn** (kể cả tutor nơi dạy chính ở chi nhánh khác). GV: không có trang. |
| Q10 | Ai ghi nhận xét về tutor: **Head tutor + Quản trị**. Ai sửa danh sách: **Head tutor + Quản trị** (QL không). |
| Q11 | Kết luận nhận xét: **Ổn · Cần cải thiện · Ngừng hợp tác**; ghi bất kỳ lúc nào; kết luận mới nhất hiện cạnh tên. |
| Q12 | Head tutor thấy **người ghi** buổi — gọn, ở dòng phụ ("CP FT 116 · ghi: Hoàng Dũng"). |
| Q13 | Bảng / ô số **không** có chữ đếm phụ dưới số ("2 Không", "5 lượt", "Online 2"). |
| — | Chưa làm (chủ SP không chọn): số buổi theo tháng để tính lương; trạng thái tutor riêng (dùng kết luận "Ngừng hợp tác"). |

## 2. Hiện trạng mã (main 19/10)

- PA loại `tutor`: `shared/domain/cases.ts` (SUPPORT_KINDS, SELF_SERVE_KINDS, nhãn "Học Tutor"), quy chế SOS sinh PA Tutor (`sos.ts`).
- Buổi tutor: bảng `case_followup_buoi(id, followup_id → case_followups CASCADE, buoi_so, tutor_ten TEXT NOT NULL, nhan_xet TEXT NOT NULL, UNIQUE(followup_id, buoi_so))`
  (migrate `prOv12h`). Luật chung web + máy chủ: `shared/domain/paDongBo.ts` `BuoiTutor`, `canBuoiTutor`, `kiemBuoiTutor`.
- Ghi: `POST /interventions/:id/result` → `cases.ts updateResult` → `buoiTutorCua` + `ghiBuoiTutor` (**xoá rồi ghi lại** mọi dòng của lần ghi). Sửa:
  `/followups/:id/sua` (`moSuaKetQua`, `suaKetQua`); Hoàn tác có sẵn. Nháp: `GhiNhanh.tsx` giữ `buoi`.
- Form: `web/src/modules/cases/CapNhatTuan.tsx` (`GhiKetQuaPanel`): mỗi buổi ô "Tutor" gõ tự do + "Nhận xét buổi"; với Tutor, `note` = ghép nhận xét các buổi.
- Hiển thị buổi: chỉ lịch sử Case (`caseDetail.followups[].buoi` → `CasePanel.tsx`, dùng chung cho hồ sơ Case và Ngăn Case của panel một em).
- Người dạy PA: `performer_user_id` / `performer_name` (ChonNguoi `giao_vien`, có "Người ngoài"). Từ HOTFIX-4 (#465): Xác nhận PA không bắt Người dạy.
- Vai: `shared/domain/people.ts` ROLES; quyền theo vai `server/src/seed/data.ts` ROLE_PERMISSIONS; bảng `roles / role_permissions / user_roles(branch_id NULL = toàn hệ thống)`.
  `migratePermissions` KHÔNG chèn vai mới → vai mới cần bước migrate riêng (khuôn `migrate/prOv2.ts`). Thêm vai chạm ~10 chỗ (danh sách ở mục 9).
- Excel: chỉ có **dán TSV** (nhập HV `IntakePanel.tsx` + `classes/intake.ts`); thư viện `xlsx` có sẵn, đang chỉ dùng để xuất (nạp động).
- Chi nhánh: bảng `branches(id, code, name)`; trên màn luôn gọi "chi nhánh".

## 3. Dữ liệu

### 3.1 Bảng mới

`tutors` — danh sách tutor (không phải tài khoản):
- `id`, `ten TEXT NOT NULL`, `sdt TEXT NOT NULL UNIQUE` (chỉ chữ số, đã chuẩn hoá: bỏ dấu cách / chấm / gạch; `+84` → `0`; 9–11 số),
  `noi_day_branch_id INTEGER NULL REFERENCES branches(id)` (NULL = **Chỉ online**), `ky_nang TEXT NOT NULL` (tập con `L,R,W,S`, ≥ 1, thứ tự cố định),
  `created_at`, `created_by`, `updated_at`, `updated_by`.
- Xoá tutor: chỉ khi **chưa có buổi nào** trỏ tới (máy chủ kiểm). Có buổi → dùng kết luận "Ngừng hợp tác".

`tutor_nhan_xet` — nhận xét của Head tutor / Quản trị:
- `id`, `tutor_id NOT NULL REFERENCES tutors(id)`, `ket_luan TEXT NOT NULL CHECK (ket_luan IN ('on','can_cai_thien','ngung'))`, `noi_dung TEXT NOT NULL` (10–1000 ký tự),
  `nguoi_id NOT NULL REFERENCES users(id)`, `luc TEXT NOT NULL`, `sua_luc TEXT NULL`.
- Sửa / xoá: chỉ người ghi, trong 24 giờ kể từ `luc`. Xoá là xoá hẳn (nhật ký `audit_logs` giữ nội dung).
- Chỉ mục `(tutor_id, luc)`.

### 3.2 Thêm cột `case_followup_buoi` (chỉ thêm, dòng cũ NULL)

`tutor_id INTEGER NULL REFERENCES tutors(id)`, `hinh_thuc TEXT NULL CHECK IN ('offline','online')`,
`chuan_bi INTEGER NULL`, `tai_lieu INTEGER NULL`, `feedback_gv INTEGER NULL` (0 / 1), `danh_gia INTEGER NULL CHECK (danh_gia BETWEEN 1 AND 5)`, `nhan_xet_tutor TEXT NULL` (≤ 1000),
`lop_id INTEGER NULL REFERENCES classes(id)` (**chụp lớp em đang học lúc ghi** — `LOP_CUA_CASE`; quyết định phạm vi QL, mục 7), `ghi_luc TEXT NULL` (lúc ghi 3 ô / đánh giá của buổi — mốc "Cần chú ý").
- Sửa kết quả (`ghiBuoiTutor` xoá-rồi-ghi): dòng cùng `buoi_so` mà 3 ô + đánh giá **không đổi** thì giữ `ghi_luc` + `lop_id` cũ; đổi thì `ghi_luc` = lúc sửa (giữ `lop_id`).
- `tutor_ten` giữ (NOT NULL): chọn từ danh sách → lưu cả `tutor_id` lẫn tên lúc ghi (bản chụp, đổi tên tutor sau không đổi lịch sử); "Tutor khác" → chỉ `tutor_ten`.
- Dòng cũ (trước tính năng) có 3 ô NULL → **không** vào mẫu số tỉ lệ, không tính "Cần chú ý"; vẫn hiện ở lịch sử như nay.
- Chỉ mục `(tutor_id)` cho trang Tutor; mẫu số theo khoảng ngày đọc qua `case_followups(created_at)` (đã có chỉ mục theo case — người làm kiểm EXPLAIN, thêm chỉ mục nếu quét bảng).
- `ghiBuoiTutor` xoá-rồi-ghi vẫn đúng vì mọi cột đánh giá nằm trên chính dòng buổi (không có bảng con).

### 3.3 Migrate

Một file `server/src/migrate/prTu.ts` (hoặc tên theo PR): tạo 2 bảng + thêm 9 cột + chỉ mục + vai `head_tutor` + quyền (mục 4). **Chỉ thêm**, chạy lặp được,
khớp từng chữ với `schema.sql`. Không đổi dữ liệu cũ. Bao đóng xoá HV / tài khoản / lớp: thêm `tutor_nhan_xet` vào chỗ xoá tài khoản (`nguoi_id`);
phép kiểm đếm bảng / cạnh (`xoaDuLieu.tests.ts`) cập nhật.

## 4. Vai và quyền

- Vai mới `head_tutor`, nhãn **"Head tutor"** (EN "Head tutor"). Cấp toàn hệ thống (`branch_id NULL`). Không có trong đăng ký tự chọn (`VAI_DANG_KY`) — Quản trị cấp.
- Quyền mới: `tutor.view` (xem trang Tutor), `tutor.manage` (sửa danh sách, gộp tên, ghi nhận xét).
  - `head_tutor`: `tutor.view`, `tutor.manage`. Không quyền nào khác (không `case.view`, `student.view`, `work.view`).
  - `system_admin`: thêm cả hai. `manager`: chỉ `tutor.view` (phạm vi theo grant chi nhánh). Vai khác: không.
- Máy chủ kiểm mọi đường `/tutors*`. QL hỏi tutor / buổi ngoài phạm vi → không trả (không lộ buổi chi nhánh khác: QL chỉ thấy các **buổi** của em chi nhánh mình,
  số liệu chỉ tính các buổi đó; nhận xét Head tutor về tutor đó vẫn đọc được — nhận xét nói về tutor, không về em).
- Ô chọn tutor trong form (GV, QL…): đường riêng chỉ đọc `GET /tutors/chon?q=&kyNang=&classId=` cho người **ghi được kết quả PA** (cùng quyền đang có);
  trả `id, ten, noiDay, kyNang, sdtDuoi` (**3 số cuối SĐT**, không trả đủ SĐT cho GV), bỏ tutor có kết luận mới nhất "Ngừng hợp tác". ≤ 20 dòng.
- Head tutor đăng nhập: thanh trên chỉ **"Tutor"** (+ chuông, menu tài khoản có Hướng dẫn); `/` → `/tutor`.

## 5. Ghi kết quả PA Tutor (mockup mục 1)

Thứ tự trong panel (giữ mọi phần hiện có): Tiến triển → Số buổi kỳ này + Người dạy → "Đã dạy a/b" → **mỗi buổi**:
1. **Tutor \*** — ô chọn (gõ để tìm). Gợi ý: nhóm đầu = tutor có nơi dạy chính = chi nhánh lớp của em **và** có kỹ năng của PA (kỹ năng PA lấy từ Case; Case nhiều kỹ năng → đủ một kỹ năng là được);
   nhóm "Khác" = còn lại. Cuối danh sách: **Tutor khác: "…"** (gõ tên tự do, 2–100 ký tự).
   Điền sẵn: buổi 1 = theo ô "Người dạy" kỳ này (mục 6), không có thì tutor buổi cuối của lần ghi trước của PA này; buổi n > 1 = tutor buổi n − 1. Người ghi đổi được.
2. **Hình thức** Offline · Online — tự chọn khi chọn tutor: `noi_day_branch_id` = chi nhánh lớp của em → Offline; khác hoặc "Chỉ online" / "Tutor khác" → Online. Bấm đổi được; lưu giá trị đang chọn.
3. **Nhận xét buổi \*** — như hiện nay (feedback tutor gửi và / hoặc GV ghi; vẫn ghép thành `note` của lần ghi).
4. Khối **"Tutor buổi này \*"**: 3 dòng, mỗi dòng nút đôi **Có · Không** (✓ / ✗ + chữ, không chỉ màu), nút **"Cả 3 Có"**. Chưa chọn đủ → không lưu được;
   lỗi ngay dưới dòng thiếu "Chọn Có hoặc Không"; chân panel "n ô còn thiếu"; bấm Lưu nhảy tới ô thiếu đầu tiên (như luật lỗi form hiện có).
5. Khối gập **"Đánh giá tutor · tuỳ chọn"** (mặc định gập; mở / gập không mất chữ): **Đánh giá** 1–5 (bấm sao; bấm lại sao đang chọn = bỏ) + **Nhận xét về tutor** (≤ 1000).
   Lần Sửa kết quả mở panel có sẵn đánh giá → khối tự mở.

Luật chung (web + máy chủ cùng gọi): mở rộng `BuoiTutor` thành `{ tutorId?, tutor, nhanXet, hinhThuc, chuanBi, taiLieu, feedbackGv, danhGia?, nhanXetTutor? }`
và `kiemBuoiTutor`: thêm kiểm 3 ô là boolean, `hinhThuc` hợp lệ, `danhGia` ∈ 1–5 hoặc trống, `tutorId` (nếu có) tồn tại. **Không** áp cho lần ghi cũ (`cu`) — Sửa lần ghi
cũ không có 3 ô thì không bắt điền. Seed / phép kiểm gọi `updateResult` có `buoi` phải cập nhật (pb2bSeed, duyetSeed).
Nháp (`GhiNhanh`) giữ đủ trường mới. Hoàn tác như hiện nay.

375: các khối xếp dọc; Có · Không chia đôi bề ngang, cao 44 px; sao 44 px (mockup mục 7).

## 6. Người dạy của PA (Xác nhận PA / Thêm PA / Sửa PA)

Chỉ **PA loại Tutor**: ô "Người dạy" của PA (Xác nhận / Thêm / Sửa PA) và ô "Người dạy" kỳ này trong Ghi kết quả (ChonNguoi) thêm **nhóm "Tutor"** đầu danh sách
(tutor nơi dạy = chi nhánh lớp, rồi tutor khác; bỏ tutor Ngừng hợp tác). Chọn tutor → lưu **như "Người ngoài"**: `performer_name` / `phu_trach_ten` = tên tutor —
**không thêm cột** (Điều chỉnh, Thay PA, bàn giao, Hoàn tác giữ nguyên cách đang làm). Vẫn tuỳ chọn (HOTFIX-4).
Điền sẵn buổi 1: tên ở ô "Người dạy" kỳ này (mặc định = Người dạy của PA) khớp **đúng một** tutor trong danh sách (bỏ dấu, không phân biệt hoa thường) → chọn tutor đó; không khớp / khớp nhiều → để trống.

## 7. Trang Tutor (mockup mục 2, 3, 6, 7)

Đường `/tutor`. Khung thời gian: **bộ chọn thời gian chung của Phân tích** (OV-15e: 2 tuần vừa qua · Theo tuần · Theo tháng · Tùy chọn; URL `tu`–`den`).
Ngày của một buổi = **ngày ghi lần kết quả** chứa buổi đó (`case_followups.created_at`, theo giờ VN) — các buổi cùng một lần ghi cùng ngày.

**Bảng** (phân trang 10 / 20 / 50 dùng `usePhanTrang` của OV-15e): Tutor (tên + SĐT dòng phụ) · Nơi dạy · Kỹ năng · Buổi · Chuẩn bị · Tài liệu đúng hạn · Feedback GV · Đánh giá · Kết luận (+ ngày) · Cần chú ý vì.
- Buổi = số dòng buổi có `tutor_id` = tutor, trong khoảng (QL: chỉ buổi có `lop_id` thuộc chi nhánh QL — lớp **chụp lúc ghi**, mục 3.2; dòng cũ không có `lop_id` không có 3 ô nên không vào số).
- 3 cột tỉ lệ = số buổi "Có" / số buổi **có trả lời** ô đó (dòng cũ NULL không vào mẫu). Có buổi "Không" → số màu cam (lý do bằng chữ ở cột cuối, không chỉ màu).
- Đánh giá = trung bình các buổi có đánh giá, 1 chữ số lẻ; không có → "—".
- Bộ lọc: **Cần chú ý** · **Đang dạy** (có ≥ 1 buổi trong khoảng, chưa Ngừng) · **Ngừng hợp tác** · **Tất cả** (có số); Nơi dạy; Kỹ năng; ô tìm tên / SĐT (bỏ dấu).
  Mặc định "Cần chú ý" nếu > 0, không thì "Đang dạy". QL: không có lọc Nơi dạy (cố định chi nhánh), không có "Ngừng hợp tác" (vẫn thấy trong "Tất cả").
- **Cần chú ý** (một hàm, dùng cho bộ lọc, số trên menu "Tutor n" của Head tutor, cột lý do): tutor có ít nhất một buổi (**mọi thời gian**, không theo khoảng)
  có một ô "Không" hoặc Đánh giá ≤ 2, có `ghi_luc` **sau** `luc` của nhận xét Head tutor / Quản trị gần nhất về tutor đó (hoặc chưa có nhận xét nào; sửa nhận xét không dời mốc).
  Ghi nhận xét → tutor rời nhóm. GV sửa buổi thành "Không" sau đó → `ghi_luc` mới → vào lại.
  Cột "Cần chú ý vì": câu gom ngắn theo loại nhiều nhất ("3 buổi không gửi feedback cho GV", "1 buổi không chuẩn bị", "1 buổi đánh giá 2/5").
  Tutor "Ngừng hợp tác" không vào Cần chú ý.
- Dải **"n tên gõ tay chưa có trong danh sách · m buổi · Gộp…"** (Head tutor / Quản trị): tên `tutor_ten` của dòng `tutor_id IS NULL` (bỏ dấu, gom chữ hoa thường + khoảng trắng).
- Nút (Head tutor / Quản trị): **Thêm tutor** (hộp nhỏ), **Tải danh sách** (panel). QL: không có.

**Panel một tutor** (bấm tên / hàng; số ở 3 cột → panel lọc sẵn buổi "Không" của cột đó): đầu (tên, SĐT, nơi dạy, kỹ năng, **Sửa**) → 5 ô số
(Buổi · Chuẩn bị · Tài liệu đúng hạn · Feedback GV · Đánh giá; bấm = lọc bảng buổi) → khối **Nhận xét** (Head tutor / Quản trị: Kết luận \* + Nhận xét \* ≥ 10 ký tự + Lưu;
QL chỉ đọc) + dòng thời gian (ngày · kết luận · nội dung · người) → bảng **Buổi dạy** (Ngày · Học viên + "lớp · ghi: người ghi" dòng phụ · KN · Hình thức · 3 dấu ✓/✗ · Đánh giá · Nhận xét buổi + Nhận xét về tutor nếu có),
nút bật **"Chỉ buổi chưa đạt"**. Không link sang hồ sơ HV / Case (Q2).

## 8. Danh sách tutor: tải lên, thêm, sửa, gộp (mockup mục 4, 5)

- **Tải danh sách** (panel): "Chọn tệp" (.xlsx / .xls / .csv, đọc sheet đầu bằng `xlsx` có sẵn, nạp động ở web) hoặc "Dán từ Excel" (TSV); **Tải mẫu** (.xlsx 4 cột).
  Có / không hàng tiêu đề (nhận diện bằng bí danh tiêu đề như nhập HV). Nơi dạy: tên hoặc mã chi nhánh (bỏ dấu), trống = Chỉ online. Kỹ năng: L, R, W, S cách bằng dấu phẩy / dấu cách / "·".
  Xem trước (máy chủ, cùng hàm kiểm với lúc lưu): **Mới** · **Cập nhật** (SĐT đã có; ghi trước → sau từng trường đổi) · **Lỗi** (lý do từng dòng; trùng SĐT trong tệp → lỗi cả hai).
  Sửa ô lỗi ngay trong bảng xem trước hoặc dán lại. **Lưu n dòng** = mọi dòng hợp lệ, **một giao dịch**, một mục nhật ký. Tutor không có trong tệp: giữ nguyên.
  Giới hạn 500 dòng / lần.
- **Thêm / Sửa** (hộp nhỏ): Tên \* · SĐT \* · Nơi dạy chính · Kỹ năng \* (bật tắt L R W S). SĐT trùng → lỗi tại ô "SĐT đã có: {tên}". **Xoá tutor** chỉ khi chưa có buổi.
- **Gộp tên gõ tay** (hộp nhỏ): mỗi tên một dòng (số buổi, lớp, ngày) → chọn tutor có sẵn hoặc "Thêm vào danh sách" (mở hộp Thêm điền sẵn tên). Lưu = đặt `tutor_id`
  cho các dòng đó (giữ `tutor_ten`), một giao dịch; thông báo có **Hoàn tác** (đặt lại NULL đúng các dòng đó).

## 9. Chỗ khác đổi theo

- Lịch sử Case / Ngăn Case: mỗi buổi thêm hình thức + 3 dấu (✓ / ✗ + chữ) + đánh giá (nếu có) + nhận xét về tutor (nếu có) (mockup mục 8).
- Quản trị › Tài khoản: thêm vai "Head tutor" (toàn hệ thống, như CX: `VAI_TOAN_HE_THONG`).
- Thêm vai chạm: `people.ts` (ROLES, ROLE_LABEL), `seed/data.ts`, migrate vai + quyền, `platform/nav.ts` + `dieuHuong.ts` (khu "Tutor" theo `tutor.view`),
  Hướng dẫn `shared/huongDan/headTutor.ts` + `kieu.ts` / `index.ts` (mặc định vai), "Vào nhanh" (tài khoản demo Head tutor), `AccountsAdmin`, Tổng quan mặc định vai, EN.
- Hướng dẫn: vai Head tutor (5 việc: xem Cần chú ý · ghi nhận xét · tải danh sách · gộp tên · thêm / sửa tutor); mục "Ghi kết quả PA" của GV thêm 3 ô + khối Đánh giá; QL: trang Tutor chỉ xem.
- Seed demo: ~8 tutor ở 4 chi nhánh + 1 chỉ online + 1 Ngừng hợp tác; tài khoản Head tutor; vài lần ghi PA Tutor có đủ 3 ô, vài buổi "Không", vài đánh giá, 2–3 tên gõ tay để gộp.
- **Không đổi**: Công việc, Tổng quan, thông báo, Phân tích (không thêm việc, không thêm số).

## 10. Chia PR (đề xuất)

| PR | Gồm | Phụ thuộc |
|---|---|---|
| **TU-a** nền + nhập liệu | migrate (2 bảng, 7 cột buổi, `performer_tutor_id`, vai + quyền), `GET /tutors/chon`, form Ghi kết quả (mục 5), Người dạy nhóm Tutor (mục 6), lịch sử Case (mục 9), Quản trị thêm vai, seed tutor + Head tutor | — |
| **TU-b** trang Tutor | `/tutor` + API danh sách / panel / nhận xét / tải lên / thêm sửa xoá / gộp (mục 7, 8), QL chỉ xem, Hướng dẫn Head tutor + QL, 375 | TU-a merge |

TU-a và TU-b không chạy song song (TU-b đọc bảng + cột của TU-a). Model Opus 5.5 · High (TU-a có migrate + luật dùng chung web / máy chủ).

## 11. Kiểm chứng (đầu ra)

- Ghi kết quả PA Tutor 2 buổi: chọn tutor (buổi 2 tự điền) → 3 ô bắt buộc (thiếu → 400 máy chủ + lỗi tại ô web) → đánh giá trống vẫn lưu → Sửa / Hoàn tác giữ đủ trường.
- Lần ghi cũ không có 3 ô: Sửa được, không bị bắt điền.
- QL MB: thấy tutor Bãi Cháy dạy online em MB, số buổi chỉ đếm buổi em MB; không thấy buổi em chi nhánh khác (gọi API thẳng → không có).
- GV gọi `/tutors` (danh sách đầy đủ) → 403; `/tutors/chon` chỉ trả 3 số cuối SĐT.
- Cần chú ý: buổi "Không" → vào nhóm; Head tutor ghi nhận xét → ra; buổi "Không" mới sau đó → vào lại; đánh giá 2 → vào; đánh giá trống → không.
- Tải danh sách: tệp có trùng SĐT / chi nhánh lạ / SĐT sai → đúng dòng lỗi; lưu lại cùng tệp lần 2 → 0 mới, 0 cập nhật.
- Gộp tên → buổi trỏ đúng tutor, số trên bảng đổi; Hoàn tác → về như cũ.
- Dòng đọc Turso: trang Tutor và panel ghi số câu + dòng đọc; đường mới có trần `tocDoDuong.ts`.

## 12. Planning tự quyết sau đọc thử (19/10) — chủ SP sửa nếu khác

1. Phạm vi QL theo **lớp chụp lúc ghi** (`lop_id` trên dòng buổi), không theo lớp em đang học hôm nay — em chuyển chi nhánh, buổi cũ vẫn thuộc chi nhánh cũ.
2. Chọn tutor ở ô Người dạy (PA Tutor) lưu **tên** như "Người ngoài", không thêm cột id — không đụng Điều chỉnh / Thay PA / bàn giao / Hoàn tác; buổi 1 điền sẵn khi tên khớp đúng một tutor.
3. "Cần chú ý" so `ghi_luc` của buổi với `luc` nhận xét gần nhất; sửa kết quả mà đổi 3 ô / đánh giá thì `ghi_luc` mới.
4. Nhóm "Tutor" ở ô Người dạy chỉ cho PA loại Tutor.
5. Ô chọn tutor của GV chỉ hiện 3 số cuối SĐT (đủ để phân biệt, không lộ số).
