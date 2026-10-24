# Truy vết — `cong-viec.html` (V5-B1 · Công việc GV / QL)

> **Đã vào mã → PR #533 UI-CONG-VIEC** (TL-V5, 24/10). Mockup đã duyệt (`10` đầu tệp: phần chủ SP không góp ý = duyệt); chỗ web khác khung + lý do: `docs/anh/<pr>/khop-khac.md` của PR đó.

> V5-B1, 22/10/2026. **ĐỀ XUẤT THIẾT KẾ**, chờ chủ SP duyệt. Dựa trên V5-A (`v5-nen.css`, `du-lieu-demo.md` mục 7, `07` mục 4).
> Mở: `cong-viec.html?k=<gv|gvs|ql>&tt=<tai|loi|rong>&p=<nhap|go|dang|da|loi|xungdot>&mo=<an|huy|ghR|ghW|c1|c2>&han=1&tin=1&hoi=1&theme=dark`.
> Ảnh: `anh/cong-viec-*.png`. Người xem: GV Lê Minh Khoa (R, W1 — 6 việc · 4 HV · 36 bài), GV Đỗ Thu Hương (có S, không dạy S), QL Nguyễn Khánh Vy.

## 1. Yêu cầu → khung → thành phần

| Yêu cầu | Nội dung | Khung (ảnh) | Thành phần |
|---|---|---|---|
| brief 7, T17 | Đầu trang ghi rõ đơn vị: "2 nhóm · 6 việc · 4 HV · 36 bài"; đầu nhóm "4 việc · 3 HV", "2 việc · 36 bài"; gập nhóm / lọc **không đổi** số | `cong-viec-gv-1440-sang` | `.dem-tong`, `.nhom-dau` |
| **T01**, brief 7 | Phan Gia Hân có Case R + Case W1 cùng thầy Khoa → **hai việc riêng** dưới một dòng tên HV, mỗi việc có nhãn kỹ năng, hạn riêng (17/09, 18/09), mở panel đúng kỹ năng; panel có "Em này còn: PA W1 · hạn 18/09" | `-gv-1440-sang`, `-xung-dot-1280-sang` | `.hv-gop` + `.viec` con |
| **T02** | Nợ chấm chỉ phần W của thầy Khoa; ghi chú "không tính L, R (cô Linh), S (cô Trang)" | `-gv-1440-sang` | `.nhom-ghi` |
| **T14** | "Hạn tuần sau · W4 SEP · 2 việc · 36 bài" gập sẵn; mở ra hạn 23/09 chữ trung tính, không đỏ | `-gv-1440-sang`, `-gv-da-luu-1440-sang` | `.vach-han` |
| **T03**, C12 | GV có S trong hồ sơ, không dạy S: "Bạn không có việc đang mở" (một dòng, không khối rỗng) + nhóm **"Bài thi Speaking tuần này"** (36 bài MB) ghi rõ "không tính là việc / nợ của bạn", nút "Chấm Speaking" | `-gv-s-cheo-1440-sang` | `.nhom` |
| brief 7 | QL xem người khác = **chế độ theo dõi**: dải "Đang xem việc của Lê Minh Khoa — chế độ theo dõi…"; dòng không nút động từ; panel "THEO DÕI"; **"Làm thay"** chỉ ở Case (QL có quyền Case); chấm điểm nút **"Nhập hộ"** (QL có `plan.week` — `06` điểm 1) | `-ql-theo-doi-1440-sang` | `.bao-chi-xem` |
| brief 7 | Badge menu Công việc = **việc của tôi đang mở** (GV 6; QL 4 = đề xuất chờ mình duyệt — không phải việc của GV đang xem); **chuông = tin chưa đọc** (số riêng, chấm hồng từng tin) + dòng cuối "Việc cần làm: Công việc · 6 việc ›" | `-chuong-1440-sang`, `-ql-theo-doi-` | `.dh .dem`, `.hop-tin` |
| brief 5.3 | Nút động từ "Ghi kết quả PA", "Nhập điểm" (không "Mở"); panel việc: loại (vạch hồng) → tiêu đề → bối cảnh → form → lịch sử gập → chân | `-gv-1440-sang` | `.panel` |
| brief 5.3 | "Lưu" ở lại (chân "✓ Đã lưu 10:42 · Hoàn tác" + "Việc kế: PA W1 · cùng em"); "Lưu và tiếp" chỉ chuyển sau khi lưu xong; không tự chuyển theo giờ | `-gv-da-luu-1440-sang`, `-panel-375` (đang lưu) | `.tt-luu` |
| **T15** | Mất mạng: "⚠ Chưa lưu được — mất mạng. Chữ đang gõ vẫn giữ" + Thử lại. Hai người cùng sửa: "QL Vy đã lưu việc này lúc 10:41 (Làm thay)" → "Tải bản mới, giữ chữ" / "Huỷ chữ của tôi" — không báo thành công giả | `-gv-loi-luu-1440-sang`, `-xung-dot-1280-sang` | `.bao-xung-dot` |
| **T16** | Đang gõ, bấm việc khác → hộp "Bỏ chữ đang gõ?" — **Ở lại** (nút chính, có focus) / Bỏ chữ, sang việc khác | `-hoi-bo-chu-1440-sang` | `.hop-hoi` (modal chỉ cho hậu quả mất chữ) |
| G4, 375 | Một danh sách một kiểu mở: 1440 khung phải dính; < 1024 panel toàn màn; 375 chạm cả dòng (ẩn nút trong dòng), chân panel dính đáy | `-gv-375`, `-panel-375` | `.khu-panel` |
| trạng thái | Đang tải · lỗi tải chỉ vùng danh sách · hết việc (câu + lượt kế) | `-dang-tai-`, `-loi-tai-1440-sang`, `?tt=rong` | `.bao-loi`, `.rong` |

## 2. GIỮ

- Một nguồn `/my-work` cho Công việc, thanh việc hồ sơ, Cần làm, badge (`mywork.ts`); người phụ trách theo kind (`b1-ra-soat.md` mục 3).
- S chéo: ô `laChamCheo` không `mine` của ai, phạm vi `lopFtChoGvSpeaking` (N7).
- Kết quả PA 5 mức đúng mã `FOLLOWUP_OUTCOMES` (`shared/domain/cases.ts:895-903`) + gợi ý chữ `GOI_Y_KET_QUA_PA`.
- Hỏi "Bỏ nội dung đang gõ?" khi đổi việc (`PanelViec.tsx:197`).

## 3. BỎ

| Bỏ | Nguồn |
|---|---|
| Dòng gộp "1 em · 2 việc" giấu việc thứ hai (`gopViecTheoLop`) | `shared/domain/gopViec.ts:111-116` → dòng tên HV + dòng con từng kỹ năng |
| Badge GV = số **dòng quá hạn sau gộp**; badge QL = chờ duyệt mọi chi nhánh | `App.tsx:73-76`, `mywork.ts:1468` → việc của tôi đang mở, đúng phạm vi |
| Số chuông = dòng "Cần làm" của thông báo | `duongHoSo.ts:183-199` → tin chưa đọc |
| Tự mở việc đầu + tự sang việc kế sau lưu | `CongViecPage` / `viecKeTiep` → chỉ khi bấm "Lưu và tiếp" / "Việc kế" |
| Đầu nhóm chỉ một số trơn | `NhomViec.tsx:39-45` |

## 4. Giả định · dữ liệu [V5]

- Hạn Case (14–18/09), nội dung PA, "MT0 R 5.0": **[V5]** minh hoạ. Bước tiếp PA ("Kết thúc PA / Tiếp tục PA đến MT1 / Điều chỉnh PA…") lấy từ V4 (05 2.3 A) — PR triển khai đối chiếu mã `sosV4.ts`.
- Lưới nhập điểm trong panel không vẽ lại — dùng của Chấm Test (V5-B2 `test.html`).
- Nháp bền (giữ chữ khi đóng tab) chưa có trong mã — mockup chỉ hỏi khi đổi việc (theo bảng mẫu V5-A mục 7).

## 5. Đích đo

- T01: từ trang Công việc tới panel PA W1 của Phan Gia Hân: 1 bấm, 0 đổi trang; từ panel R sang W1: 1 bấm ("Em này còn").
- Số "6 việc" = badge = tổng việc các nhóm, kể cả nhóm gập (T17).

## 6. Triển khai → PR UI-CONG-VIEC (`claude/cool-wright-mvmdhe`, 22/10)

Mục 1 + 2 + 3 → `web/src/modules/congViec/DanhSachViec.tsx`, `HoTroHocVienTab.tsx`, `ui/KhungPanel.tsx` (`DauViecCongViec`), `PanelViec.tsx` (Case mở tại chỗ).
Lệch có lý do: ghi chú T02 "Chỉ phần W của bạn…" và câu giải thích nhóm Speaking bỏ theo P1 · nhãn vạch "Hạn đến 20/09 / Hạn sau 20/09" thay "tuần này / tuần sau" (P7) ·
QL giữ "Của tôi · Của GV · Tất cả" + Chọn GV (P11) thay một ô chọn · chuông dạng nút của thanh chung (NEN-V5), không đổi ở màn này.
Đo T01 (seed SEED-UX không có Case R + W1 của Phan Gia Hân): từ danh sách 1 bấm mở panel, 0 đổi trang; "Em này còn" 1 bấm sang việc kia (đo trên Đặng Quốc Bảo).
