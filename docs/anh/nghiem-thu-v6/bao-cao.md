# NGHIỆM THU V6 — 5 kịch bản (04-thiet-ke.md mục 8) · báo cáo

Chạy THẬT trên dev server (main `25e0a026f`, sau #1713), seed mới, tài khoản demo tên giả: GV (GVCN) Trần Ngọc Hà (7) · GV Speaking Phạm Thu Trang (9). 1440 tối + 375 sáng (Playwright, Edge). Ảnh: `kb<n>-<bước>-<1440|375>.png` cùng thư mục.
Mỗi bước đo bằng mã: đếm bấm (không tính gõ phím), chuyển trang, console lỗi, chữ bị cắt (`scrollWidth > clientWidth`, ≥ 10 px rộng), tâm ✕ / ⋯ so tâm nút, cuộn ngang trang.
**Không sửa mã** — không có lỗi P2 nào vừa nhỏ vừa không đụng chữ chung (ngắt dòng "REPORT 1" cần đổi hàm tên bậc dùng chung và vài phép kiểm so chuỗi). PR chỉ có báo cáo + ảnh.

## 1. Kết quả theo kịch bản

| KB | Kịch bản (vai GV) | Số bấm từ lúc mở web | Chuyển trang | Phải đoán? | Kết quả |
|---|---|---|---|---|---|
| 1 | Mở web → nhập điểm lớp đang có bài (GVCN 7) | **2** (Nhập điểm ở dòng việc → ô điểm) + gõ + Enter; 375: chạm dòng + ô = 2 | 0 (vào thẳng Công việc › Chấm điểm; panel và hộp tại chỗ) | Không | Lưu được (PUT điểm, ✓ trên ô, tự sang bài kế). Lỗi: **P1-2** |
| 2 | Ghi một vi phạm cho em lớp mình (GVCN 7) | **7** (+ Task → Vi phạm / Nhắc nhở → chọn em → Nhóm → Môn → Lưu; Vi phạm gõ) | 0 | Không; ô bắt buộc báo lỗi tại ô | Lưu được, toast "Đã ghi vi phạm cho …". Lỗi: P2-1, P2-8 |
| 3 | GV Speaking chấm một bài chấm chéo (GV 9) | **3** (tab Chấm Speaking → Nhập điểm → ô) + gõ 4 tiêu chí + Enter | 0 | Không | Lưu được ("✓ Đã lưu 1 bài"); số thập phân bị chặn đúng câu ("số nguyên 0–9"). Lỗi: **P1-1**, P2-4, P2-6 |
| 4 | GVCN xử lý vi phạm theo mặc định (GVCN 7) | **4** (tab Ý thức → Xử lý ▾ → Xác nhận xử lý → Xác nhận · REPORT 1) **+ bắt buộc gõ Mô tả ≥ 10 ký tự** | 0 | "Nâng 1 bậc · Mặc định" đã chọn sẵn; **Mô tả bắt buộc** làm "theo mặc định" vẫn phải gõ | Nút bị chặn "Còn 1 ô cần sửa ↑" tới khi gõ. Lỗi: **P1-3**, P2-2, P2-3 |
| 5 | Viết Báo cáo PH khi đợt mở (GVCN 7) | **12** cho MỘT em phần Chung (tab Vận hành → Viết › → ô → 7 mức → ô nhận xét → Lưu · em tiếp ›); 6 em ≈ 54 | 1 (Viết › sang hồ sơ lớp › Báo cáo PH) | Không | Lưu được; "1/6 em đủ", tự sang em kế. Lỗi: **P1-4**, P2-5, P2-7 |

Đo chung (mọi KB, 1440 + 375): console lỗi **0** · chữ bị cắt "…" **0** · cuộn ngang trang **không** · ✕ / ⋯ lệch tâm tối đa **0,75 px** (≤ 1 px).
Đếm việc: đầu trang GV "33 việc · 9 quá hạn · 1 làm thay" = badge menu 9 = chuông 9; GV Speaking "18 việc · 3 quá hạn · 2 làm thay" = badge 3 = chuông 3 — khớp (một hàm `demDongViec`). Việc chấm chéo (22 bài) nằm ngoài "3 quá hạn" đúng luật.

## 2. Lỗi (mỗi lỗi một dòng)

| # | Mức | Màn | Cách tái hiện | Đề xuất sửa |
|---|---|---|---|---|
| P1-1 | **P1** sai lời 33 | Công việc › tab "Chấm Speaking" (GV Speaking, 1440 + 375) | Đăng nhập GV 9, mở `/`: badge tab "Chấm Speaking 22" đỏ cùng màu (232,154,140) với tab Chấm điểm / Case — lời 33: badge tab Chấm Speaking **mờ**, không đỏ, không vào badge menu. Ảnh `kb3-0-vao-*`, `kb3-1-tab-speaking-*` | Dùng kiểu badge mờ (`.bd.mo` của mockup ①) cho tab chấm chéo; số vẫn đếm bài |
| P1-2 | **P1** số liệu hai nguồn | Công việc › Chấm điểm › Mock Test (GVCN 7) | Dòng "MB FT 101 · W1 JUL · **4 bài**" → bấm Nhập điểm → đầu panel "còn **6 / 6 bài**"; panel chỉ có 2 em × L, R = 4 ô. Sau khi lưu 1 ô: dòng "3 bài", panel "còn 5 / 6" (lệch cố định 2). Ảnh `kb1-2-panel-nhap-diem-1440`, `kb1-5-sau-enter-375` | Dùng MỘT hàm đếm bài cho dòng việc và đầu panel (số bài của việc, hoặc cùng "còn x / tổng" từ dữ liệu lưới) |
| P1-3 | **P1** luật cứng 08/10 (mặc định làm điều hiển nhiên) | Công việc › Ý thức & Phối hợp › Xác nhận xử lý (GVCN 7) | Xử lý "theo mặc định": "Nâng 1 bậc · Mặc định" đã chọn, ngày, người thực hiện đã điền; nút Xác nhận chặn bằng "Còn 1 ô cần sửa ↑" vì **Mô tả** bắt buộc ≥ 10 ký tự ("đang có 0"). Ảnh `kb4-3-panel-xu-ly-1440`, `kb4-5-o-can-sua-1440` | PTA quyết: nếu Mô tả không phải luật nghiệp vụ đã chốt thì không bắt buộc khi chọn bậc mặc định (hoặc điền sẵn "Xử lý theo thang"); nếu là luật thì giữ và ghi rõ lý do trên ô |
| P1-4 | **P1** quá nhiều thao tác (luật cứng "ít thao tác") | Hồ sơ lớp › Báo cáo PH › panel viết (GVCN 7) | Một em phần Chung = 7 hàng mức (Xuất sắc / Tốt / Khá / Yếu) + nhận xét = 9 bấm trong panel; 6 em ≈ 54 bấm, chưa tính cột L / R. Không có "cả lớp = Tốt" hay mặc định. Ảnh `kb5-3-hop-ghi-1440`, `kb5-5-sau-luu-1440` | Thêm "Đặt cả lớp / cả em = Tốt" (một bấm) hoặc mặc định "Tốt" cho 7 mức rồi chỉ sửa ngoại lệ |
| P2-1 | P2 | Ghi vi phạm (+ Task) | Lưu xong chỉ toast "Đã ghi vi phạm cho …", không "Hoàn tác" (luật không khoá cứng: có Hoàn tác ngắn). Ảnh `kb2-6-sau-luu-1440` | Toast có Hoàn tác 10 giây (xoá lần ghi vừa lưu), như hộp Tình hình / lịch thi |
| P2-2 | P2 | Công việc › Ý thức, danh sách trái (1440) | Bấm Xác nhận xử lý rồi cuộn: tiêu đề nhóm dính "Vi phạm 2 việc" nền trong suốt, chữ dòng "Lê Quang Huy … Xác nhận xử lý" lọt qua dưới tiêu đề. Ảnh `kb4-4-sau-xac-nhan-1440` | Nền đặc cho tiêu đề dính (cùng `--surface`) |
| P2-3 | P2 | Panel Xác nhận xử lý › thẻ "Nâng 1 bậc" | "Chưa có → REPORT / 1" ngắt dòng giữa "REPORT" và "1". Ảnh `kb4-3-panel-xu-ly-1440` | Khoảng trắng không ngắt trong tên bậc ("REPORT 1", "WARNING LETTER 1") ở `bacNgan` / `bacDu`; cập nhật phép kiểm so chuỗi |
| P2-4 | P2 | Dòng việc gộp (Công việc, 1440 + 375) · panel Chấm Speaking | Mũi mở còn tam giác ▾ ▴ (nút "Xem ▾" / "Xử lý ▾", dòng 375) và accordion lớp trong panel Chấm Speaking — GD-18 chỉ đổi `MuiTenMo` + 4 chỗ. Ảnh `kb4-2-sau-bam-xu-ly-375`, `kb3-2-panel-speaking-1440` | Đổi sang `MuiChev` (tệp `DanhSachViec.tsx` dòng ▾, accordion `PanelChamSpeaking`) |
| P2-5 | P2 | Hồ sơ lớp 375 | Đầu trang chiếm ~ nửa màn trước bảng Báo cáo PH; nút nổi "+ Task" che chữ "Cả lớp đủ 0 / 6 em". Ảnh `kb5-2-sau-viet-375` | Nút nổi cao hơn / ẩn khi cuộn tới bảng; gập khối đầu ở 375 |
| P2-6 | P2 | Panel Chấm Speaking 375 | Chân "Việc tiếp ›" + dòng Quy chế chiếm ~ 40 % màn, bảng thấy ~ 2 dòng. Ảnh `kb3-2-panel-speaking-375` | Quy chế vào ⓘ ở 375 (cùng quy ước ⑤), bảng cuộn |
| P2-7 | P2 (Turso ghi) | Báo cáo PH panel viết | Mỗi lần bấm một mức = một `PUT /classes/16/bao-cao-ph` (8 PUT cho 1 em). | Gộp: lưu khi rời ô / khi "Lưu · em tiếp" (tối đa 1 PUT mỗi em) |
| P2-8 | P2 một khái niệm một tên | + Task › Vi phạm / Nhắc nhở | Mục tên "Vi phạm / Nhắc nhở" mở panel tiêu đề "Ghi vi phạm" với phân đoạn "Vi phạm \| Chỉ nhắc nhở". Ảnh `kb2-4-form-1440` | Tiêu đề panel "Vi phạm / Nhắc nhở" (hoặc đổi theo phân đoạn đã chọn) |

Không có P0 (chặn).

## 3. Trái luật V5 / V22 / lời 40 — đã soi

- **V22 (hạn chỉ màu):** không ⚠ / ● đi kèm hạn ở cả 5 màn; chip "quá hạn n ngày" đỏ, "hạn 16/09" vàng, "hạn 23/09" thường. Đạt.
- **Lời 40 (thông tin theo trạng thái):** Mock Test việc xong biến khỏi danh sách tại chỗ (đếm giảm 4 → 3 sau khi lưu); phần mở Lịch thi đã theo trạng thái (PR GD-13b). Đạt. Ngoại lệ: P1-2 (đếm bài lệch).
- **V5 (ô số mở tại chỗ, "›" đổi trang):** chip việc có "›" khi đổi trang (Vận hành ›, Viết ›) và không có khi mở tại chỗ. Đạt. Ngoại lệ: P2-4 (mũi còn tam giác).
- **Thang cấp bậc không chữ:** panel Xác nhận xử lý vẽ thang vạch, mốc WL vạch dày đỏ, không chữ. Đạt.

## 4. Việc tiếp đề xuất (PTA giao)

1. P1-1, P1-2: sửa nhỏ, một PR (badge mờ + hàm đếm bài chung).
2. P1-3, P1-4: cần PTA / chủ SP quyết (luật Mô tả bắt buộc; điền nhanh cả lớp) — đổi luồng.
3. P2-1 … P2-8: gom một PR "chỉnh chữ / khoảng cách" (trừ P2-7 chạm máy chủ, tách riêng).

## 5. Chốt của PTA Plan và việc đã làm (PR NT-SUA)

| Mục | Chốt | Kết quả |
|---|---|---|
| P1-1 badge Chấm Speaking đỏ | **KHÔNG sửa.** Chủ SP 14/11 đã thay lời 33: có bài quá hạn thì badge ĐỎ như mọi nơi, không có thì thường. Chỉ kiểm: 0 bài quá hạn mà vẫn đỏ mới là lỗi. | Không phải lỗi (GV 9 có 15 bài quá hạn). |
| P1-2 số bài lệch | Sửa. | **Đã sửa.** Gốc: đầu panel đếm ô của CẢ LỚP (em ngoài dòng việc, em ngừng học) còn lưới chỉ vẽ em của việc → "còn 6 / 6" khi dòng việc ghi 4. Hàm chung `demBaiViec` (`shared/domain/baiKeTiep.ts`) cùng bộ lọc với lưới; phép kiểm ở `thanhPhanChung.tests.ts`. Sau: "còn 4 / 4 bài". Turso 0. |
| P1-3 Mô tả bắt buộc | GIỮ ≥ 10 (ghi nhận việc đã làm = đầu ra); ô phải nói lý do ngay tại ô, không điền sẵn chữ mẫu. | **Đã sửa.** Placeholder "Ghi việc đã làm, vd đã nhắc em trước lớp, đã báo PH" + bộ đếm ký tự (đã có). |
| P1-4 Báo cáo PH nhiều bấm | KHÔNG làm — chủ SP quyết cách chấm. | Không sửa. |
| P2-1 Hoàn tác vi phạm | Làm (luật 21/10 thắng). | **Đã sửa.** Toast "Đã ghi vi phạm … · Hoàn tác" → `DELETE /violations/:id` từng bản vừa tạo (thùng rác 30 ngày); phép kiểm `yThuc.tests.ts` (người ghi xoá được ngay, GV khác không). |
| P2-2 tiêu đề dính đè chữ | Làm. | **Đã sửa.** Gốc: `top-0` tính từ mép trong padding của vùng cuộn (16 / 20 px) nên chữ lọt qua khe trên tiêu đề; nay `-top-4 md:-top-5` (dính sát thanh trên). |
| P2-3 "REPORT / 1" | nowrap ở chỗ hiển thị, không đổi hàm tên bậc. | **Đã sửa.** `bacKhongNgat` (khoảng trắng không ngắt) ở thẻ "Cách xử lý". |
| P2-4 mũi ▾▴ sót | `MuiChev`. | **Đã sửa.** Dòng việc gộp (nút "n ▾" + 375), `MuiTenGap` (accordion Chấm Speaking, Phối hợp SOS, Xác nhận xử lý, Gv chấm). |
| P2-5 375 hồ sơ lớp FAB | Chừa đáy. | **Đã sửa.** `max-sm:pb-[100px]` ở trang hồ sơ lớp. |
| P2-6 375 panel Chấm Speaking | Chân + quy chế gọn, ⓘ nếu dài. | **Đã sửa.** `DongQuyChe` một dòng cắt "…", câu > 40 ký tự có ⓘ đọc đủ (cho mọi panel). |
| P2-7 Báo cáo PH 8 PUT | BỎ QUA (ghi, để sau). | Không sửa. |
| P2-8 tiêu đề panel vi phạm | Đổi cho cùng tên. | **Đã sửa.** Ghi mới: "Vi phạm / Nhắc nhở"; sửa giữ "Sửa vi phạm" / "Sửa nhắc nhở". |

Ảnh trước │ sau từng mục: `docs/anh/nt-sua/cap-*.png`.
