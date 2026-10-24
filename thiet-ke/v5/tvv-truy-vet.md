# Truy vết — `tvv.html` (V5-B1 · Công việc TVV: Báo PH · Sau thi · Chốt ngày thi · Bổ sung hồ sơ)

> **Đã vào mã → PR #540 UI-CV-TVV** (TL-V5, 24/10). Mockup đã duyệt (`10` đầu tệp: phần chủ SP không góp ý = duyệt); chỗ web khác khung + lý do: `docs/anh/<pr>/khop-khac.md` của PR đó.

> V5-B1, 22/10/2026. **ĐỀ XUẤT THIẾT KẾ**, chờ chủ SP duyệt. Dựa trên V5-A (`v5-nen.css`, `du-lieu-demo.md` mục 6–7).
> Mở: `tvv.html?mo=<yen|binh|quyen|tung|bs|none>&tt=<nhap|go|dang|chua|da|loi|thuhoi|tai|loitai|rong>&kq=0&kb=1&hoi=1&theme=dark`.
> Ảnh: `anh/tvv-*.png`. Người xem: TVV Nguyễn Thu Hương (Cẩm Phả) — 3 việc: Báo PH Ngô Hải Yến, Báo PH Lý Tuấn Bình, Sau thi Đinh Ngọc Quyên.
> **Việc Báo PH của TVV chưa có trong mã** (`b1-ra-soat.md` mục 4, `06-xac-minh.md`): mockup vẽ theo luật đã chốt — sinh ngay khi GVCN lưu xử lý vi phạm (plan.md N1), hạn 23:59 giờ VN ngày lưu + 4 (01 mục 2), TVV của em giữ (N6, Q1–Q2 `06`).

## 1. Yêu cầu → khung → thành phần

| Yêu cầu | Nội dung | Khung (ảnh) | Thành phần |
|---|---|---|---|
| **C05** | TVV có menu **Công việc** (badge = việc của tôi đang mở: 3); nhóm Báo PH · Sau thi (· Chốt ngày thi · Bổ sung hồ sơ khi có) | `tvv-bao-ph-1440-sang`, `-ds-375` | `.dh`, `.nhom` |
| **C15** | Form Báo PH chỉ 3 trường: **Đã báo PH / Chưa liên hệ được** · **Ngày** (ô gõ + nút lịch, mặc định hôm nay, không sau hôm nay) · **Ghi chú kết quả**. Không Cách liên hệ / PH phản hồi / Đồng ý phối hợp | `-bao-ph-1440-sang`, `-bao-ph-1440-toi` | `.lua-chon`, `ONgay`, `textarea` |
| brief 9.1 | Bối cảnh chỉ đọc trên form: HV ↗, lớp, lần xử lý (Report 1 · GVCN · giờ lưu), nội dung GVCN, **hạn 23:59 T6 18/09**, PH + **SĐT bấm gọi** (`tel:`) — không nhập lại dữ liệu GVCN | `-bao-ph-1440-sang` | `.khoi-ngu-canh`, `a.goi` |
| **T10** | "Chưa liên hệ được" = **một lần thử**: lưu xong việc vẫn mở, giữ hạn 18/09, lịch sử +1 dòng (ngày giờ · người · nội dung); dòng danh sách "⚠ Chưa liên hệ được · lần n" | `-chua-lien-he-1440-sang` | `.dong-ls`, `.bd-td.sap` |
| brief 9.1 | Kết thúc ngoại lệ là thao tác phụ "⋯ → Bỏ việc" (lý do sẵn có), không trên form chính (`06` điểm 6) | mọi khung Báo PH (nút ⋯) | — |
| "Đã báo PH" | Lưu → dòng mờ gạch "✓ Đã báo PH 14/09", chân "✓ Đã lưu 19:41 · Việc xong" + "Việc kế: Lý Tuấn Bình"; badge 3 → 2; "Sửa" vẫn có (sửa có lịch sử) | `-da-bao-ph-1440-sang` | `.tt-luu.da` |
| **T22** | GVCN xin thu hồi Report 1 sau khi TVV đã báo: báo vàng "chờ QL duyệt", lịch sử TVV giữ nguyên; TVV không phải làm gì | `-thu-hoi-1280-sang` | `.bao-xung-dot` |
| **T16** | Đang gõ ghi chú Yến, bấm Bình → "Bỏ chữ đang gõ?" (Ở lại = nút chính) | `-hoi-bo-chu-1440-sang` | `.hop-hoi` |
| **T15** | Mất mạng khi lưu → giữ chữ, "Thử lại"; không báo xong | `-loi-luu-1440-sang` | `.tt-luu.loi` |
| **T21** | 375 + bàn phím mở: panel toàn màn co trên bàn phím, ô đang gõ và chân "Lưu / Lưu và tiếp" vẫn thấy, không bị che | `-bao-ph-ban-phim-375` | `.panel-chan` dính đáy |
| **C16**, brief 9.2 | **Sau thi** một panel hai bước: ① Kết quả thi thật (L R W S → Overall máy tính) **lưu riêng** → ② Bước tiếp (Lộ trình mới · Tạm dừng · Kết thúc học — `LY_DO_DONG`) | `-sau-thi-1440-sang`, `-sau-thi-chua-luu-diem-1440-sang`, `-sau-thi-375` | `.buoc` |
| **T09** | Lưu điểm xong: "Đã có kết quả · Chưa chốt bước tiếp" (badge tiến độ, xanh dương) — bước tiếp còn mở, **hạn 21/09** riêng; trước khi lưu: "Đã thi · chờ KQ" (badge lịch thi) | `-sau-thi-` | `.bd-td.dang`, `.bd-lich` |
| C10, C23 | KQ thi thật: "✓ Đạt Target 6.5" (badge kết quả, cùng họ SOS) + câu "W, S thấp hơn không tính chưa đạt vì Overall đạt"; "Đã thi · chờ KQ" dáng lịch thi, không nhầm Đạt | `-sau-thi-1440-sang` | `.bd-kq`, `.bd-lich` |
| N6 | Chốt ngày thi (không hạn): Ngày thi / Dời tháng dự kiến; ngày đã qua chọn được | `-chot-ngay-thi-1440-sang` | `ONgay`, `.bd-lich.du-kien` |
| N6, V4 Q-D4 | Bổ sung hồ sơ: 4 trường (Ngày sinh · Email · Tuần bắt đầu · Target FT), nhãn đã có / thiếu, một nút Lưu | `-bo-sung-ho-so-1280-sang` | `.truong` |
| trạng thái | Rỗng: "Việc Báo PH mới sẽ hiện ngay khi GVCN lưu xử lý…" · đang tải · lỗi tải | `-rong-1440-sang`, `?tt=tai`, `?tt=loitai` | `.rong`, `.bao-loi` |

## 2. GIỮ

- Lưu KQ thi thật **tách** chọn bước tiếp — mã đã đúng (`loTrinh/thiThat.ts:59-120` ↔ `buocTiep.ts:187`).
- Hạn bước tiếp = muộn hơn của (ngày thi + 7, ngày có KQ + 7) — `tongKetLoTrinh.ts:119-136`, `06` điểm 3: thi 12/09, có KQ 14/09 → **21/09**. Gán lại TVV không reset hạn.
- "Báo PH kết quả Test lớp thường" (`bao_ph_tvv`) **vẫn của GVCN**, không vào trang này (N6).
- SĐT PH từ `students.parent_phone`, `parent_name`, `parent_relation`.

## 3. BỎ

| Bỏ | Nguồn |
|---|---|
| Form V4 4 hàng chip (Liên hệ PH · Cách + ngày · PH phản hồi · Kết quả) + "＋ Thực tế khác…" | `mockup-v4-viec-tvv` k1, k9 (C15) |
| Việc TVV đặt ở "Việc của bạn" trên Tổng quan TVV, không menu Công việc | V4 Q-A1 ① (C05) |
| "Cập nhật KQ thi thật" ở Lịch thi / của GVCN lớp cuối | `thiThat.ts:160-185`, brief mục 4 → tuyến Sau thi của TVV |
| "Chọn bước tiếp" là việc của mọi QL / TVV chi nhánh (`ownerId: null, mine: true`) | `buocTiep.ts:371-392` → TVV của em giữ (N6) |
| Xoá thẳng lần xử lý | `yThuc/xuLy.ts:622-638` → thu hồi qua QL (T22) |

## 4. Giả định · dữ liệu [V5]

- Lần thử "Chưa liên hệ được" ghi **14/09 15:30** (bảng demo ghi 15/09 — sau "hôm nay", trái quy ước demo; V5-C sửa `du-lieu-demo.md`).
- Nội dung GVCN, tên + SĐT PH, Target 6.5 và điểm L R W S của Đinh Ngọc Quyên (Overall 7.0 theo demo), thời điểm lưu Report 1 của Lý Tuấn Bình (10:05): **[V5]**.
- Việc Chốt ngày thi (Hồ Thanh Tùng) và Bổ sung hồ sơ (Lý Tuấn Bình) là **minh hoạ thêm**, không nằm trong 3 việc demo (nút "± việc minh hoạ thêm").

## 5. Đích đo

- Ca thường "đã gọi, PH đã nghe": mở trang (việc đầu chọn sẵn khi là việc của mình) → chọn "Đã báo PH" → gõ ghi chú → "Lưu và tiếp": **2 bấm + gõ**, 0 đổi trang.
- Sau thi lưu riêng điểm: 4 ô + "Lưu điểm" = 1 bấm; chốt bước tiếp sau: 2 bấm.

## 6. Triển khai → PR #540 UI-CV-TVV (22/10)

| Khung / yêu cầu | Web | Kết quả |
|---|---|---|
| C05 menu Công việc + badge | `platform/nav.ts` (`viecTvv`), `/my-work` chỉ việc TVV | KHỚP |
| Nhóm Báo PH · Sau thi · Chốt ngày thi · Bổ sung hồ sơ | `gomNhomViec(…, tvv)` | KHỚP (luật hạn → ⓘ, P1) |
| Dòng việc (hạn · tên · em · lớp · badge · nút) | `DanhSachViec` (`BadgeViecTvv`, `HanPhu`) | KHỚP (+ "Gia hạn" sẵn có ở Sau thi) |
| C15 + bối cảnh Báo PH, SĐT bấm gọi | `PanelBaoPhTvv` | KHỚP (chữ phụ "mặc định hôm nay…" bỏ — P1) |
| T10 lần thử · T15 lỗi lưu · T16 hỏi bỏ chữ · T21 375 | `PanelBaoPhTvv` + `KhungPanel` (NEN-PANEL) | KHỚP |
| T22 GVCN xin thu hồi | `thuHoiCho` (máy chủ) + báo vàng | KHỚP |
| C16 / T09 Sau thi hai bước (+ Ghi chú bước tiếp, lưu ở `buoc_tiep_json` + nhật ký) | `PanelSauThi` | KHỚP (khác nhỏ: "Thôi học" thay "Kết thúc học" — một khái niệm một tên; Lịch sử mở thay panel, không đếm số) |
| Chốt ngày thi | `PanelChotNgayThi` (`PUT /hoc-vien-lop/lich-thi`) | KHỚP |
| Bổ sung hồ sơ 4 trường | dòng tổng mở trang Thiếu thông tin ↗ (sẵn có) | KHÁC: máy chủ gom một dòng (Q-D4 ①); panel 4 ô cần luật Target / Tuần bắt đầu theo vai — giữ đường cũ |
| Rỗng · đang tải · lỗi tải | `HoTroHocVienTab` | KHỚP (rỗng: "Không còn việc đang mở" + HV của tôi ›, câu giải thích bỏ — P1) |
