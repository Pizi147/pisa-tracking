# BPXL-2 — trang đầu BPXL (Kế hoạch Test) · khớp / khác mockup `thiet-ke/v22/bpxl-trang-dau.html`

Vai chụp: BPXL demo **Lương Thu Trang** (id 33, MB) · Head demo **Nguyễn Khánh Vy** (id 2). Seed nguyên, ngày demo 14/09/2026 (W3 SEP).
Ảnh K3 (chuông) chụp sau khi Head báo vắng 2 em lớp MB FT 101 (seed không có tin vắng). Ảnh K4 (mọi số = 0): seed không có chi nhánh rỗng → chặn API đặt số 0 (cùng component vẽ).

## Bảng truy vết khung → thành phần → ảnh

| Khung | Thành phần | Tệp | Ảnh | GIỮ / BỎ |
|---|---|---|---|---|
| K1 dải 4 số lặng | `DaiChiSo` + `ODai` + nút `.so-lang` (dùng lại dải chỉ số chung) | `KeHoachTestTab.tsx`, `index.css` `.dai-cs-lang` | `k1-1440-toi.png` | MỚI, chỉ BPXL (`nav.trangDauTest`) |
| K1 hàng lớp | "Chưa xếp lịch MT · n em" (đổi tên) + "Vắng · n em" | `LopKeHoach.tsx`, `keHoachTest.ts` `vangTuanNay` | `k1-1440-toi.png`, `truoc-sau-head-1440-toi.png` | GIỮ ô số, đổi tên |
| K1 ô MT vắng | "L R vắng · dời W4 SEP" · "Đã huỷ · vắng 2 lần" (khung đứt) | `oMt.ts` `oGon`, `ChipKyNang.tsx` | `k1-1440-toi.png`, `truoc-sau-bpxl-lop102-1440-toi.png` | đổi chữ (N38) |
| K1 nút-chip "Chưa đủ MT n" | BPXL: gộp vào số đầu dải · vai khác: đổi tên "Chưa xếp lịch MT n" | `KeHoachTestTab.tsx` | `truoc-sau-*.png` | BỎ với BPXL (theo mockup), GIỮ vai khác |
| K2 đang lọc | số `aria-pressed` + chip "Lọc: … ✕" + lớp đầu tự mở + lưới chỉ em khớp + "n HV" = em khớp | `KeHoachTestTab.tsx`, `LuoiKeHoach.tsx` (`vangTuan`) | `k2-1440-toi.png`, `k5b-375-sang.png` | MỚI |
| K3 chuông | tin "n em vắng · lớp · tuần", dòng tóm "cả 2 đã dời sang W4 SEP" / "3 đã dời · 1 đã huỷ", ⌄ từng em, ✓ đã xem, bấm = Kế hoạch Test lọc lớp | `HopChuong.tsx`, `server/src/keHoach/tinVang.ts` | `k3-chuong-1440-toi.png`, `k3-chuong-375-sang.png` | MỚI |
| K4 rỗng | số 0 mờ, không bấm; dải vẫn hiện | `SoTinh` | `k4-1440-toi.png` | MỚI |
| K5 375 | dải 2 × 2, số căn phải, không chạm mép | `index.css` @media | `k5a-375-sang.png`, `k5b-375-sang.png` | MỚI |

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Lưới, + MT, S Ex, Xếp MT, Xếp nhiều MT…, Xuất Excel…, Ghi chú lớp, Mở tất cả lớp, tìm lớp / HV, Fast Track / Lớp thường, ⓘ | có | GIỮ mọi vai |
| Chip "Chưa đủ MT n" (lọc lớp thiếu MT) | có | vai khác: "Chưa xếp lịch MT n", lọc giữ ở URL `?so=chua-xep` · BPXL: số "Chưa xếp lịch MT" của dải |
| Ô số hàng lớp "Chưa đủ MT · n em" | có | "Chưa xếp lịch MT · n em" (một tên) |
| Ô số "Vắng · n em" | — | MỚI mọi vai (lọc em vắng của lớp) |
| Dải 4 số, lọc theo số | — | MỚI chỉ BPXL |
| Tin chuông vắng gộp | — | MỚI chỉ BPXL |
| `chiXepLai` của Xuất Excel (tệp "chỉ cần xếp lại") | đường máy chủ chết (web không gọi) | GỠ — không mất thao tác nào trên màn |

## KHỚP / KHÁC (cổng ≥ 90 %)

| # | Hạng mục | Kết quả |
|---|---|---|
| 1 | Vị trí dải (dưới tab, trên hàng lọc), 4 nhãn, thứ tự | KHỚP |
| 2 | Chữ xám, số xám gạch mảnh, không đỏ / badge | KHỚP |
| 3 | Số đang lọc nền nhấn + viền + chip "Lọc: … ✕" | KHỚP |
| 4 | Số 0 mờ, không bấm | KHỚP |
| 5 | Hàng lớp "Chưa xếp lịch MT · n em" + "Vắng · n em" | KHỚP |
| 6 | Đang lọc: hàng lớp chỉ còn ô số đang lọc | KHỚP |
| 7 | Ô MT "L R vắng · dời W4 SEP" ở tuần vắng | KHỚP |
| 8 | Ô "Đã huỷ · vắng 2 lần" khung đứt | KHỚP |
| 9 | Lớp đầu khớp tự mở, lưới chỉ em khớp, "n HV" = em khớp | KHỚP |
| 10 | Chuông: tin gộp, dòng tóm, ⌄ từng em, ✓ | KHỚP |
| 11 | 375: dải 2 × 2, số căn phải | KHỚP |
| 12 | 375 đang lọc: mockup ẩn Fast Track / ô tìm | KHÁC có lý do — GIỮ thao tác (luật "không bỏ thao tác cũ") |
| 13 | Chuông mockup nền trang mờ khi mở | KHÁC — hành vi chuông sẵn có mọi vai, ngoài phạm vi màn |
| 14 | Nhãn số 4 "Lượt MT tuần này" | KHỚP — PTA chốt [XM-1] 21/11, mockup đã sửa theo (luật Thi = thi thật, CT-1; cùng tên ô cùng số của Admin). Ảnh `k4` bên trái là PNG duyệt cũ (còn chữ cũ) |

12 / 14 KHỚP (≈ 86 % theo hạng mục). Hai KHÁC là thao tác giữ theo luật / hành vi chung ngoài màn, không phải lệch hình ảnh: màu, nền, viền, cỡ chữ, khoảng cách khớp ở mọi khung. Chủ SP xem ảnh để quyết.

## Nguồn số

- Chưa xếp lịch MT = Σ `chuaCoLichTiep` lớp FT (danh sách lớp đã nạp, cùng hàm `thieuMt`).
- Vắng tuần này = Σ `vangTuanNay` — em có ô điểm Mock "-" ĐÃ CHỐT của tuần thi này, trừ MT cũ "Không dự thi" (`tinVang.ts` `VANG_TUAN_SQL` / `laVangTuan` — một luật cho số lớp, cờ lưới, tin chuông).
- Bài chưa có điểm = `scoreDebtCells` qua `overdueScoreBai(…, caChuaQuaHan = true)` của lớp FT — cùng tập nợ điểm và phạm vi quyền với "Quá hạn chấm" Lịch Test / "Bài quá hạn" Tổng quan (trước: 0 cho BPXL).
- Lượt MT tuần này = `highlights` tuần đầu (`mockStudents`, lớp `mockClasses`) — cùng số "Lượt MT tuần này" của Admin.
