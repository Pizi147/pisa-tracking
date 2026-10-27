# 6b-4 PILOT-GV-TRE — truy vết + KHỚP / KHÁC + thao tác TRƯỚC → SAU (mockup `thiet-ke/v7/panel-pilot.html` khu ③)

Ảnh cặp mockup | web (seed nguyên, ngày demo 14/09/2026, `scripts/anh-cap.mjs`, vai Admin Monbay = Phạm Thanh Xuân, id 26):
`cap-ds-1440-toi.png` (danh sách theo GV) · `cap-em-1440-toi.png` (view kế: em còn trống) · `cap-ds-375.png` (375 sáng).
Ảnh chỉ web: `web-ql-1440-toi.png` (vai QL Nguyễn Khánh Vy, ô "⚠ 11" của Trần Ngọc Hà) · `web-nhap-ho-1440-toi.png` (lưới Nhập hộ trong panel) · `web-em-375.png`.
Số trên web là dữ liệu seed (khác số demo của mockup) — so khung, thứ tự, tên, kiểu chữ. Mockup vẽ sáng ở khung 1440; web chụp tối theo cổng.

## Truy vết khung → thành phần

| # | Khung mockup | Thành phần web | Kết quả |
|---|---|---|---|
| 1 | Admin: số "4" trong "GV chấm quá hạn · 4 giáo viên" bấm được → panel (Q5) | `MockTestAdmin` → `OSo nguon=/tong-quan/gv-tre gvTre` (dáng số V5, `useMoSoLieu`) | KHỚP |
| 2 | QL: cùng panel mở từ cột "Quá hạn" bảng GV cần chú ý, lọc một GV | `TongQuanV5` ô "⚠ n" → `OSo … gvTre` (`?gv=`) | KHỚP |
| 3 | Đầu panel: loại "SỐ LIỆU · MOCK TEST" · tiêu đề "GV chấm quá hạn" · phạm vi · tuần · "4 GV · 17 bài + 2 bài chưa có GV" | `PanelGvTre` `KhungPanel loai` + `dong2` (chi nhánh · tuần dữ liệu · n GV · n bài · + n chưa có GV · n dòng vừa đủ) | KHỚP |
| 4 | Số = số dòng: 4 GV = 4 nhóm; Σ bài = ô "quá hạn" | máy chủ `gvTre` đọc CHÍNH `viecQuaHanAdmin` (Admin) / `treCham` (QL) — Q8, phép kiểm `prPilotGvTre` | KHỚP |
| 5 | Dải nhóm GV: nền surface-2, vạch trung tính, tên ↗ hồ sơ GV, chip "n bài", dính khi cuộn | `NhomGv` (V21, G14: vạch trung tính vì nhóm theo người) | KHỚP |
| 6 | Dòng: lớp · lượt + chip kỹ năng · n bài · hạn dd/mm · chip "quá hạn n ngày" | nút dòng 4 cột (`ChipHan`), thêm "thi W1 SEP" (dòng thi bù khác tuần tách riêng) | KHỚP |
| 7 | Nhóm "Chưa có GV" + "lớp chưa phân công GV môn" + link "Phân công GV ở hồ sơ lớp ›" | `NhomGv` `gvId 0` (seed hiện không có dòng này — chỉ kiểm theo mã) | KHỚP |
| 8 | Dòng "Speaking chấm chéo chưa ai nhận: n bài — chờ chấm, không tính quá hạn" | `data.choCham` (Q12) | KHỚP |
| 9 | "Cách tính" cuối panel, có "Dữ liệu đến" | `<details>` + ngày nghiệp vụ | KHỚP |
| 10 | View kế: "‹ 4 GV chấm quá hạn" · tiêu đề lớp · lượt · môn · chip quá hạn · "người nhập {GV} ↗ · thi W1 SEP · hạn · n bài còn trống" | `ViewEm` (‹ = tên panel, không số) | KHỚP |
| 11 | Bảng em × cột của việc (Task 1 / Task 2), tên ↗ hồ sơ HV | `BangEm` đọc lưới `diem-theo-luot` (cùng nguồn Nhập hộ): điểm có → số; ô nợ → chữ **"trống"** (đếm khớp "n bài còn trống"); ô không tính → "Đã huỷ" / "vắng" / "không tính" | KHÁC có lý do — XM-1 (PTA giữ) |
| 12 | "Mở lưới lớp ở Lịch Test (W1 SEP) ›" (đổi trang, giữ tuần) | `duongLichTest({ classId, periodId, kn })` | KHỚP |
| 13 | Chân: "Ghi tên bạn là người nhập; bài vẫn của …" + nút chính "Nhập hộ" | chân `KhungPanel`; chữ đổi "Bạn được ghi là người nhập…" (critique: câu cũ đọc như lệnh); người xem chính là GV → "Nhập điểm"; không quyền → một câu "ai làm được" | KHỚP |
| 14 | "Nhập hộ" mở lưới nhập ngay trong panel (view kế nữa, ‹ về) | `PanelNhapDiem chiEmViec` (lưới Công việc, chỉ các em của dòng, "Cả lớp" mở đủ) trên `?panel=em.nhap` | KHỚP |
| 15 | Lỗi: tải lỗi → "Không tải được · Thử lại" (≠ rỗng); GV vừa nhập đủ → dòng "✓ Đã đủ" giữ chỗ, số giảm; Nhập hộ lỗi → ở lại lưới, giữ ô | `ErrorState` + `Thử lại`; `giu` giữ dòng; lưới giữ ô lỗi như cũ | KHỚP |
| 16 | Rỗng: "Không GV nào chấm quá hạn" | khối Tổng quan giữ câu cũ (số 0 không vẽ nút); panel `Empty` cùng câu | KHỚP |
| 17 | 375: panel toàn màn, dòng 2 tầng (lớp · lượt / n bài · hạn · chip) | lớp `max-sm:` | KHỚP |
| — | GIỮ (mockup không vẽ): danh sách tĩnh dưới khối Admin; dòng loại "VIỆC" ở view Nhập hộ (cùng các view làm việc khác — V11) | | GIỮ |
| — | GIỮ: panel QL một GV không vẽ dải tên (tiêu đề đã có tên; link "Hồ sơ GV ↗" lên đầu) | | GIỮ |

**Đếm:** 17 dòng có khung — 16 KHỚP · 1 KHÁC có lý do (XM-1) → **94 %**, đạt cổng 90 %.

## Thao tác TRƯỚC → SAU (bấm thật 27/10 trên dev cục bộ)

| Luồng | TRƯỚC (main 27/10) | SAU (PR này) | Bấm | Đổi trang | Mất / thêm |
|---|---|---|---|---|---|
| Admin xem GV nào chấm quá hạn, bài nào, em nào | khối tĩnh (tên không bấm) → Test › Lịch Test → lùi tuần → nhóm "Quá hạn chấm" → mở lớp | số "4" → dòng → bảng em | ≥ 5 → **2** | 1 → **0** | Thêm |
| Admin / QL nhập hộ bài trễ | Test › Lịch Test → tìm lớp · tuần → lưới | số → dòng → Nhập hộ (lưới trong panel) | ≥ 4 → **3** | 1 → **0** | Thêm |
| QL xem bài trễ của một GV | ô "⚠ n" → danh sách bài phẳng (một dòng một bài) → dòng → Nhập điểm | ô "⚠ n" → dòng lớp · lượt · tuần (gộp môn) → em → Nhập hộ | 3 → 3 | 0 → 0 | Gộp bài theo lớp · lượt; thêm bảng em, link Lịch Test |
| Mở hồ sơ lượt từng bài (link "Mở trang ↗" của danh sách bài cũ) | dòng bài → Mở trang ↗ | tên em ↗ (hồ sơ HV) · "Mở lưới lớp ở Lịch Test ›" | 2 → 2 | 1 → 1 | Đổi đích: hồ sơ lượt từng bài → hồ sơ HV / lưới lớp (thông tin lượt có ở lưới) |

Không mất thao tác: Nhập điểm tại chỗ của QL vẫn có (nay là "Nhập hộ", cùng lưới). Danh sách tĩnh khối Admin giữ nguyên.
Đường cũ `GET /tong-quan/ql/tre` (`oTreCham`) web không còn gọi — giữ máy chủ + phép kiểm cũ, gỡ ở 6c nếu PTA đồng ý.

## Sửa kèm (lỗi sẵn có chặn luồng Nhập hộ)

- `KhungPanel`: Esc trong hộp điểm (vẽ qua portal ngoài panel) đóng CẢ panel → mất ô đang gõ. Nay focus đang ở hộp thoại ngoài panel thì panel để hộp tự xử lý
  (hộp hỏi "Bỏ điểm …? Bỏ / Gõ tiếp"). Ảnh hưởng tốt cho mọi panel có lưới nhập (Công việc, Lịch Test).
- `PanelNhapDiem`: thêm `chiEmViec` (chỉ hàng các em của việc khi việc có nhiều em) — chỉ panel này bật, Công việc giữ như cũ.

## [XM] — PTA Plan đã trả lời (27/10 tối)

- **XM-1 → GIỮ, KHÁC có lý do** (dòng 11): bảng em ghi chữ "trống" cho ô còn nợ và chữ mờ "Đã huỷ / vắng / không tính" cho ô không tính, thay "—" của mockup —
  chữ nói trạng thái (không chỉ màu) và số ô "trống" khớp "n bài còn trống" (seed có ô đã huỷ nằm cạnh ô nợ; "—" cho cả hai thì 8 dấu ≠ 5 bài).

## Để sau (6c — PTA Plan 27/10)

- Lưới Nhập hộ (`PanelNhapDiem` sẵn có): cột "Kết quả · Chờ 4 kỹ năng" và nút "Cả lớp" đứng riêng trên đầu bảng (XM-2).
- Dấu "·" đầu dòng ở 375 khi dòng 2 đầu panel xuống hàng (`KhungPanel dong2`, dùng chung mọi panel) (XM-3).
- Gỡ `GET /tong-quan/ql/tre` + `oTreCham` (web không còn gọi) cùng phép kiểm cũ.

## Check

`npm run check` một lần: 4500 đạt, 2 đỏ do PR (N1 (7) panel chỉ xem; EN-TRUNG khoá "trống" trùng). Đã sửa; chạy lại riêng hai bộ chứa chúng
(`suaLoiNong`, `prEn`, bản build): **N1 (7) ✓ · EN-TRUNG ✓**.

## Critique (impeccable, MỘT lần, hai agent tách biệt)

- **A (rà thiết kế, Opus): 29 / 40**, không P0; một P1 — đầu panel thiếu phạm vi + ngày dữ liệu (V11). Đã sửa: chi nhánh (theo quyền khi chỉ một) · tuần dữ liệu ·
  "Dữ liệu đến" ở Cách tính; P2: tên QL thống nhất "Chấm quá hạn · {GV}", panel một GV bỏ dải tên lặp; P3: ‹ ở Nhập hộ đủ môn, câu chân rõ hơn, thứ tự môn L · R · W1 · W2 · S.
  Giữ có chủ ý: "VIỆC" ở view Nhập hộ (view làm việc), hạn + chip quá hạn ở mỗi dòng (mockup).
- **B (bộ dò `impeccable detect`): 0 phát hiện** (cả khi tắt cấu hình). Lớp phủ trình duyệt không chạy — bản skill cài không có script phủ.
- **audit:** a11y 3 · hiệu năng 3 (panel tải chậm, lưới chỉ tải khi mở) · token 4 · responsive 3 · toàn vẹn 4 → 17 / 20. **web-design-guidelines:** sửa `scroll-mt` cho dòng dưới dải dính; còn lại đạt.
