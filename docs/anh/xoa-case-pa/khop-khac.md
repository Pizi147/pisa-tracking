# XOA-CASE-PA (N37, chủ SP 05/11) — xoá Case / PA dễ hơn · Case · PA · Kết quả PA một tuyến

Loại PR: **sửa nhỏ** (thêm mục ⋯ / nút theo mẫu sẵn có — `plan.md` 1.3b), không đổi bố cục. Ảnh TRƯỚC (main) | SAU, DB demo cục bộ, ngày demo 14/09,
1440 tối + 375 sáng, vai QL Nguyễn Khánh Vy (2) · GVCN + GV Reading Trần Ngọc Hà (7) · GV Listening Đỗ Thu Hương (17).

## Bước 1 — rà mọi nơi có Case / PA / Kết quả PA (KQ)

Case luôn mở bằng MỘT panel chung `NganCase` (hồ sơ HV, hồ sơ lớp, Công việc, Phân tích, trang lượt Test…) → nút xoá đặt ở panel này là có ở mọi nơi.

| # | Nơi | Xem | Xoá TRƯỚC | Sang Case / PA / KQ TRƯỚC | SAU PR |
|---|---|---|---|---|---|
| 1 | Panel Case `NganCase` → `ThanCase` (`CasePanel.tsx`) | Case + PA + KQ | Xoá PA: ⋯ dòng PA, chỉ QL, Case chưa xong, không PA quy chế · Xoá Case: chỉ chân "Sửa Case", QL, Case báo tay, chặn khi PA có KQ | Case → PA → KQ trong panel (Kết quả, Sửa, Nhật ký PA) | **⋯ Xoá Case ở đầu panel** (cạnh Đổi người… / Sửa / Mở lại; trong cột: ở chân) + giữ ở chân Sửa Case; ⋯ Xoá PA theo cờ máy chủ; PA quy chế / Case SOS → "Gửi QL duyệt"; đang chờ → mục mờ "Đang chờ QL duyệt xoá" |
| 2 | Hồ sơ HV · cột Case & PA (`CotCaseHv`, Case mở trong cột) | Case + PA + KQ | như #1 | Có (dòng tóm tắt → Case) | như #1 (⋯ ở chân Case trong cột) |
| 3 | Hồ sơ HV · Hành trình theo kỹ năng (`HanhTrinhKyNang`, `BieuDoD`) | Case, PA, KQ gần nhất | — | "Mở Case" | GIỮ |
| 4 | Hồ sơ HV · tab Hành trình (`HanhTrinh`) | Case, PA, KQ | — | "Mở Case ›" (popover, tên Case) | GIỮ |
| 5 | Hồ sơ HV · Chương theo lớp (`ChuongLop`) | Case + chip PA | — | **Không có** | **Tên Case bấm được → mở Case tại chỗ** (`?case=`, giữ tab) |
| 6 | Hồ sơ HV · thanh việc, Chờ duyệt, Kết luận khoá | việc / thẻ / Mini Test | — | Có (`moCase`) | GIỮ |
| 7 | Panel một em `/hoc-vien` (`PanelMotEm`) | Case, PA, KQ | qua #1 | Có (Xem thêm ›) | như #1 |
| 8 | Công việc · panel việc (`PanelViec`, `PanelKetQuaNhanh`) | Case / PA / KQ | qua #1 | Có ("Xem Case") | như #1 |
| 9 | Công việc · việc người khác (`TomTatTheoDoi`) | PA + Tới đâu + Gần nhất | — | **Không có** | **"Mở Case ›"** cạnh "Tới đâu" (hồ sơ em, Case + PA mở sẵn) |
| 10 | Công việc · Xác nhận PA lô (`XacNhanPaLo`), Chọn phụ trách (`PanelChonPhuTrach`) | PA quy chế chờ xác nhận / tên Case | — | Mở riêng từng em ("Đề xuất PA khác…") | GIỮ — panel làm lô, không xem KQ |
| 11 | Chờ duyệt (`HopChoDuyet`, `TheYeuCau`) | thẻ PA / Case | — | "Mở ›" | + loại thẻ **Xoá Case / Xoá PA** (Duyệt = vào Thùng rác, Huỷ quyết định = khôi phục; người gửi Rút được) |
| 12 | Tổng quan · Chờ bạn duyệt (`ChoDuyetGon`) | thẻ gọn | — | **Không có** ("Mở ›" ẩn ở thẻ gọn) | **"Mở ›" ở chân panel duyệt** |
| 13 | Tổng quan / Phân tích số liệu · Hiệu quả PA (`SoLieu` → `LamDongSoLieu`) | dòng Case / PA | qua #1 | Có (mở Case) | như #1 |
| 14 | Phân tích · Kết quả Test (`PanelCaseLuot`) | Case + PA + KQ, chỉ đọc | — | **Không có** | **"Mở Case ›"** mỗi Case (hồ sơ em, Case mở sẵn) |
| 15 | Hồ sơ lớp FT / lớp thường (`BangHoSoLop`, `BangCanHoTro`), KQ lớp FT | Case + PA + KQ | qua #1 | Có | như #1 |
| 16 | Trang lượt Test (`MockDetailPage`, `LuotThuongPage` → `TheKyNang`) | Case + PA + KQ | qua #1 | Có ("Mở Case", PA) | như #1 |
| 17 | Hồ sơ GV, chuông | Case | — | Có (link) | GIỮ |
| 18 | Quản trị › Đã xoá (`DaXoaAdmin`) | Case / PA đã xoá | Khôi phục (chỉ QL) | link HV | Khôi phục: **người xoá thẳng được** (GV môn, GVCN) cũng khôi phục — cần cho Hoàn tác của GV |

## Luật máy chủ TRƯỚC → SAU (`server/src/cases/cases.ts` — `cachXoaCase`, `cachXoaPa`, một hàm cho máy chủ, cờ nút và Khôi phục)

| | Trước | Sau (N37) |
|---|---|---|
| Ai xoá Case | QL / Quản trị | QL / Quản trị: xoá ngay · người sửa được Case (GV môn, người tạo, GVCN lớp em): xoá ngay — **trừ** Case hệ thống (từ Test / SOS, Kỳ vọng đầu ra, việc QL giao) hoặc Case còn PA quy chế → thẻ chờ QL duyệt |
| Case đã có PA có KQ | 400 "xoá các PA trước" | Xoá được — Case + mọi PA + KQ vào Thùng rác **cùng một mục**, Khôi phục / Hoàn tác trả đủ |
| Case từ Test | 400 "dùng Không cần theo dõi" | GV: xin QL duyệt · QL: xoá ngay |
| Case / PA của Case đã hoàn thành | 400 "Mở lại trước" | Xoá được; xoá PA không mở lại Case; khôi phục PA vào Case đã xong được |
| Ai xoá PA | QL; PA quy chế / Bổ trợ: không ai | QL ngay · người ghi được KQ PA hoặc sửa được Case: ngay — PA quy chế (preset, Bổ trợ) → xin QL duyệt |
| Khôi phục | chỉ QL | người xoá ngay được (Case hệ thống / PA quy chế: chỉ QL) |
| Thẻ duyệt | — | `xoa_case` / `xoa_pa` (Học thuật, không hạn): Duyệt = xoá (chốt thẻ trước, lưu id Thùng rác) · Từ chối giữ nguyên · Huỷ quyết định Duyệt = Khôi phục · người gửi Rút · đối tượng mất → tự đóng |

## Thao tác TRƯỚC → SAU

| Trước | Sau |
|---|---|
| Xoá Case: Sửa → chân panel "Xoá Case" (QL) | Giữ, + ⋯ "Xoá Case" ngay đầu panel Case (mọi vai có quyền) |
| Case có PA có KQ: nút Xoá Case mờ + câu "xoá các PA trước" | Xoá một lần; hộp hỏi nêu đúng đối tượng "Xoá Case và 1 PA" · "xoá cả 1 PA · 1 kết quả PA" |
| ⋯ PA "Xoá PA" (QL) | Giữ, + GV môn / GVCN; PA quy chế → "Gửi QL duyệt xoá PA?" (lý do không bắt buộc) |
| Toast "Đã xoá … · Hoàn tác" (QL) | Giữ, GV cũng Hoàn tác được |
| Sau xoá Case trong hồ sơ HV: toast lỗi "Chưa tải lại được" (cột Case tải lại Case vừa xoá → 404) | Không còn — tải lại nền gặp 404 (đối tượng đã xoá) không báo "Thử lại" (`useApi.ts`) |
| Phân tích · Kết quả Test / Công việc việc người khác / Tổng quan duyệt / Chương theo lớp: không đường sang Case | "Mở Case ›" / "Mở ›" / tên Case bấm được |

Không bỏ thao tác nào.

## Tôi đã tự quyết (chép vào mục 4 plan khi merge)
1. "Người có quyền" xoá thẳng = người sửa được Case (GV môn, người tạo, GVCN lớp em) + người ghi được KQ PA (cho PA).
2. "Trạng thái SOS" = Case hệ thống (mọi nguồn trừ báo tay / nhập bù); Case báo tay còn PA quy chế cũng xin duyệt (xoá Case kéo PA quy chế).
3. Bỏ chặn "Case đã hoàn thành — Mở lại trước khi xoá" (Case và PA) — luật "không thêm bước".
4. Lý do xin xoá không bắt buộc; thẻ không hạn; người gửi Rút được, không Sửa.
5. Kết quả PA lẻ: KHÔNG thêm nút xoá (N37 chỉ nêu Case / PA; KQ có Sửa + Hoàn tác sẵn).

## [XM] hỏi PTA Plan
- **Case SOS đã xoá có thể sinh lại** khi điểm lượt đó được nhập / sửa lại (luồng SOS tạo Case theo điểm) — chấp nhận như hành vi đúng (điểm mới thì tính lại)?
- Có cần xoá **một Kết quả PA lẻ** không (mục 5 trên)?

## Kiểm
- `prXoaCasePa` (mới, 4 phép): XCP-1 GV xoá Case 2 PA + 3 KQ → một mục, GV Khôi phục → mọi bảng y hệt, GV môn khác 403 · XCP-2 quyền: GV môn khác / QL chi nhánh khác 403,
  GVCN xoá thẳng · XCP-3 PA quy chế: thẻ, gửi lại 400, Rút, Từ chối giữ, Duyệt → Thùng rác, GV không khôi phục, Huỷ quyết định = khôi phục y hệt · XCP-4 Case SOS / Case có PA quy chế → thẻ, Duyệt xoá, QL xoá thẳng.
- Sửa theo luật mới (Q-7): `prLuiA2` LUIa2-14, -16 · `prThungRac` TR-5, TR-13 · `prPa` PA18 (`nutDongPa` theo cờ máy chủ).
- Bấm thử (Playwright Edge, DB demo): QL xoá Case có PA + KQ → toast → Hoàn tác trả đủ; GV gửi xin xoá PA quy chế + Case SOS → mục mờ; QL thấy 2 thẻ, Duyệt → PA mất, có Hoàn tác;
  Phân tích "Mở Case ›"; Chương theo lớp mở Case tại chỗ; Tổng quan "Mở ›".
- Turso: không thêm câu đọc khi mở trang (nút nối dùng id sẵn có; `caseDetail` dùng lại câu thẻ `sos_case` đã có). Xin xoá Case/PA: +1 câu COUNT lúc ghi.

## Ảnh
`truoc-case-ql` → `sau-case-ql-menu` (⋯ Xoá Case) · `truoc-sua-case-ql` (Xoá Case mờ + câu chặn) → `sau-hoi-xoa-case` → `sau-da-xoa-case` (toast Hoàn tác) ·
`truoc-case-sos-ql` (PA quy chế: ⋯ chỉ Sửa PA) → `sau-gv-xin-xoa-pa` · `sau-gv-cho-duyet-pa` · `sau-gv-xin-xoa-case` · `sau-gv-yeu-cau-cua-toi` · `sau-ql-cho-duyet` · `sau-ql-da-duyet` ·
`truoc-panel-case-luot` → `sau-panel-case-luot` (+ `-375`) · `sau-chuong-lop-mo-case` · `sau-tong-quan-duyet` · `sau-gv-case-375` (375 sáng, GV).
