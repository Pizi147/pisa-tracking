> Phụ lục của [Đánh giá lại UX/UI toàn diện 20/10/2026](../2026-10-20-danh-gia-lai-ux-ui-toan-dien.md). Báo cáo gốc của agent rà (Opus 5.5), giữ nguyên chữ. Đường `SCR\anh\…` / `SCR\…` là ảnh và tệp tạm của đợt rà (không lưu trong repo); ảnh tiêu biểu đã lưu ở `anh/`.

# a2 — Công việc + mọi panel làm việc · rà 20/10/2026

Demo http://localhost:5621 · ngày demo 14/09/2026 · mã `main` e3405b93. Chỉ đánh giá, không lưu gì.
Ảnh: `SCR\anh\a2\` (SCR = `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad`).
Spec chụp: `SCR\chup\a2-gv10.json`, `a2-gv.json`, `a2-ql.json`, `a2-fix.json`, `a2-cuoi.json`, `a2-mock.json`, `a2-lai.json`. Đọc API (GET) bằng `SCR\chup\a2-api.mjs`.
**Phông:** ảnh không tiền tố chụp lúc môi trường thử chặn tệp phông (403 ở `.woff`, KHÔNG phải lỗi web) → dùng phông dự phòng. Mọi nhận xét về độ rộng chữ / xuống dòng / cắt chữ đã chụp lại với phông đúng: ảnh tiền tố `v2-` (console 0 lỗi); kết luận không đổi.

---

## Phần 0. Phạm vi

**Đã chụp (1440 tối, trừ khi ghi khác):**
- GV 10 Linh (W2): trang đầu `gv10-dau`, sáng `gv10-sang`, mở 2 nhóm gập `gv10-mo-nhom`, 375 `gv10-375`, Tab `gv10-tab`, Esc `gv10-esc`.
- GV 7 Hà (GVCN, L·R): `gv7-dau` (+375 `gv7-375`). GV 8 Khoa: `gv8-dau`. GV 9 Trang (S, 2 chi nhánh): `gv9-dau`.
- QL 2 Vy: `ql2-dau`, Của tôi `ql2-cua-toi`, Của GV `ql2-cua-gv`, chọn GV `ql2-chon-gv`, chip quá hạn `ql2-qua-han`, Việc quản lý `ql2-viec-ql`, 375 `ql2-375`.
- QT 1: `qt1-dau`, chi nhánh Uông Bí `qt1-buoc-tiep`. Admin văn phòng 22: `adm22-dau`. TVV 23: `tvv23-cv`. CX 24: `cx24-cv`, `cx24-buoc-tiep`.
- Panel / hộp: Nhập điểm một lớp `gv10-dau`, nhiều lớp `gv10-nhieu-lop`, một em `gv10-mot-em`, lớp thường `gv7-lop-thuong`, 5 lớp `gv7-w3sep`, Cả lớp `gv10-ca-lop`,
  Dán từ Excel khung `gv10-dan--khung` + xem trước `gv10-dan` + `?` `gv10-dan-hoi`, hộp ô điểm `gv10-o--hop`, "Mở lưới đầy đủ ↗" `gv10-luoi-day-du`,
  "1 lớp · 2 bài ↗" `gv10-lop-bai`, Ghi nhận xét `gv10-nhan-xet` (+375), Thêm PA `gv10-them-pa` (+375), Xác nhận PA `gv7-xn-pa`, Xác nhận Case `gv7-xn-case`,
  Kết quả PA nhanh `gv7-kq-pa`, `gv9-kq-pa` + "Điều chỉnh / Kết thúc…" `gv7-kq-dieu-chinh`, Mini Test `gv7-mini`, Ghi nhận vi phạm (lô) `gv7-ghi-nhan-vp`,
  Xác nhận xử lý `gv10-xu-ly` (+375), Bàn giao `gv10-ban-giao`, Phối hợp SOS `gv7-phoi-hop`, Báo PH qua TVV `gv7-bao-ph`, Chọn người phụ trách `gv7-nguoi-pt`,
  Thêm PA việc chưa có người `gv7-pa-chua-nguoi`, Điền Target `gv7-target`, Nhập điểm MT cũ `gv7-mt-cu`, Chấm Speaking + hộp `gv9-speaking` (+375),
  Thiếu PA (dòng gộp) `gv9-thieu-pa`, Xem nhận xét Speaking `gv9-xem-nx`, Từ chối… `ql2-tu-choi`, "Mở" thẻ duyệt `ql2-mo-the`, Phân công… `ql2-phan-cong`,
  + Giao việc `ql2-giao-viec`, Chốt lộ trình `ql2-chot-lt`, chấm chéo S (QL) `ql2-cham-cheo`, QL mở việc GV `ql2-nhan-xet-gv`, Bước tiếp + Gia hạn `qt1-gia-han`,
  bấm số Lớp tôi dạy `gv10-lop-toi-day-so`.
- Chụp lại phông đúng: `v2-gv10-dau`, `v2-gv10-sang`, `v2-gv10-dan`, `v2-gv7-kq-pa` (+375 `v2-gv7-kq-pa-375`), `v2-ql2-dau`, `v2-ql2-375`, `v2-qt1-dau`, `v2-gv10-375-mo`, `v2-gv10-xu-ly`.
- Mockup: `mock2-p1…p16` (ov14-2), `mock-v3-p1…p10` (ov12 panel v3), `mock-oh1-p1…p4` (overhaul-1); bản chữ ở `SCR\a2tmp\*.txt`.
- Chiều cao trang: GV 10 1239 px · GV 7 2321 px (375: 3463 px ≈ 4,3 màn) · QL 2080 px (375: 3793 px ≈ 4,7 màn) · QT 2176 px.

**Chưa rà được + lý do:**
- Mọi trạng thái SAU KHI LƯU (tự sang việc kế, dải "✓ Xong · ‹ việc vừa xong", "Xong hết hôm nay ✓" của GV, Hoàn tác, lỗi mạng) — luật cấm lưu trên demo chung. Phần 2 mục CV-05 mô tả bằng đọc mã.
- Duyệt / Xác nhận PA cùng lúc (`XacNhanPaLo`): demo không có dòng gộp Xác nhận PA. Khai báo bậc (`khai_bac`), Đã thực hiện (`yt_thuc_hien`), Cập nhật kết quả thi thật (`thi_that`): demo không có việc.
- TVV 23 và CX 24 KHÔNG có khu Công việc (`/cong-viec` → Tổng quan; API trả 403 "Vai trò của bạn không có khu Công việc"). Bước tiếp sau thi của TVV/CX nằm ở Tổng quan + Học viên & Lớp (khu agent khác) — chỉ ghi lối vào.

---

## Phần 1. Điểm (khu Công việc + panel làm việc)

| # | Nielsen | Điểm | Lý do cụ thể |
|---|---|---|---|
| 1 | Trạng thái hệ thống | 2 | Hạn / quá hạn, dòng đang mở, trạng thái lưu từng ô tốt. Nhưng: đầu panel không nói đúng việc ("Nhập điểm · W1 JUL" cho việc "Nhập điểm Writing Task 2"); việc "2 bài" mà bảng 3 em; không có "Việc i/N · Còn n bài"; mở Kết quả PA nhanh thì tên việc + tên em biến mất; QL "Của tôi" báo "Xong hết hôm nay ✓" ngay dưới "Chờ bạn duyệt 10 ⚠1". |
| 2 | Khớp đời thực | 2 | Thuật ngữ nghề quen với GV, nhưng nhãn sai nghĩa: "Cả lớp" (thực ra = hiện mọi cột), "Chờ 4 kỹ năng" (đọc như việc của GV), nhóm "Ý thức & Phối hợp" không chứa việc Phối hợp, chip "Bình thường". |
| 3 | Kiểm soát, lối thoát | 2 | Có ✕ / Esc / "‹ Công việc" về đúng chỗ cuộn. Nhưng tự sang việc kế làm mất "Hoàn tác 10 s" của panel; hai link ↗ trong panel nhập điểm bắt chuyển trang; "Mở" thẻ duyệt, Chốt lộ trình, Xem nhận xét S đều rời Công việc. |
| 4 | Nhất quán | 1 | Tên dòng ≠ tên panel ở 6 loại việc; ba kiểu đầu panel (v3, đầu cũ 52 px, hộp phủ); cùng việc Chốt lộ trình: Tổng quan mở tại chỗ, Công việc chuyển trang; hạn Mini Test dòng 15/09 – panel 22/09; badge "Công việc n" hai nghĩa; máy tính chỉ cột của việc, điện thoại hiện tab cả 5 kỹ năng. |
| 5 | Phòng lỗi | 2 | Hộp điểm giữ chữ khi lỗi, nhận xét bắt buộc rõ. Nhưng con trỏ tự đặt vào em KHÔNG thuộc việc (MT cũ nhập bù); em ngoài việc vẫn sửa được ngay trong panel; GV mở "Chọn người phụ trách" ra panel có nút chính "Hoàn thành Case"; "Phân công…" sửa phân công cả lớp. |
| 6 | Nhận ra hơn nhớ | 2 | Việc không hạn (Phối hợp SOS, Báo PH, Chọn người phụ trách) dồn cuối nhóm sau "Xem thêm"; việc của chính QL (Chốt lộ trình, Bước tiếp) ở nhóm gập cuối trang; panel Ghi nhận vi phạm không cho thấy vi phạm gì; Kết quả PA nhanh không có PA / kỳ trước. |
| 7 | Linh hoạt, nhanh | 2 | Có hàng đợi, Enter = "Lưu · em tiếp", lọc GV, duyệt nhiều. Nhưng Dán Excel trong panel hỏng ở ≥ 1280 px, "Mẫu nhận xét" của mockup bị bỏ, nhiều lớp phải mở từng hàng gập, không phím tắt sang việc kế / trước. |
| 8 | Thẩm mỹ, tối giản | 2 | Danh sách gọn. Ngoại vi nhiễu: bảng co nửa panel + 4 nút dồn phải, cột "Chờ 4 kỹ năng", "Chưa có hạn" lặp, "2 HV" lặp "0/2 em", 4 dòng Bàn giao một lớp, câu giải thích dưới nút, "Lớp tôi dạy" tràn khung, khung phải trống "Chọn một việc ở danh sách". |
| 9 | Nhận ra / sửa lỗi | 3 | Lỗi dán Excel nói đúng chỗ ("Dán 4 tiêu chí — Band tự tính"), lỗi lưu ô có Thử lại, chữ giữ. Trừ: khung xem trước bị cắt trái nên không đọc được tên dòng lỗi. |
| 10 | Trợ giúp | 3 | Dải "Mới dùng PISA?", `?` 6 bước của Dán Excel, ⓘ ở "Dưới kỳ vọng". Thiếu giải thích tại chỗ cho "Cả lớp", "Chờ n kỹ năng", em "nhập bù". |
| | **Tổng** | **21/40** | Acceptable (20–27). Rà 17/10 toàn web: 27/40. |

**Cognitive load: trượt 5/8** (tải cao): Single focus ✗ (QL: Chờ duyệt + 84 việc + panel tự mở việc GV) · Chunking ✗ (nhóm 10 dòng + "Xem thêm", thanh lọc QL 8 lựa chọn) ·
Grouping ✓ · Visual hierarchy ✗ (việc cần quyết của QL ở cuối, gập) · One thing at a time ✓ · Minimal choices ✗ (thanh lọc QL 8, thanh nút lưới 4 + 2 link) ·
Working memory ✗ (tên dòng ≠ tên panel, phải tự nhớ em nào thuộc việc) · Progressive disclosure ✓.

**Có xứng ≥ 35/40 không? Không.** Ba lý do gốc: (1) panel Nhập điểm — việc nhiều nhất của GV — vẫn là bản "Trước" của mockup 2 (mock2-p1 khung "Trước" = web hôm nay), không phải bản đã duyệt;
(2) hàng đợi và danh sách không phân biệt "việc của tôi / việc tôi phải quyết" với "việc người khác", nên GV và QL đều thấy nhiều việc không phải của mình;
(3) 3 lỗi bố cục P1 (Dán Excel bị cắt, Kết quả PA nhanh mất tiêu đề, Lớp tôi dạy tràn). Sửa 3 nhóm này + đồng bộ tên → ước 29–31; muốn ≥ 35 cần Phần 3.

**Design specificity:** đúng chế độ Operate, token màu / chip SOS thống nhất, không "slop". Điểm yếu là **hệ panel chưa một khuôn**: panel tại chỗ (v3) · đầu cũ 52 px (Bàn giao, Thông tin lớp, Giao việc, Gia hạn) · ngăn phủ 560 px chồng lên panel tại chỗ.
**Hành trình cảm xúc (Cô Linh):** vào trang gặp ngay "⚠ quá hạn 68 ngày" và panel tự mở việc cũ nhất (không phải lớp vừa dạy) → phải tìm lại việc hôm nay; nhập xong thì bị đẩy sang việc khác loại; "Xong hết hôm nay ✓" chỉ đến khi trả hết nợ cũ.

**Persona — cờ đỏ:**
- **Cô Linh (GV, 20 bài cuối buổi, hay dùng điện thoại):** con trỏ đứng ở em ngoài việc (`v2-gv10-dau`); mỗi bài phải gõ nhận xét ≥ 10 ký tự, không có "Mẫu"; Dán Excel ở máy tính bị cắt (`v2-gv10-dan`); điện thoại hiện tab L · R · W1 · S của GV khác, 2 hàng (`v2-gv10-375-mo-p1`).
- **Chị Vy (QL, giao ban 10 phút):** mặc định 84 việc, nhóm đầu là 31 việc nhập điểm của GV (hiện 10 + "Xem thêm"); 6 Chốt lộ trình quá hạn + Bước tiếp nằm ở "Việc quản lý" gập cuối trang; "Của tôi 1" + "Xong hết hôm nay ✓" (`ql2-cua-toi-p1`); vào trang, panel tự mở lưới nhập điểm của GV Hà và trang tự cuộn khỏi "Chờ bạn duyệt" (`v2-ql2-dau`).
- **Alex (thạo việc):** không phím sang việc kế / trước; "Xem thêm" 10 dòng một lần; hàng gập từng lớp.
- **Sam (bàn phím):** Tab đi đúng thứ tự, vòng focus rõ (`gv10-tab`); Esc chỉ đóng panel khi focus đang trong panel; sau Esc focus không về dòng việc (GIẢ THUYẾT — `HoTroHocVienTab.tsx:202–207` không trả focus).

---

## Phần 2. Phát hiện (nặng → nhẹ)

### CV-01 Panel Nhập điểm hiện em NGOÀI việc, con trỏ đặt sai em
Loại [XÁC NHẬN-ẢNH + PHÁT HIỆN] · P1 · GV, QL, QT
- Vấn đề: việc "2 bài" mở bảng 3 em; việc **1 em** (Hà Gia Bình, "1 bài") mở bảng 3 em; nhóm "W2 SEP" lớp MB FT 101 "1 bài" nhưng lưới có 4 ô W2 trống sửa được. Con trỏ tự đứng ở Bùi Thảo Vy — em KHÔNG thuộc việc.
- Bằng chứng: `v2-gv10-dau-p1`, `gv10-mot-em`, `gv10-o--hop` (hộp mở cho Bùi Thảo Vy). API `/classes/3/cham?periodId=31`: ô W2 của Bùi Thảo Vy `progress: "lich_su"` (MT cũ nhập bù, không tính việc), 2 em kia `due`; `periodId=34`: Lý Minh Châu, Đỗ Minh Khôi `lich_su`; `periodId=41`: 4 ô W2 `due` nhưng việc chỉ có Lương Bảo Anh. Mã: `PanelViec.tsx:239–242` gọi `LuoiNhung` KHÔNG truyền `chiAttempt` (chỉ `PanelNhapDiem` dòng 163–164 có lọc em); `LuoiChamLop.tsx:144` đặt con trỏ ở `[data-trong]` đầu tiên. PR #469 đã ghi "Chưa xác minh: … 2 bài hiện 3 em" — chưa sửa.
- Nguyên nhân: triển khai (OV-15b áp lọc em cho panel một lượt, quên panel theo tuần — đường mà MỌI việc có tuần thi đi qua, `PanelViec.tsx:101`).
- Ảnh hưởng: GV nhập điểm nhầm em, nghĩ việc chưa xong; số "2 bài" mất tin cậy.
- Phương án: panel chỉ hiện em của việc (`emIds` / `con`), con trỏ ở ô trống đầu của việc; em ngoài việc chỉ hiện khi bấm "Hiện cả lớp". Lý do: số trên dòng = số hàng trong panel (CLAUDE.md "cùng nguồn, cùng hàm").
- Lệch mockup: mockup 2 khung "vừa xong" (`mock2-p10`): việc Hà Gia Bình chỉ một hàng.

### CV-02 Dán từ Excel trong panel bị cắt trái, lưới biến mất (≥ 1280 px)
Loại [PHÁT HIỆN] · P1 · GV, QL
- Vấn đề: ở 1440 bấm "Dán từ Excel" → khối dán rộng hơn panel, phần trái bị cắt: tiêu đề "…cel · W1 JUL 2026", tên em "…Bảo Anh", "…h Quân"; lưới điểm bị ép về 0 px. `?` cũng bị cắt.
- Bằng chứng: `v2-gv10-dan` (phông đúng, vẫn cắt: "xcel · W1 JUL 2026", "…ăn X · không có"), `gv10-dan--khung`, `gv10-dan-hoi`. Mã `LuoiChamLop.tsx:207–209`: `xl:flex-row-reverse` + khối dán `xl:w-[56rem]` (896 px) trong panel ~800 px (1440) / ~920 px (1536 = máy chủ SP 125 %).
- Nguyên nhân: triển khai — bố cục "lưới trái, khối dán phải" của mockup 1d dành cho trang rộng, đem nguyên vào panel.
- Ảnh hưởng: đúng lối nhanh nhất cho "Cô Linh 20 bài" không dùng được ở máy tính; không đọc được dòng nào khớp / lỗi.
- Phương án: trong panel luôn xếp chồng (khối dán trên, lưới dưới) hoặc khối dán thay lưới (như 375 `gv10-375-dan-p1`); bỏ `?` trùng (đã có `?` cạnh nút). Rule `horizontal-scroll`, `truncation-strategy`.

### CV-03 Kết quả PA "ghi nhanh" làm mất tiêu đề + tên em của dòng
Loại [PHÁT HIỆN] · P1 · GV, QL
- Vấn đề: bấm "Kết quả PA Reading · Lý Minh Châu" → khối ghi mở dưới dòng, nhưng dòng chỉ còn chip "SOS 1" + hạn; tên việc, tên em, lớp biến mất. Khung phải hiện "Chọn một việc ở danh sách".
- Bằng chứng: `v2-gv7-kq-pa-p1`, `gv9-kq-pa`. Chỉ từ 640 px: ở 375 tiêu đề còn (`v2-gv7-kq-pa-375-p2`). Mã `WorkList.tsx:148`: khối `col-span-full sm:col-start-2` → chiếm riêng cột 2 (`auto`), cột 1 (`minmax(0,1fr)`) co về 0.
- Nguyên nhân: triển khai (OV-13b).
- Ảnh hưởng: GV gõ nhận xét mà không thấy đang ghi cho em nào; khối ghi cũng thiếu PA đang chạy và kết quả kỳ trước (panel lớn `gv7-kq-dieu-chinh` thì có).
- Phương án: khối mở bắt đầu ở cột 1 (`sm:col-start-1`), thêm một dòng bối cảnh "PA · kỳ trước" trong khối; khung phải hiện bối cảnh em (hoặc bỏ ghi nhanh, mở panel như mọi việc — xem Phần 3).

### CV-04 Panel Nhập điểm vẫn là bản "Trước" của mockup 2; hai link cùng chuyển trang
Loại [XÁC NHẬN-ẢNH] · P1 · GV, QL, QT
- Vấn đề: tiêu đề "Nhập điểm · W1 JUL" ≠ tên việc "Nhập điểm Writing Task 2"; dòng 2 là link "1 lớp · 2 bài ↗"; thêm hàng lớp gập "MB FT 101 MT1 W1 JUL · Writing Task 2 · 2 bài" lặp ý; "Mở lưới đầy đủ ↗" là link thứ hai. Cả hai link rời Công việc sang Test › Lịch Test (khác trạng thái: một lọc lớp + mở "Test quá hạn chấm" 2 em, một mở "Lịch Test W1 JUL" 3 em), trang đích không có "‹ Công việc".
- Bằng chứng: `gv10-dau-p1`, `gv10-luoi-day-du-p1`, `gv10-lop-bai-p1`; mockup `mock2-p1` khung "Trước · panel hiện tại" giống hệt; khung "Sau" `mock2-p2`: "Nhập điểm Pronunciation · ⚠ · MB FOU 12 ↗ · Progress Test W3 AUG · 2 bài · Còn 2 bài · Cả lớp", bảng rộng hết panel, không link lưới. Mã `PanelViec.tsx:211` (tiêu đề theo tuần), `:217–219` (link Lịch Test), `LuoiNhung.tsx:24–29` ("Mở lưới đầy đủ ↗").
- Nguyên nhân: kế hoạch + triển khai — OV-15b chỉ nói "lưới một component… chỉ cột của việc"; không ghi đổi đầu panel theo tuần; không có lý do lệch trong PR #469.
- Ảnh hưởng: mọi việc nhập điểm (6/6 dòng Chấm điểm của GV 10); lệch luật "xử lý tại chỗ".
- Phương án: đầu panel = tên việc + chip hạn; dòng 2 "lớp ↗ (hồ sơ lớp) · lượt · tuần · n bài"; bỏ "1 lớp · 2 bài ↗"; "Mở lưới đầy đủ" chuyển vào ⋯ (hoặc bỏ). Thêm "Việc i / N · Còn n bài" như mockup 2.

### CV-05 Hàng đợi "lưu xong tự sang việc kế": mất Hoàn tác, nhảy vào việc ẩn / gập / không phải của mình, có thể mất chữ
Loại [PHÁT HIỆN (mã) + GIẢ THUYẾT] · P1 · GV (QL, QT cũng chạy)
- Hành vi (đọc mã `HoTroHocVienTab.tsx`): mỗi lần lưu → `daLam` giữ dòng (mờ + gạch); khi `/my-work` tải lại mà việc biến mất → `useEffect` dòng 224–229 mở `keTiep`. `keTiep` lấy từ `thuTu` (dòng 175) = MỌI việc có panel theo thứ tự nhóm, gồm cả việc sau "Xem thêm", việc ở nhóm đang gập, việc "Chưa có người" / không phải của mình (GV 7: "Thêm PA · Dương Ngọc Ánh · Chưa có người", "Chọn người phụ trách"). Ghi nhanh Kết quả PA nhảy ngay (dòng 249). Dải "✓ Xong: … · ‹ việc vừa xong" (390–395) mở lại việc đã xong ở dạng form.
- Rủi ro:
  1. Panel NganCase có khối "✓ Đã lưu · Hoàn tác 10 s · Việc tiếp ›" (`KhuonViec.tsx:131`) — bị thay ngay khi danh sách tải lại → Hoàn tác thực tế không bấm được. Mockup 2 (`mock2-p10`) có "✓ Xong … · Hoàn tác" trên dải; web chỉ có "‹ việc vừa xong".
  2. Tự sang việc khác loại (Chấm điểm → Case học thuật → Ý thức gập), dòng được chọn không thấy trên danh sách. Mockup 1e: "Việc kế = việc gần hạn nhất **cùng loại** của chính người này".
  3. [GIẢ THUYẾT] Lưu ô cuối của việc rồi mở ngay ô khác (vd em nhập bù) và gõ: khi danh sách tải lại, lưới bị thay → chữ trong hộp mất không hỏi (hiệu ứng không gọi `boDuocChu`/`coPanelDangSua`). Kiểm: trên bản sao dữ liệu, lưu ô cuối việc "2 bài", gõ ngay vào ô Bùi Thảo Vy.
  4. [GIẢ THUYẾT] "‹ việc vừa xong" mở lại Thêm PA / Ghi nhận xét dạng form trống → dễ thêm PA lần hai. Kiểm như trên.
  5. "Xong hết hôm nay ✓" (dòng 285): chỉ xét việc quá hạn + hạn tuần này; không xét thẻ Chờ duyệt / Bị từ chối; danh sách bên dưới vẫn đủ nhóm (mockup: "Sau tuần này 9" gập). Chữ "hôm nay" nhưng điều kiện là "hết tuần".
- Phương án: Phần 3, mục B.

### CV-06 QL: việc phải quyết của chính QL bị tính "Của GV", nằm cuối, gập; "Xong hết hôm nay ✓" sai
Loại [PHÁT HIỆN] · P1 · QL, QT
- Vấn đề: Chốt lộ trình (6 quá hạn), Bước tiếp, Phân công có `mine=false` → "Của tôi 1", "Của GV 83". Bấm "Của tôi": "Xong hết hôm nay ✓" + "Việc quản lý 0" ngay dưới "Chờ bạn duyệt 10 ⚠1". Ở "Tất cả", nhóm đầu là 31 việc nhập điểm của GV; "Việc quản lý 15 ⚠8" gập ở cuối (trang 2080 px); với QT ở Uông Bí, "Chọn bước tiếp · UB FT 401 · quá hạn 22 ngày" cũng nằm trong nhóm gập này.
- Bằng chứng: `ql2-dau-p1/p2`, `ql2-cua-toi-p1`, `ql2-viec-ql-p2/p3`, `qt1-buoc-tiep--ds`. API `/my-work?nguoi=tat-ca` (user 2): `chot_len_ft … owner=null mine=false`. Mã `shared/domain/congViec.ts:292` (`khopNguoiViec` theo `mine`), `HoTroHocVienTab.tsx:168–169` (nhóm Việc quản lý `moSan:false`).
- Nguyên nhân: thiết kế + triển khai (mockup 3 đặt Việc quản lý cuối, gập; "mine" chỉ theo người phụ trách).
- Ảnh hưởng: "Chị Vy" giao ban 10 phút không thấy việc của chính mình; dễ bỏ sót Chốt lộ trình / Bước tiếp.
- Phương án: "Của tôi" của QL gồm việc QL phải làm (Chốt lộ trình, Bước tiếp, Phân công, Báo PH giao cho QL); đặt khối "Cần bạn quyết" (Chờ duyệt + Chưa có người + Việc quản lý quá hạn) đầu trang, mở sẵn; việc của GV gập theo GV. Câu hỏi cho chủ SP (Phần 4).

### CV-07 "Phân công…" mở cả "Thông tin lớp" (ngăn phủ) thay hộp nhỏ; không sửa được đúng việc
Loại [PHÁT HIỆN] · P1 · QL, QT
- Vấn đề: bấm "Phân công…" ở "Thêm PA học thuật Reading · Dương Ngọc Ánh · Chưa có người" → ngăn phủ 560 px "Thông tin lớp MB FOU 12" (Lớp · Phân công GVCN/L/R/G+V/P · Lịch Test), chồng lên panel tại chỗ đang mở. Ô R đã là Trần Ngọc Hà → QL không biết sửa gì; "Lưu phân công" đổi phân công CẢ LỚP.
- Bằng chứng: `ql2-phan-cong`; DB `sos_cases.id=14 owner_user_id NULL`, lớp 6 có GV R. Mã `HoTroHocVienTab.tsx:368–370, 419`, `PanelViec.tsx:254–264`. Mockup 3 (`mock2-p16`): hộp nhỏ "Phân công · Thêm PA học thuật Reading · Dương Ngọc Ánh · Người phụ trách ▾ · Huỷ · Giao việc".
- Nguyên nhân: triển khai dùng lại panel có sẵn sai mục đích (Case thiếu người ≠ lớp thiếu GV).
- Ảnh hưởng: việc "Chưa có người" không xử lý được trong 1–2 bấm; nguy cơ đổi phân công ngoài ý.
- Phương án: hộp nhỏ ngay dòng (chọn người phụ trách cho Case, gợi ý GV môn), chỉ mở "Thông tin lớp" khi lớp thật sự thiếu GV môn (`thieu_gv_mon`).

### CV-08 Một Case hai dòng việc; GV mở "Chọn người phụ trách" ra panel có nút chính "Hoàn thành Case"
Loại [PHÁT HIỆN] · P1 · GV, QL
- Vấn đề: Case 14 sinh "Thêm PA học thuật Reading · Chưa có người" (có Phân công…) VÀ "Chọn người phụ trách" (không hạn, cuối nhóm sau "Xem thêm"). Cả GV 7, 8, 9 (dạy lớp MB FOU 12) đều thấy. GV mở "Chọn người phụ trách" → panel "Case Reading" chỉ có "+ Thêm PA" và nút chính "Hoàn thành Case", không có ô chọn người.
- Bằng chứng: `gv7-nguoi-pt`, `gv7-pa-chua-nguoi` (GV 7 mở được form Thêm PA của việc không phải của mình), `gv9-xem-nx--ds`. API GV 7/8/9 đều có `no_owner owner:14`. Mã `server/src/worklist/mywork.ts:1218–1239` (hiện cho mọi người `teachesClass`), `PanelViec.tsx:134–137`.
- Nguyên nhân: dữ liệu + triển khai (hai nguồn việc cho cùng gốc; vai không làm được vẫn thấy).
- Ảnh hưởng: nhiễu danh sách 3 GV; badge GV 7 "10" gồm cả việc Chưa có người; GV có thể bấm nhầm "Hoàn thành Case".
- Phương án: gộp thành một dòng "Chưa có người · Thêm PA …" chỉ QL (người có quyền phân công) thấy; GV không thấy việc chưa giao.

### CV-09 QL / QT: vào trang bị tự mở lưới nhập điểm của GV và tự cuộn khỏi "Chờ bạn duyệt"
Loại [PHÁT HIỆN] · P1 · QL, QT
- Vấn đề: mở Công việc, panel phải tự mở việc đầu ("Nhập điểm Listening, Reading · Trần Ngọc Hà") và con trỏ nhảy vào ô điểm đầu → trang tự cuộn ~600 px: tiêu đề, thanh lọc, đầu "Chờ bạn duyệt 10 ⚠1" và 2/3 thẻ duyệt ra khỏi màn. Panel còn hiện "GV chấm S: Nguyễn Khánh Vy ▾" (QT: tên QT) dù việc chỉ có L, R.
- Bằng chứng: `v2-ql2-dau`, `v2-qt1-dau` (khung nhìn ngay khi vào trang; so `ql2-dau-p1` chụp cả trang). GV chỉ cuộn ~20 px (`v2-gv10-dau`). Mã `HoTroHocVienTab.tsx:235–240` (tự mở việc đầu), `LuoiChamLop.tsx:148` (`scrollIntoView` ô trống đầu), `LuoiFT.tsx:174` (nút "GV chấm S" hiện khi người xem sửa được S).
- Nguyên nhân: triển khai — UX-2 "tự mở việc đầu" (hợp với GV) áp nguyên cho QL; con trỏ tự đặt cả khi panel do máy mở, không do người bấm.
- Ảnh hưởng: "Chị Vy" mở trang thấy lưới điểm của GV khác thay vì việc phải quyết; dễ gõ nhầm vào lưới của GV.
- Phương án: QL / QT không tự mở việc của GV (hoặc tự mở thẻ đầu của "Cần bạn quyết"); không đặt con trỏ / không cuộn khi panel tự mở, chỉ khi người dùng bấm việc; ẩn "GV chấm S" khi việc không có S. Mockup 3: dòng việc của GV có `?` giải thích + "Mở để nhập thay".

### CV-10 "Lớp tôi dạy" tràn ra ngoài thẻ
Loại [XÁC NHẬN-ẢNH] · P2 · GV
- Vấn đề: thẻ rộng 560 px, bảng kéo tới ~780 px (1440) — đúng ảnh chủ SP (~975 px ở 125 %).
- Bằng chứng: `v2-gv10-dau-p1`, `v2-gv10-sang-p1` (sáng rõ hơn), `gv10-mo-nhom-p1`. Mã `LopToiDay.tsx:92–93` (`table-scroll bang-dinh` + `min-w-[760px]`), `index.css:189` (`.bang-dinh { overflow: visible }` từ 1280 px).
- Nguyên nhân: triển khai (OV-15d chuyển khối từ Tổng quan GV rộng sang cột 560 px, giữ lớp `bang-dinh`).
- Phương án: bỏ `bang-dinh` ở bảng này (giữ `table-scroll`) hoặc đưa "Lớp tôi dạy" ra bề rộng trang dưới cả hai cột; bớt cột "Tôi dạy" xuống dòng phụ. Rule `horizontal-scroll`.

### CV-11 Bảng co nửa panel, thanh 4 nút dồn mép phải; "Cả lớp" thực ra là "mọi cột"
Loại [XÁC NHẬN-ẢNH] · P2 · GV
- Vấn đề: bảng 404 px (176 + 104 + 124) trong panel ~825 px (1440) / ~920 px (1536); thanh "Mở lưới đầy đủ ↗ · Dán từ Excel · ? · Cả lớp" `justify-end` → mắt nhảy từ trái sang phải. "Cả lớp" chỉ thêm cột L · R · W1 · W · S (trống, không sửa được) và làm bảng tràn ngang; em vẫn chỉ là em trong tuần đó.
- Bằng chứng: `v2-gv10-dau-p1`, `gv10-ca-lop`. Mã `LuoiFT.tsx:168` (`rongBang = chiCot ? '' : 'w-full'`), `LuoiChamLop.tsx:180, 191–195`.
- Phương án: bảng rộng hết panel (cột Học viên co giãn), nút đặt sát trên bảng bên trái (đếm "Còn n bài" trái, "Hiện cả lớp" phải như mockup); đổi chữ "Cả lớp" → "Hiện cả lớp" và làm đúng nghĩa (thêm em + cột).

### CV-12 Cột "Kết quả: Chờ 4 kỹ năng" vô ích với GV một kỹ năng
Loại [XÁC NHẬN-ẢNH] · P2 · GV
- Vấn đề: 3/3 hàng "Chờ 4 kỹ năng" khi chưa ai có điểm; đọc như việc GV phải làm 4 kỹ năng. Chiếm 1/3 bảng.
- Bằng chứng: `v2-gv10-dau-p1`. Mã `LuoiFT.tsx:420, 428`.
- Nguyên nhân: thiết kế (mockup 1a giữ cột Kết quả, nhưng với nội dung có ích: "SOS 2 tạm · L, R · còn P").
- Phương án: khi hàng chưa có điểm nào → để trống; sau khi GV lưu ô của mình → "Đạt / Chưa đạt kỳ vọng" của chính kỹ năng đó (phản hồi tức thì), Kết quả lượt chỉ khi ≥ 2 kỹ năng có điểm.

### CV-13 Tên việc ≠ tên panel (6 loại)
Loại [PHÁT HIỆN] · P2 · mọi vai
- "Nhập điểm Writing Task 2" → "Nhập điểm · W1 JUL" · "Ghi Mini Test · Vương Bảo Ngọc" → "Kết quả cuối" · "Xử lý vi phạm · Quách Thành Nam (3) · bậc kế tiếp: Report 1" → "Xác nhận xử lý" ·
  "Ghi nhận vi phạm mới · MB FT 101 · 3 em" → "Ghi nhận" · "Chọn bước tiếp · UB FT 401" → "Bước tiếp" · cùng một việc có ba tên "Thiếu PA học thuật" (dòng gộp) / "Thêm PA học thuật …" (dòng đơn) / "Thêm PA" (panel).
- Bằng chứng: `gv10-dau-p1`, `gv7-mini`, `gv10-xu-ly`, `gv7-ghi-nhan-vp`, `qt1-buoc-tiep`, `gv9-thieu-pa`.
- Phương án: một hàm tên việc dùng chung cho dòng + đầu panel (động từ + đối tượng, như mockup v3 "Đầu"); tên dài như "(3) · bậc kế tiếp: Report 1" chuyển xuống dòng phụ. Rule `consistency`.

### CV-14 Hạn trên dòng ≠ hạn trên panel (Mini Test)
Loại [PHÁT HIỆN] · P2 · GV
- Vấn đề: dòng "Ghi Mini Test · Vương Bảo Ngọc · hạn 15/09"; panel "Kết quả cuối · hạn 22/09".
- Bằng chứng: `gv7-mini`. Mã `mywork.ts:1072–1084` (dòng = `mini_test.han`), panel = hạn kỳ PA (NganCase view ghi-kết-quả).
- Nguyên nhân: triển khai (hai nguồn hạn). Lệch luật "cùng số liệu cùng hàm".
- Phương án: một hạn cho một việc (lấy hạn Mini Test ở cả hai nơi), panel ghi rõ "hạn Mini Test 15/09".

### CV-15 Nhóm "Ý thức & Phối hợp" không chứa việc Phối hợp; việc không hạn chìm sau "Xem thêm"
Loại [PHÁT HIỆN] · P2 · GV
- Vấn đề: "Phối hợp SOS · MB FT 101 · 6 lượt" và "Báo phụ huynh qua TVV" nằm ở **Case học thuật**, xếp cuối (không hạn), sau "Xem thêm 6 việc"; nhóm "Ý thức & Phối hợp" chỉ có vi phạm.
- Bằng chứng: `gv7-dau-p2`, `gv7-phoi-hop` (phải bấm "Xem thêm" mới thấy). Mã `shared/domain/tongQuan.ts:34, 42–43`.
- Phương án: đổi nhãn nhóm thành "Ý thức" HOẶC chuyển Phối hợp SOS + Báo PH về nhóm này; việc không hạn hiện "chưa có hạn" một lần ở đầu nhóm con, không lặp từng dòng.

### CV-16 Badge "Công việc n" hai nghĩa, khác số trên trang
Loại [PHÁT HIỆN] · P2 · GV, QL, QT
- GV: số việc quá hạn trong danh sách (GV 7 "10" gồm cả việc "Chưa có người" không phải của cô). QL/QT: số thẻ chờ duyệt MỌI chi nhánh (QT "12"), trong khi trang lọc Monbay ghi "Chờ bạn duyệt 10" và "⚠44 quá hạn".
- Bằng chứng: `gv7-dau-p1`, `qt1-dau-p1`; API `/yeu-cau/dem` 12 (toàn hệ thống) / 10 (`branchId=1`). Mã `App.tsx:70–73`.
- Phương án: một nghĩa cho mọi vai: "việc của tôi đang quá hạn + thẻ tôi phải quyết", cùng phạm vi chi nhánh đang chọn; `sr-only` nói đủ câu (rule `contextual-live-badge-updates`, `tab-badge`).

### CV-17 Thanh lọc QL 8 lựa chọn (mockup đã duyệt: 3)
Loại [PHÁT HIỆN] · P2 · QL, QT
- Vấn đề: "Của tôi · Của GV · Tất cả" + nút riêng "Xem việc của: một GV… ▾" + "⚠ quá hạn" + công tắc "Tất cả · Fast Track · Lớp thường" (+ ô "Chi nhánh" có nhãn đứng trên, lệch hàng). 375: chiếm 3 hàng + câu "10 chờ bạn duyệt".
- Bằng chứng: `ql2-dau-p1`, `qt1-dau-p1`, `v2-ql2-375-p1` (phông đúng: vẫn 3 hàng); mockup 3 (`mock2-p14`): "Của tôi 5 · Của GV 79 ▾ · Tất cả 84" một hàng, "Chương trình → thanh ngữ cảnh".
- Phương án: gộp chọn GV vào "Của GV ▾"; chuyển công tắc chương trình + chi nhánh lên thanh ngữ cảnh chung; ô chi nhánh không nhãn trên (cùng hàng). Rule `progressive-disclosure`, `primary-action`.

### CV-18 Phần của mockup 2 bị bỏ hẳn, không ghi lý do: "Mẫu nhận xét", "Việc i/N · Còn n bài", "Hoàn tác" trên dải xong
Loại [PHÁT HIỆN] · P2 · GV
- Bằng chứng: mockup 1b / 2 / 2b (`mock2-p9`, `mock2-p13`): "Mẫu: 3 câu gần nhất … + Như em trước"; "Việc 1 / 19 · Còn 3 bài"; "✓ Xong … · Hoàn tác". `grep` toàn `web/src`, `shared`, plan, kế hoạch OV-15: không có. Spec 18/10 mục 6: "Không nhắc = duyệt như mockup v2".
- Ảnh hưởng: nhận xét ≥ 10 ký tự bắt buộc cho MỌI bài MT → 20 bài = 20 lần gõ tay.
- Phương án: làm "Mẫu" (3 câu gần nhất của chính GV cho kỹ năng + "Như em trước") trong hộp nhập điểm và khối dán; thêm bộ đếm; Hoàn tác trên dải.

### CV-19 Panel / hộp phủ chồng lên panel tại chỗ
Loại [PHÁT HIỆN] · P2 · GV, QL, QT
- "Phân công…" (`ql2-phan-cong`), "+ Giao việc" (`ql2-giao-viec`), "Gia hạn" trong panel Bước tiếp (`qt1-gia-han`), bấm số "Lớp tôi dạy" (`gv10-lop-toi-day-so`) đều mở ngăn 560 px phủ nền tối, panel tại chỗ vẫn mở phía sau → hai panel cùng lúc (CLAUDE.md: không panel lồng panel).
- Phương án: Gia hạn = hộp nhỏ ngay dưới dòng "Đã xong · Đạt Target" của panel; Phân công = hộp nhỏ (CV-07); số "Lớp tôi dạy" mở trong khung phải (thay việc đang mở) với "‹ Việc".

### CV-20 Chốt lộ trình: Công việc chuyển trang, Tổng quan mở tại chỗ
Loại [PHÁT HIỆN] · P2 · QL, QT
- Bằng chứng: `ql2-chot-lt` (sang Hồ sơ lớp › Lộ trình tiếp theo, có "‹ Công việc"); PR #482 ý 6: Tổng quan mở `BangLoTrinhTiep` tại chỗ. Mã `PanelViec.tsx:36–40` (`chot_len_ft` không `lamTaiCho`).
- Phương án: dùng cùng panel `BangLoTrinhTiep` ở Công việc.

### CV-21 Điện thoại: chế độ một kỹ năng hiện tab cả 5 kỹ năng
Loại [PHÁT HIỆN] · P2 · GV
- Vấn đề: việc W2 mở tab "W2 0/3 · L 0/3 · R 0/3 · W1 0/3 · S 0/3" (phông đúng: xuống 2 hàng); 4 tab không phải của GV; "0/3" đếm 3 em dù việc 2 bài; nhãn "KV 6.0" viết tắt.
- Bằng chứng: `v2-gv10-375-mo-p1`. Mã `LuoiChamLop.tsx:160` (`MotKyNang` nhận `ft` chưa lọc cột).
- Phương án: chỉ tab của việc; đếm theo bài của việc; "Kỳ vọng 6.0". Mockup 1f: "1 / 2 bài", "3 em đã có P" gập.

### CV-22 Panel Ghi nhận vi phạm (lô) không cho thấy vi phạm
Loại [PHÁT HIỆN] · P2 · GVCN
- Vấn đề: chỉ có 3 tên + "1 vi phạm mới" + nút "Ghi nhận · 3 em"; không ngày, lỗi gì, ai ghi → ghi nhận mù.
- Bằng chứng: `gv7-ghi-nhan-vp` (so `gv10-xu-ly`: panel Xác nhận xử lý có danh sách vi phạm).
- Phương án: mỗi em một dòng con "02/09 · Nghỉ học không báo trước · Trần Ngọc Hà ghi" như panel Xác nhận xử lý.

### CV-23 Thêm PA / Xác nhận PA lệch panel v3
Loại [PHÁT HIỆN] · P2 · GV, QL
- Thêm PA: "Loại PA" là ô chọn (v3: chip hai nhóm Tự làm / Cần QL duyệt), không có "Người thực hiện *", còn "(không bắt buộc)" + câu "Có số buổi thì web đếm sau mỗi lần Kết quả" (v3 "Đã lược bỏ" ghi bỏ), Bối cảnh chỉ "Nguyên nhân 1 Từ vựng / ngữ pháp" (thiếu câu mô tả + Kết quả gần nhất), có thêm hàng "← Case Reading".
- Xác nhận PA: v3 §3 "bấm thẳng" (PA quy chế điền sẵn); web bắt gõ Nội dung ≥ 15 ký tự + Số buổi.
- Bằng chứng: `gv10-them-pa`, `gv7-xn-pa`; `mock-v3` §3, §6 (`SCR\a2tmp\mockup-ov12-panel-v3-2026-10-14.txt` dòng 120–160, 274–326, 509–524).
- Phương án: theo v3; nếu Học Tutor bắt buộc số buổi thì điền sẵn theo quy chế, GV chỉ bấm.

### CV-24 Chấm Speaking: đếm lớp lệch, ô "Người chấm" thừa, bài đã chấm trộn giữa danh sách
Loại [PHÁT HIỆN] · P2 · GV S
- Dòng "Chấm Speaking · 24 bài · 4 lớp" ↔ ô lọc "Mọi lớp (5)"; hộp chấm có "Người chấm: Chưa chọn [Đổi]" (mockup 2b không có, GV đang chấm chính là người chấm); bài đã có điểm ("Nhập bởi …") đứng xen giữa bài chưa chấm.
- Bằng chứng: `gv9-speaking--ds`, `gv9-speaking`; mockup `mock2-p13`. Mã `PanelChamSpeaking.tsx:40, 62` (ô lọc đếm lớp của mọi dòng, cả bài đã chấm) ↔ `server/src/worklist/mywork.ts:555` (dòng việc đếm lớp còn bài).
- Phương án: mặc định người chấm = người đang chấm; bài đã chấm gập cuối "n bài đã chấm"; số lớp một hàm.

### CV-25 "Điền Target" mở cả form "Sửa thông tin"; ô Target nằm dưới màn
Loại [PHÁT HIỆN] · P2 · GVCN
- Bằng chứng: `gv7-target` (Họ tên, Ngày sinh, Email, TVV, Ghi chú, Lộ trình…; Target phải cuộn mới thấy). Mã `PanelViec.tsx:133`.
- Phương án: panel chỉ một ô Target (+ Dự kiến thi nếu thiếu), con trỏ đứng sẵn; "Sửa thông tin khác" là link.

### CV-26 Panel nhiều lớp / nhiều tuần: mở từng hàng gập, tiêu đề lấy tuần đầu
Loại [PHÁT HIỆN] · P2 · GV, QL
- "Nhập điểm · W3 SEP · 14 bài · 4 lớp" → 5 hàng gập (MB FOU 12 hai lần), mỗi lớp +1 bấm. QL "Nhập điểm · MB FT 101 · 15 bài" (chấm chéo S, 6 tuần) → panel tên "Nhập điểm · W1 JUL" + 6 hàng gập. Hàng đầu luôn hiện em đã xong ("Đã hoàn tất").
- Bằng chứng: `gv7-w3sep`, `ql2-cham-cheo--ds`, `gv10-nhieu-lop-p1`. Mã `PanelViec.tsx:211–212`.
- Phương án: mở sẵn mọi lớp còn bài (≤ 3) hoặc đi tuần tự "Lớp 1/3 ›"; tiêu đề = tên việc của dòng.

### CV-27 "Mở" trên thẻ Chờ duyệt rời Công việc
Loại [PHÁT HIỆN] · P2 · QL
- Bằng chứng: `ql2-mo-the` → Hồ sơ học viên + ngăn Case phủ (thẻ lặp lại Duyệt / Từ chối…).
- Phương án: "Mở" mở ngăn Case trong khung phải của Công việc (thay việc đang mở), giữ nguyên trang.

### CV-28 Nhiễu chữ và trùng ý
Loại [PHÁT HIỆN] · P3 · mọi vai
- Chip "Bình thường" trên dòng Thêm PA / Kết quả PA (`gv10-dau-p1`, `qt1-buoc-tiep`); "Chưa có hạn" lặp mỗi dòng con (`gv9-xem-nx--ds`); "0/2 em · 2 HV", "Bàn giao 2 em … · 2 HV" (`gv10-ban-giao--ds`); 4 dòng Bàn giao cho một lớp (GVCN + L + R + W);
  câu dưới nút: "Đánh dấu ô ở thẻ để duyệt nhiều cùng loại." (`HopChoDuyet.tsx:191`, không qua `t()` → bản EN vẫn tiếng Việt), "Bấm số để xem danh sách em", "Việc mới sẽ hiện ở đây khi có.", "Nhìn thấy công việc nhưng KHÔNG sửa được." (Giao việc);
  lớp thường trong panel việc còn "Tạo bài kiểm tra theo chương trình", "tổng · Điền cả cột" (`qt1-buoc-tiep--ds`, `gv7-lop-thuong`); "Phương án: … đến Cuối khoá … đến Cuối khoá · W2 OCT" lặp (`gv7-xn-case`).
- Phương án: bỏ chip mức "Bình thường"; một "Chưa có hạn" ở đầu dòng gộp; gộp Bàn giao một lớp thành một dòng; bỏ câu giải thích (đưa vào `?`); ẩn nút tạo bài / Điền cả cột trong panel việc.

### CV-29 Khung phải trống "Chọn một việc ở danh sách"
Loại [PHÁT HIỆN] · P3 · GV, QL
- Khi ghi nhanh Kết quả PA, sau Esc, hoặc QL "Của tôi": nửa màn bên phải là một thẻ chữ (`gv7-kq-pa`, `gv10-esc`, `ql2-cua-toi-p1`).
- Phương án: hiện bối cảnh của việc đang ghi nhanh (PA, kỳ trước) hoặc "Việc kế: …"; ẩn khung khi không cần.

### CV-30 Hai lối lùi trên panel ở điện thoại; Bàn giao dùng đầu panel kiểu cũ
Loại [PHÁT HIỆN] · P3 · GV
- 375: "‹ Công việc" và "← Case Reading" chồng nhau ngay đầu panel (`gv10-375-them-pa-p1`). Bàn giao, Thông tin lớp, Giao việc, Gia hạn dùng đầu 52 px không chip hạn (`gv10-ban-giao`, `ql2-giao-viec`).
- Phương án: bỏ hàng "← Case …" (link Case vào tên em ↗ như v3); mọi panel dùng đầu v3.

### CV-31 Xem nhận xét Speaking chuyển hẳn sang Hồ sơ Mock Test
Loại [PHÁT HIỆN] · P3 · GV S
- Bằng chứng: `gv9-xem-nx` (trang đầy đủ, ô "Nhận xét GV phụ trách" ở góc phải). Có "‹ Công việc".
- Phương án: panel tại chỗ: bảng nhận xét S của lượt + ô nhận xét GV phụ trách.

### CV-32 Vai không có Công việc / tiêu đề khác menu
Loại [PHÁT HIỆN] · P3 · TVV, CX, Admin
- TVV, CX: không có khu Công việc; việc "Chọn bước tiếp" của CX là thẻ số ở Tổng quan → sang Học viên & Lớp (lọc "Chờ chọn bước tiếp") (`cx24-cv-p1`, `cx24-buoc-tiep--ds`). Admin văn phòng: menu "Công việc", tiêu đề "Chấm điểm", rỗng → "Xong hết hôm nay ✓" (`adm22-dau-p1`).
- Phương án: tiêu đề = tên menu; với TVV/CX → câu hỏi chủ SP (Phần 4).

### CV-33 Thanh trên GV: "Công việc" đứng cuối
Loại [PHÁT HIỆN] · P3 · GV
- Web: "Học viên & Lớp · Test · Công việc 5"; mockup 2 (`mock2-p2`, `mock2-p9`): "Công việc · Học viên & Lớp · Test" (trang đầu GV đứng đầu). QL mockup 6 §10: "Công việc · Báo cáo · …".
- Phương án: Công việc đứng đầu với mọi vai có khu này.

---

## Phần 3. Đề xuất lớn — "một việc = một panel đúng việc", hàng đợi theo loại, QL thấy việc của mình trước

**Hiện trạng:** danh sách 4 nhóm + panel tại chỗ (tốt); nhưng panel Nhập điểm là bản "Trước", nhiều panel phủ chồng, tự sang việc kế mọi loại, QL thấy 84 việc với việc của mình ở cuối.

**Đề xuất (không đổi luật nghiệp vụ):**
- **A. Hợp đồng panel việc** (áp mọi loại): đầu v3 = **tên việc của dòng** + chip hạn (một hàm tên, một hạn); dòng 2 = em ↗ / lớp ↗ · ngữ cảnh; thân chỉ **đúng đối tượng của việc**
  (Nhập điểm: em của việc, cột của việc, "Việc i / N · Còn n bài"; "Hiện cả lớp" là công tắc thật); bối cảnh ≤ 3 dòng; một nút chính. Bỏ "n lớp · m bài ↗" và "Mở lưới đầy đủ ↗" khỏi thân.
  Việc cần không gian lớn (Chốt lộ trình, Nhập điểm MT cũ) mở panel rộng **thay** khung phải, không ngăn phủ.
- **B. Hàng đợi**: việc kế = việc gần hạn nhất **cùng nhóm, của chính tôi, đang hiện** (mockup 1e); dải "✓ Xong · Hoàn tác 10 s" (mockup 2); không tự chuyển khi còn hộp đang gõ; "Xong hết việc tuần này ✓" chỉ khi không còn thẻ phải quyết; việc sau tuần này gập "Sau tuần này n".
- **C. QL / QT**: đầu trang một khối **"Cần bạn quyết"** mở sẵn = Chờ duyệt + Chưa có người (hộp Phân công nhỏ) + Việc quản lý quá hạn / ≤ 7 ngày (Chốt lộ trình, Bước tiếp); "Của tôi" gồm các việc này; việc của GV gập theo GV ("Trần Ngọc Hà · 10 việc · ⚠5 ›"), mở ra mới thấy dòng; không tự mở lưới của GV, không tự cuộn (CV-06, CV-09).
- **D. Sửa bố cục P1/P2**: CV-02, CV-03, CV-10, CV-11 (mỗi cái 1–3 dòng CSS / props).
- **E. Gọn chữ**: CV-12, CV-13, CV-28; làm "Mẫu nhận xét" (CV-18).

**Số bước (đếm trên demo; bấm = click/tap, không tính gõ chữ):**

| Luồng | Trước | Sau (đề xuất) |
|---|---|---|
| GV nhập điểm 3 lớp cuối buổi, máy tính (20 bài W2, mỗi bài nhận xét) | 1 bấm chọn đúng việc (trang tự mở việc 68 ngày) + 1 bấm sửa con trỏ (em nhập bù) mỗi việc + 1 bấm mỗi hàng lớp gập + 1 bấm kéo về việc định làm sau mỗi lần tự chuyển ≈ **8–10 bấm**; Dán Excel: hỏng ở panel → +2 chuyển trang (Mở lưới đầy đủ ↗, Back); 20 nhận xét gõ tay | **3 bấm** (chọn việc mỗi lớp; tự sang lớp kế cùng nhóm), 0 chuyển trang; Dán Excel trong panel; "Mẫu" → mỗi nhận xét 1 bấm + sửa |
| GV nhập điểm, điện thoại | 1 chạm mở việc + 1 chạm ô đầu + mỗi em "Lưu · em tiếp"; tab 5 kỹ năng; bảng có 3 em cho 2 bài | 1 chạm mở việc, ô đầu mở sẵn, chỉ em của việc, nút "Lưu · em tiếp" dính đáy (mockup 1f) |
| GV ghi nhận xét SOS cho một em | 1 bấm dòng + 1–2 chip + 1 Lưu = **3–4**, 0 chuyển trang (đã tốt) | 3–4; thêm "Mẫu" + điểm W2 trong bối cảnh |
| GV ghi kết quả PA | 1 bấm dòng (tiêu đề biến mất) + 1 chip + 1 Lưu = **3**; muốn xem PA / kỳ trước: +1 ("Điều chỉnh / Kết thúc…") | **3**, dòng giữ tên em, bối cảnh PA một dòng trong khối |
| QL duyệt đề xuất PA | 1 Duyệt (**1**); xem bối cảnh: "Mở" = 1 chuyển trang + Back (**+2**) | 1; "Mở" mở Case ở khung phải (**+1**, 0 chuyển trang) |
| QL phân công việc chưa có người | Cuộn qua Chờ duyệt + nhóm Chấm điểm (10 dòng hiện) → "Phân công…" (1) → ngăn Thông tin lớp: Đổi (1) + chọn (1–2) + Lưu phân công (1) = **4–5**, ô môn đã có người → không biết sửa; dòng trùng "Chọn người phụ trách" sau 3× "Xem thêm" | Khối "Cần bạn quyết" đầu trang: "Phân công…" (1) → chọn người (1) → Giao (1) = **3** |
| QL/QT chọn bước tiếp sau thi | Mở "Việc quản lý" (1) → dòng gộp (1) → em (1) → chip (1) → Lưu (1) = **5**; Gia hạn → ngăn phủ | Khối "Cần bạn quyết": em (1) → chip (1) → Lưu (1) = **3**; Gia hạn hộp nhỏ trong panel |
| TVV chọn bước tiếp | Không có Công việc: Tổng quan thẻ số → Học viên & Lớp (1 chuyển trang) → dòng → panel → chọn → Lưu ≈ **4 + 1 chuyển trang** | (Câu hỏi 6) nếu cho TVV khối "Cần làm" tại Tổng quan mở panel tại chỗ: **3**, 0 chuyển trang |

**Rủi ro:** đổi luật tự sang việc kế (đã chốt OV-15d theo mockup 2) — vẫn giữ tự sang, chỉ giới hạn trong nhóm; QL quen thấy hết việc GV — giữ chip "Tất cả"; lọc em trong panel phải đúng `emIds` cho cả việc gộp tuần (phép kiểm "số trên dòng = số hàng panel").
**Điểm cần chủ SP quyết:** Câu 1–4 và 7, Phần 4.

---

## Phần 4. Câu hỏi cho chủ SP + ảnh cần thêm

**Câu hỏi:**
1. QL mở Công việc: mặc định thấy khối "Cần bạn quyết" (việc của chính QL) trước, việc của GV gập theo GV — đồng ý? (Hiện: 84 việc, việc QL ở cuối, gập.)
2. Panel nhập điểm một kỹ năng: cột "Kết quả" để trống tới khi có điểm, rồi hiện "Đạt / Chưa đạt kỳ vọng" của chính kỹ năng đó — đồng ý?
3. "Mẫu nhận xét" (3 câu gần nhất của GV + "Như em trước") có trong mockup 2 đã duyệt nhưng chưa làm — làm luôn trong đợt sửa?
4. Chấm Speaking: mockup 2b (sửa 19/10) có hạn + "⚠ quá hạn"; web theo T18 không hạn. Giữ không hạn?
5. GV có cần thấy việc "Chưa có người" / "Chọn người phụ trách" của lớp mình dạy không? (Hiện GV 7, 8, 9 đều thấy; badge GV tính cả việc này.)
6. TVV, CX có cần khu Công việc (hoặc khối "Cần làm" tại chỗ) để chọn bước tiếp sau thi không, hay giữ lối qua Học viên & Lớp?
7. Tự sang việc kế: chỉ trong cùng nhóm (Chấm điểm → Chấm điểm) như mockup 1e — đồng ý?

**Ảnh cần chủ SP chụp (máy chủ SP, 125 %):**
- Công việc GV 10, bấm "Dán từ Excel" ở panel việc đầu tiên → dán 3 dòng → chụp cả panel (kiểm CV-02 ở 1536 px).
- Trên bản demo riêng (không phải demo chung): GV 10 nhập đủ 2 bài việc "Nhập điểm Writing Task 2 · MT1 W1 JUL" → chụp ngay sau ô cuối (dải "✓ Xong", panel tự sang việc nào), rồi bấm "‹ việc vừa xong" → chụp (kiểm CV-05 ý 1, 2, 4).
- QL 2: "Phân công…" ở "Thêm PA học thuật Reading · Dương Ngọc Ánh" → không đổi gì, bấm "Lưu phân công" → chụp dòng việc sau khi tải lại (còn "Chưa có người" không — CV-07).
- QT (máy chủ SP): mở Công việc, chụp NGAY khung đầu tiên khi trang vừa tải, chưa cuộn (kiểm CV-09: trang có tự cuộn khỏi "Chờ bạn duyệt" không).

---

## Phần 5. Ảnh tiêu biểu (SCR\anh\a2\)

1. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a2\v2-gv10-dau-p1.png` — Công việc GV: panel Nhập điểm bản "Trước", bảng nửa panel, 3 em cho việc 2 bài, con trỏ ở em ngoài việc, Lớp tôi dạy tràn khung.
2. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a2\v2-gv10-dan.png` — Dán từ Excel trong panel bị cắt trái, lưới biến mất (phông đúng).
3. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a2\gv10-mot-em.png` — việc 1 em (Hà Gia Bình, 1 bài) mở bảng 3 em.
4. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a2\v2-gv7-kq-pa-p1.png` — Kết quả PA ghi nhanh: dòng mất tên việc + tên em; khung phải trống.
5. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a2\v2-ql2-dau.png` — QL vào trang: panel tự mở lưới điểm của GV, trang tự cuộn khỏi "Chờ bạn duyệt".
6. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a2\ql2-cua-toi-p1.png` — QL "Của tôi": "Xong hết hôm nay ✓" ngay dưới "Chờ bạn duyệt 10 ⚠1".
7. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a2\ql2-phan-cong.png` — "Phân công…" mở cả "Thông tin lớp" phủ lên panel đang mở.
8. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a2\gv7-nguoi-pt.png` — GV mở "Chọn người phụ trách": panel Case, nút chính "Hoàn thành Case", không có ô chọn người.
9. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a2\gv7-mini.png` — dòng "Ghi Mini Test · hạn 15/09" mở panel "Kết quả cuối · hạn 22/09".
10. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a2\gv10-luoi-day-du-p1.png` — "Mở lưới đầy đủ ↗" rời Công việc sang Test › Lịch Test.
11. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a2\mock2-p1.png` + `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a2\mock2-p2.png` — mockup 2: khung "Trước" (= web hôm nay) và "Sau" (đã duyệt).
12. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a2\v2-gv10-375-mo-p1.png` — 375: việc W2 hiện tab cả 5 kỹ năng (2 hàng), 3 em cho 2 bài.
