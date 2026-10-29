---
name: PISA Progress
description: Bàn làm việc của giáo viên — theo dõi Test, điểm, Case cho trung tâm IELTS
colors:
  bg: "#050a16"
  surface: "#111c33"
  surface-2: "#172440"
  line: "#22324f"
  line-strong: "#33496f"
  text: "#e7edf7"
  accent: "#9cbde7"
  accent-strong: "#bdd3ef"
  hong: "#f57aae"
  dieu-huong-nen: "#0a1a3a"
  ok: "rgb(148 209 174)"
  bad: "rgb(232 154 140)"
  late: "rgb(232 154 140)"
  soon: "rgb(228 199 132)"
  doing: "rgb(156 189 231)"
  done: "rgb(158 172 200)"
  muted: "rgb(186 198 222)"
  text-dim: "rgb(186 198 222)"
  text-faint: "rgb(158 172 200)"
  sos1: "rgb(204 185 109)"
  sos2: "rgb(154 102 51)"
  sos2-nen: "#5a320f"
  sos3: "rgb(213 123 113)"
  sos3-nen: "#a33d2d"
  da-thi-bg: "rgb(22 35 46)"
  light-bg: "#f3f5f9"
  light-surface: "#ffffff"
  light-surface-2: "#f2f4f9"
  light-text: "#141a2b"
  light-accent: "#273c8f"
  light-hong: "#f25a98"
typography:
  body:
    fontFamily: "'Be Vietnam Pro', system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 400
  label:
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
  table-head:
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
  table-cell:
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
  page-title:
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
  group-row:
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 800
  work-object:
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
  chip:
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "22px"
  scale:
    note: "Thang chữ V5 (G13, tailwind fontSize): 12 · 13 · 14 · 15 · 17 · 22 · 28 px — 14 lưới dày, 17 tiêu đề khối / panel, 28 số lớn đều trong thang"
rounded:
  note: "Bán kính trong thang: 2 px badge lịch thi · 3–4 px chip / ô sửa · 6 px ô nhập nhỏ · 8 px nút / ô · 9–12 px thẻ / panel · pill; vạch trái 3–4 px = đang chọn / hàng nhóm (G14), không phải side-tab trang trí"
  chip-square: "0.25rem"
  field: "0.5rem"
  card: "0.75rem"
  pill: "9999px"
spacing:
  btn: "0.45rem 0.85rem"
  btn-sm: "0.25rem 0.6rem"
  field: "0.45rem 0.6rem"
components:
  button:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
    rounded: "{rounded.field}"
    padding: "{spacing.btn}"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#060c1a"
    rounded: "{rounded.field}"
    padding: "{spacing.btn}"
  field:
    backgroundColor: "#0b1427"
    textColor: "{colors.text}"
    rounded: "{rounded.field}"
    padding: "{spacing.field}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
  chip-tron:
    rounded: "{rounded.pill}"
    typography: "{typography.chip}"
    height: "22px"
  chip-vuong:
    rounded: "{rounded.chip-square}"
    typography: "{typography.chip}"
    height: "22px"
---

# Design System: PISA Progress

> Bản ghi hệ giao diện **đang có** (nguồn: `web/src/index.css`, `web/src/ui/`), không phải thiết kế mới. Token gốc nằm trong
> `index.css` — khi lệch, `index.css` đúng. Đổi phông, bảng màu, bố cục phải qua kế hoạch PR + mockup duyệt (CLAUDE.md).
> **Thứ tự đọc (TL-V5, 24/10):** mục "Luật V5" (mới nhất, thắng khi khác) → "Luật 21/10" → phần mô tả bên dưới. Bảng mẫu sống: `/dev/thanh-phan`
> (`web/src/modules/dev/BangMauV5.tsx`, theo `thiet-ke/v5/bang-mau.html`).

## Luật V5 (22–24/10 — mockup `thiet-ke/v5/` #507–#510 + `docs/superpowers/specs/2026-10-22-overhaul-v5/` `04`, `10`; đã vào mã #528–#561)

| # | Luật | Nguồn |
|---|---|---|
| V1 | **Nâng cấp, không chép mockup:** giữ mọi thao tác V4 (Nhập điểm, + Case, ⋯, Xuất, Dán Excel…), sửa đồng bộ cả phần mockup không vẽ (panel, hộp, popover, chân lưu, rỗng / lỗi); xung đột → [XM] | `10` mục 8; CLAUDE.md |
| V2 | **Màu PISA từ logo:** xanh `#273C8F` (cấu trúc: thanh điều hướng `--dieu-huong-*`, nút chính sáng) · hồng `--hong` chỉ để **nhận diện** (logo, chữ khớp khi tìm) — hồng KHÔNG mang nghĩa lỗi / SOS. Tối: xanh bớt ngả tím, nền `#050a16` (P3) | `04` M19; `10` P3 |
| V3 | **Logo:** chữ "PISA" hồng đậm + "TRACKING" mảnh giãn chữ, không ảnh logo trung tâm; "TRACKING" trắng cả ở chế độ sáng vì thanh vẫn nền xanh (chữ đen 2,1 : 1 — [XM] #545) | `10` mục 8; #545 |
| V4 | **Bốn nhóm badge, một cỡ** (cao 22, chữ 12 / 600, `ui/Nhan.tsx`): ① kết quả học tập `NhanKq` — góc 4 px, viền 1 px màu nghĩa, ✓ ✗ – đứng đầu · ② lịch thi `NhanLich` — nền xanh lơ đặc, góc 2 px ("Đã thi · chờ KQ" không nhầm Đạt) · ③ tiến độ xử lý `Nhan` — viên tròn nền xám + chấm màu; sắp hạn / quá hạn nền nhạt + ⚠ · ④ mức SOS `ChipSos` / `lopSos` | `04` M12 (C23); #528 NEN-V5 |
| V5 | **SOS 1 · 2 · 3 = rỗng · nền vừa · đặc (MAU-MUC, chủ SP 28/10 — thay P6):** mức tách bằng ĐỘ ĐẶC nền trước, màu (vàng → cam → đỏ, không hồng) sau; mọi chip SOS, ô đếm hàng lớp, làn Case biểu đồ D đi qua một chỗ (`lopSos` / `MAU_THANH_SOS`). SOS 1 viền mảnh vàng trên nền thẻ · SOS 2 nền cam vừa `--sos2-nen` + viền 1 px · SOS 3 nền đỏ đặc `--sos3-nen` chữ trắng; cùng viền 1 px, chữ 600. Nền hai mức liền nhau cách ΔL ≥ 0,10, chữ / nền chip ≥ 4,5 (đo `thiet-ke/v7/kiem-mau-muc.py`, kể cả giả lập deutan / protan). Tạm = giữ nền của mức + viền đứt + chữ "tạm". Rê chuột chip có nền: sáng lên, không đổi nền | `thiet-ke/v7/mau-muc.html`; P6 cũ |
| V6 | **Ít chữ (P1):** không câu giải thích luật / cách tính trên màn chính → dấu **"?"** (`NutLuat`) hoặc ⓘ; chú thích trong mockup không lên web | `10` P1 |
| V7 | **Phân cấp (P2):** nhãn nhỏ xám / giá trị đậm (`NhanGt`, dòng thông tin đầu hồ sơ), chính trước phụ, dữ liệu tách thao tác; không lạm dụng badge | `10` P2 |
| V8 | **Hạn = ngày thật** `hạn 28/10` (P7), không thứ, không "tuần này / tuần sau"; tháng thi dự kiến luôn kèm năm `Dự kiến 02/2027` (P5); "Thi tháng này" thay "Thi tuần này" (P4) | `10` P4, P5, P7 |
| V9 | **Thời gian tự do (P9):** Từ tuần → Đến tuần; Phân tích thêm **Toàn bộ** · **Chọn khoảng tuần**, không trần 52 tuần (#558); hồ sơ GV mặc định 4 tuần; ô chọn một tuần `‹ W3 SEP ›` + **Tuần này** (#560) | `10` P9 |
| V10 | **Trang đầu mọi vai = Tổng quan tình hình** (3–4 chỉ số + khối theo vai + cột "Chờ bạn duyệt" / **Điều hướng**), không form làm việc; việc làm ở **Công việc** (GV, TVV có Công việc riêng, Admin, QL). Thay G3 | `04` M1, M2 (C04, C05); #551 |
| V11 | **Số → panel giải thích đúng số (bản M6, chủ SP 27/10 — thay C22 "chỉ đọc"):** tên, phạm vi, ngày dữ liệu, tổng + đơn vị, danh sách đúng tập tạo ra số, Cách tính. Dòng mà người xem **có quyền làm** → bấm mở việc ngay trong CÙNG panel (view kế, ‹ về đúng dòng; máy chủ `kemViec`); không có quyền → **một câu "ai làm được"** (`chuAiLamDuoc`), không 403 trống. Báo cáo / Phân tích giữ chỉ đọc (G8). Một panel một lúc, không panel chồng panel. Số theo **lượt của từng HV** (P8). Pilot 6b-2: ô "Case chưa chốt PA" — 6 nhóm phân rã máy chủ (rỗng không vẽ, quá hạn lên đầu nhóm), dòng → view Case (khối Case A) | `04` M3; `10` P8; M6 #605 (Q3, Q4)
| V12 | **Sau lưu (bản 26/10, chủ SP 26/10 — thiết kế deploy-ux 4.1):** ① **Lưu** chờ máy chủ → ở lại, "✓ Đã lưu", nút chính thành **Bài tiếp ›** (không gửi lại) · ② **Lưu · bài tiếp ›** (chấm) / **Lưu · việc tiếp ›** (panel việc) chỉ chuyển khi máy chủ đã nhận; lỗi → ở lại, giữ chữ, focus ô sai (lỗi máy chủ: ô điểm đầu) · ③ không đổi gì: bài xong → chuyển ngay, không gọi máy chủ; ô trống → ở lại, nhắc "Ô còn trống — nhập điểm hoặc Vắng" · ④ **Vắng** ghi "-" rồi chuyển, toast Hoàn tác · ⑤ bài kế = bài CÒN THIẾU của người xem (`baiKeTiep`, ảnh chụp thứ tự lúc mở): cùng kỹ năng phía sau → vòng lên → kỹ năng khác theo cột · ⑥ chân hộp "Tiếp: Reading · Minh Anh" · ⑦ hết: "Đã xong phần của bạn · {lớp · lượt}: đã lưu n bài" + **Lớp tiếp: {mã} ›** / **Việc tiếp ›** / Đóng — không bao giờ "cả lớp xong"; trang một em: bài trong lượt → **Lưu · em tiếp ›** (danh sách nguồn) → "‹ Về {nguồn}" · ⑧ Enter = nút chính, Enter trên nút = nút đó, nhận xét Ctrl / Cmd + Enter, bỏ qua khi gõ IME · ⑨ chống bấm đôi bằng ref, "Đang lưu…" chỉ ở nút đã bấm · hộp một trường đóng sau lưu: **Lưu · đóng** · ô gõ trực tiếp lớp thường: Enter xuống hàng, bỏ qua ô chỉ đọc · không tự chuyển theo giờ | `04` M16; R1-LUU-TIEP |
| V13 | **Đơn vị luôn ghi** (việc / bài / HV / lượt / Case); badge Công việc = số **việc của chính người xem** (`mine`), chuông = tin chưa đọc, khác dáng badge | `04` M15; #560 (nợ #528) |
| V14 | **Tìm kiếm thanh trên:** `/` hoặc `Ctrl K`; nhóm Học viên · Lớp · GV, chỉ trong phạm vi quyền máy chủ; chữ khớp tô hồng | #560 k1 |
| V15 | **Ô MT thiếu nhận xét:** chỉ MT mới nhất của em, ô **viền vàng** + nhắc ở tooltip / tên đọc màn — không chữ dưới ô, không chặn lưu (LUAT-NX-MT, N8) | `10` mục 7; #549, #560 |
| V16 | **Tiêu đề trang 22 / 700** (`text-xl` = 22 trong thang Tailwind; mockup `.h-trang`). Còn lệch 17 px (`text-lg`) ở 11 trang — CHAM-LAI sửa (`plan.md` mục 4) | `04` mục 2.2; mockup V5 |
| V18 | **Công việc ba tầng** (CONG-VIEC-2, chủ SP duyệt mockup `thiet-ke/v7/cong-viec-2.html` #621): ① **nhóm việc** — thẻ riêng, dải `--surface-2` + vạch trái 3 px **một màu nhấn** (xám = bài chấm chéo, không phải việc của bạn) + biểu tượng nét, 15 / 700, chip đếm vuông có đơn vị, dính khi cuộn (`DaiNhom`, dùng cả cho Chờ bạn duyệt / Việc quản lý) · ② **học viên** — vòng tròn chữ đầu 28 px + tên **15 / 600** (link hồ sơ) · lớp 13 · SOS **một lần**; em một việc vẫn có khối; khối cách khối vạch `--line-strong` · **lớp / nhóm em** — ô vuông biểu tượng, chính dòng là việc; dòng gộp ô chồng có số: "n em ▾" mở khay em, hoặc làm cả dòng (`moCaDong`) · ③ **việc** — thụt dưới tên + nét cây 1 px, tên **15 / 500** không lặp tên em, phụ 13, **hạn cột cố định 136 px** (`ChipHan`) + nút 112 px; "›" = việc đổi trang · "việc tiếp" đi hết nhóm (sau → vòng lên), hết nhóm → thẻ "Hết việc {nhóm} của bạn" + "Còn: {nhóm} · n việc" + Việc tiếp › · 375: chạm cả dòng, hạn dưới tên, ẩn nút (trừ "n em ▾", Gia hạn) | D5 / D5b sửa tối 27/10 |
| V19 | **Luật Quay lại (M6, chủ SP 27/10 Q2):** ‹ = lùi một view · Back trình duyệt / vuốt Back điện thoại = cũng lùi một view (mỗi view sâu = một mục lịch sử `?panel=`); ở view gốc thì đóng panel; mở từ link sâu (thông báo, tab mới) → thay URL bằng view cha, không rời app · ✕ / Esc / bấm nền = đóng cả panel về URL trước khi mở (còn chữ chưa gửi thì hỏi MỘT lần) · link (tên / mã / "Hồ sơ") = đổi trang, Back về đúng view · nháp theo người + Case + view · **một chuỗi view một bề rộng** (720 ở 1440 cho chuỗi Case, toàn màn ở 375 — `XemCha.rong`) | M6 khu "Quay lại"; 6b-1 #618, 6b-2
| V20 | **Sau lưu trong chuỗi Case (Q1):** form mở TỪ view Case (Thêm PA, Ghi kết quả) lưu xong **tự về Case**, thẻ PA vừa đổi viền nhấn + "✓ Đã thêm PA · Hoàn tác" (10 giây, đường đảo máy chủ); form mở thẳng (Công việc, link) giữ "✓ Đã lưu · Việc tiếp ›" (V12). Danh sách số: **"Case tiếp ›"** = Case kế bạn làm được, chưa xử lý, theo thứ tự danh sách (Q7), thay view — ‹ vẫn về danh sách; hết → "Hết Case chờ trong danh sách". Hộp điểm giữ V12 | M6 Q1, Q7
| V21 | **Luật chữ đầu mục (M6 vòng 2, chủ SP 27/10):** Đầu nhóm danh sách = dải nền `surface-2` rộng hết panel, chữ 15 / 700 `--text`, vạch trái 3 px **theo bước** (token sẵn có: trống PA `bad` · chờ nhận xét `soon` · chờ xác nhận PA `doing` · chờ duyệt đổi `hong` · PA xong `ok` · không theo dõi `text-faint`; màu luôn kèm tên nhóm), chip đếm vuông (Case còn chờ; hết → ✓), dính khi cuộn · Đầu mục view Case (Case · Phương án · Kết luận · Lịch sử · Bằng chứng — `DauMuc`) 15 / 700, vạch 3 × 18 px `--accent`, đường kẻ + khoảng trên 22 px, chip đếm vuông · Tên dòng 15 / 500 · Tên thẻ PA 15 / 600 · Nhãn 13 / 500 `text-dim` (cột 7.5rem; 375 nằm trên giá trị) · Giá trị 15 (điểm là giá trị chính: màu kết quả + ✓ / ✗) · Phụ 13 · Tiêu đề panel 17. **Đổi tên:** "Vấn đề" → **"Case"**; "Ghi nhận" → **"Mô tả"** (mô tả Case — N8) | mockup M6 "Vòng 2 · chữ"; 6b-2

## Luật 21/10 (overhaul — chủ SP duyệt #486; thắng phần mô tả bên dưới khi khác)

Nguồn: `docs/superpowers/specs/2026-10-20-ke-hoach-overhaul/` — `02` quyết định, `04` hệ thiết kế (chi tiết từng thành phần), `05` workflow.
Phần bên dưới mục này là **bản ghi mã hiện tại**; dòng ghi "→ Luật 21/10" sẽ đổi ở PR nền (NEN-TYPO-MAU, NEN-BANG, NEN-SO-PANEL, NEN-TUAN — `07` mục 6).

| # | Luật | Nguồn |
|---|---|---|
| G1 | **Khung mockup đã duyệt thắng** file này và luật giao diện cũ hơn ngày duyệt (trừ nghiệp vụ, quyền, chống mất dữ liệu) | 02 mục 2.3 (9.1-1); 04 mục 1.8 |
| G2 | **Thi** = kỳ thi thật (IELTS…) · **Test** = MT, Progress, Final, Mini…; gọi chung "Test". Chữ trạng thái Test theo bảng thuật ngữ Rulebook ("Đã làm bài", "Vắng", "Đã huỷ · vắng 2 lần", nút "Bỏ khỏi đợt") | 02 mục 2.5 (V2 I.5), 4.7 A8 |
| G3 | ~~Việc của tôi ở trang đầu vai; TVV không thêm mục Công việc~~ → **thay bằng V10** (trang đầu = Tổng quan tình hình, việc ở Công việc, TVV có Công việc) | 02 mục 2.9 (Q-A1 ①); V5 `04` M1, M2 |
| G4 | **Một danh sách một kiểu mở:** danh sách có khung phải → mọi dòng mở ở khung phải; bảng rộng không khung phải → mở dưới hàng; danh sách hẹp không mở rộng tại dòng; mở cái mới thay cái cũ, không panel chồng | 04 mục 9.2; 02 4.7 C5, A12, A14 |
| G5 | **Thang làm tại chỗ 0–5**, chọn bậc thấp nhất đủ dùng: 0 chỉ xem · 1 một bấm + Hoàn tác 10 s · 2 hộp neo / mở dưới hàng · 3 khung chi tiết phải (375 toàn màn + "‹ Quay lại") · 4 panel rộng · 5 trang riêng (xem hồ sơ, cần không gian lớn); modal chỉ để xác nhận hậu quả lớn | 04 mục 9.2; 02 4.1 (10.7-6) |
| G6 | **Một nghĩa một dáng:** ô số (`OSo`) = mở tại chỗ / panel · chữ + "›" = đổi trang (không "›" trong nút) · tên em / mã lớp / chip lượt = link mở hồ sơ, **không ký hiệu "↗"** (chủ SP 28/10 — rê = màu nhấn + gạch chân, focus-visible rõ; nơi tên nằm trong nút mở thì link chữ "Hồ sơ" cuối dòng) · **ⓘ** = giải thích (thay "?") · bỏ gạch chấm chấm dưới chỉ số · số 0 không bấm | 04 mục 8; 02 2.5 (V3 II.1.1, II.1.3) |
| G7 | **Số trên trang = số dòng panel** (cùng hàm, đúng tập tạo nên con số); một phạm vi số cho cả trang | 04 mục 1.6, 9.3; 02 2.3 (9.1-4) |
| G8 | **Báo cáo thuần:** báo cáo / Phân tích không lồng việc, không cột quá hạn; chỉ bảng theo dõi việc mới có quá hạn | 02 2.5 (V3 II.3) |
| G9 | **Cấm điều khiển trong tiêu đề bảng** (`th` không chứa ô nhập / nút / select); công cụ bảng ở một hàng ngoài khung; căn tiêu đề = căn ô theo kiểu cột (`Bang`) | 04 mục 6.2–6.3; 02 2.5 (V2 I.7, V3 I.3) |
| G10 | **Thời gian:** bộ lọc chỉ Từ tuần – Đến tuần (`Khoảng tuần`); **"Toàn bộ" chỉ ở 6 tab Phân tích**; thi thật giữ tháng / ngày; không hàng nút / chip "Tuần này · Tuần trước", "Ngay hôm nay · W4 SEP" (V5: khoảng tự do, không trần — V9; ô một tuần có nút **Tuần này** cạnh ‹ › — #560) | 02 2.5 (V2 I.1, V3 II.5), 4.7 B12, B13 (X-06) |
| G11 | Thứ tự menu: Tổng quan → Học viên & Lớp → Test → Công việc → Phân tích → Tutor | 02 2.4 (V1 I.2) |
| G12 | Màu kết quả tô **chính con số điểm** (✓ / ✗ trước số), mọi chỗ có điểm; không % trong ô ("✗ 17/25") | 02 2.4 (V1 I.3), 4.7 A6 |
| G13 | Thang chữ **12 · 13 · 14 · 15 · 17 · 22 · 28** (ô bảng / ô nhập 15, lưới điểm 14, nhãn 13, tối thiểu 12); không in hoa | 02 4.7 A4; 04 mục 2.2 |
| G14 | **Đang chọn** = nền nhấn nhạt + vạch trái 3 px, khác hẳn vòng focus 2 px; vạch trái hàng nhóm màu trung tính — **trừ dải nhóm danh sách theo bước** (V21: vạch theo bước, chủ SP 27/10 — màu luôn kèm tên nhóm) | 02 4.7 A11; 04 mục 6.3; M6 vòng 2

## Overview

**Creative North Star: "Bàn làm việc của giáo viên"**

Gọn, rõ, yên tĩnh. Người dùng mở PISA để làm việc — nhập điểm, xếp lịch, xử lý Case — nên màn nào cũng phải cho thấy ngay
việc còn thiếu và làm được tại chỗ. Mật độ cao kiểu bảng dữ liệu, nhưng cột hàng thẳng, không dồn chữ. Màu không dùng để
trang trí: màu chỉ báo **trạng thái**. Giao diện mặc định **theo máy** (`prefers-color-scheme`), chọn Sáng / Tối trong menu tài khoản; chế độ sáng
`:root[data-theme="light"]` cùng bộ token.

**Key Characteristics:**
- Bảng và danh sách là chính; hàng nhóm (lớp) đậm có vạch trái, hàng con nhạt hơn.
- Một màu nhấn xanh (`accent`) cho hành động chính và mục đang chọn.
- Trạng thái bằng chip nhỏ có màu + chữ.
- Thời gian ghi bằng mã tuần `W2 OCT`; con số dùng chữ số Inter, `tabular-nums`.
- Thao tác phụ gom vào menu ⋯; sửa trong hộp / panel nổi, không chuyển trang.

## Colors

Nền xanh than tối, một màu nhấn xanh pastel, và một bộ màu trạng thái cố định. **V5 (NEN-V5 #528):** giá trị theo `thiet-ke/v5/v5-nen.css` (màu PISA từ logo — V2),
tên biến cũ giữ nguyên; bốn nhóm badge thay "5 nghĩa" dưới (V4, V5). Đo tương phản: `thiet-ke/v5/kiem-tuong-phan.py`, phép kiểm `nenGiaoDien.tests.ts`.

- **Nền / bề mặt**: `bg` → `surface` (thẻ, panel) → `surface-2` (nút, ô phụ). Vạch kẻ `--line` mảnh, `--line-strong` khi cần rõ.
- **Nền tách lớp** (OV-15a, chủ SP 19/10): trang tối hơn (`bg`), thẻ / bảng sáng hơn một bậc (`surface`), viền rõ hơn (`--line` 0.18, `--line-strong` 0.32).
- **Nhấn** (`accent`, sáng `#1d5fbf`): nút chính, focus ô nhập, **đang chọn = viền khung 2 px quanh cả hàng** (`row-active`), không tô nền; thắng mọi nền. → Luật 21/10 G14.
- **5 nghĩa — dáng / ký hiệu mang nghĩa, màu chỉ phụ** (mockup OV-14 1 §1a; → **V5 thay bằng bốn nhóm badge V4–V5**, dòng 2 "chip SOS chỉ viền" và tím / magenta đã bỏ; quá hạn nay cùng màu lỗi `bad`, luôn kèm ⚠):
  1. Nhấn — đang chọn, nút chính, focus.
  2. Kết quả — chỉ trong ô điểm và chip SOS: ✓ xanh lá vượt kỳ vọng · ✓ xanh dương (`doing`) bằng · ✗ đỏ (`bad`) dưới (SVG nét trơn, không vòng tròn);
     "Chưa đủ điểm" chỉ chữ. Chip SOS chỉ VIỀN (`--sosN-rgb`) + chữ (`--sosN-chu-rgb`), không nền: vàng 1 px · cam 1,5 px · đỏ 2,5 px + viền đôi; tạm = viền đứt.
  3. Đã thi — nền cả hàng `--da-thi-bg-rgb` + vạch trái 3 px `ok` + chip "Đã thi · chờ KQ" / "Có KQ · chờ bước tiếp". Nền hàng CHỈ cho nghĩa này.
  4. Hạn — chỉ chữ: quá hạn cam `late` **luôn kèm ⚠** (không chip, không nền, không tô hàng); sắp hạn / hôm nay vàng `soon`. Hạn ghi ngày `hạn 18/09`, không thứ.
  5. Trung tính `muted` — mọi trạng thái khác (chờ duyệt, chờ chấm, Chưa chốt PA…). Đã bỏ tím `wait` và teal `chon-*` (OV-15a).
- Đạt = `ok`; `bad` còn cho thao tác nguy hiểm.
- **Giảm độ rực (D4 MAU-WEB, chủ SP 27/10 — "giữ tông, giảm độ rực"):** nền, mặt, viền, chữ, thanh điều hướng, xanh logo, hồng logo GIỮ; mọi màu nghĩa giảm chroma OKLCH, giữ độ sáng — trạng thái / SOS / lịch / kết quả × 0,65 (sáng: đỏ lỗi, quá hạn, SOS 3 × 0,8), nhấn tối × 0,8, chữ hồng × 0,85. Đỏ chữ tối (lỗi / quá hạn / ✗ dưới) `#e89a8c` hơi ngả cam để ✓ vượt ↔ ✗ dưới vẫn tách khi mù màu đỏ–lục (deutan ΔE 14 ≥ 10, K-MAU-2). Màu mới không được rực hơn mức này. Nút chính ở tối: nền `--nut-chinh-nen` xanh thẫm + viền `--nut-chinh-vien`, không tô kín `--accent` (sáng giữ tô xanh logo). Bảng so sánh + đo: `thiet-ke/v7/bang-mau-moi.html`, `kiem-tuong-phan-mau-moi.py`.
- Chữ phụ: `text-dim` (quan trọng), `text-faint` (nhỏ) — cả hai ≥ 4,5:1 (chủ SP 30/10, khớp phép kiểm) trên `bg`, `surface`, `surface-2` ở sáng lẫn tối (`prOv15a`).

## Typography

- **Be Vietnam Pro** cho mọi chữ; **chữ số lấy từ Inter** (khai báo `@font-face` cùng tên, `unicode-range` 0–9) để số thẳng hàng.
- **Thang 12 · 13 · 14 · 15 · 17 · 22 · 28** (NEN-TYPO-MAU #497; `tailwind.config.js` đặt `fontSize`, không extend): `xs` 12 badge / dòng phụ · 13 (`text-[13px]`) đầu cột,
  nhãn, `btn-sm` · `sm` 14 lưới dày, giá trị panel · `base` 15 chữ thường, ô bảng, nút · `lg` 17 tiêu đề khối / panel · `xl` 22 tiêu đề trang · `2xl` 28 số lớn.
  Ô nhập ở 375 = 16 (Safari không tự phóng to). Đầu cột **không in hoa**. Line-height Việt ≥ 1,45 (nhiều dòng), tiêu đề ≥ 1,3.
- Hàng nhóm đậm, hàng con nhạt hơn (cỡ theo thang trên).
- **Độ đậm (MAU-WEB-2 D10, 27/10):** chữ thường 400 · nhãn (ô form, trường panel, nút phụ `btn-sm`, tab / chip lọc / nút đoạn KHÔNG chọn) 500 ·
  mục đang chọn, nút chính, tên đầu dòng (`.ten-ho-so`), đầu cột, badge 600 · tiêu đề trang / khối, số chính (`OSo`), tên lớp hàng nhóm 700 · không dùng 800 (trừ logo).
  Ô hàng nhóm ghi `font-normal` thì giữ chữ thường (`.hang-lon > :where(td)`).
- **Số căn giữa** + `tabular-nums` (`td.tabular-nums`, đầu cột số); tên / chữ dài căn trái (C06).
- Đối tượng trong khối **Cần làm** của panel v3 (tên PA, mức kỷ luật, loại meeting): **15 px đậm 700** (OV-12e, chủ SP 14/10).
- **Không chữ < 11 px** ở bất kỳ đâu (→ Luật 21/10 G13: tối thiểu 12).
- Số liệu, điểm, mã tuần: `tabular-nums`.

## Layout

- Chỉ `<main>` cuộn (một thanh cuộn); không cắt chữ, nút không tràn (PR-KHUNG).
- Kiểm ở **375** và **1440**, cả sáng và tối.
- Bảng tra cứu dài (nhiều hàng số ngắn, vd Quản trị › Bảng quy đổi band 41 hàng): `Bang chat` — hàng 32 px ở ≥ 640 px (đệm dọc 4 px), < 640 px giữ 44 px (vùng chạm); căn theo kiểu cột như mọi bảng (BAND-QUY-DOI, PTA 28/10).
- Bảng rộng: `.table-scroll` cuộn ngang trong bảng, trang không trượt ngang. Điện thoại (< 640 px): bảng chuyển thành thẻ, mỗi em một thẻ.
- Trên điện thoại: nút và ô nhập cao tối thiểu 44 px (`max-sm:min-h-[44px]`); máy tính 40 px.
- Thao tác: menu ⋯ ở đầu dòng / đầu hộp; hộp nổi neo vào chỗ bấm (`HopKyNang`, `HopThaoTacMt`); panel trượt (`KhungPanel`) cho form dài.

## Elevation & Depth

Phẳng, phân lớp bằng tông nền (`bg` → `surface` → `surface-2`) và viền mảnh, không đổ bóng trang trí. Bóng chỉ dùng cho vạch
trái (inset) của hàng nhóm / hàng chọn và vòng focus `0 0 0 3px var(--accent-soft)`.

## Shapes

- Thẻ / panel bo 0.75rem; nút và ô nhập 0.5rem (`btn-sm` 0.4rem); ô sửa trong lưới 0.375rem.
- Hai họ chip, cùng cỡ chữ 12 / 600, cao 22 px (NEN-V5): **chip tròn** (`CHIP_TRON`, bo tròn) cho tiến độ xử lý; **chip vuông** (`CHIP_VUONG`, bo 4 px, có viền) cho kết quả / mã (kỹ năng, tuần, điểm). Chip SOS `CHIP_SOS` cùng cỡ.
- Nút lọc nhanh dạng viên (rounded-full, cao 32 px).

## Components

- **Nút** `.btn`: nền `surface-2`, viền mảnh; hover đổi nền + viền nhấn. `.btn-primary` nền nhấn, chữ tối. `.btn-danger` chữ `bad`. `.btn-ghost` trong suốt. Tắt = mờ 45 %.
- **Ô nhập** `.field`: nền `--o-nhap-nen`, viền `--o-nhap-vien`, focus viền nhấn. Ô ngày luôn là `ONgay` (gõ được + nút lịch).
- **Ô sửa trong lưới điểm** `.o-sua`: viền xanh nhạt, focus vòng nhấn.
- **Hàng nhóm / con** (`.hang-lon`, `.hang-con`, `.khoi-nhom-*`): nhóm đậm có vạch trái 3 px màu nhấn, khi thu gọn vạch xám (→ Luật 21/10 G14: vạch trung tính).
- **Chip trạng thái** (`Nhan`): màu theo bảng trạng thái, chữ luôn có nghĩa khi bỏ màu. Tone `late` = chữ cam + ⚠, không chip.
- **Chip SOS** (`ChipSos`, MỘT component mọi màn; dáng V5 ở `lopSos` — V5): "SOS 2 · R, W" / "SOS 3 tạm"; bấm chip = hộp "Vì sao SOS n" (tiêu đề → kết luận đậm → số → việc), không nút `?` cạnh (nút giải thích khác: ⓘ — G6).
- **V5 thêm:** `KhungPanel` (khung panel chung NEN-PANEL: dòng loại, hộp "Bỏ chữ đang gõ?", nháp theo việc, chân lưu thống nhất, 375 toàn màn + bàn phím) ·
  `Bang` (một mẫu bảng, kiểu cột, thẻ ở 375) · `OSo` (ô số mở panel chỉ đọc) · `ChiSo` / `DaiChiSo` (dải chỉ số Tổng quan) · `NhanGt` (nhãn / giá trị) ·
  `LichNho` (chọn tuần theo tháng) · `SaveState` + `KhoiXungDot` ("Bản đã lưu / Bạn đang sửa") · `LichSuThayDoi` (lịch sử trước → sau).
- **Ký hiệu điểm** (`DauKetQua` ✓ / ✗, `MuiTenKyVong` ▲ / ▼ chỉ ở hộp điểm lẻ không có cột kỳ vọng); xu hướng ở Hành trình bằng chữ "Tăng 0.5 / Giảm 0.5 / Không đổi".
- **Thẻ** `.card`: nền `surface`, viền `--line`, bo 0.75rem.
- **Đang tải**: `.skel` shimmer theo khung của nội dung.
- **Toast** báo kết quả lưu; lỗi máy chủ hiện ngay trong hộp/panel (`role="alert"`).

## Do's and Don'ts

**Do**
- Dùng token CSS (`var(--…)`) và lớp sẵn có (`btn`, `field`, `card`, `CHIP_*`, `KhungPanel`, `Menu`); thêm biến thể vào chỗ chung, không rải giá trị.
- Ghi tuần bằng `W2 OCT`; chữ nhãn 1–3 từ.
- Giữ cùng chữ cho cùng thao tác ở mọi màn (`CHU_THAO_TAC`, `CHU_MUC_HOP`).
- Làm thao tác tại chỗ (hộp, panel, ⋯) thay vì chuyển trang.

**Don't**
- Không đổi phông, bảng màu, bố cục đã khoá khi kế hoạch PR không ghi rõ và màn không có mockup mới đã duyệt.
- Không dùng màu trạng thái để trang trí; không dùng màu nhấn cho thông tin thường.
- Không chữ < 12 px (G13); không câu giải thích dưới nút/ô.
- Không hàng nút "Hôm nay · Hôm qua · 2 ngày trước" cho ô ngày.
- Không gradient, glassmorphism, đổ bóng lớn, minh hoạ trang trí.
