# Đặc tả làm lại giao diện (overhaul) — 23/09/2026 tối

**Trạng thái:** chủ sản phẩm duyệt mockup 13, 14, 15, 17 và góp ý 16, Hành trình, màu (23/09 ~22:30). Mockup 16 v2 và 18 đang dựng lại theo góp ý.
**Bối cảnh:** bản chính deploy tối 23/09 nhưng **chưa báo giáo viên**; overhaul chạy song song, xong phần nào deploy lại phần đó; xong hết mới báo GV.
**Nguồn thắng khi lệch:** file này > mockup 13–18 (phương án ghi ở đây) > đặc tả 2026-09-22 (§1 G-1…G-12 vẫn áp) > THUAT_NGU_DA_CHOT.
**Thay đặc tả 22/09 §3.5:** Kế hoạch Test FT xếp **từng kỹ năng L · R · W · S** (không còn cặp RLW / S); lớp thường xếp **theo từng học viên như FT** (không còn "theo lớp" + nút "Dời một môn"); khu Test bỏ tab **Cần chấm**.

## 1. Luật nền (PR-UX0, làm trước)

| Mã | Luật |
|---|---|
| N-1 Màu | Giao diện thật phải **rõ như mockup**. Dùng bộ token màu nghĩa (đạt/tiến bộ · chưa đạt/SOS · quá hạn · sắp tới hạn · đang làm · đã xong · chờ người khác · trung tính · hàng lớn/hàng con · ô sửa được/chỉ đọc) theo bảng ở mockup 18 phần (b). Chữ tương phản ≥ 4.5:1. Một chỗ khai báo, mọi màn dùng token. |
| N-1b Màu kết quả Test | Chủ sản phẩm 23/09: kết quả Test **luôn có màu mã hoá** ở mọi nơi hiện kết quả (bảng Tổng hợp Test + SOS, Lịch Test, lưới chấm, hồ sơ HV, Hành trình): **Đạt** = `--ok` (xanh lá) · **SOS 1** = `--soon` (vàng) · **SOS 2** = `--late` (cam) · **SOS 3** = `--bad` (đỏ) · Tạm thời / Chưa đủ điểm = `--muted` (xám, viền đứt). Khai báo alias `--sos1 --sos2 --sos3 --dat` trong cùng chỗ với token N-1, có chú giải màu ở đầu bảng Tổng hợp. Ở bảng Tổng hợp, cột Đạt / SOS1 / SOS2 / SOS3 tô chữ + nền nhạt theo màu đó (ô 0 thì xám). |
| N-2 Hàng lớn/nhỏ | Mockup 17 **phương án A**: hàng lớn nền sáng hơn một bậc + vạch màu 3px bên trái + chữ đậm; hàng con thụt 16px, nền tối hơn, chữ nhỏ hơn; số tổng của hàng lớn thẳng cột. Một component dùng chung, áp **mọi nơi có mở rộng** (8 chỗ liệt kê ở mockup 17). |
| N-3 Badge | Gọn thông tin, không phình: một badge = một trạng thái ngắn (≤ 3 từ + số: "Quá hạn 5 ngày", "Chờ chấm", "Đã ổn"). Việc cần làm là tiêu đề dòng, không nằm trong badge; hạn đặt ở dòng phụ/cột riêng ("hạn CN 30/08"); ⚠ chỉ cho quá hạn (G-4), nằm trong chữ; bản đầy đủ vào tooltip. **Vẫn dùng badge** ở chỗ trạng thái cần nổi (quá hạn, SOS, chưa có PA, đã chấm). Sửa 4 gốc: `shared/domain/display.ts:241-306`, `server/src/worklist/mywork.ts`, `web/src/modules/worklist/WorkList.tsx:38-94`, `web/src/ui/ui.tsx:195` (Alert tự gắn ⚠); rồi bảng 26 dòng ở mockup 17. Badge hộp lớp: "9 bài chờ chấm". |
| N-4 Khuôn panel | Mockup 15: mọi form/ngăn là **ngăn phải** 560px (form dạng bảng 720px), 375px thành toàn màn · đầu panel một dòng: tiêu đề · tên HV · lớp · thân chia khối có tiêu đề nhỏ, nhãn trên ô, tối đa 2 ô/hàng khi thật ngắn · chữ phụ ≤ 1 dòng, luật dài vào ⓘ · chân panel cố định (phụ trái, chính phải) · chỉ thân cuộn · mở việc khác thì **thay nội dung**, không chồng panel (G-8) · không chữ dev ("(B05)", "[khoá]"), không placeholder giống dữ liệu, lỗi chỉ hiện sau khi gõ · ngày không lặp năm, tuần dạng `W4 SEP`. |

## 2. Test (PR-UX1 Lịch Test, PR-UX2 Kế hoạch Test)

**Khu Test còn 2 tab: Lịch Test · Kế hoạch Test.** `/test/can-cham` chuyển hướng sang Lịch Test (giữ `classId`/`kn`). GV mặc định vào Lịch Test, lọc "Lớp tôi dạy".

**Lịch Test (mockup 13, phương án B):**
- Một hàng: `‹ 14/09–20/09 · W3 SEP ›` + **Tuần này** + Chi nhánh (+ "Lớp tôi dạy / Tất cả" cho GV).
- Dải số bấm được: đã chấm x/y · còn phải chấm · nợ tuần trước (n bài · m lớp) · quá hạn.
- Khối **Nợ tuần trước** (thay Cần chấm): lớp · đợt · kỹ năng · còn n bài · hạn · nút Chấm mở lưới ngay dưới dòng (không dạy môn đó thì "Xem").
- Tab nhỏ **Fast Track · n lớp | Lớp thường · n lớp**.
- Mỗi lớp là một hàng lớn (N-2): mã · đợt · chi nhánh · tiến độ "12/20 bài" · hạn chấm · một badge ("Chờ bạn chấm" / "Chờ GV khác" / "Đã chấm ✓"). **Mặc định thu gọn, tự mở lớp còn bài của người xem.** Mở ra là **danh sách học viên có điểm, nhập tại chỗ** — dùng lại luật lưới chấm hiện có (`/classes/:id/cham?periodId=`): FT L/R gõ số câu → band, W1/W2/S hộp tiêu chí, "-" vắng (FT dời sau Chủ nhật), sửa ô có điểm cần lý do, đợt hoàn tất khoá (QL sửa có lý do); lớp thường `đúng/tổng`, ô tổng ↓, chưa đạt đỏ nhẹ, "-" dời ngay. Ô môn mình dạy sửa được, môn khác chỉ đọc; kỹ năng không thi tuần này mờ + tuần thi. Nút nhỏ "Mở lưới đầy đủ".
- 375px: một kỹ năng một lúc.

**Kế hoạch Test (mockup 14, phương án B):**
- Hàng: Chi nhánh + **ô tìm lớp có gợi ý** (thay ô chọn lớp dài) · tab Fast Track | Lớp thường · "Xếp lịch hàng loạt…".
- FT: lưới HV × MT1…MT5; mỗi đợt **4 kỹ năng L R W S xếp riêng** (W = chấm W1 + W2, ⓘ). Ô cùng tuần gộp "L R W S · W3 SEP"; khác tuần tách dòng; đợt thi xong gọn "Xong ✓"; ô cao cố định 2 dòng. Bấm chip đổi tuần một kỹ năng (hộp có ô bỏ kỹ năng khỏi đợt).
- Panel **Xếp lịch hàng loạt** ~720px: Đợt → Học viên (ô tích + Chọn cả + tình trạng hiện có) → Kỹ năng 4 dòng (ô tích + bộ chọn tuần, "Chọn cả 4 kỹ năng", "Áp một tuần cho mọi kỹ năng đã chọn") → Xem trước (em · kỹ năng · tuần cũ → mới · cảnh báo/chặn trùng T15) → chân "Lưu lịch cho 4 em · 16 bài".
- **Lớp thường như FT:** lưới HV × Giữa khoá | Cuối khoá, mỗi đợt 4 chip L R W S, cạnh tuần ghi **tuần trong chương trình** "W3 SEP · tuần 5/10" (FOU 8 tuần: W4, W8; BE/ELE 10 tuần: W5, W10). Hàng đầu lớp "Xếp cả lớp theo đề xuất". Dùng chung panel (đợt = Giữa/Cuối khoá). Bỏ nút "Dời một môn" (GV ghi "-" ở lưới chấm; QL đổi tuần ở đây).
- Máy chủ: `keHoachTest.ts` nhận tuần theo từng kỹ năng (dữ liệu `skillSchedule` đã theo kỹ năng, không đổi bảng); lớp thường thêm đường dữ liệu theo HV × kỹ năng; nhãn "tuần n/N" cho tuần bất kỳ.

## 3. Panel ở Học viên & Lớp (PR-UX3)

Vẽ lại theo N-4 đúng mockup 15: Tạo Case (kể cả nhập bù), Thẻ Case, Ghi kết quả PA, Điều chỉnh/Thay PA, Ghi nhận vi phạm, Phương án xử lý, Chuyển lớp một em, Lộ trình tiếp theo; cùng Sửa phân công GV, Thêm HV hàng loạt nếu kịp. Kèm lỗi thấy khi chụp hiện trạng: dòng việc lớp thường ghi "MT1" (phải "Giữa khoá") · `SkillBoard.tsx:654` hạn "thực hiện PA" đặt dưới nhãn "cập nhật kết quả" · "Quá hạn xếp lớp tiếp" luôn ⚠ dù không hạn · form Case đã xong còn chữ "Đã tốt hơn hẳn…" · ⋮ HV lớp thường còn "Kết luận lộ trình" · hồ sơ HV một hạn 30/08 nói 4 lần, "Đang xử lý" 2 lần. Ảnh hiện trạng: `thiet-ke/anh/hien-trang-23-09/`.

## 4. Phân tích (PR-UX4 — chờ mockup 16 v2)

Chủ sản phẩm chốt 23/09:
- Thứ tự góc nhìn: **Tổng hợp Test + SOS (mặc định)** · **Tổng hợp vấn đề HV** · **Hiệu quả PA** · **Ý thức & Phối hợp** · Danh sách Case. Bỏ "Chưa ai nhận".
- **Tổng hợp vấn đề HV** (thay ma trận Vấn đề học viên): vấn đề là **nguyên nhân / loại lỗi** theo danh mục `ISSUE_TAXONOMY` (lỗi chính + phụ của Case), **không** phải "kỹ năng dưới ngưỡng" (đó là SOS, đã ở Tổng hợp). Hàng lớn kỹ năng → hàng con loại lỗi: số HV · số lớp · lớp nhiều nhất · so với lần Test trước · cột "Lỗi phổ biến". Công tắc gộp loại lỗi chung (Ngữ pháp của R+W+S, đếm HV không trùng). Dòng "Chưa phân loại" nổi rõ. Không có nút "Giao bổ trợ" (không có trong quy trình) — chỉ mở danh sách HV/Case.
- **Hiệu quả PA** (phương án A): bỏ cột "Không cải thiện"; "Thời gian thường mất" → **"Thời gian trung bình"**; giữ cỡ mẫu, "Ít dữ liệu" < 5.
- **Ý thức & Phối hợp**: "Em cần leo thang" → **"Học viên cần chú ý"**; bỏ khối "Phối hợp SOS chưa xong"; giữ "Lớp nhiều vi phạm".
- Việc của "Chưa ai nhận" đáng giữ (HV trượt 2 lần liền không có Case mở; tín hiệu lớp thường bị Bỏ qua mà em vẫn trượt lần sau) chuyển thành 2 dòng trong khối **Cần xử lý** ở Tổng quan QL và một bộ lọc ở Danh sách Case — không làm góc nhìn riêng.

## 5. Hành trình học viên (PR-UX5 — chờ mockup 18a)

Giữ mô hình hiện tại. **Không vẽ đường điểm (sparkline)** — chủ sản phẩm bỏ 23/09. **Chuỗi điểm nằm trong cột tên, ngay sau tên kỹ năng, cùng dòng, thẳng một cột dọc giữa các hộp** (chủ sản phẩm 23/09 — vùng trục chỉ còn badge trạng thái / "Không có Case"). Sửa: điểm **lên/xuống rõ ngay trong chuỗi điểm** (▲ xanh / ▼ đỏ / = xám + mức chênh, điểm dưới kỳ vọng đỏ, màu kết quả theo N-1b, ghim đợt Test ghi điểm); **trải hết chiều ngang** (cột tuần giãn theo màn), công tắc "Xem gọn" mới thu hẹp; **không chữ bị cắt/chồng** (tên vấn đề 1 dòng + tooltip, dòng phụ riêng, khối PA hẹp chỉ hiện dấu kết quả).

## 6. Chia PR và thứ tự

| PR | Phạm vi | Phụ thuộc | Model (B) | Rà |
|---|---|---|---|---|
| **UX0** Nền giao diện | §1 N-1…N-4: token màu, component hàng lớn/nhỏ, khuôn `<Panel>`, 4 gốc badge | Z2c-c merge trước (chung `Filters`/`ScoreEntry`?) — kiểm | Opus 5.5 · High (Sonnet 5 · High) | Fable 5.1 |
| **UX1** Lịch Test | §2 Lịch Test + bỏ Cần chấm | UX0 (dùng component hàng) | Opus 5.5 · High | Fable 5.1 |
| **UX2** Kế hoạch Test | §2 Kế hoạch Test (máy chủ + web) | Rc2 đã merge; song song UX1 (khác file) | Opus 5.5 · High | Fable 5.1 |
| **UX3** Panel + badge toàn web | §3 + phần còn lại của N-3 | UX0 | Opus 5.5 · High | Fable 5.1 |
| **UX4** Phân tích v2 | §4 (máy chủ + web) | mockup 16 v2 duyệt; UX0 | Opus 5.5 · High | Fable 5.1 |
| **UX5** Hành trình | §5 | mockup 18a duyệt; UX0 | Opus 5.5 · High | Fable 5.1 |

Quy trình nhanh như các PR trước (không rà từng task bằng subagent; `npm run check` mỗi task, một lần một lúc; bấm thử bằng **ảnh thật** theo vai + 375px một lần cuối; rà PR một lượt khác model). Người code ưu tiên **Opus 5.5** — PR giao diện vừa qua chạy Sonnet lọt nhiều lỗi hình.
