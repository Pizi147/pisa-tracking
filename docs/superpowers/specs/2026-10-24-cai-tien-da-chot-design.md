# Cải tiến đã chốt 24/10 — đối chiếu, phương án, kế hoạch (PTA Plan)

> Nguồn yêu cầu: prompt chủ SP `PISA_TRACKING_PROMPT_CAI_TIEN_DA_CHOT_2026-10-24.md` (8 nhóm, mục 2–9). Bản được kiểm: **mã nhánh `main` 578f66d6** (24/10, sau #565),
> đọc mã — không phải bản đang deploy (DB `pisatracking-261022`), không bấm thử. PR đang mở không chạm: **#566 UI-HV-LOP-TVV** (cloud), **SUA-CHAM-LAI** (cloud, chưa mở PR).
> Chủ SP vắng mặt, giao PTA Plan tự làm: phần đã rõ chạy ngay; phần đổi nghiệp vụ / cần mockup đứng chờ câu hỏi ở mục 6.
> Phân loại: **[CHỐT]** chủ SP đã nói · **[KIỂM]** đã đọc mã, có file:dòng · **[ĐX]** đề xuất của PTA (chưa duyệt) · **[HỎI]** cần chủ SP.

## 0. Đọc nhanh

- **Chạy ngay (không đổi nghiệp vụ, không cần mockup):** P1 điểm tiêu chí W / S số nguyên (4.4) · P2 bộ đếm MT "đã xong / đã tạo" + thôi nhắc xếp thêm khi đủ MT mặc định (4.1) ·
  P3 bỏ Góp ý hàng tuần khỏi giao diện, menu ⋯ rõ nhóm, tiêu đề bảng dài cố định, "Mới dùng PISA TRACKING?" (6.2–6.4) · P5 mockup V6 cho các luồng phải duyệt (2, 3, 5).
- **Chạy tiếp khi có chỗ:** P4 ô chọn lớp gõ-tìm dùng chung (6.3) · P12 báo cáo lịch sử không lệch theo Target / trạng thái hiện tại (2.4, 4.2).
- **Chờ chủ SP:** khoá lịch cuối tuần (4.3 — 3 câu phạm vi), trạng thái + lộ trình mới (2 — 3 câu), môn đăng ký (3 — 2 câu), cuối khoá (5 — mockup + 1 câu),
  KET / PET (7 — 3 câu), dịch (8 — 3 câu + chủ SP tự cấu hình khoá).
- **Lỗi thật tìm được khi đối chiếu** (mục 2): lộ trình mới chép ngày thi cũ, "Lớp này" lỗi khi lớp cũ đã kết thúc, lộ trình mới bỏ trống điểm đầu vào,
  bộ đếm MT tính MT chưa thi, gợi ý MT3 cho lớp RF, Phân tích GV so Target hiện tại, Chấm điểm GV đổi theo trạng thái hôm nay.

## 1. Bảng yêu cầu — hiện trạng

| Mã | Yêu cầu | Hiện trạng [KIỂM] | Loại | Nơi xử lý |
|---|---|---|---|---|
| R2.1a | Một nút "Tạm dừng/ Kết thúc học" | Đã có MỘT mục menu "Tạm dừng / Thôi học" mở panel hai tab (`shared/domain/quanLyHocVien.ts:16, 38-43`, `StudentManagePanel.tsx:132-141`); Bước tiếp có ba hướng Lộ trình mới / Tạm dừng / Thôi học (`tongKetLoTrinh.ts:36-41`) | bổ sung | P7 + mockup P5 |
| R2.1b | HV tạm dừng vào lưu trữ, ẩn khỏi vận hành | Tạm dừng = `status='inactive'`, ghi danh `paused`, KHÔNG lưu trữ; đã ẩn khỏi danh sách lớp / Công việc / nợ (`HV_DANG_HOC_SQL` ~70 nơi) nhưng **vẫn ở lưới điểm FT** (`attempts.ts:1390-1394`); `archiveStudent` chỉ nhận `finished` (`students.ts:667`) | bổ sung + [HỎI] Q1 | P7 |
| R2.1c | Đường quay lại học / sửa nhầm | Có Quay lại học, Hoàn tác tạm dừng / kết thúc, Học lại, Bỏ lưu trữ — nhưng em lưu trữ bị chặn đổi trạng thái (`students.ts:276`), hoàn tác tạm dừng không xoá `archived_at` (`:606`) | bổ sung | P7 |
| R2.2 | Thi thật → 2 hướng | KQ thi thật ở `learning_cycles.thi_that_*`, không mất khi chưa chọn bước tiếp; việc KQ / Bước tiếp lọc `archived_at IS NULL` (`cotSauThi.ts:19-21`, `buocTiep.ts:366`) | bổ sung | P7 |
| R2.3 | Lộ trình mới LT1 / LT2 (3 MT) · RF (2) · Khác (0, ghi tên) | `moLoTrinhMoi` (`luatLoTrinh.ts:243-272`): MT theo `classes.lich_mt` (LT 3, RF 2 — đúng); **không có "Khác"**; **không chọn môn**; **không chép điểm đầu vào** (`:260-268`); **chép ngày thi cũ** (`:256, 266`); Case cũ đóng `course_ended` | bổ sung + lỗi | P7 |
| R2.4 | Hồ sơ lưu trữ có tóm tắt hành trình; báo cáo lịch sử giữ | `cacLoTrinh` + `NganTongKet` có đủ từng lộ trình (`tongKet.ts:66-176`); chưa có một dòng tóm tắt cả hành trình. Báo cáo lịch sử KHÔNG lọc lưu trữ (`baoCao.ts:99-206`, `ketQuaThi.ts:103`) — đúng | bổ sung nhỏ | P7 (tóm tắt), P12 |
| R3 | Môn đăng ký L / R / W1 / W2 / S | **Chưa có**. Gần nhất: phạm vi của lượt (`attempt_skills.required`, chỉ QL, chặn lớp thường `skillSchedule.ts:973`, Writing là một dòng) | mới + [HỎI] Q4–Q5 | P8 |
| R4.1 | Đủ MT mặc định → thôi nhắc xếp thêm; bộ đếm đã xong / đã tạo | Nhắc = em không còn lượt planned có tuần (`keHoachTest.ts:82-99`), không xét đã đủ MT; gợi ý "MT{b} chưa xếp" dùng hằng **3 cho mọi lớp** (`:126`, RF cũng 3); bộ đếm "MT x/y" = MT lớn nhất đã xếp / độ dài lịch (`hocVienLop.ts:163-164, 340`) — tính MT chưa thi, MT4 hiện "4/3" | lỗi + bổ sung | **P2** |
| R4.2 | Kết quả mọi HV (cả lưu trữ / chuyển lớp / lộ trình mới) vào phân tích GV | Đã tính (không lọc trạng thái); gán GV theo phân công ở tuần thi (`giaoVien.ts:6-7, 97-100`). Lệch: MT so **Target / KCK hiện tại** (`:129, 245-248`); thi thật 3 luật chọn lớp khác nhau; Chấm điểm bỏ ô của em "không đang học" theo trạng thái HÔM NAY (`:129, 210`) | lỗi | P12 |
| R4.3 | Khoá đổi lịch MT T6–CN cho 3 tuần, trừ Quản trị | Chưa có. Không có phễu chung: ~20 đường ghi lịch (mục 3.5) | mới + [HỎI] Q6–Q8 | P6 |
| R4.4 | Tiêu chí W / S chỉ số nguyên | Máy chủ nhận x.5 (`attempts.ts:2284` `Number.isInteger(v*2)`); Dán Excel `kiemBand` bậc 0.5 (`danExcel.ts:209`); hộp nhập chỉ kiểm là số (`chamDiem.ts:233`); seed có tiêu chí x.5 (`seed/build.ts:45-48`) | thay luật nhập | **P1** |
| R5.1 | Lộ trình tiếp theo: chọn tất cả / nhóm, áp chung + ngoại lệ, ô gõ lớp, tạo lớp tại chỗ, cùng chi nhánh | `BangLoTrinhTiep` chỉ checkbox từng em, `<select>` lớp (`:325, 467`), không tạo lớp; máy chủ trả lớp thường mọi chi nhánh (`transition.ts:162-181`). `TransitionPanel` (FT) có đủ mẫu chọn cả lớp + tạo lớp + giữ lựa chọn | làm lại | mockup P5 → P9 |
| R5.2 | Kết quả đầu ra lớp thường | Hai khái niệm song song: TabDauRa (theo Final, máy tính Đạt, không hàng loạt, không Case) và KQĐR Lên FT (`HopKetQua`, chỉ sau khi chốt lệnh FT, một em một lần) | làm lại + [HỎI] Q9 | mockup P5 → P9 |
| R5.3 | Bỏ "Chuyển tiếp lớp" thừa (FT) | Còn ở menu ⋯ lớp FT (`hocVienLop.ts:684`), dải "Chưa chuyển được" (`DaiChuyenLop.tsx:37-41`), Kết thúc lớp › đi tiếp; không việc / metric nào còn trỏ tới | gỡ (giữ chuyển từng em) | P9 |
| R6.1 | Cột Việc đúng vai (GV chỉ việc mình; QL ≤ 3 dòng, mở ≤ 5) | Thuộc HV & Lớp — #566 đang sửa cùng tệp | chờ #566 | P11 |
| R6.2 | Bỏ Góp ý hàng tuần | Cách xem `gop-y` ở tab Học viên lớp (`TabHocVienLop.tsx:26, 59, 95`), `BangGopYTuan.tsx`, Hướng dẫn GV / QL; không việc / metric; bảng `gop_y_tuan` + Lịch sử | gỡ giao diện, giữ dữ liệu | **P3** |
| R6.3a | Menu ⋯ rõ nhóm | `Menu` có `nhom`, `keTruoc` (`ui/Menu.tsx:10-16, 71-80`) nhưng nhóm chỉ là chữ nhỏ, mục sát nhau | tinh chỉnh | **P3** |
| R6.3b | Mọi ô chọn lớp gõ → tìm → chọn | Có mẫu `OLopDich` (`ChuyenLopPanel.tsx:46-66`, dùng `ChonNguoi ds`); còn **12 `<select>` lớp** (mục 3.8) | thay | P4 (+ P9 cho 4 ô của cuối khoá) |
| R6.4a | Tiêu đề bảng dài cố định | Có `bang-dinh` / `Bang dinh`, chỉ ≥ 1280 px và chỉ bảng không cuộn ngang (`index.css:228-240`) | mở rộng | **P3** |
| R6.4b | "Mới dùng PISA TRACKING?" | `DaiMoiDung.tsx:20` ghi "Mới dùng PISA?" | đổi chữ | **P3** |
| R7 | KET / PET trình độ, Target theo chương trình, sẵn TOEFL | KET / PET là chương trình **liên tục**: 2 môn gộp L+S / R+W, chấm đúng/tổng 70 %, Checkpoint 6 tuần, **không Target, không thi thật** (luật 11/10, `normal.ts:239, 263`) | nghiên cứu + [HỎI] Q10 | P13 |
| R8 | Nút "Dịch" chữ GV nhập | Chưa có; i18n chỉ dịch chữ hệ thống (`shared/i18n`) | mới + [HỎI] Q11 | P14 |
| R9 | 10 đề xuất GPT | mục 5 | đánh giá | — |

## 2. Lỗi đã kiểm trong mã (chưa tái hiện trên web) — tách khỏi lỗi chủ SP báo

| # | Lỗi | Bằng chứng | Xử lý |
|---|---|---|---|
| E1 | Lộ trình mới chép `exam_month / exam_date` của lộ trình cũ khi panel không gửi tháng thi → có thể hiện ngay "Đã thi · chờ kết quả" | `luatLoTrinh.ts:256, 266-267`, `PanelBuocTiep.tsx:105`, `tongKetLoTrinh.ts:116, 127` | P7 |
| E2 | Bước tiếp "Lớp này" khi lớp cũ đã kết thúc → 400 (panel không gửi `moLaiLop`) | `students.ts:426`, `PanelBuocTiep.tsx` | P7 |
| E3 | Lộ trình mới không có điểm đầu vào (không lấy KQ thi thật vừa nhập) | `luatLoTrinh.ts:260-268` | P7 |
| E4 | Bộ đếm "MT x/y" tính MT đã xếp chưa thi; MT4 → "4/3" | `hocVienLop.ts:163-164, 340` | **P2** |
| E5 | Gợi ý "MT3 chưa xếp" ở lớp RF (hằng 3) | `keHoachTest.ts:126`, `fasttrack.ts:28` | **P2** |
| E6 | Phân tích GV / hồ sơ GV so MT với Target, KCK **hiện tại** (không `target_at_attempt`) | `phanTich/giaoVien.ts:129, 245-248` | P12 |
| E7 | Thi thật: 3 luật chọn lớp khác nhau (Phân tích GV · Kết quả thi · bản chụp) + Target hiện tại ở cột hiển thị | `giaoVien.ts:281-283`, `ketQuaThi.ts:120-129, 148`, `banChup.ts:148-152` | P12 |
| E8 | Chấm điểm GV kỳ cũ đổi theo trạng thái học viên HÔM NAY | `giaoVien.ts:129, 210` | P12 |
| E9 | Gợi ý Bước tiếp trả `hoc_lai` dù web không bày | `tongKetLoTrinh.ts:52-55` | P7 |
| E10 | Hoàn tác tạm dừng không xoá `archived_at` (khi tạm dừng đã vào lưu trữ — sẽ phát sinh sau R2.1b) | `students.ts:606` | P7 (phòng trước) |

## 3. Phương án khuyến nghị theo luồng

### 3.1 Trạng thái học viên: một nút "Tạm dừng/ Kết thúc học" (R2.1) — [ĐX], chờ Q1
- Một mục menu, một nhãn ở mọi nơi (hồ sơ ⋯, thao tác hàng loạt lớp, Bước tiếp sau thi, trang Lưu trữ): **"Tạm dừng/ Kết thúc học"**. Hộp nhỏ (không panel lớn):
  ngày · lý do (tuỳ chọn) · **một** ô "Có thể quay lại học" (mặc định bật nếu đang giữa khoá, tắt nếu vừa có KQ thi thật). Lưu → em vào **Lưu trữ** cả hai trường hợp.
- Lưu tối giản: giữ `students.status` cũ (`inactive` = có thể quay lại, `finished` = kết thúc) để **không đổi** luật quay lại học / báo cáo đã có; thêm `archived_at` cho cả `inactive`.
  Mọi lọc "đang học" đã dùng `HV_DANG_HOC_SQL` (status + archived) nên tự đúng; thêm lọc ở lưới điểm FT (đang cho nhập em inactive).
- Quay lại học: một nút ở hồ sơ lưu trữ + trang Lưu trữ → bỏ lưu trữ + `active`; em `inactive` về lớp cũ nếu lớp còn chạy, không thì hỏi lớp (ô gõ lớp P4). Hoàn tác 10 s ngay sau khi lưu (như hiện có).
- Bảng thao tác: trước 2 tab (Tạm dừng / Thôi học) + Lưu trữ riêng (chỉ em đã thôi học) → sau 1 hộp, lưu trữ tự động; Quay lại học từ lưu trữ: trước không được (chặn `:276`) → sau được.

### 3.2 Thi thật → Bước tiếp hai hướng (R2.2) — [CHỐT] + [ĐX]
- Hai nút: **Tạm dừng/ Kết thúc học** (hộp 3.1, ô "Có thể quay lại" mặc định tắt) · **Lộ trình mới** (3.3). KQ thi thật giữ nguyên khi chưa chọn (đã đúng).
- Việc "Chọn bước tiếp" hạn 1 tuần, gia hạn (giữ). Em đã lưu trữ thì không còn việc (đúng: đã chọn). Dữ liệu cũ `buoc_tiep='tam_dung' | 'ket_thuc' | 'hoc_tiep' | 'hoc_lai'` đọc được như cũ (chỉ đổi nút).

### 3.3 Lộ trình mới (R2.3) — [CHỐT] + [ĐX]
- Một panel gọn (không nhiều màn): **Lộ trình** LT1 · LT2 · RF · Khác (ô tên) → **Môn học** (5 ô L R W1 W2 S, mặc định theo lộ trình cũ — R3) → **Target** (giữ, sửa được) →
  **Bắt đầu** ngay / hẹn Thứ Hai · **Lớp** giữ lớp hiện tại / lớp khác (ô gõ lớp, lọc đúng loại lớp của lộ trình; lớp sai loại → giải thích ngay, không cho lưu) →
  vùng cuối tóm tắt: "Tạo MT1–MT3 · đóng 2 Case của LT1 · đầu vào = KQ thi 15/08 (L 6.5 R 7.0 W 6.0 S 6.0)".
- Số MT mặc định = `lich_mt` của lớp đích (LT 3, RF 2 — đã đúng), **Khác = 0 MT** (QL thêm "+ MT" khi cần).
- Điểm đầu vào = **KQ thi thật gần nhất** của em (`learning_cycles.thi_that_*` của lộ trình vừa xong; không có thi thật → MT có Overall gần nhất, ghi rõ nguồn; không ghép điểm nhiều lần thi).
- Case chưa xong của lộ trình cũ: **đóng với lý do riêng "Kết thúc lộ trình"** (không "đã cải thiện", không vào tử số Hiệu quả PA); PA đang chạy → [HỎI] Q2.
- Không mang trạng thái / hạn / việc của lộ trình cũ; lộ trình cũ ở "Lộ trình & lớp" đọc từ bản chụp (đã có). Sửa E1 (không chép ngày thi), E2, E3, E9.

### 3.4 Môn đăng ký (R3) — [ĐX], chờ Q4–Q5
- Dữ liệu: `learning_cycles.mon_dang_ky` (JSON 5 khoá L R W1 W2 S, NULL = đủ môn) + nhật ký đổi (`audit_logs`, có trước → sau). Theo lộ trình (đổi lộ trình mới → chọn lại).
- Nơi sửa: Sửa thông tin HV, Sửa cả lớp, Lộ trình mới. **Không** ở Thêm HV / Dán Excel (mặc định đủ môn).
- Xếp lịch: môn không học → `attempt_skills.required = 0` lý do "không học" (đã có cột `scope_reason`); W1 / W2 riêng cần thêm cờ mức ô (Writing đang một dòng) — một cột `attempt_skills.bo_task` ('writing1' | 'writing2' | NULL).
- Đánh giá: ô môn không học không phải "thiếu" (`O_CHO_TU_SQL`, `scoreDebt`, `oXongCua`, `kyNangXongThieu`); **Overall không kết luận** khi không đủ 4 kỹ năng (đã có nhánh `skipped.length` → Overall null, `scoring.ts:229`),
  nhãn "Không đủ bộ môn" (khác "Chưa đủ dữ liệu"); SOS / Case chỉ xét môn đăng ký (`failingEntrySkills` đã bỏ kỹ năng bị skip).
- Giao diện: hồ sơ cá nhân chỉ hiện môn học; bảng lớp giữ cột, ô ghi "Không học" nhạt (khác "-" vắng).

### 3.5 Khoá đổi lịch MT cuối tuần (R4.3) — [CHỐT] phương án ưu tiên, chờ Q6–Q8
- Một luật thuần `khoaCuoiTuan({ tuanGoc, tuanDich, homNay, laQuanTri })` ở `shared/domain/lichMt.ts` cạnh `kiemTuanXep` (`:86`): T6–CN (ngày nghiệp vụ giờ VN — `demoToday()` /
  `todayInBusinessTz`) và tuần gốc hoặc đích ∈ {tuần trước, tuần này, tuần sau} → câu lỗi; `laQuanTri` = vai gốc `system_admin` (`p.vaiGoc`, không theo quyền).
- Chốt máy chủ: trong `setSkillWeek` (bỏ qua `ghiBuDau` — lớp thường "-") + một dòng ở `createAttempt`, `setSkillScope`, `boTuanLuot`, `huyLuot`, `reopenAttempt`,
  `restoreCancelledSkill`, `khoiPhucKetQua`, 4 hàm S Ex; xem trước `kiemDotNoi` báo cùng câu. **Không** đặt trong `applyMove` / `xuLyVangMotKyNang` / `chotVangNgay` (ngoại lệ "-").
- Web: dùng lại chip "Tuần đã qua" + `title` lý do; hàng loạt báo lỗi từng em (đã có `dong.loi`). Không thêm câu đọc DB (chỉ so ngày + mã tuần đã có) → chi phí Turso ~0.

### 3.6 Điểm tiêu chí (R4.4) — [CHỐT], chạy ngay (P1)
- Tiêu chí W1 / W2 / S: số nguyên 0–9 ở `saveScore` (`attempts.ts:2284`), Dán Excel (`danExcel.ts:209`), hộp nhập (`chamDiem.ts:233`, `inputMode="numeric"`); câu lỗi "Tiêu chí là số nguyên 0–9".
  Band kỹ năng / Overall giữ x.5 (công thức không đổi). Dữ liệu cũ không sửa: lệnh chỉ đọc `kiem-tieu-chi-le` đếm ô cũ có tiêu chí lẻ (chủ SP chạy trên bản sao trước deploy).
  Ô cũ có tiêu chí lẻ vẫn đọc được; chỉ khi sửa ô đó mới phải nhập số nguyên.

### 3.7 Bộ đếm MT + thôi nhắc (R4.1) — chạy ngay (P2)
- **Một định nghĩa** (`shared/domain/lichMt.ts`): lượt MT tính = `kind='mock'`, không huỷ (`status != 'cancelled'`), không phải lượt mọi phần đã huỷ (cùng điều kiện `mocKeTiep`);
  **đã xong** = `status = 'done'` (kết quả đủ — `refreshOutcome`). Bộ đếm HV & Lớp "MT đã xong / tổng" (vd `3/4`); MT0 không tính. 0 lượt → "—".
- Thôi nhắc **xếp thêm** khi số MT đã xong ≥ số MT mặc định của lớp (`lichMtCua(...).length`): `chuaCoLichTiep` (Admin "HV chưa có MT tiếp theo") và gợi ý "MT{b} chưa xếp" (thay hằng 3 bằng độ dài lịch của lớp).
  Lượt đã tạo thêm (MT4…) vẫn có lịch / nhắc chấm bình thường; không giới hạn số MT (giữ `MT_TOI_DA`).

### 3.8 Ô chọn lớp dùng chung (R6.3b) — P4
- Component `ChonLop` (gõ → tìm → danh sách → chọn) dựa trên `OLopDich` / `ChonNguoi ds`; dòng phụ `phuLopDich` (mã · chương trình · chi nhánh · sĩ số); lọc chi nhánh / quyền / chương trình do nơi gọi truyền.
- Thay ở: `StudentManagePanel.tsx:325`, `XemTruocHangLoatPanel.tsx:115`, `PanelBuocTiep.tsx:187`, `congViec/PanelSauThi.tsx:190`, `IntakePanel.tsx:189`, `test/keHoach/{NganXepHangLoat:209, NganXepLichMt:253, XepTheoHocVien:304, NganXuatDiem:81}`.
  Cuối khoá (`BangLoTrinhTiep:325, 467`, `TransitionPanel:280, 416`) làm ở P9. Bộ lọc "Mọi lớp" (`StudentsPage` — #566, `PhanTich.tsx:107`, `PanelChamSpeaking` — SUA-CHAM-LAI) để sau.

### 3.9 Cuối khoá lớp thường (R5) — mockup P5 rồi P9
- Một không gian "Cuối khoá · lớp" (mở từ Công việc, hồ sơ lớp ⋯, hồ sơ HV — cùng nguồn, khác phạm vi một em / nhiều em — GPT 1): bảng em có checkbox + chọn tất cả + chọn nhóm (theo hướng gợi ý),
  thanh "Áp cho n em" (hướng · lớp đích bằng `ChonLop` cùng chi nhánh + "+ Mở lớp mới…" như `TransitionPanel` · tuần), ngoại lệ sửa ngay trên dòng; cột **Kết quả đầu ra** Đạt / Không đạt bấm tại chỗ,
  Không đạt mới hiện nguyên nhân + kỹ năng (chung cho nhóm em đã chọn); vùng cuối tóm tắt tác động (GPT 3); lỗi một phần giữ dòng lỗi (GPT 4, đã có `guiTheoLo`).
- **Cùng chi nhánh** cho luồng cả lớp [CHỐT 24/10 — thắng Rulebook §20.6 :788 / §20.7 :796 "khác chi nhánh được"]; máy chủ phải chặn (`transition.ts:162-181`, `raLenh`). Chuyển một em khác chi nhánh giữ (luồng cá nhân).
- Giữ quy chế §20.6–20.9: GVCN đề xuất, QL ra lệnh (không thẻ duyệt), bàn giao, lên FT: QL đánh kỳ vọng đầu ra → Case + Tutor 10 buổi khi lý do Trung tâm.
- Bỏ "Chuyển tiếp lớp" FT (menu ⋯ `hocVienLop.ts:684`, dải `DaiChuyenLop:37-41`, Kết thúc lớp › đi tiếp) sau khi dời `guiTheoLo`, `OTuan`, `NutHomNay`, `KHOI_VANG`, `OMt0` ra tệp chung; sửa phép kiểm prLcb / prOv3a / prCt / prLuiB.

### 3.10 KET / PET / TOEFL (R7) — nghiên cứu, chờ Q10
- Tách ba khái niệm: **trình độ lớp** (CEFR — nhãn chương trình), **kỳ thi** (A2 Key / B1 Preliminary / B2 First / TOEFL…), **thang kết quả / Target** (thuộc kỳ thi). Nguồn chính thức Cambridge
  (Key: R&W chung một bài, 4 điểm R W L S, thang 100–150, Grade A 140–150 / B 133–139 / C 120–132; Preliminary: R, W riêng, 120–170, A 160–170 / B 153–159 / C 140–152; First: 5 điểm, 140–190)
  và ETS (TOEFL iBT từ 21/01/2026 thang 1–6 bước 0.5; trước đó 0–120; Junior 600–900; Primary 100–115) — chi tiết + link: báo cáo nghiên cứu lưu ở mục 7.
- Đề xuất tối giản: hằng số kỳ thi ở `shared/domain/kyThi.ts` (kỹ năng, min / max / bước, cách tính tổng, mức Grade + CEFR); `programmes.cefr`, `programmes.ky_thi`; điểm thi thật nhiều thành phần
  ở bảng riêng `diem_thi_that(cycle_id, ky_nang, diem)`. Không quy đổi điểm giữa các hệ. Chưa làm TOEFL / B2 First khi chưa mở lớp.

### 3.11 Dịch chữ GV nhập (R8) — chờ Q11
- Nút "Dịch" chỉ hiện khi đoán ngôn ngữ chữ ≠ ngôn ngữ giao diện (đoán ở trình duyệt, không gọi AI: có `đ` hoặc ≥ 5 % chữ có dấu → vi; không dấu đếm từ quen; < 3 chữ cái / chỉ mã, số → không hiện nút).
- `POST /api/dich {bang, id, cot, den}`: máy chủ tự đọc chữ (không nhận chữ tuỳ ý), kiểm quyền như đường đọc, danh sách cột cố định (nhận xét Test, Case, PA, bàn giao), che tên / email / SĐT trước khi gửi,
  cache `ban_dich` theo sha256(ngôn ngữ đích + chữ đã che) — sửa gốc tự hết dùng bản cũ; trần / ngày / người bằng biến môi trường; lỗi / hết lượt → giữ bản gốc + "Thử lại". Không ghi đè chữ gốc.
- Khuyến nghị OpenAI `gpt-5.4-mini` (giá chính thức $0.75 / $4.50 mỗi 1 triệu token; ước ~$4 / tháng với 200 lần × 300 ký tự / ngày; đặt mức suy luận thấp nhất), model qua biến `DICH_MODEL`;
  Google Translation ~$26 / tháng sau 500 k ký tự miễn phí; DeepL Free điều kiện không rõ; LibreTranslate loại. Chủ SP tự tạo khoá (5 bước ở mục 7) — agent không nhập khoá.

## 4. Bảng ảnh hưởng (luật 1.2 của prompt)

| Nhóm | Dữ liệu | API / quyền | Giao diện | Việc / hạn / thông báo / bộ đếm | Báo cáo | Dữ liệu cũ | Sửa sai |
|---|---|---|---|---|---|---|---|
| 3.1 Trạng thái | `archived_at` cho cả `inactive`; status giữ | `setStudentStatus`, `archiveStudent`, hàng loạt `luu-tru`, `unarchive` mở cho inactive | 1 nút, hộp nhỏ; Lưu trữ có Quay lại học | em tạm dừng hết việc / nợ (đã), thêm: rời lưới FT; Case giữ dừng hạn [HỎI Q1] | lịch sử giữ (không lọc); "Thi tháng này" bỏ em tạm dừng (đã vậy) | em `inactive` hiện có: migrate một lần đặt `archived_at`? → [HỎI Q1] | Hoàn tác 10 s; Quay lại học từ lưu trữ; hoàn tác xoá `archived_at` (E10) |
| 3.3 Lộ trình mới | cột route "khac" + tên; đầu vào chép từ thi thật; lý do đóng Case mới | `moLoTrinhMoi`, Bước tiếp | panel một luồng | việc KQ / Bước tiếp hết khi chọn; MT mới có việc mới; Case cũ đóng → hết việc PA | Hiệu quả PA không tính Case đóng do kết thúc lộ trình | lộ trình đã mở trước: không đổi | Hoàn tác Bước tiếp (đã có — sửa theo 2 hướng); lưu hai lần → khoá theo lộ trình (đã có `tx`) |
| 3.4 Môn đăng ký | `mon_dang_ky` + `bo_task` | sửa thông tin, sửa cả lớp, lộ trình mới; mọi hàm chấm / nợ / đánh giá | ô "Không học" | không việc / nợ / nhắc cho môn không học; Overall "Không đủ bộ môn" | tỷ lệ đạt chỉ môn đăng ký; Overall thiếu → ngoài mẫu (như "Chưa đủ dữ liệu") | NULL = đủ môn (không đổi gì) | đổi lại môn → nhật ký trước → sau; không xoá điểm cũ |
| 3.5 Khoá lịch | không | ~13 hàm dịch vụ + xem trước; vai `system_admin` | chip lý do, nút tắt | không đổi việc; thẻ "Dời lịch Test" [HỎI Q7] | không | không | thứ Hai mở lại; Quản trị làm thay |
| 3.6 Tiêu chí | không | `saveScore`, `luuDiemLo`, Dán Excel | câu lỗi tại ô | không | không | ô cũ x.5 giữ; đếm bằng lệnh chỉ đọc | nhập lại số nguyên |
| 3.7 Bộ đếm MT | không | `hocVienLop`, `keHoachTest`, `tongQuanMt` | "MT 3/4" | Admin "HV chưa có MT tiếp theo" giảm (em đã đủ MT mặc định); gợi ý MT kế theo lịch lớp | không | không | — |
| 3.8 Ô chọn lớp | không | không (dùng nguồn sẵn) | 9 ô `<select>` → `ChonLop` | không | không | không | — |
| 3.9 Cuối khoá | không (gộp hai KQĐR → [HỎI Q9]) | chặn khác chi nhánh ở `transition` / `raLenh` (luồng cả lớp) | không gian một bảng | việc "Chốt lộ trình · lớp" giữ một việc | không | lệnh đã ra khác chi nhánh giữ nguyên | Huỷ quyết định (đã có), Hoàn tác |
| P12 Báo cáo lịch sử | thêm `thi_that_target` (Target lúc nhập KQ) | `giaoVien.ts`, `ketQuaThi.ts`, `baoCao.ts` | không | không | MT so `target_at_attempt`; thi thật một luật lớp; Chấm điểm theo trạng thái tại kỳ | backfill `thi_that_target` = Target hiện tại cho lộ trình đã có KQ (ghi rõ) | — |

## 5. Đánh giá 10 đề xuất GPT (mục 9 prompt)

| # | Đề xuất | Nhận | Lý do / chi phí |
|---|---|---|---|
| 1 | Một trải nghiệm cuối khoá mọi lối vào | **Có** — 3.9 | giảm 2 panel trùng (TransitionPanel, BangLoTrinhTiep, HopKetQua, TabDauRa) |
| 2 | Áp chung rồi sửa ngoại lệ | **Có** — 3.9 | đã có mẫu ở TransitionPanel |
| 3 | Tóm tắt tác động ở vùng cuối | **Có** — 3.3, 3.9 | chỉ hành động lớn; không thêm màn xác nhận |
| 4 | Hàng loạt lỗi một phần dễ sửa | **Có** | đã có `guiTheoLo`, dùng lại |
| 5 | Một nơi cấu hình môn có hiệu lực + lịch sử | **Có** — 3.4 | theo lộ trình, nhật ký |
| 6 | Đóng Case lý do riêng | **Có** — 3.3 | thêm một lý do đóng; báo cáo PA bỏ qua |
| 7 | Lưu trữ có tóm tắt | **Có, nhỏ** | một dòng đầu hồ sơ lưu trữ (lộ trình gần nhất · Target · thi thật · kết quả · ngày kết thúc); chi tiết đã có |
| 8 | Một hàm quyết định sửa lịch | **Có** — 3.5 | không thêm câu DB |
| 9 | Bảng giữ ngữ cảnh khi xử lý | **Có** — tiêu chí nghiệm thu P9 | không làm riêng |
| 10 | Mẫu số minh bạch | **Có** — 3.7 (0 lượt "—"), panel chỉ đọc đã có | — |

## 6. Câu hỏi cho chủ SP (chỉ điều đổi kết quả; khuyến nghị đứng đầu)

> **Chủ SP 25/10: chọn khuyến nghị cho cả 12 câu** → luật `plan.md` 1.6 N11–N19. Các khuyến nghị dưới đây giờ là quyết định.

1. **Q1 — Tạm dừng vào Lưu trữ:** em tạm dừng (có thể quay lại) vẫn **giữ chỗ lớp + lộ trình đứng yên + Case dừng hạn** như hiện nay, chỉ thêm vào Lưu trữ cho khỏi rối danh sách? *(khuyến nghị: có — quay lại học về đúng lớp, không mất gì; em đang tạm dừng hiện có cũng vào Lưu trữ khi deploy)*
2. **Q2 — PA đang chạy khi mở lộ trình mới:** kết thúc PA với kết quả "Dừng — kết thúc lộ trình" (không tính hiệu quả PA), Case đóng lý do "Kết thúc lộ trình"? *(khuyến nghị: có)*
3. **Q3 — Lộ trình "Khác":** có Target và thi thật như LT / RF không? *(khuyến nghị: Target tuỳ chọn, thi thật như LT; 0 MT)*
4. **Q4 — Chỉ học W1 hoặc chỉ W2:** điểm Writing = điểm task đã học, Overall "Không đủ bộ môn"? *(khuyến nghị: có)*
5. **Q5 — Bỏ môn giữa lộ trình:** bài môn đó đã xếp chưa thi → bỏ khỏi đợt (giữ lịch sử); bài đã chấm giữ; Case đang mở của môn đó đóng lý do "Không còn học môn"? *(khuyến nghị: có)*
6. **Q6 — Khoá lịch cuối tuần áp cho:** MT (gồm MT0 và S Ex), **không** áp Progress / Final / Checkpoint lớp thường? *(khuyến nghị: có)*
7. **Q7 — Cuối tuần QL vẫn duyệt / từ chối thẻ "Dời lịch Test", Khôi phục phần thi vắng, "Không mock lại"** (thuộc cơ chế vắng, thẻ có hạn)? *(khuyến nghị: được)*
8. **Q8 — Đường gián tiếp** (chuyển lớp, đổi mốc lớp, mở lộ trình mới, áp lịch mặc định) làm lịch MT trong 3 tuần đổi theo: cho chạy cuối tuần? *(khuyến nghị: cho — chặn sẽ kẹt cả luồng; ghi nhật ký như cũ)*
9. **Q9 — Kết quả đầu ra lớp thường:** gộp thành MỘT cột trong không gian cuối khoá: Đạt / Không đạt theo Final (máy gợi ý, GVCN / QL chốt tại chỗ), riêng em lên FT thêm kỳ vọng MT0 → Case + Tutor 10 buổi khi lý do Trung tâm (Rulebook §20.6); bỏ tab "Đánh giá đầu ra" riêng? *(khuyến nghị: có)* → **Sửa 25/10 (chủ SP, theo quy chế lớp thường):** Kết quả đầu ra máy tự ghi theo Final; chỉ em Lên FT đánh dấu kỳ vọng (QL).
10. **Q10 — KET / PET:** (a) có Target + kết quả thi thật (theo điểm Cambridge 100–150 / 120–170, hay theo mức Grade)? (b) Checkpoint giữ 2 môn gộp hay tách 4 môn như kỳ thi thật? (c) B2 First / TOEFL đã mở lớp chưa? *(khuyến nghị: Target theo điểm Cambridge; tách R W L S; chưa làm B2 / TOEFL)*
12. **Q12 — Bài Speaking chấm chéo chưa ai nhận** (12 bài MT1 W1 JUL ở MB FT 101 / 105): Tổng quan Admin đang tính là "quá hạn 68 ngày" (dòng "Chưa có GV", #567) trong khi luật T18 nói chấm chéo không tính quá hạn. Ô quá hạn của Admin có nên bỏ bài chấm chéo ra (chỉ đếm "chờ chấm")? *(khuyến nghị: bỏ ra khỏi quá hạn, vẫn hiện "Chưa có GV · 12 bài chờ chấm")*
11. **Q11 — Dịch:** đồng ý gửi chữ GV (đã che tên) sang OpenAI; dịch nhận xét Test, Case, PA, bàn giao; trần 300 lần / ngày toàn trung tâm? *(khuyến nghị: có — chủ SP tự tạo khoá theo 5 bước mục 7)*

Đã tự quyết (chủ SP xem khi đọc): cùng chi nhánh cho luồng cả lớp thắng Rulebook cũ · cột Việc QL: 3 dòng mặc định, "Xem thêm" mở hết (≤ 5 dòng môn + 1 dòng việc không gắn môn) ·
dữ liệu Góp ý hàng tuần giữ trong DB + Lịch sử, chỉ gỡ khỏi giao diện · tiêu chí cũ x.5 không sửa · KET / PET chưa làm gì tới khi trả lời Q10.

## 7. Kế hoạch PR

| PR | Phạm vi | Phụ thuộc | Duyệt | Trạng thái |
|---|---|---|---|---|
| **P1 DIEM-TIEU-CHI** | 3.6 | — | PTA rà + merge | plan `docs/superpowers/plans/2026-10-24-p1-diem-tieu-chi.md` · prompt 25/10 |
| **P2 MT-DEM** | 3.7, E4, E5 | — (chỉ máy chủ; web nhãn `DanhSachHvLop` là tệp #566 — không chạm) | PTA rà + merge | plan `…/2026-10-24-p2-mt-dem.md` · prompt 25/10 |
| **P3 UI-CHUNG** | 6.2, 6.3a, 6.4a, 6.4b | — | PTA rà ảnh + merge | plan `…/2026-10-24-p3-ui-chung.md` · prompt 25/10 |
| P4 CHON-LOP | 3.8 (9 ô) | — | PTA rà ảnh | plan `…/2026-10-24-p4-chon-lop.md` · chạy khi có chỗ |
| **P5 MOCKUP-V6** | mockup 3.1–3.4, 3.9 + hồ sơ lưu trữ | — | **chủ SP duyệt** | plan `…/2026-10-24-p5-mockup-v6.md` · prompt 25/10 |
| P6 KHOA-LICH | 3.5 | Q6–Q8 (làm theo khuyến nghị, nháp tới khi trả lời) | PTA + rà sâu `/code-review high` | sau P2 (chung `keHoachTest.ts`) |
| P7 SV-LO-TRINH + UI | 3.1–3.3, E1–E3, E9, E10 | Q1–Q3, mockup P5 | chủ SP duyệt ảnh; rà sâu (dữ liệu) | đợi |
| P8 MON-DANG-KY | 3.4 | Q4–Q5, mockup P5 | rà sâu | đợi |
| P9 CUOI-KHOA | 3.9, R5.3 | Q9, mockup P5, P4 | chủ SP duyệt ảnh | đợi |
| P11 VIEC-DUNG-VAI | R6.1 | #566 merge | PTA rà ảnh | đợi |
| P12 BAO-CAO-LICH-SU | E6–E8 + `thi_that_target` | sau SUA-CHAM-LAI (chung Tổng quan / Phân tích GV) | rà sâu (migrate) | đợi |
| P13 KET-PET | 3.10 | Q10 | — | đợi |
| P14 DICH | 3.11 | Q11 + khoá OpenAI | rà bảo mật `/security-review` | đợi |

Cách làm dịch (chủ SP tự làm khi đồng ý Q11): (1) platform.openai.com → Billing nạp $5–10, Limits đặt ngân sách tháng + email cảnh báo; (2) Project "PISA" → API keys → Create secret key, chép ngay;
(3) Netlify › Site configuration › Environment variables: `OPENAI_API_KEY` (chỉ Functions, không tiền tố `VITE_`), `DICH_MODEL=gpt-5.4-mini`, `DICH_TRAN_NGAY`, `DICH_TRAN_NGUOI`;
(4) deploy lại, bấm Dịch thử, xem Usage; (5) muốn tắt: `DICH_TAT=1` hoặc xoá khoá.

Nguồn KET / PET / TOEFL / dịch (báo cáo nghiên cứu 24/10): Cambridge [Key](https://www.cambridgeenglish.org/exams-and-tests/qualifications/key/format/) ·
[Preliminary](https://www.cambridgeenglish.org/exams-and-tests/qualifications/preliminary/format/) · [First](https://www.cambridgeenglish.org/exams-and-tests/qualifications/first/format/) ·
[Results](https://www.cambridgeenglish.org/exams-and-tests/qualifications/results/) · ETS [iBT score scale update](https://www.ets.org/toefl/institutions/ibt/score-scale-update.html) ·
[Junior scoring](https://www.ets.org/toefl/junior/scoring-reporting.html) · OpenAI [pricing](https://developers.openai.com/api/docs/pricing) · Google [Translation pricing](https://cloud.google.com/translate/pricing) ·
DeepL [API Free](https://support.deepl.com/hc/en-us/articles/360021200939-DeepL-API-Free). Giá / thang đọc ngày 24/10/2026 — kiểm lại trước khi cấu hình.

## 8. Tình huống nghiệm thu
Rà tài liệu: agent "builder check" (skill brainstorming) dừng giữa chừng vì hết lượt dùng — PTA Plan tự rà lại theo góc người làm; các điểm builder có thể hỏi đã đưa vào Global Constraints / Review Focus của từng plan.

Bảng 10.3 của prompt là tiêu chí chung; mỗi PR chép các dòng của mình vào mô tả PR và ghi kết quả (đã thử / chưa thử, vai, bản nào). Build / test xanh không đủ — PR giao diện phải bấm thử đủ vai bị ảnh hưởng.
