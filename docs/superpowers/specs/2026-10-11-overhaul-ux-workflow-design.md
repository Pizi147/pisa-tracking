# Đặc tả Overhaul UX/UI + workflow (OV) — 11/10/2026

Nguồn: prompt chủ sản phẩm 11/10 “PISA Prompt Overhaul UX/UI Workflow” (mục 1–7, góp ý D1–D11) + 5 đợt hỏi đáp + góp ý mockup
bản 1 (11/10). Căn cứ mã: `main` = `0ac4c41` (#312). Quyết định gốc ghi ở `plan.md` mục 3 (các dòng 11/10) — file này là bản đầy đủ.

Mockup (đã duyệt bản 2, 11/10 — chờ chủ SP xem lại lần cuối):
- M1 `thiet-ke/mockup-overhaul-1-cong-viec-diem-mt-2026-10-11.html` — Công việc tại chỗ · hộp nhập điểm · Lịch Test “phần của bạn” · huỷ / khôi phục MT · Quay lại
- M2 `thiet-ke/mockup-overhaul-2-ho-so-lop-lo-trinh-2026-10-11.html` — đầu hồ sơ lớp + ⋯ · Thông tin lớp · Tổng hợp · Lộ trình tiếp theo · KQ lớp trước ở FT · dòng “Đầu vào” · hồ sơ HV
- M3 `thiet-ke/mockup-overhaul-3-tong-quan-vai-chuong-trinh-2026-10-11.html` — Lịch sắp tới · đổi góc nhìn · TVV / CX / Admin · ma trận vai · Chương trình + PET/KET

Ký hiệu: **[chốt]** = chủ SP đã quyết · **[tự quyết]** = planning chọn, chủ SP gạch được khi duyệt đặc tả.

## 1. Đối chiếu hiện trạng (kiểm trên mã, không theo tài liệu cũ)

| Mục | Hiện trạng | Căn cứ |
|---|---|---|
| 1.1 TVV | **Chưa có** vai. TVV chỉ là chữ gõ tay trên hồ sơ HV | `shared/domain/people.ts:16` (`ROLES` = system_admin, manager, teacher) · `server/src/schema.sql:278` `consultant_name TEXT` |
| 1.2 Admin | **Đã bỏ** (vai `branch_admin` → “vai trò đã bỏ”) | `people.ts:5-28` |
| 1.3 CX | **Chưa có** | như trên |
| 2.1 Email, ngày sinh bắt buộc | **Chưa** bắt buộc; đã có danh sách “Thiếu thông tin” | badge `thieu-tt` (`DauTrangLop.tsx`), `/hoc-vien?view=thieu_tt` |
| 2.2 Tạm dừng / Thôi học | **Một phần**: panel chung `StudentManagePanel` đã gom Tạm dừng / Quay lại / Kết thúc học | `web/src/modules/students/StudentManagePanel.tsx:30` |
| 3.1 Menu ⋯ hồ sơ lớp | 10+ mục, thứ tự khác nhau lớp thường / FT; Sửa thông tin lớp có ghi chú | `DauTrangLop.tsx` mảng `menu`; `SuaThongTinLopPanel.tsx` |
| 3.1b Điểm cả lớp | Khối cuối trang **thu gọn mặc định** + mục ⋯ “Điểm Test cả lớp” | `ClassOverviewPage.tsx` `KhoiDiemLop`, `moDiem=false` |
| 3.1c Kỳ vọng đầu ra | Panel riêng `PanelKyVong`, chỉ BE/ELE, chỉ QL | `PanelKyVong.tsx`, `DauTrangLop.tsx` (mục `ky-vong`) |
| 3.2 Nhập điểm | Lớp thường mở `/bang-diem-thuong/:id` (trang Nhập điểm riêng). Test › Điểm theo lớp đã có (`/test/diem-lop?lop=`) nhưng lớp thường **không có lượt MT0** | `DauTrangLop.tsx` `nhapDiem`; `server/src/cham/diemTheoLuot.ts` `tomTatLop` (chỉ progress/final) |
| 3.3 MT0 hiện như Final | **Lỗi đã tái hiện.** `ChamDiemPage` chọn sẵn bài MT0 (`kindMacDinh`) nhưng gọi `/classes/:id/cham` không `kind` → máy chủ trả bảng tỷ lệ có hàng MT0. Đường ghi `PUT /regular/attempts/:id/scores/:skill` **nhận** điểm MT0 → lưu đúng/tổng, band trống, lượt thành “done” | `ChamDiemPage.tsx:46,63`; `server/src/normal/regular.ts:892` (`regularSheet` không loại `kind='mt0'`) |
| 3.4 Điểm đầu vào từng kỹ năng | **Một phần**: nhập học viên FT có ô từng kỹ năng; lớp thường không có | `shared/domain/nhapHocVien.ts:58` |
| 3.5 Đầu vào ở chỗ MT0 | **Chưa có** (bảng Điểm FT ghi “chưa có điểm”) | `ClassRoster.tsx` |
| 3.6 Sửa cả lớp — TVV | **Chưa có** cột TVV | `SuaCaLopPanel.tsx:23` |
| 3.7 Bảng tổng hợp lớp thường | Có cột “Dự kiến thi”, “Hướng gợi ý” | `BangDiemLopThuong.tsx:94,114,145` |
| 4.1 Lộ trình tiếp theo | GVCN đề xuất (`coTheGhiHuong`) + QL Soạn › Xác nhận; **không có nháp lưu được**; hạn chốt = CN trước tuần Final; nhắc 2 tuần cuối | `PanelCuoiKhoa.tsx:47-80`; `shared/domain/mt0.ts:28` `hanChotLenFt` |
| 4.2 Bàn giao | Hạn **2 ngày (GVBM) / 3 ngày (GVCN)** sau khi ra lệnh | `shared/domain/chuyenLop.ts:58` `hanBanGiao` |
| 4.3–4.5 | **Chưa có** bảng chung, chưa có KQ lớp trước ở FT | — |
| 5.1 Tên tab | “Lịch Test” | `shared/domain/dieuHuong.ts:71` |
| 5.2 Báo chờ chấm / quá hạn sai | **Chưa tái hiện** trên demo. Ảnh chủ SP 11/10 (CP FT RF 01): “-” ra 3 kết quả; em đủ “-” vẫn quá hạn; “Đã huỷ phần thi” mà “Đã lên lịch”; dòng lớp “Quá hạn” khi ô đếm 0 | `server/src/cham/canCham.ts` `oFtXong`, `hangLopTuan`; `server/src/fasttrack/absence.ts:753` `settleNoShows` |
| 5.3 Nhập điểm bằng hộp | L/R gõ thẳng ô; W/S nút + khung sửa; nhận xét chỉ W/S (`assessment_scores.comment` đã có cho mọi kỹ năng) | `LuoiFT.tsx`, `ODiemLon.tsx`; `schema.sql:711` |
| 5.4 SOS MT | SOS tính **ngay từ điểm đầu tiên**, theo từng kỹ năng, **không xét Overall** | `server/src/fasttrack/scoring.ts:183-209` |
| 5.5 Huỷ cả lượt | Có “Huỷ MT{n}” (QL, Quản trị) nhưng **xoá điểm** (`xoaDiemLuot`, chỉ nhật ký giữ); **không có Khôi phục** | `server/src/fasttrack/attempts.ts:1446-1470` |
| 6.1–6.3 Công việc | Mọi nút việc **chuyển trang** theo `href`; `NganCase` tự chứa, dùng lại được | `WorkList.tsx:61,92`; `NganCase.tsx:30` |
| 6.4 Quay lại | Chỉ hồ sơ HV / lớp: “← Quay lại” = lùi trình duyệt, chữ chung; trang Nhập điểm “← Test” cố định | `web/src/ui/ThanhTruocSau.tsx:52`; `ChamDiemPage.tsx` |
| 7.1 Lịch sắp tới | Danh sách phẳng nhiều tuần | `web/src/modules/worklist/Highlights.tsx` |
| 7.2 Tổng hợp Test + SOS | Mở sẵn hàng **tuần mới nhất** | `TongHopTestSos.tsx` (`daMoSan`) |
| 7.3 Lộ trình tự cấu hình | Bảng `programmes` (số tuần, cách chấm), `programme_checkpoints` **một progress + một final** mỗi chương trình; tuần MT FT **viết cứng** | `schema.sql:30-54`; `shared/domain/lichMt.ts:21` |
| 7.4 PET/KET | **Chưa có**; tên lớp bộ ký hiệu cố định | `shared/domain/tenLop.ts` |
| 7.5 Đổi góc nhìn | **Chưa có** | — |
| 7.6 Sửa thông tin từ ⋯ dòng | Menu dòng đã có (`thaoTacDongHocVien.tsx`), chưa có mục cho TVV/Admin | — |

## 2. Vai và quyền

Thêm 3 vai vào `ROLES` (`shared/domain/people.ts`) + `ROLE_PERMISSIONS` (`server/src/seed/data.ts`) + bước migrate riêng
`server/src/migrate/prOv2.ts` (vai mới, quyền mới; không nới quyền vai cũ). Phạm vi chi nhánh theo grant như hiện nay.

| Việc | Quản trị | QL | **Admin** | GVCN | GVBM | **TVV** | **CX** |
|---|---|---|---|---|---|---|---|
| Phạm vi HV | hệ thống | CN | CN | lớp mình | lớp mình | CN, mặc định “HV của tôi” | mọi CN |
| Tổng quan · Phân tích | ✓ | ✓ | xem | xem lớp mình | xem lớp mình | xem (HV của tôi) | xem, **trừ phần GV** |
| Test (3 tab) | ✓ | ✓ | ✓ | xem + chấm môn mình | xem + chấm môn mình | — | — |
| Xếp/dời lịch MT, MT cũ, lịch PT/Final/MT0 lớp thường | ✓ | ✓ | ✓ | dời môn lớp thường | dời môn lớp thường | — | — |
| Nhập / sửa điểm | ✓ | ✓ | ✓ (sửa có lý do = `score.override`) | môn mình | môn mình | — | — |
| Huỷ / khôi phục cả lượt MT | ✓ | ✓ | **—** [chốt] | — | — | — | — |
| Sửa thông tin HV (họ tên, ngày sinh, email, TVV, dự kiến thi, điểm đầu vào) | ✓ | ✓ | ✓ | lớp mình | — | ✓ | ✓ |
| Target | ✓ | ✓ | — | đề xuất | — | — | — |
| Lộ trình tiếp theo | ✓ | ✓ nháp · chốt | — | **—** (bỏ đề xuất) | — | xem đã chốt | xem đã chốt |
| Kết quả đầu ra | chốt | chốt | — | đề xuất | — | xem đã chốt | xem đã chốt |
| Case · PA · Ý thức | ✓ | ✓ | xem | như nay | như nay | xem | xem |
| Nhận xét điểm của GV | ✓ | ✓ | xem | ✓ | ✓ | xem | xem |
| Công việc | ✓ | ✓ | nhóm Chấm điểm + Nhắc | ✓ | ✓ | — | — |
| Đổi góc nhìn | vai đang nắm | vai đang nắm | — | — | — | — | — |
| Quản trị › Chương trình | ✓ | — | — | — | — | — | — |

- **Đổi góc nhìn** [chốt]: chỉ QL / Quản trị có ≥ 2 vai. Chọn vai = **phiên làm việc đúng quyền vai đó** (máy chủ kiểm theo vai đang
  chọn, lưu ở phiên đăng nhập — không phải chỉ ẩn nút). Dải “Góc nhìn: {vai} · {phạm vi} · Về {vai gốc}”. Bộ lọc nhớ theo từng vai.
- **CX “trừ phần GV”** [tự quyết]: không có Phân tích › Theo giáo viên, không mở `/giao-vien/:id`; tên GV vẫn hiện như chữ.
- **TVV = người**: `students.consultant_user_id` (FK users, vai TVV); `consultant_name` giữ để đọc. Ô chọn = `ChonNguoi` như chọn GV,
  lọc tài khoản có vai TVV cùng chi nhánh trước; chữ cũ hiện mờ dưới ô (“Ghi cũ: …”), **không tự gán** [chốt].
- **Email + ngày sinh** [chốt]: bắt buộc ở Thêm học viên (một em, cả lớp, dán Excel) và Sửa thông tin (một em, cả lớp); không chặn
  việc khác; em cũ thiếu → nhãn “Thiếu thông tin” (đã có). Không điền giả.

## 3. Quy trình mới

### 3.1 Lộ trình → Bàn giao → Kết quả đầu ra → lên FT (chỉ lớp thường) [chốt]
| Bước | Ai | Khi nào / hạn | Đầu ra | Sửa sai |
|---|---|---|---|---|
| Nhắc | hệ thống | từ đầu tuần **Final − 2**: thanh nhắc ở hồ sơ lớp + việc QL “Chốt lộ trình · {lớp}” | — | — |
| Nháp | QL | bất cứ lúc nào (⋯ Lộ trình tiếp theo) | dòng nháp **chỉ QL / Quản trị thấy**, không tạo lệnh, không MT0, không việc | sửa / xoá nháp |
| Chốt | QL | hạn **hết tuần Final − 2**; quá hạn đỏ, không chặn | lệnh chuyển lớp (thi hành Thứ Hai tuần đã chọn); Lên FT → **MT0** (tạo lúc chốt [tự quyết]); mở việc **Bàn giao** | sửa / huỷ tới ngày thi hành; đổi hướng / lớp đích → phiếu cũ đóng, phiếu mới điền sẵn nội dung cũ + chuông “Cần làm” |
| Bàn giao | GVCN + GVBM từng môn | hạn **hết tuần Final**, ít nhất **2 ngày sau khi chốt** | phiếu bàn giao | sửa phiếu tới ngày thi hành (như nay) |
| Kết quả đầu ra | GVCN đề xuất → QL chốt | em Lên FT từ FOU / BE / ELE, theo MT0 (≥ 3/4 kỹ năng, luật A #312); ngưỡng BE/ELE như nay, **FOU: Overall > 3.5** | QL chốt “Không đạt · Trung tâm” → Case + Tutor 10 buổi chạy ngay; đề xuất GVCN không chạy gì | QL sửa kết quả đã chốt (như PanelKyVong) |
| Lên FT | hệ thống | ngày thi hành lệnh | em vào lớp FT; bảng “Kết quả đầu ra {BE/ELE}” hiện ở hồ sơ lớp FT **4 tuần từ ngày thi hành của đợt** | hết 4 tuần ẩn; tra lại ở Hồ sơ HV › Hành trình |
- Bỏ hẳn: bước GVCN đề xuất lộ trình, việc liên quan, cờ `coTheGhiHuong`, mục “Kỳ vọng đầu ra…” (đổi tên **Kết quả đầu ra**, vào bảng).
- **Bảng “Lộ trình tiếp theo”** (tab Học viên, cách xem giữa “Tổng hợp” và “Cần hỗ trợ”): một bảng nhỏ mỗi hướng, mở sẵn — Chưa chọn ·
  Lên FT · Lên {lớp kế} (`NORMAL_LADDER`) · **Học lại** (cùng trình độ hoặc xuống lộ trình dưới — lớp đích thấp hơn được phép) ·
  Tạm dừng · Dừng học. Mọi bảng có ô Lộ trình cạnh điểm Progress / Final (ô điểm bấm được để nhập); đổi lộ trình → em sang bảng tương ứng.
- **FT** giữ “Chuyển tiếp lớp”; hạn bàn giao FT = **5 ngày** sau ra lệnh (GVBM và GVCN) [chốt].
- Hồ sơ một em › Lộ trình tiếp theo mở **đúng hộp Lộ trình** của bảng lớp [chốt].

### 3.2 SOS Mock Test [chốt]
1. Có điểm kỹ năng đầu tiên → **SOS tạm thời** (chip như hiện nay), **không** tạo Case / PA / việc / hạn.
2. **Chốt** khi: mọi kỹ năng bắt buộc có điểm, **hoặc** mọi kỹ năng còn thiếu đã dời tuần (vắng) / huỷ phần thi. Lúc chốt:
   Overall tính được (đủ 4 kỹ năng) **và ≥ kỳ vọng** → **không SOS**; ngược lại SOS theo số kỹ năng dưới kỳ vọng như cũ → Case + PA quy chế
   + hạn xác nhận 3 ngày **tính từ ngày chốt**.
3. Sau chốt, kỹ năng dời có điểm và Overall thành ≥ kỳ vọng → **xoá SOS**: Case tự tạo còn “Chờ xác nhận” đóng hệ thống (“Overall đạt”);
   Case GV đã xác nhận / PA đang chạy giữ, ghi mốc “Overall đã đạt” để GV tự đóng [tự quyết].
4. Chỉ MT1+; không đổi lớp thường, không đổi chip MT0 (≤ Target − 2.0, chỉ để nhìn). KCK như cũ (không SOS).

### 3.3 Dấu “-” = Vắng (MT) [chốt]
- Gõ “-” hoặc bấm **Vắng** trong hộp: chốt ngay. Lần 1 → kỹ năng dời tuần sau tuần thi; nếu tuần đó đã qua (nhập bù) → **tuần sau của
  tuần hiện tại** [tự quyết]. Lần 2 → huỷ phần thi. MT cũ (`lich_su`) → “Không dự thi”, không dời.
- Đường lui: **Bỏ vắng** (GV đúng kỹ năng, GVCN, QL; khi ô ở tuần mới chưa có điểm) → về tuần cũ, bộ đếm −1; hoặc nhập điểm thẳng.
  Đã huỷ phần thi → chỉ QL “Khôi phục phần thi” (đã có).
- Bỏ đường “chờ hết Chủ nhật” (`settleNoShows`) cho dấu mới; dữ liệu “-” cũ chưa chốt được chốt một lần theo luật cũ khi migrate.

### 3.4 Huỷ / khôi phục cả lượt MT [chốt]
- Chỉ QL (và Quản trị). Hộp nêu hệ quả: số kỹ năng có lịch, điểm đã nhập, Case / PA / Phối hợp sẽ đóng.
- Huỷ: lượt `cancelled`, **điểm giữ nguyên nhưng ẩn** (không tính Overall, SOS, Phân tích, Xuất Excel); đóng Case chưa có kết quả PA,
  PA có kết quả gần nhất **“Chưa đủ dữ liệu”**, Phối hợp còn chờ; PA đã có kết quả khác giữ nguyên.
- Khôi phục: lượt, lịch, điểm và đúng những gì lần huỷ đã đóng trở lại (ghi danh sách đóng vào nhật ký huỷ). Đã có lượt cùng số mới (không huỷ)
  → chặn, câu “Đã xếp MT{n} mới tuần … Huỷ MT{n} mới trước, rồi khôi phục MT{n} cũ.”

### 3.5 Lịch Test / Chấm Test [chốt]
- Tab “Lịch Test / Chấm Test”; hàng đầu khung bỏ chữ “thi”.
- Dòng lớp: nhãn đỏ “Quá hạn” chỉ khi **ô của người xem** quá hạn; phần của người khác ghi “W, S: GV khác · ⚠ quá hạn n ngày” (nhạt).
  QL / Admin thấy toàn bộ. Số đếm ô trên cùng và nhãn dòng dùng **một hàm** (cùng luật `oFtXong`).

## 4. Giao diện (theo mockup đã duyệt)
- **Hồ sơ lớp** (M2 §1–3): nút cố định Nhập điểm (→ `/test/diem-lop?lop={id}&luot={lượt mở sẵn}`) · + Case · ⋯ gom Lớp / Lộ trình / Công cụ /
  kết thúc; bỏ “Điểm Test cả lớp”, gộp 3 panel thành **Thông tin lớp** (Lớp: số + chương trình, chỉ QL, bỏ ghi chú · Phân công · Lịch Test;
  mỗi phần Sửa / Lưu riêng); bảng điểm cuối trang mở sẵn; “Điểm” → **Tổng hợp**, bỏ Dự kiến thi, “Hướng gợi ý” → **Lộ trình tiếp theo** (đã chốt).
- **Hồ sơ lớp FT** (M2 §5): cách xem “Kết quả đầu ra” (mỗi chương trình nguồn một bảng, nhóm con theo đợt, mỗi đợt ghi “hiện tới hết …”);
  bảng Điểm: em chưa có MT0 có dòng mốc **“Đầu vào”** (chỉ Overall → chỉ cột OVR) — chỉ để nhìn [chốt].
- **Hồ sơ HV** (M2 §6): ⋯ Sửa thông tin · Chuyển lớp · **Tạm dừng / Thôi học** (panel 2 tab, giữ luật cũ) · Lưu trữ. Sửa thông tin gồm
  Target (QL sửa thẳng có lý do; GVCN lưu thành Đề xuất sửa) [chốt]; điểm đầu vào từng kỹ năng hoặc chỉ Overall.
- **Điểm theo lớp**: lớp thường thêm lượt **MT0** (bảng band). MT: ô điểm là nút → **hộp nhỏ** (M1 §3): L/R số câu + band + nhận xét;
  **W1, W2 hai hộp riêng** (4 tiêu chí + nhận xét riêng, lưu một task được); S 4 tiêu chí + người chấm + nhận xét; dưới tên em “MT{n} · tuần”;
  Enter = “Lưu · em tiếp ›”; lỗi giữ chữ đã gõ. Lớp thường giữ ô gõ thẳng + nút Nhận xét [chốt]. L/R luôn hiện số câu.
- **Công việc** (M1 §1–2, §6): lọc 2 tầng + dòng phạm vi + Xoá lọc; danh sách trái, panel phải; Xác nhận nguyên nhân gom theo lớp + kỹ năng
  + lượt (bỏ chọn em = làm riêng; em khác mức PA quy chế tự tách), panel có đủ PA, “xác nhận cùng lúc” mặc định bật; Thêm PA / Kết quả PA /
  Hoàn thành = `NganCase` trong panel; Nhập điểm = danh sách em + hộp nhập điểm; Bàn giao = `BanGiaoPanel`; chỉ Chốt lộ trình / KQĐR mở hồ sơ lớp.
  Lưu xong dòng mờ, không nhảy; điện thoại mở màn đầy đủ.
- **Quay lại** (M1 §6): mọi hồ sơ (HV, lớp, lượt MT, GV, Case) có “‹ {tên nguồn}” về đúng URL nguồn (bộ lọc, tab trên URL) + vị trí cuộn;
  lưu chồng nguồn trong `sessionStorage` (tối đa 5). Mở bằng link → trang cha như nay.
- **Tổng quan** (M3 §1): Lịch sắp tới 3 tab tuần, gom theo lớp (chip lượt), tối đa 5 lớp + “+ n lớp”, “Xem toàn bộ lịch ›” → Kế hoạch Test
  đúng tuần / chi nhánh / chương trình; “Chưa xác định tuần” riêng. **Phân tích › Tổng hợp Test + SOS mở sẵn tuần trước.**
- **Vai mới** (M3 §2–4): như mục 2. Tổng quan TVV = “Học viên của tôi” (4 số + danh sách Cần chú ý); Admin hộp ô MT có Dời tuần, không Huỷ (dòng 🔒).
- **Chương trình + PET/KET** (M3 §6): Quản trị › Chương trình: môn, cách chấm (đúng/tổng · band), độ dài (số tuần · liên tục), mốc (tuần cố định ·
  lặp mỗi n tuần), ngưỡng đạt; áp cho **lớp mở sau** (lớp đang chạy giữ bản cũ — chép mốc vào lớp lúc tạo). Tuần MT FT (`lichMt.ts`) đọc từ
  chương trình. PET/KET: L+S, R+W, checkpoint mỗi 6 tuần, liên tục, đúng/tổng ≥ 70 %, chưa đạt → **chip SOS nhỏ, không tự tạo Case/PA**;
  không Target, không Lộ trình tiếp theo / KQĐR; tên `{CN} PET {số}` / `{CN} KET {số}` [chốt].

## 5. Kế hoạch PR (thứ tự theo phụ thuộc; model Opus 5.5 hoặc Sonnet 5.5, **không Fable**)

| PR | Nội dung | Phụ thuộc | Rà |
|---|---|---|---|
| **OV-1a** (S) | 3.3 (gửi đúng `kind`; máy chủ từ chối ghi tỷ lệ lên `kind='mt0'`; `regularSheet` bỏ MT0) · 3.2 (Nhập điểm → Điểm theo lớp; thêm lượt MT0 lớp thường) · 5.1 · 7.2 · `kiem-du-lieu-mt` nhóm 6 “MT0 có điểm đúng/tổng, không band” + lệnh chỉ đọc `kiem-o-lop --lop "CP FT RF 01"` (trạng thái từng ô) | — | mặc định |
| **OV-1b** (M) | 5.2 theo kết quả lệnh chỉ đọc · dấu “-” = Vắng chốt ngay + Bỏ vắng · dòng lớp “phần của bạn”, một hàm đếm | OV-1a + log chủ SP | **sâu** (luồng chính, dữ liệu) |
| **OV-1c** (M) | SOS MT tạm thời → chốt → xoá (3.2) | OV-1b | **sâu** (Case tự tạo) |
| **OV-2a** (L) | Vai TVV / CX / Admin, quyền, thanh trên theo vai, đổi góc nhìn, TVV Tổng quan | — | **sâu** (quyền) |
| **OV-2b** (M) | Hồ sơ HV: TVV chọn người (migrate `consultant_user_id`), email + ngày sinh bắt buộc, Tạm dừng / Thôi học, Sửa thông tin + Target, ⋯ dòng Sửa thông tin, cột TVV ở Sửa cả lớp | OV-2a | mặc định |
| **OV-3a** (M) | Đầu hồ sơ lớp + ⋯, Thông tin lớp, bảng điểm mở sẵn, Tổng hợp, dòng “Đầu vào” FT | OV-1a | mặc định |
| **OV-3b** (L) | Lộ trình tiếp theo: nháp / chốt, bảng theo hướng, bỏ GVCN đề xuất, KQĐR gộp + FOU > 3.5, hạn mới, bàn giao FT 5 ngày, chuông đổi lộ trình | OV-3a | **sâu** (lệnh chuyển, MT0, migrate nháp) |
| **OV-3c** (M) | Kết quả đầu ra lớp trước ở FT (4 tuần theo đợt) | OV-3b | mặc định |
| **OV-4** (L) | Hộp nhập điểm L/R/W1/W2/S + nhận xét + Lưu · em tiếp · Huỷ giữ điểm ẩn + Khôi phục lượt | OV-1b | **sâu** (điểm, huỷ) |
| **OV-5** (L) | Công việc tại chỗ (panel, gom xác nhận nguyên nhân + PA, lọc 2 tầng) + Quay lại toàn hệ thống | OV-4 | **sâu** (luồng chính) |
| **OV-6a** (S) | Lịch sắp tới gọn | — | mặc định |
| **OV-6b** (L) | Quản trị › Chương trình (mốc lặp, liên tục, tuần MT FT cấu hình, chép mốc vào lớp) + PET/KET | OV-3b | **sâu** (migrate lịch) |

- Mỗi PR có kế hoạch ≤ 200 dòng ở `docs/superpowers/plans/` (planning viết trước khi giao). Giao diện: `/ponytail lite`, `clarify`,
  `harden`, `adapt`, `audit` cuối. Sau OV-1a nên **deploy sớm** (lỗi MT0 đang ghi sai dữ liệu). PR-EN làm sau toàn bộ OV; PR-SOTAY cuối cùng.

## 6. Tiêu chí nghiệm thu (đối chiếu mục 1–7)
1. **Vai**: TVV / CX / Admin đăng nhập thấy đúng thanh trên và phạm vi ở bảng mục 2; gọi API ngoài quyền → 403 (phép kiểm theo từng vai).
   Admin không có Huỷ / Khôi phục lượt kể cả gọi thẳng API. Đổi góc nhìn chỉ hiện vai đang nắm; ở góc nhìn GV, API từ chối việc chỉ QL làm được.
2. **Hồ sơ HV**: thêm / sửa thiếu email hoặc ngày sinh → lỗi đúng ô, không lưu; em cũ thiếu vẫn nhập điểm được. Ô TVV chỉ chọn tài khoản vai TVV;
   chữ cũ hiện mờ. Tạm dừng / Thôi học một nút, hai tab, luật và Hoàn tác như cũ.
3. **Hồ sơ lớp**: ⋯ cùng thứ tự hai loại lớp; Thông tin lớp lưu từng phần, phần lỗi không làm mất phần khác; Nhập điểm mở đúng lớp + lượt ở
   Điểm theo lớp; **mở lần đầu MT0 lớp thường ra bảng band** và máy chủ từ chối ghi đúng/tổng vào MT0 (phép kiểm). Bảng FT có dòng “Đầu vào”,
   không vào SOS / Overall / Phân tích. Bảng Tổng hợp không còn Dự kiến thi; cột Lộ trình tiếp theo chỉ hiện bản đã chốt.
4. **Lộ trình**: nháp không tạo lệnh / MT0 / việc và GV không thấy; chốt tạo đủ; hạn nhắc / chốt / bàn giao đúng ví dụ Final tuần 10
   (nhắc từ tuần 8, chốt trước hết tuần 8, bàn giao trước hết tuần 10, ≥ 2 ngày sau chốt); đổi lớp đích sau chốt → phiếu cũ đóng + chuông;
   FT bàn giao 5 ngày. KQĐR: GVCN đề xuất không tạo Case; QL chốt Không đạt · Trung tâm tạo Case + Tutor; FOU Overall 4.0 đạt, 3.5 không.
   Bảng KQ lớp trước ở FT hiện đúng 4 tuần theo từng đợt, hai chương trình hai bảng.
5. **Test**: “-” lần 1 dời ngay, lần 2 huỷ phần thi, nhập bù không dời vào tuần đã qua; Bỏ vắng trả về như trước; không còn ô “-” bị trống
   sau Enter; em đủ “-” không còn báo quá hạn. Dòng lớp và ô đếm cùng số. SOS MT: điểm đầu tiên không tạo Case; chốt đúng 3 trường hợp; Overall
   đạt → không SOS; xoá SOS khi kỹ năng dời có điểm. Huỷ lượt giữ điểm ẩn; khôi phục ra đúng trạng thái trước; bị chặn có câu rõ.
   Hộp nhập điểm: W1 / W2 lưu riêng, nhận xét 4 kỹ năng, R/L hiện số câu.
6. **Công việc**: mọi việc trừ Chốt lộ trình / KQĐR làm xong không rời trang; gom xác nhận nguyên nhân áp đúng em đã chọn, em bỏ chọn còn lại;
   số đếm đúng đơn vị; Quay lại từ hồ sơ về đúng nguồn với bộ lọc, tab, vị trí cuộn (Tổng quan, Công việc, Test, Phân tích, hồ sơ khác).
7. **Khác**: Lịch sắp tới không cao hơn khối bên cạnh; Phân tích mở tuần trước; tạo chương trình liên tục mốc lặp 6 tuần → lớp PET mới có
   checkpoint mỗi 6 tuần, lớp đang chạy không đổi lịch; checkpoint chưa đạt chỉ có chip SOS.
