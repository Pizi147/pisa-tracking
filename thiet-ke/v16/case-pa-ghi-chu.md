# v16 · Tuyến Case – Phương án – Kết quả PA — ghi chú mockup

Nguồn: lời chủ SP 06/11 ý 6 (`plan.md` mục "Chủ SP 06/11 (6 ý…)") + hướng PTA chốt · luật N37, N33 ①③, N35, N8 · memory "Case – PA bấm thẳng", "Không khoá cứng".
Mockup: `thiet-ke/v16/case-pa.html` · ảnh từng khung: `thiet-ke/v16/anh/` (1440 tối · 375 sáng). Mã đối chiếu: main `0a2277248`.
Dữ liệu như ảnh 5 của chủ SP: em Ngô Bảo Châu (MB FT 101), Case Speaking · MT2 SOS 3, PA "Học Tutor" theo quy chế chờ xác nhận, người xem Nguyễn Khánh Vy. Hôm nay 14/09 · W3 SEP.

## 1. Brief (impeccable shape — tự trả lời theo vai GV)

- **Người · lúc nào:** GV mở Công việc đầu giờ, xử lý 5–15 việc Case liên tiếp (mô tả, xác nhận PA, ghi kết quả). Máy tính ở trung tâm; điện thoại để tra / sửa nhanh.
- **Đầu ra:** mỗi Case có mô tả, PA đúng người, kết quả đúng hạn, xoá được cái làm sai. Thành công = làm xong một việc mà không rời panel, không tìm nút.
- **Luận điểm:** *bấm vào chính thứ đang thấy để sửa nó.* Không nút "Sửa" rời, không ⋯ một mục. Mỗi giá trị sửa được có dấu cố định (▾ = chọn, bút = gõ), rê thì hiện khung ô nhập. Thẻ PA bấm là mở tại chỗ; thẻ mở = nơi xem đủ, sửa, xác nhận, ghi kết quả, xoá.
- **Trong hệ có sẵn:** `KhungPanel` 720 px (V19), đầu mục `DauMuc` (V21), khung trường nhãn trái 7.5rem (ro.css), chip SOS / hạn / kết quả, nút `.nut`, dải Hoàn tác (V20). Thành phần mới duy nhất: **giá trị sửa được** (`.sd`) và **thẻ PA mở được**.
- **Không làm:** đổi luật, đổi quyền, thêm bước xác nhận, thêm trang.

## 2. Bảng ý → mockup

| # | Ý (chủ SP / PTA) | Mockup | Khung |
|---|---|---|---|
| 1 | Bấm thẳng để sửa tại chỗ; bỏ "Sửa", "Đổi người…" | Phụ trách: bấm tên → hộp chọn ngay dưới, lưu ngay + "✓ Đã đổi · Hoàn tác". Mô tả: ô trống trông như ô nhập (viền nhấn + "việc của bạn · hạn 16/09" khi là việc đang làm); có chữ → bấm chữ (bút) → ô gõ, tự lưu, "Đang lưu… / ✓ Đã lưu 14:02". Nguyên nhân: bấm thẻ → hộp chọn. Tên Case (bút ở tiêu đề) → hộp nhỏ Tên · Kỹ năng · Mức độ | a, b1, b2, c1, c2 |
| 2 | Thẻ PA bấm cả thẻ → mở trong thẻ, xem đủ + sửa | Đầu thẻ là một nút (aria-expanded), ▾ bên phải. Thẻ mở: Loại (khoá, ⓘ) · Nội dung · Số buổi · Người dạy · Bắt đầu · Kết quả · Nhật ký — mỗi giá trị bấm được như ở Case. Không panel lồng panel | d1, d2, m4 |
| 2b | Trạng thái là nút làm việc | Thẻ gập: "Chờ xác nhận" → nút **Xác nhận PA** (mở thẻ = form xác nhận điền sẵn); "Đang chạy" tới kỳ → nút **Ghi kết quả**; chưa tới kỳ → chữ "Đang chạy · KQ hạn 29/09" + nút "Cập nhật trước hạn" trong thẻ | a, d1, e1 |
| 2c | Ghi kết quả ngay trong thẻ | Form trong thẻ, trường trên gập thành một dòng nội dung: Tiến triển (5 mức) · Nhận xét 8–200 · Quyết định (đoạn: Giữ nguyên · Điều chỉnh · Kết thúc PA; PA quy chế: Giữ nguyên · Điều chỉnh · Xin hỗ trợ QL) · Ngày ghi. PA Tutor: khối buổi (Tutor · Offline/Online · Nhận xét buổi · 3 tiêu chí Có/Không + Cả 3 Có · Đánh giá tutor tuỳ chọn). Lưu xong thẻ gập, viền nhấn + "✓ Đã ghi kết quả · Hoàn tác" | e1, e2, e3, m5 |
| 3 | Xoá = nút chữ cuối phần đang mở + Hoàn tác + Thùng rác | "Xoá PA" cuối thẻ (1 bấm, không hỏi — như cũ) → thẻ thành dải "Đã xoá PA … · vào Thùng rác · Hoàn tác" đúng chỗ. "Xoá Case" cuối panel; Case còn PA → hỏi MỘT lần tại chỗ, nêu đúng các PA (như cũ); xong → dải Hoàn tác + Việc tiếp › | f1–f4, m6 |
| 3b | PA quy chế / Case SOS: "Đề nghị QL xoá" (N37) | Nút chữ "Đề nghị QL xoá" / "Đề nghị QL xoá Case" — 1 bấm gửi (như cũ) → "Chờ QL duyệt xoá · Rút lại" ngay tại chỗ, PA vẫn chạy. QL mở Case: "Giữ lại · Duyệt xoá" ngay trên thẻ | g1, g2, j2 |
| 3c | Bỏ mọi ⋯ một mục | Không còn ⋯ nào trong tuyến Case (Sửa PA, Kết thúc PA, Mở lại PA, Xoá PA, Xoá kết quả, Xoá Case → nút chữ / giá trị bấm được) | toàn bộ |
| 4 | Lý do chặn đặt tại nút, bỏ dòng khoá đỏ | "Hoàn thành Case" luôn thấy (với người có quyền); bị chặn = mờ + "chờ PA Học Tutor · MT3" + ⓘ → lý do đủ + "Tới PA Học Tutor ↑". Các lý do khác: "cần ít nhất 1 PA", "1 PA chờ QL duyệt", "1 PA chưa có kết quả cuối" | h1, k2 |
| 5 | Một tuyến | Mọi lối vào (Công việc, thẻ việc ở HV & Lớp, "Mở Case ›" ở Phân tích / Chờ duyệt / chuông) mở **cùng panel Case**, cuộn tới đúng phần (Mô tả · thẻ PA · form kết quả), thẻ đích viền nhấn. Hồ sơ HV: Case mở tại chỗ trong khối (N33 ①) với đúng thân panel. PA và Kết quả nằm trong Case → luôn thấy Case, không cần nút "tới Case" | i1, i2 |
| 6 | Đếm số bấm | Mục 3 dưới | — |
| — | QL làm thay (N33 ③) | Dải "Bạn đang làm thay Nguyễn Khánh Vy · Thôi, chỉ xem" ngay dưới loại việc; panel giống hệt; nhãn việc ghi "việc của Nguyễn Khánh Vy"; PA quy chế: "Xoá PA" thẳng + "Kết thúc sớm…" | j1, j3 |
| — | Lỗi / rỗng / chỉ xem | Lỗi lưu: chữ giữ, báo tại ô + Thử lại, chân "⚠ Chưa lưu được". Quá 300: không lưu, đếm đỏ tại ô. Case chưa có PA: "+ Thêm PA" thành nút chính, thẻ form mới ở đầu mục. Không quyền: giá trị là chữ thường, không bút / ▾ / nút xoá, một câu "ai làm được". Lỗi tải: Tải lại | k1–k5 |
| — | N8 ③ S chấm chéo | Ô mô tả trống + khối nhận xét chấm chéo ngay dưới: "Dùng nhận xét này" (1 bấm) hoặc gõ | b3 |
| — | Hoàn thành / Mở lại | Form Hoàn thành ngay trong mục (4 mức điền sẵn theo PA gần nhất · Vì sao ≥ 10 · Ngày · + chi tiết). Case xong: Kết luận + "Mở lại" | h2, h3 |

## 3. Số bấm — tình huống thật (tính từ lúc panel Case đã mở)

| Tình huống | Trước (web) | Sau (v16) | Đổi trang / view |
|---|---|---|---|
| Đổi người phụ trách | 3 (Đổi người… · chọn · Lưu · đóng) | **2** (bấm tên · chọn) | không |
| Viết mô tả (việc "Mô tả Case") | 2 + gõ (Mô tả Case · Lưu), đổi view | **0** + gõ (con trỏ đã trong ô), tự lưu | không |
| Sửa mô tả đã có | 2 + gõ (Sửa · Lưu), view 5 ô | **1** + gõ | không |
| Xem đủ một PA | không bấm được (chỉ "Nhật ký PA" gập) | **1** (bấm thẻ) | không |
| Sửa nội dung / người dạy PA | 3 + gõ (⋯ · Sửa PA · Lưu), đổi view | **2** (mở thẻ · bấm giá trị), tự lưu | không |
| Xác nhận PA | 2 (Xác nhận PA · Xác nhận), đổi view | **2** (Xác nhận PA · Xác nhận PA) | không |
| Ghi kết quả PA | 3 + gõ (Ghi kết quả · mức · Lưu); PA Tutor / Điều chỉnh: đổi view | **3** + gõ (Ghi kết quả · mức · Lưu kết quả) — tối thiểu, vì mức phải tự chọn | không |
| Xoá PA thường | 2 (⋯ · Xoá PA) | **2** (mở thẻ · Xoá PA); 1 khi thẻ đang mở | không |
| Xoá Case (còn PA) | 3 (⋯ · Xoá Case · Xoá Case và n PA) | **2** (Xoá Case · Xoá Case + n PA); chưa có PA: 1 | không |
| Đề nghị QL xoá PA quy chế | 2 (⋯ · Xoá PA) | **2** (mở thẻ · Đề nghị QL xoá) | không |
| Hoàn tác xoá / đổi | 1 (toast góc màn) | **1** (dải ngay chỗ vừa đổi) | không |
| Biết vì sao chưa hoàn thành Case | đọc dòng khoá đỏ | đọc "chờ PA Học Tutor · MT3" cạnh nút; ⓘ 1 bấm cho lý do đủ | không |

Mục tiêu ≤ 2 bấm: đạt cho đổi người, sửa mô tả, sửa PA, xoá PA, xoá Case. Ghi kết quả = 3 (mở · chọn mức · lưu) — không thể ít hơn khi mức kết quả phải do GV chọn; đã bỏ đổi view.

## 4. Thao tác trước → sau

Bảng đầy đủ 38 dòng ở cuối `case-pa.html` (mục "Thao tác trước → sau"; nguồn: kiểm kê `NganCase`, `CasePanel`, `ThaoTacCase`, `MenuXoaPa`, `CapNhatTuan`, `GhiNhanh`, `FormPa`, `DoiPa`, `DoiNguoiPhuTrach`). Tóm tắt:
- **GIỮ** (đủ, chỉ dời chỗ): mọi trường form Thêm PA / Xác nhận PA / Ghi kết quả (gồm buổi tutor, Số buổi kỳ này, Mini Test lần cuối, Lý do chưa đủ dữ liệu, chặn quyết định) / Hoàn thành Case; Đề xuất PA khác…, Không cần theo dõi…, Rút / Đề xuất lại đổi PA; Hoàn tác 10 giây; Mở lại Case; Lịch sử (cả Sửa lần xem lại cũ, Xoá kết quả); Bằng chứng; Xem đầy đủ, Dịch; Việc tiếp ›, Case tiếp ›; Làm thay; chỉ xem + Phụ huynh · Gọi.
- **GỌN** (ít bấm hơn, không đổi view): Đổi người, Mô tả, Sửa Case (tên · kỹ năng · mức · nguyên nhân), Sửa PA, Xác nhận PA, Ghi kết quả, Sửa kết quả, Xoá kết quả, Kết thúc PA sớm, Mở lại PA, Xoá PA / Case, Đề nghị QL xoá.
- **BỎ**: dòng khoá đỏ, mọi ⋯ trong tuyến Case, nút "Sửa" / "Sửa xác nhận" / "Đổi người…" rời, view riêng Mô tả / Sửa Case / Sửa PA / Xác nhận PA / Ghi kết quả (nội dung vào panel Case).
- **MỚI**: "Rút lại" đề nghị xoá (đường hoàn tác cho việc gửi QL); QL duyệt xoá ngay trên thẻ (vẫn có ở Chờ bạn duyệt).

Quyền: theo luật hiện hành, không đổi. Đổi người: QL + GVCN lớp em (`doiChu`) — người khác thấy tên là chữ thường. Sửa: `canEdit`. Hoàn thành: `canClose`. Kết thúc sớm: GVCN lớp + QL. Xoá: cờ máy chủ `ngay` / `xin` quyết nút "Xoá…" hay "Đề nghị QL xoá…".

## 5. [XM] — cần PTA Plan chốt (khuyến nghị ghi sẵn)

- **[XM1] Rút lại đề nghị xoá** — mới. Khuyến nghị: thêm (memory "luôn Hoàn tác"); máy chủ cần đường rút yêu cầu xoá (chưa kiểm có sẵn chưa; đổi PA đã có `/yeu-cau/:id/rut`).
- **[XM2] Đề nghị QL xoá không hỏi lý do** — giữ như hiện tại (1 bấm gửi). Không thêm ô lý do vì không đổi đầu ra; QL hỏi lại nếu cần.
- **[XM3] View riêng Xác nhận PA / Ghi kết quả / Sửa PA / Sửa Case → vào thẻ / tại chỗ.** Thân form giữ đủ trường; chỉ đổi chỗ. Form dài (PA Tutor nhiều buổi, Điều chỉnh › Thay PA) làm thẻ cao — chấp nhận, panel cuộn; thẻ khác gập.
- **[XM4] Tự lưu cho Mô tả / Nội dung PA / giá trị đơn** (trước: nút Lưu). Lưu khi rời ô hoặc ngừng gõ ~1 giây; chưa đủ luật (Mô tả < 15, Nội dung < 8) → không lưu, báo tại ô, giữ chữ (nháp máy). Esc bỏ thay đổi. Form nhiều trường cùng lưu một lần (Xác nhận PA, Ghi kết quả, Thêm PA, Hoàn thành) vẫn có nút.
- **[XM5] "Hoàn thành Case" luôn thấy với người có `canClose`**, bị chặn thì mờ + lý do (trước: ẩn khi PA quy chế chưa khép). Người không có quyền: không thấy nút (giữ).
- **[XM6] Nút chính chân panel = "Việc tiếp ›"** (trước: "Mô tả Case" / "Xác nhận PA"… mở view). Việc đã thành ô / nút trong thân; V12 ③ giữ: việc chưa xong mà bấm Việc tiếp → vẫn sang việc kế, việc cũ còn trong danh sách.
- **[XM7] Sửa kết quả / Xoá kết quả có ngay trong thẻ PA** (trước: chỉ ở Lịch sử, sau ⋯). Lịch sử vẫn giữ.
- **[XM8] 375: hộp chọn mở ngay dưới giá trị** (không nổi), vùng bấm 44 px; thẻ PA: nút trạng thái xuống dòng dưới tên.

## 6. Turso (đọc mỗi lần mở / lưu)

- Mở panel: **không thêm câu** — cùng dữ liệu Case + PA + kết quả đang đọc. Nhật ký PA đã có trong dữ liệu thẻ (dòng "Tạo" + đổi).
- Hộp chọn Phụ trách / Người dạy: danh sách ứng viên đọc **khi bấm mở hộp** (một câu nhỏ, một lớp × một kỹ năng ≈ < 10 dòng), không đọc khi mở panel.
- Lưu tại chỗ: **1 ghi + trả về đúng bản ghi vừa đổi** (Case hoặc một PA), không tải lại cả Case như sau "Lưu" hiện nay. Tự lưu khi gõ: chỉ gửi khi rời ô / ngừng ~1 giây và chữ khác bản đã lưu → không nhân số câu theo phím gõ.
- Ước: mỗi lần sửa ≈ 1 ghi + 1–5 dòng đọc (thay ≈ 30–60 dòng tải lại Case). Không cần cảnh báo chủ SP; builder ghi trần ở `server/src/tests/tocDoDuong.ts` cho đường PATCH mới.

## 7. Ghi cho builder

- `.sd` = `<button>` có `aria-label` "Sửa {trường}" (+ `aria-haspopup="listbox"` khi chọn); dấu ▾ / bút luôn hiện (chạm, không có rê). Mở ô gõ: focus vào cuối chữ; Enter (ô một dòng) / rời ô = lưu; Esc = bỏ. Không quyền → `<span>` thường.
- Thẻ PA: đầu thẻ một `<button aria-expanded>`; nút trạng thái là nút riêng ngoài nút đầu thẻ (không lồng). Mở nhiều thẻ được. Mở panel từ lối vào có đích (PA / kết quả) → thẻ đó mở sẵn + viền nhấn + cuộn tới.
- Dải "Đã xoá … · Hoàn tác" thay đúng chỗ thẻ 10 giây rồi gọn đi (Thùng rác giữ — N28). Hoàn tác đảo bằng đường máy chủ có sẵn (`/thung-rac/:id/khoi-phuc`).
- Lý do chặn: chữ ngắn cạnh nút (`aria-describedby`), ⓘ mở lý do đủ (cùng hàm `closeBlockers` / sosV4 — không viết luật lần hai), link "Tới PA ↑" cuộn tới thẻ.
- Màu: kết quả PA theo `OUTCOME_TONE` (✓ xanh lá · ↗ vàng · – vàng · ↓ đỏ · ? xám). **Nút xoá (chủ SP 06/11, khi xem bản nháp): "Xoá Case", "Đề nghị QL xoá Case", "Xoá PA", "Đề nghị QL xoá", "Xoá kết quả" = nút nhỏ viền 1 px đỏ (`bad-vien`), chữ đỏ `bad`, nền trong; rê → nền `bad-nen`.** Cao 30 (375: 44). "Kết thúc sớm…" không phải xoá → nút thường. Không màu kết quả cho trạng thái.
- 375: panel toàn màn, nhãn trên giá trị, chân hai nút ngang.

## 8. Đồng bộ MỌI NƠI có Case – PA – Kết quả (chủ SP 06/11, khi xem bản nháp)

**Luật:** một mẫu cho mọi chỗ — giá trị sửa được = ô khung nhẹ (`surface-2` + viền `line-strong`) có ▾ / bút; giá trị không sửa = chữ thường; nhãn trái 13 / 600 `text-dim`; nút xoá = nút nhỏ viền đỏ; thẻ PA mở tại chỗ; không ⋯; lý do chặn cạnh nút. Không nơi nào được giữ kiểu cũ.

| Nơi (mã hiện tại) | Đang hiện | Sau v16 |
|---|---|---|
| Panel Case — Công việc (`PanelViec` → `NganCase` + `CasePanel`) | dải đầu 3 nút, view riêng | panel v16 (khung a–k) |
| Hồ sơ HV · khối Case (`CotCaseHv`, `NganCase` trong cột, `TheKyNang` / `SkillBoard`, `StudentDetailPage`) | thẻ kỹ năng + Case mở trong cột | danh sách Case tóm tắt (N33 ①), Case mở tại chỗ = cùng thân panel (khung i1) |
| HV & Lớp · thẻ việc dưới hàng em, panel một em (`PanelMotEm`, `NganTongKet`) | chip việc → panel | mở cùng panel Case, cuộn tới việc |
| Hồ sơ lớp (`BangHoSoLop`, `BangDiemLopThuong`) | link / nút Case | mở cùng panel Case |
| Test · lượt MT / Progress (`MockDetailPage`, `LuotThuongPage`, `CaseLuotKn`) | khối Case của lượt | cùng thân panel / "Mở Case ›" → cùng panel |
| Công việc · tóm tắt theo dõi, Làm thay (`HoTroHocVienTab`) | tóm tắt chỉ đọc + "Làm thay" + "Mở Case ›" | giữ tóm tắt; Làm thay → panel v16 có dải (j1) |
| Ghi kết quả nhanh ở dòng việc (`GhiNhanh` trong Công việc) + panel lớn (`CapNhatTuan`) | form dưới dòng / view riêng | form trong thẻ PA (e1, e3); ở dòng Công việc dùng cùng form |
| Xác nhận PA (`CaseSosControls`), Sửa / Thêm PA (`ThaoTacCase`, `FormPa`, `DoiPa`), Đổi người (`DoiNguoiPhuTrach`), ⋯ (`MenuXoaPa`) | view / hộp / ⋯ riêng | vào thẻ / giá trị tại chỗ; bỏ `MenuXoaPa` |
| Chờ bạn duyệt (`HopChoDuyet`), Phân tích / số liệu (`LamDongSoLieu`), chuông | thẻ duyệt, "Mở Case ›" | giữ thẻ duyệt; "Mở Case ›" → cùng panel, thẻ đích mở sẵn + viền nhấn |
| Bảng Case (`CaseBoardPage`), bảng SOS (`BangSos`) | dòng → Case | dòng → cùng panel |
| Case Ý thức (`yThuc/*`) | khác trường (vi phạm, biện pháp) | **cùng dáng** (ô sửa được, nút xoá viền đỏ, không ⋯, lý do tại nút); trường riêng giữ — PR riêng, không vẽ ở đây [XM9] |

- **[XM9] Case Ý thức:** chủ SP nói "tất cả mọi nơi" — khuyến nghị áp cùng dáng ở PR code tuyến Ý thức sau tuyến học thuật (trường khác, mockup U10 đã duyệt giữ bố cục).
- Builder: làm thành phần dùng chung (`GiaTriSua`, `ThePa`, `NutXoa`, `LyDoChan`) để mọi nơi trên đi qua MỘT chỗ — không chép mẫu từng nơi.

## 9. Critique (impeccable critique — A rà thiết kế + B máy dò, hai agent riêng)

- **Vòng 1: 29/40**, 2 × P1 (hai nút chính + chân "Tự lưu" khi form trong thẻ chưa lưu · hai nút đề nghị xoá dễ lẫn, Xoá Case chung hàng Hoàn thành) → sửa: form mở thì "Việc tiếp ›" thành nút phụ + chân "● … chưa lưu · nháp giữ trên máy"; "Đề nghị QL xoá PA" trong thẻ, Xoá / Đề nghị xoá Case một hàng riêng cuối panel; lý do "chờ PA Học Tutor · MT3"; ⓘ mở dưới nút; trạng thái = viên xám + chấm màu (V4 ③); vẽ thêm n1–n5.
- **Vòng 2: 35/40, không P0 / P1** (Nielsen: 4 · 3 · 4 · 3 · 4 · 4 · 3 · 3 · 4 · 3). Đã sửa thêm P2: ⓘ 44 px ở 375; nút "Xác nhận PA" / "Ghi kết quả" ở thẻ gập là nút phụ (một nút chính mỗi màn); "Chờ QL duyệt xoá Case" theo viên xám + chấm; Case đã xong = chữ thường (không ▾ / bút / + Thêm PA) tới khi Mở lại. P3 đã sửa: nhãn ngày trên ô, "2/6 buổi", bỏ 🔒, bộ đếm lý do rõ.
- **Máy dò (B):** 27 dấu — đều là ghi chú vàng của mockup, màu / phông khung đọc mockup, `.viec.chon` vạch trái (V18 đã duyệt) → không lỗi giao diện. Không lỗi console. Tràn chữ tên Case 9 px đã sửa.
- **Chủ SP xem bản nháp 06/11:** (1) nút Đề nghị xoá / Xoá Case + PA = viền nhỏ màu đỏ → đã làm; (2) trường thông tin phân biệt rõ hơn → giá trị sửa được là ô khung nhẹ, giá trị cố định là chữ thường, nhãn 13 / 600; đồng bộ mọi nơi → mục 8.
