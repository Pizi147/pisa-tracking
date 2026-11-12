# Tình hình học tập / Ý thức — ghi chú mockup v20 (session MOCKUP-TINH-HINH, 12/11)

Mockup: `tinh-hinh.html` · ảnh: `anh/` · đặc tả (6 câu cho a–e, dữ liệu, migrate, API): `docs/superpowers/specs/2026-11-12-tinh-hinh-hoc-tap/dac-ta.md`.
Nền: Ý thức V3 `thiet-ke/v19/y-thuc.html` (token, khối em, cột) — giữ nguyên hình ảnh, chỉ thêm.

## 1. Brainstorm (nội bộ, chọn một)

**Chỗ đặt "tình hình học tập" trong tab:**
| PA | Cách | Được | Mất |
|---|---|---|---|
| 1 | Tab nhỏ thứ ba "Tình hình học tập" riêng | tách bạch | trái lời chủ SP (2 tab nhỏ, tình hình + ý thức chung); một em rải hai nơi |
| 2 | Khối "Tình hình" riêng dưới danh sách vi phạm | ít đổi v19 | em có cả vi phạm lẫn tình hình nằm hai chỗ — lặp lỗi v19 đã sửa |
| **3 (chọn)** | **Cùng khối em, mỗi dòng có nhãn loại** (Vi phạm · Nhắc nhở · Tình hình · TVV hỏi); cột 2 đổi tên "Vấn đề" | một em một chỗ; dùng lại cột Đã xử lý / Bước đang làm; cả hai chiều GV ↔ TVV đọc cùng một cách | cột 2 chứa hai dạng nội dung (danh sách vi phạm / một đoạn chữ) — chấp nhận, nhãn loại đứng đầu dòng |

**Xác nhận xử lý (chủ SP: "rối, xấu"):**
| PA | Cách | Được | Mất |
|---|---|---|---|
| 1 | Giữ hai chế độ, đổi link thành nút | ít việc | vẫn hai màn — gốc của rối |
| 2 | Ô chọn (select) "Cách xử lý" | gọn nhất | giấu mặc định + hậu quả sau một bấm, 375 khó |
| **3 (chọn)** | **4 ô chọn lớn ngang** (Nâng 1 bậc có nhãn Mặc định) → ô riêng của cách đã chọn → **dải vàng nói hậu quả** khi khác mặc định → nút chính đổi chữ | thấy hết lựa chọn + bậc ngay; hậu quả đặt tại chỗ (luật "lý do chặn đặt tại nút"); một form | 4 ô tốn một hàng — 375 xếp 2×2 |

**Đếm ngược QL:** chữ "Còn n ngày · tới dd/mm" + 5 vạch (số ngày, thông tin thật) + câu "Hết hạn: tự chốt theo GVCN"; ≤ 1 ngày nền vàng ⚠ (không chỉ màu).

## 2. Đề bài mục 5–6 → chỗ trong mockup (tự rà)

| # | Ý đề bài | Chỗ | Đạt |
|---|---|---|---|
| a1 | Mọi GV dạy em + QL gửi TVV "Tình hình học tập" | nút "Báo tình hình" ở tab lớp (A1) + hồ sơ HV (A4); hộp C1 / C3 | ✓ |
| a2 | KHÔNG phân loại, nội dung tự do | hộp chỉ có Học viên · Nội dung · tệp (C1) | ✓ |
| a3 | TVV trả "Đã báo PH" + nội dung, dùng lại Báo PH TVV | panel TVV C2 / C4 = form Báo PH có sẵn; kết quả về khối em (A1 Tạ Minh Khoa, A4) | ✓ |
| b1 | Ghi vi phạm có "Chỉ nhắc nhở" | B1 / B2 lựa chọn đầu panel | ✓ |
| b2 | Không tính luật 3/2 tuần, không lên bậc, không việc TVV, GVCN chỉ xem | câu dưới lựa chọn (B1); dòng "Nhắc nhở · không tính luật", Bước "Không cần làm gì" (A1 Mai Anh Thư, A4, G-vai) | ✓ |
| c1 | Chọn tại chỗ Nâng 1 bậc (mặc định) · Không nâng · Vượt bậc · Ngoài thang | D1–D5 | ✓ |
| c2 | Mặc định → thẳng TVV | D1 "Lưu xong: TVV … nhận việc" | ✓ |
| c3 | Khác mặc định → hộp duyệt QL, 5 ngày, hết hạn GVCN là cuối | dải vàng D2–D4; thẻ E1 đếm ngược; "Tự chốt" (E1 Đã quyết, A1 Phùng Ngọc Diệp) | ✓ |
| c4 | TVV chỉ nhận việc SAU duyệt / tự chốt | dải vàng; A1 Hồ Gia Bảo "TVV nhận việc báo PH sau khi chốt"; G-vai "Chưa có việc cho bạn" | ✓ |
| c5 | Bỏ nút "Đề xuất QL duyệt" | A1 (không còn link ở cột Bước), D (không còn chế độ) | ✓ |
| c6 | Làm lại panel Công việc + trang hồ sơ, gọn đẹp hơn | D (một form một cột, bối cảnh một dòng), A1 / A4 | ✓ (chờ chủ SP chấm) |
| d1 | Giữ một tab, 2 tab nhỏ | A1 / A4 "Tình hình học tập / Ý thức" · "Phối hợp SOS" | ✓ |
| d2 | Tab nhỏ 1: vi phạm, nhắc nhở, tình hình cả hai chiều | A1 nhãn loại dòng | ✓ |
| d3 | Xem kỹ cả quá trình từng em | A1 "Xem lịch sử · n"; A4 "Cả quá trình" + lọc loại + phạm vi | ✓ |
| d4 | Tên tab lớn: đề xuất + [XM] | giữ "Ý thức & Phối hợp" — XM-1 | ✓ |
| e1 | TVV tạo "Hỏi tình hình học tập" gửi GVCN | F1 / F3 | ✓ |
| e2 | Hạn 3 ngày, trong Công việc GVCN | F2 "hạn 13/11" (hỏi 11/11); dòng Công việc "Tình hình học tập" | ✓ |
| e3 | GVCN ghi kết quả → TVV đọc, web không theo dõi tiếp | F2 / F4 → F5 "Bạn tự báo PH · web không theo dõi tiếp" | ✓ |
| — | 1440 + 375, tối + sáng, đủ trạng thái | A1–A4, D4b sáng, G (tải, lỗi, lớp sạch, gửi lỗi giữ chữ, em không TVV, hỏi trùng), D3 lỗi thiếu tệp, D6 sau gửi, C5 Hoàn tác | ✓ |

## 3. Bảng thao tác TRƯỚC → SAU (không mất thao tác)

### Tab Ý thức & Phối hợp (hồ sơ lớp + hồ sơ HV)
| Thao tác | Trước (V3 #1487 #1488) | Sau (v20) | |
|---|---|---|---|
| Phân đoạn Vi phạm \| Phối hợp SOS | phân đoạn trong thanh công cụ | **2 tab nhỏ** "Tình hình học tập / Ý thức" · "Phối hợp SOS" | ĐỔI dáng (đề bài d) |
| + Ghi vi phạm · Khai / sửa cấp bậc · Chọn nhiều · Điểm Mock Test › · Tìm em · Tất cả / Việc của bạn | đầu tab | đầu tab | GIỮ |
| Báo tình hình (GV, QL) | — | đầu tab, hộp nhỏ | MỚI |
| Hỏi tình hình (TVV, QL) | — | đầu tab (TVV) / hồ sơ HV | MỚI |
| Xác nhận xử lý · Đã xem · Đánh dấu đã thực hiện · Ghi kết quả báo PH · Sửa hạn · Duyệt (QL) | cột Bước đang làm | như cũ | GIỮ |
| **Đề xuất QL duyệt** (link cột Bước + panel) | nút chữ | **BỎ** — chọn cách xử lý trong panel Xác nhận xử lý | BỎ (đề bài c) |
| Sửa lý do · Rút đề xuất (chờ QL) | bấm badge GVCN → panel lần xử lý | thêm link ngay cột Bước khi chờ QL; panel lần xử lý giữ | GIỮ + gần hơn |
| Thu hồi… · Xem lần xử lý | badge GVCN | như cũ | GIỮ |
| Xem lịch sử · n · Lộ trình / Cả lịch sử | ô em | như cũ, gồm cả nhắc nhở + tình hình | GIỮ |
| Sửa / Xoá vi phạm · + Tệp · + Liên kết | bấm tên vi phạm | như cũ; Sửa đổi được Vi phạm ↔ Nhắc nhở | GIỮ + thêm |
| Sửa / Rút tình hình · Sửa / Rút câu hỏi · Sửa kết quả (GVCN) | — | cột Bước của dòng | MỚI |
| Hồ sơ HV: lọc loại (Tất cả · Vi phạm · Nhắc nhở · Tình hình) | — | đầu "Cả quá trình" | MỚI |

### Panel Xác nhận xử lý (Công việc + hồ sơ, cùng panel)
| Thao tác | Trước | Sau | |
|---|---|---|---|
| Tick vi phạm đưa vào (mặc định + "Cũ hơn" gập) | có | có (danh sách gọn có ngày, môn, "bắt buộc") | GIỮ |
| Bậc xử lý tự điền (chỉ đọc) | ô riêng | ô "Nâng 1 bậc · Report 1 → Report 2" (mặc định) | GIỮ |
| Ngày · Người thực hiện · Mô tả · + Tệp | có | có (mặc định) | GIỮ |
| Đề xuất: loại ngoài thang / không tăng bậc · lý do · bằng chứng | màn thứ hai sau "Đề xuất QL duyệt" | ô Không nâng / Ngoài thang ngay trong form | ĐỔI chỗ |
| Vượt bậc | không có | ô Vượt bậc + chọn bậc | MỚI |
| ← Quay lại Xác nhận xử lý | có | **BỎ** (không còn màn thứ hai) | BỎ |
| Bối cảnh: Lần trước · Bậc tiếp theo | hộp riêng cuối panel | một dòng dưới tiêu đề + Thang › | ĐỔI chỗ |
| Hoàn tác 10 s sau Xác nhận | toast | như cũ | GIỮ |
| Sau Gửi QL: Sửa lý do · + Bằng chứng · Rút đề xuất | panel lần xử lý | panel ở lại, hiện ngay (D6) | GIỮ |
| Khai cấp bậc (em chưa có bậc) | link | giữ (không vẽ — không đổi) | GIỮ |

### Panel Ghi vi phạm
| Thao tác | Trước | Sau | |
|---|---|---|---|
| Mọi ô + Thêm vi phạm + Mô tả riêng + Bằng chứng + lô / thử lại | có | như cũ | GIỮ |
| Vi phạm \| Chỉ nhắc nhở | — | đầu panel | MỚI |

### Công việc
| Thao tác | Trước | Sau | |
|---|---|---|---|
| TVV: Báo PH (sau xử lý, Meeting CX) | mục Báo PH | như cũ + việc "Báo PH · Tình hình học tập" cùng mục, cùng form | GIỮ + thêm |
| GVCN: trả lời TVV hỏi | — | mục mới "Tình hình học tập" trong tab Ý thức & Phối hợp | MỚI |
| QL: thẻ `y_thuc` Duyệt / Từ chối… / xem vi phạm + bằng chứng | Hộp duyệt | như cũ + đếm ngược + nhãn cách (Vượt bậc / Không nâng / Ngoài thang) + "Tự chốt" ở Đã quyết | GIỮ + thêm |

## 4. [XM] chờ chủ SP
- **[XM-1] Tên tab lớn giữ "Ý thức & Phối hợp"** (đề xuất): đã quen, "Phối hợp" bao cả tình hình học tập. Khác: "Tình hình & Phối hợp".
- **[XM-2] Hạn việc TVV "Báo PH · Tình hình học tập" = 5 ngày** (hàm Báo PH chung, sửa hạn N34). Chủ SP không nói hạn; không hạn thì việc dễ bị bỏ.
- **[XM-3] Giữ bước "Đánh dấu đã thực hiện"** sau khi QL duyệt / tự chốt (như nay, việc `yt_thuc_hien`). Bỏ thì GVCN phải ghi ngày thực hiện lúc gửi — với Meeting / Đình chỉ chưa xảy ra nên sai.
- **[XM-4] Nhắc nhở không vào số vi phạm** ở Phân tích / Excel. Cần đếm riêng "nhắc nhở" ở Phân tích › Ý thức không?
- **[XM-5] Thu hồi (`thu_hoi_y_thuc`) giữ luật cũ** (hết hạn không tự chốt). Muốn cùng luật 5 ngày tự chốt thì nói.
- **Đổi luật N1** (đã chốt chủ SP, ghi để PTA sửa plan.md 1.6): lần chờ QL không sinh việc TVV; sinh lúc chốt. Thẻ đang chờ lúc deploy: việc TVV đã có giữ nguyên.

## 5. Turso
Chi tiết `dac-ta.md` mục 4. Tóm: tab lớp +1 câu (+0…40 dòng), hồ sơ HV +1 câu, `/my-work` GVCN +1 câu (0–3 dòng), quét tự chốt +1 câu (thường 0 dòng); nhắc nhở và việc TVV tình hình nằm trong câu có sẵn. Ước < 0,05 triệu dòng / ngày.

## 6. Ghi cho session code (khi chủ SP duyệt)
- PR máy chủ trước (Q-2): migrate `violations.chi_nhac`, bảng `tinh_hinh_hoc_tap`, `viec_bao_ph.tinh_hinh_id`; `batBuocTu` bỏ nhắc nhở; `sinhViecBaoPh` dời từ `guiDeXuat` sang `khiDuyet` + `quetYThucHetHan`; `deXuat` nhận vượt bậc; đường tình hình; trần `tocDoDuong.ts`.
- PR giao diện: `XacNhanXuLyPanel` một form (bỏ chế độ đề xuất), `RecordViolationPanel` lựa chọn nhắc nhở, `ClassYThucCard` / `StudentYThucSection` tab nhỏ + dòng tình hình, panel TVV / GVCN ở Công việc, thẻ `y_thuc` đếm ngược. Skill: impeccable `layout` + `adapt` + `harden` + `audit`, `/ponytail lite`, `karpathy-guidelines`.

## 7. Vòng critique
Agent rà riêng (impeccable critique + ui-ux-pro-max, đọc đủ 28 ảnh khung, so v19):
- **Vòng 1: 25/40.** P1: thanh công cụ 5 nút · Trịnh Khôi Nguyên thiếu chip trạng thái · lỗi Bằng chứng (D3) bị chân panel che · F1 mất lịch sử. P2: câu tĩnh lặp, Vượt bậc / Ngoài thang mơ hồ, chip 375. → sửa. **Không theo (có lý do):** gộp em sạch thành một dòng (trái yêu cầu "đủ danh sách TẤT CẢ học viên" v19 đã duyệt) · bỏ số ở chip W1/W2 (môn thật, N31) · đổi "Đã xem · 2" / bỏ ô tick (thao tác V3 đã duyệt).
- **Vòng 2: 29/40, không P0 / P1.** P2–P3: hộp F1 che nút, chip A4b xuống dòng, câu dài ở dải vàng / thẻ tự chốt. → sửa.
- **Vòng 3: 31/40, không P0 / P1.** Còn P2 chip Kết quả 375 xếp hai dòng (giữ: mỗi nút rộng hết hàng, 44 px) · P3 rút chữ tự chốt → sửa. Theo cổng (qua 30, không P0 / P1): dừng.
- Tự rà đề bài mục 5–6: 19 / 19 ý (mục 2), chờ chủ SP chốt XM-1…XM-5.
- Ảnh: `anh/` (1440 + 375 tối; sáng: `a3-khung`, `d4b`).
