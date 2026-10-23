# UI-HO-SO-GV — truy vết + KHỚP / KHÁC + thao tác TRƯỚC → SAU

Khung: `thiet-ke/v5/dieu-chinh-cuoi.html` khu **e** (V5-D, mới nhất — thắng phần trùng của `ho-so-gv.html` phương án C) + `ho-so-gv.html` C (trạng thái tải / lỗi / rỗng, panel chỉ đọc, 375) · `ho-so-gv-truy-vet.md`.
Màn: `/giao-vien/:id` (`web/src/modules/giaoVien/HoSoGiaoVienPage.tsx`). Seed nguyên, ngày demo 14/09/2026, ảnh `scripts/anh-cap.mjs`.

## Kế hoạch (loại PR: làm lại màn)

| Bước | Việc |
|---|---|
| 1 | Khung truy vết này + PR nháp |
| 2 | Máy chủ: `chiSoHoSoGv` thêm `theoLop` (lượt trong kỳ theo bài, Đạt kỳ vọng, Tiến bộ theo lớp em học lúc thi); hồ sơ: `laGvcn`, `gvcn` từng lớp, `coPa` từng Case; panel `ket-qua-lop:<lớp>` · `tien-bo-lop:<lớp>`; xoá `ketQuaHoSoGv` + đường `/ket-qua` (nợ #521) |
| 3 | Web: đầu gọn (tên · Vai · Kỹ năng · GVCN) + kỳ Từ tuần – Đến tuần (mặc định 4 tuần, P9) + "?" + dải 6 chỉ số (số → panel chỉ đọc) |
| 4 | Web: khối Lớp đang dạy (thẻ) + bảng Học thuật theo lớp (hàng Cộng) |
| 5 | Web: khối V4 giữ (Việc đang có, Case đang phụ trách, Yêu cầu đã gửi) theo luật V5; rỗng / lỗi / 375 |
| 6 | Ảnh cặp + bảng KHỚP / KHÁC (dưới) |
| 7 | `npm run check` · `/ponytail-review` · impeccable `audit` + `web-design-guidelines` |

Vai demo: QL = Nguyễn Khánh Vy (2). GV nhiều lớp + GVCN = Lê Minh Khoa (8: 16 lớp, GVCN 5 lớp). GV ít dữ liệu = Đỗ Thu Hương (17: 1 lớp, việc đúng hạn trống).
Số trên web là seed (khác số demo của mockup) — so khung, thứ tự, tên, kiểu ô; số kiểm bằng phép kiểm (`prGv`, `prSvSo2`, `prOv11h`: ô = số dòng panel).

Ảnh (`docs/anh/ui-ho-so-gv/`): `cap-gv8-1440-toi.png` · `cap-gv8-1440-sang.png` · `cap-gv8-1280.png` · `cap-gv8-375.png` (nhiều lớp + GVCN) · `cap-gv17-1440-toi.png` · `cap-gv17-375.png` (ít dữ liệu, so `ho-so-gv.html?tt=rong`) · `cap-gv8-tu-xem-1440-toi.png` (GV tự xem).

## Truy vết khung → thành phần

| # | Khung mockup | Thành phần web | Kết quả |
|---|---|---|---|
| 1 | Khu e: đầu một hàng — tên · **Vai** (GV · chi nhánh) · **Kỹ năng** (chip) · **GVCN** n lớp; bỏ chuỗi "4 lớp: …" | `HoSoGiaoVienPage` đầu (`NhanDau`: nhãn nhỏ xám / giá trị đậm — P2) | KHỚP |
| 2 | Khu e: Từ tuần [ô] đến [ô] ? (P9, mặc định 4 tuần tới tuần này) | hai `ONgay kieu="tuan"` (gõ được + nút lịch) + `NutLuat`; giá trị ghi `?tu=&den=` (mặc định không ghi); tuần đầu > tuần cuối → báo ⚠, không gọi API | KHỚP |
| 3 | Khu e: dải 6 chỉ số trong MỘT thẻ, ô ngăn vạch (Việc đúng hạn · Điểm đúng hạn · Quá hạn · Đạt kỳ vọng · Tiến bộ · Case có PA) | `DaiChiSo` — % gạch chân = panel chỉ đọc (`/giao-vien/:id/chi-so/o`), cùng hàm số (SV-SO2) | KHỚP |
| 4 | Mốc "phản hồi vấn đề HV" (C, R3c) → "Chưa có dữ liệu" | ô thứ 7 "Phản hồi vấn đề HV · – Chưa có dữ liệu" + "?" | KHÁC — [XM-1] (khu e không vẽ ô; việc giao yêu cầu hiện) |
| 5 | Mẫu 0 → "– Chưa có dữ liệu", không "0 %" (T19) | `PhanTram` (dùng lại của Tổng quan V5) | KHỚP |
| 6 | Khu e: khối **Lớp đang dạy** thẻ: mã lớp + chip GVCN · chip kỹ năng · n HV · "GVCN cô …" | `KhoiLop` (thẻ, 4 cột ≥ 1280, 2 cột ≥ 640, 1 cột 375); tiêu đề "n lớp · n HV" (HV bấm được — V4) | KHỚP |
| 7 | Thẻ lớp GVCN có "MT1 W1 OCT" / "Final 28/09" (mốc tiếp) | không vẽ — việc giao "lớp · kỹ năng · số HV · GVCN"; thay bằng "n chưa nhập" (V4 giữ, bấm → panel) | KHÁC — [XM-2] |
| 8 | Khu e: bảng **Học thuật** — Lớp · Kỹ năng · Lượt trong kỳ ("12 · MT3 10 · MT2 2") · Đạt kỳ vọng ("75 % 9/12 lượt") · Tiến bộ · Case có PA · Quá hạn; hàng Cộng | `KhoiHocThuat` (`Bang`, hàng 44 px, cột cố định, chỉ cột "Lượt trong kỳ" giãn); máy chủ `hocThuatTheoLop` (P8: lớp em học lúc thi, lượt từng HV) | KHỚP |
| 9 | Tiêu đề "Học thuật · lượt của từng HV có tuần thi trong kỳ" + "?" (P1: bỏ hộp "Quy tắc Overall…") | tiêu đề + phụ đề + `NutLuat` | KHỚP |
| 10 | Số → panel chỉ đọc (C22) | ô % mỗi hàng → `ket-qua-lop:<lớp>` / `tien-bo-lop:<lớp>`; Quá hạn → bài quá hạn của lớp (V4); hàng Cộng không bấm (số đã ở dải) | KHỚP |
| 11 | Tiến bộ đơn vị "HV" | "lượt" — máy chủ đếm lượt kỹ năng (K5, cùng Tổng quan "Tiến bộ · lượt") | KHÁC — [XM-3] |
| 12 | Mockup chỉ vẽ lớp FT | lớp thường cùng bảng (sau FT), Tiến bộ "—"; lớp đang dạy chưa có lượt trong kỳ vẫn có hàng (0 · —) để không mất ô Quá hạn | KHỚP (mở rộng theo dữ liệu thật) |
| 13 | C: trạng thái tải / lỗi một khối / rỗng | `Skeleton` từng khối; lỗi `chi-so` chỉ báo ở dải + Học thuật (khối khác vẫn đúng); rỗng "Chưa có dữ liệu · Không có lượt nào…" | KHỚP |
| 14 | C: 375 — dải 2 cột, bảng → thẻ, panel toàn màn | `grid-cols-2`, `Bang` thẻ < 640, `KhungPanel` | KHỚP |
| 15 | C08: không xếp hạng, không màu ngưỡng | số màu trung tính; chỉ quá hạn ⚠ đỏ (không chỉ màu) | KHỚP |
| 16 | C: QL xem = theo dõi; link Công việc chế độ theo dõi | nút "Việc của Khoa ›" (V4, `duongViecCuaGv`); GV tự xem: "Mở Công việc ›" | KHỚP |
| — | BỎ: khối "Kết quả gần nhất của lớp đang dạy" (mốc gần nhất của lớp — P8) | xoá web + máy chủ (`ketQuaHoSoGv`, `/giao-vien/:id/ket-qua`, ô `cot=ket-qua`) — nợ #521 | BỎ |
| — | BỎ: hộp chữ "Quy tắc Overall…", "Bấm số gạch chân…", "Phạm vi QL" dòng chữ (P1) | về "?" (phạm vi QL nằm trong "?" của kỳ) | BỎ |
| — | GIỮ (mockup không vẽ): Việc đang có · Case đang phụ trách · Yêu cầu đã gửi (V4) | giữ nguyên thao tác, đặt sau Học thuật | GIỮ — [XM-4] |

**Đếm:** 13 KHỚP + 3 KHÁC (XM-1, XM-2, XM-3) trên 16 dòng khung → 13 / 16 = **81 %** nếu chưa duyệt; chủ SP đồng ý lý do 3 dòng KHÁC → tính KHỚP (Q-5).

## [XM] — cần PTA Plan / chủ SP

- **XM-1** ô "Phản hồi vấn đề HV · Chưa có dữ liệu": việc giao ghi "mốc phản hồi thiếu → Chưa có dữ liệu", khu e không vẽ ô. **Khuyến nghị:** giữ ô (đúng R3c, báo rõ số chưa có) — hoặc bỏ tới khi có mốc (P11).
- **XM-2** thẻ lớp không có mốc Test tiếp ("MT1 W1 OCT"): ngoài phạm vi việc giao, cần API mốc tiếp theo lớp. **Khuyến nghị:** để `plan.md` mục 4 nếu chủ SP muốn.
- **XM-3** Tiến bộ "lượt" thay "HV": máy chủ đếm theo lượt kỹ năng (K5); đổi sang HV cần luật mới. **Khuyến nghị:** giữ "lượt".
- **XM-4** khối V4 (Việc đang có, Case đang phụ trách, Yêu cầu đã gửi): `ho-so-gv-truy-vet.md` BỎ "Yêu cầu đã gửi" + chip bàn giao, nhưng luật 22/10 tối "GIỮ thao tác V4" → **giữ cả ba** (chip bàn giao vẫn ở thẻ lớp). Chờ PTA Plan nói bỏ.

## Thao tác TRƯỚC → SAU

| Thao tác trước PR | Sau PR | Ghi chú |
|---|---|---|
| "Việc của X ›" / "Mở Công việc ›" ở đầu hồ sơ | **GIỮ** (đầu trang, bên phải bộ lọc kỳ) | |
| Việc đang có: bấm số nhóm → Công việc đúng nhóm; "n quá hạn" → chỉ quá hạn | **GIỮ** (khối Việc đang có) + tổng quá hạn ở dải chỉ số | |
| Lớp đang dạy: bấm mã lớp → hồ sơ lớp | **GIỮ** (thẻ lớp) | |
| Lớp đang dạy: bấm tổng HV → panel HV | **GIỮ** (tiêu đề khối) | |
| Lớp đang dạy: bấm "Bài chưa nhập điểm" theo lớp → panel bài | **GIỮ** ("n chưa nhập" trên thẻ lớp) | |
| Lớp đang dạy: bấm "Bài quá hạn" theo lớp → panel bài | **GIỮ** (cột Quá hạn bảng Học thuật; hàng Cộng = mọi lớp) | |
| Chip "Bàn giao n/m em" → hồ sơ lớp việc bàn giao | **GIỮ** (thẻ lớp) | |
| Kết quả gần nhất: bấm ô đạt/tổng (mốc gần nhất) → panel HV | **ĐỔI** → bấm % Đạt kỳ vọng / Tiến bộ theo lớp trong kỳ → panel lượt (P8) | ô cũ trái P8 |
| — | **MỚI** chọn kỳ Từ tuần – Đến tuần (P9) | |
| — | **MỚI** dải chỉ số theo kỳ, bấm % → panel chỉ đọc | |
| Case đang phụ trách: bấm HV / Case / việc tiếp; số Case, Case quá hạn → panel; "Hiệu quả PA của X ›" | **GIỮ** | |
| Yêu cầu đã gửi: số chờ / từ chối → panel; "Yêu cầu của tôi ›" / "Chờ duyệt ›" | **GIỮ** | XM-4 |

## Phép kiểm gỡ / đổi (Q-7)
- Gỡ: `prPb2b` (3e) (khoá dòng `ketQuaHoSoGv` lớp thường) · `prGv` (3) "kết quả gần nhất khớp Phân tích lớp" · `prGv` dòng GVBM gọi `ketQuaHoSoGv` · ô `cot=ket-qua` dòng lạ / thiếu lớp.
- Đổi: `prGv` (3) số = số dòng → `hocThuatTheoLop` × panel `ket-qua-lop` / `tien-bo-lop`; HTTP `/ket-qua` → `/chi-so`; `prSvSo2` hàng lớp = Σ kỹ năng; `prOv11h` PET → hàng Học thuật có "Checkpoint 1"; `tocDoDuong` `/giao-vien/9/ket-qua` → `/giao-vien/9/chi-so`.
