# UI-CD-GON — Chờ duyệt gọn theo luật mật độ M1–M10 (`de-xuat.md` mục 1, hạng 3 mục 3)

PTA Plan 05/11 sau khi merge #937: màn tiếp là **Chờ duyệt** — Hộp duyệt (`/cong-viec/cho-duyet`, "Mở hộp duyệt ›"), khối Chờ duyệt ở hồ sơ HV, panel duyệt.
Bệnh: mỗi yêu cầu 3–4 dòng, "Nếu duyệt: …" lặp tiêu đề và bị cắt, người gửi chỉ là chữ trong câu. **Giữ bố cục + mọi thao tác**; một dáng dòng yêu cầu
ở mọi nơi như Công việc v12 (`DongDuyet`) / Tổng quan #937 (`ChoDuyetGon`). Không đổi máy chủ, không thêm request.

Dữ liệu demo 14/09/2026, QL Nguyễn Khánh Vy (vai 2), hồ sơ HV Trần Thu Hà (id 2, 3 yêu cầu). Phông kiểm `document.fonts.check('600 14px "Be Vietnam Pro"') === true` ở mọi ảnh.

## Ảnh trước | sau (toàn trang)

| Màn | Ảnh |
|---|---|
| Hộp duyệt · QL · 1440 tối | `truoc-sau-hop-1440-toi.png` |
| Hộp duyệt + panel duyệt mở (`?the=9`) · 1440 tối | `truoc-sau-hop-panel-1440-toi.png` |
| Hồ sơ HV có yêu cầu · 1440 tối | `truoc-sau-hshv-1440-toi.png` |
| Hộp duyệt · 375 sáng | `truoc-sau-hop-375-sang.png` |
| Hồ sơ HV · 375 sáng | `truoc-sau-hshv-375-sang.png` |

Công việc › nhóm "Chờ bạn duyệt" (`CayDuyet` / `DongDuyet`) đã theo v12 từ #934 — không đổi (đo trước = sau: 176 từ · 52 % đậm màn đầu).

## Đo trước → sau (cách đo như `de-xuat.md` mục 3; màn đầu 1440 × 900 / 375 × 812)

| Màn | Từ màn đầu (cả trang) | Đậm màn đầu | Nút / ô màn đầu | Cao trang |
|---|---|---|---|---|
| Hộp duyệt 1440 | 264 (451) → **238 (296)** | 66 % (50/76) → **21 % (17/80)** | 16 → 21 ¹ | 1 441 → **1 092** |
| Hộp + panel 1440 | 349 (536) → **326 (384)** | 59 % (55/94) → **22 % (22/98)** | 19 → 24 ¹ | 1 441 → **1 092** |
| Hộp duyệt 375 | 149 (441) → **121 (259)** | 59 % (27/46) → **27 % (13/48)** | 13 → 15 ¹ | 2 040 → **1 589** |
| Hồ sơ HV 1440 | 286 (837) → 274 (**791**) ² | 58 % → 55 % | 22 → 25 ³ | 2 270 → 2 185 |
| Hồ sơ HV 375 | 128 (800) → 115 (**748**) | 57 % → 55 % | 12 → 13 ³ | 4 083 → **3 880** |

- Một dòng Hộp duyệt: 3 hàng (~94 px) → **2 hàng (~70 px)**. Một thẻ ở hồ sơ HV: 3–4 hàng + hạn 2 hàng → **2 hàng** + hạn một viên.
- ¹ Dòng ngắn hơn → màn đầu chứa thêm dòng (thêm ô tích duyệt nhiều).
- ² Khối Chờ duyệt ngắn lại → màn đầu chứa thêm phần dưới (bảng Mock Test) nên từ màn đầu giảm ít; cả trang −46 từ.
- ³ "Xem thêm" của thẻ (mở "Nếu duyệt") — trước chỉ có khi lý do bị cắt.

## Chỗ ngợp → luật → cách sửa

| # | Chỗ ngợp (trước) | Luật | Sửa | Thành phần |
|---|---|---|---|---|
| CD1 | Dòng Hộp duyệt 3 hàng: nhãn loại 12 / 700 · "Đề xuất PA · Speaking · Trần Thu Hà · MB FT 101" 14 / 700 (cả chuỗi đậm) · câu lý do | M1, M10, M4 | 2 hàng: ① tên em 15 / 600 (đậm duy nhất) · lớp 13 mờ · hạn = viên theo mức; ② loại = chip VIỀN · tên yêu cầu 14 / 500 · lượt = chip nhạt · người gửi = chữ mờ + biểu tượng người. Câu lý do → `title` + panel | `DongYeuCau` |
| CD2 | Chuỗi "việc · em · lớp" | M10 | Mỗi trường một dáng, không ghép chuỗi | `DongYeuCau`, `TheYeuCau` |
| CD3 | Người gửi chỉ là chữ trong câu ("Phạm Thu Trang đề xuất…") | M10 | Cột người `NguoiGiu` (biểu tượng người) ở dòng Hộp duyệt — như Công việc. 375: ẩn (M8, panel có) | `DongYeuCau` |
| CD4 | Đầu hộp: "12 đề xuất · quá hạn trước → hạn gần nhất" + "Đánh dấu ô ở thẻ để duyệt nhiều cùng loại." | M3, M4 | Bỏ — số đã ở ô "Chờ duyệt 12", thứ tự tự thấy; câu hướng dẫn → `title` ô tích | `HopChoDuyet` |
| CD5 | Dòng có / không ô tích lệch cột tên em | M10 | Dòng không ô tích giữ rãnh 16 px | `DongYeuCau` |
| CD6 | Thẻ (hồ sơ HV, Case): "Nếu duyệt: …" thành dòng riêng, lặp ý tiêu đề | M4 | Ẩn tới khi bấm "Xem thêm"; `title` nút Duyệt có "Nếu duyệt: …"; panel giữ khối vàng "Sau khi duyệt" | `TheYeuCau` |
| CD7 | Thẻ: lý do 2 hàng + "Xem thêm" hàng riêng | M2, M4 | Lý do MỘT hàng, "Xem thêm" ngay sau cùng hàng; mở ra đủ lý do + "Nếu duyệt" + "Thu gọn" | `TheYeuCau` |
| CD8 | Thẻ: hạn 2 hàng ("Quá hạn · 1 ngày" đậm + "hạn 13/09") | M10, M1 | Một viên theo mức (quá hạn đỏ ⚠ · hôm nay vàng ⚠ · còn hạn xám) — `ChipHan vien` như Công việc | `TheYeuCau` |
| CD9 | Thẻ: tên yêu cầu 600 + "· MT1" chữ xám; nhãn loại chip nền riêng `w-24` | M1, M10 | Tên yêu cầu 500 · lượt / lớp = chip nhạt · loại = chip VIỀN (`ThePhu vien`, dùng chung) · tên em 600 khi thẻ không trong hồ sơ em | `TheYeuCau` |
| CD10 | Hồ sơ HV: "Chờ duyệt" + "**3 yêu cầu chờ bạn duyệt**" (nói hai lần, đậm) | M3, M5, M1 | "Chờ bạn duyệt" (tên như Công việc) · "3 yêu cầu" mờ · "⚠ 1 quá hạn" | `DaiChoDuyet` |
| CD11 | "Chọn một đề xuất bên trái để xem và quyết" (đề xuất ≠ yêu cầu) | M5 | "Chọn một yêu cầu ở danh sách." | `HopChoDuyet` + EN |
| GIỮ | Tab Chờ duyệt · Báo QL · Đã xử lý · lọc loại · chi nhánh · quá hạn · lớp; danh sách trái + panel phải (375 toàn màn); panel: loại · tên · em · lớp · SOS · hạn · lý do · "Sau khi duyệt" · Mở › · chân dính Tiếp / Từ chối… / Duyệt · Lịch sử · n; thanh chọn nhiều; Công việc nhóm Chờ bạn duyệt; Tổng quan Chờ bạn duyệt | — | không đổi | — |

**Chưa làm — [XM] hỏi PTA:** "tên người không có **vai**" hiểu theo nghĩa vai trò (GVCN / GVBM / TVV) cần máy chủ gắn thêm vai người gửi so với lớp của em
(đổi `yeuCau.ts` + có thể thêm câu đọc) — ngoài PR giao diện này. PR này làm theo M10: người = chữ mờ + biểu tượng người (như Công việc v12).

## Thao tác TRƯỚC → SAU (không mất thao tác)

| Thao tác | Trước | Sau |
|---|---|---|
| Bấm dòng Hộp duyệt → panel duyệt (`?the=`), ‹ Chờ duyệt (375) | có | có |
| Tích ô → thanh chọn: Chọn hết · Bỏ chọn · Từ chối n… · Duyệt n yêu cầu | có | có (gợi ý "Đánh dấu ô…" chuyển vào `title` ô tích) |
| Panel: Duyệt / Duyệt… / Từ chối… / Trả lời… · Mở › · Tiếp › · Lịch sử · Hoàn tác | có | có |
| Tab Chờ duyệt · Báo QL · Đã xử lý · lọc loại · chi nhánh · bỏ lọc quá hạn / lớp · "n yêu cầu ở chi nhánh khác · Xem ›" | có | có |
| Đã xử lý: Huỷ quyết định · Sửa trả lời… | có | có |
| Thẻ hồ sơ HV / Case: Duyệt · Duyệt… · Từ chối… · Trả lời… · + Thêm PA · Sửa… · Rút · gập / mở khối | có | có |
| Đọc lý do đủ | thẻ: 2 hàng + Xem thêm · dòng hộp: 1 hàng | thẻ: 1 hàng + Xem thêm · dòng hộp: rê chuột (`title`) hoặc panel |
| Đọc "Nếu duyệt" | thẻ: luôn hiện · dòng hộp: không có | thẻ: Xem thêm + rê nút Duyệt · panel: khối "Sau khi duyệt" (như trước) |

## Dòng đọc Turso (dev, `PISA_DEM_SQL=1`, dữ liệu demo — trước = sau, chỉ đổi giao diện)

| Đường | Câu · dòng |
|---|---|
| `/yeu-cau?hop=cho-duyet` (Hộp duyệt) | 15 · 68 |
| `/yeu-cau?studentId=2` (hồ sơ HV) | 9 · 45 |
| `/yeu-cau?hop=cho-duyet&boiCanh=1` (Công việc) | 18 · 168 |

## Mã chạm

`web/src/modules/duyet/HopChoDuyet.tsx` (`DongYeuCau`, đầu hộp) · `web/src/modules/duyet/TheYeuCau.tsx` (thẻ ngoài panel) · `web/src/modules/students/DauHoSo.tsx`
(`DaiChoDuyet` đầu khối) · `shared/i18n/en/uiConLai.ts` · phép kiểm `prHk1` H4 (chip loại không viền → chip viền chung, theo M10 / v12) và `prOv12e` OV12e-1b (thẻ không tự tô hạn → dùng `ChipHan vien`, ngưỡng vẫn một chỗ `deadlineView`) — Q-7: phép kiểm chuỗi khoá dáng cũ.
