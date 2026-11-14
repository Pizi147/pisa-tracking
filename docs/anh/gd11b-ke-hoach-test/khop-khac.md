# GD-11b KE-HOACH-TEST — khớp / khác mockup ⑦ B1–B7

Mockup `thiet-ke/v21/test.html` (⑦) + `test-ghi-chu.md` (B1–B7, [XM-1], [XM-3], [XM-5], [XM-6]). Plan `12-plan-giao-dien-dot-3.md` dòng GD-11b + V22.
Ảnh seed demo, tài khoản demo tên giả: QL "Nguyễn Khánh Vy", GV "Trần Ngọc Hà". Phông Be Vietnam Pro đã nạp (kiểm `document.fonts`).

## Ảnh cặp (mockup │ web)
| Ảnh | Khung | Nội dung |
|---|---|---|
| `cap-b1-ql-1440-toi.png` | B1 | QL, lớp FT mở: lưới HV × MT, S Ex chỉ ô "+ S Ex n" kế tiếp, "+ MT ▾", nút "Mở tất cả lớp" |
| `cap-b1-chan-1440-toi.png` | B1 | lọc "Chưa đủ MT · 1 em": em chưa có MT — "Xếp MT1" · **"Xếp MT2" mờ + "Xếp MT1 trước"** · MT3 "—"; "+ Ghi chú lớp" là nút |
| `cap-b2-ql-1440-toi.png` | B2 | hộp một kỹ năng: tên lượt "MT3 · {em} ›" (link hồ sơ MT) · "Xoá MT3" viền đỏ · Từng môn Dời · Vắng (mờ, bong "Đã có điểm" tại nút khi focus) · Xoá · ⋯ · **"Lịch sử · 10"** mở · Ghi chú lịch Test · chân **Đóng · Lưu** |
| `cap-b3-ql-1440-toi.png` | B3 | ngăn **"Xếp nhiều MT"**: thanh tab Fast Track / Lớp thường · đoạn Xếp theo tuần / theo học viên · ô Lớp có chip bên trong · ô Học viên |
| `cap-b4-ql-1440-toi.png` | B4 | lớp thường mở: Progress / Final + đề xuất tuần |
| `cap-b5-gv-1440-toi.png` | B5 | GV chỉ xem: "Chỉ xem", không "+ MT", không ô S Ex trống |
| `cap-b7-ql-375-sang.png` | B7 | 375: FT / Lớp thường rộng, ô tìm một hàng, chip + "Mở tất cả lớp"; lưới cuộn ngang, cột Học viên dính trái |

## Bảng truy vết
| Khung | Thành phần | Sau PR | Ảnh | Đánh giá |
|---|---|---|---|---|
| B1 | Ô bị chặn | CHỈ cột kế tiếp: nút mờ "Xếp MT{n+1}" + lý do "Xếp MT{n} trước" ngay dưới; cột sau "—" ([XM-5]) | cap-b1-chan | KHỚP |
| B1 | "Mở tất cả lớp", "Hiện tất cả n", "+ Ghi chú lớp" | nút nhỏ (G2), "n HV khác" | cap-b1-* | KHỚP |
| B1 | Hàng S Ex | chỉ ô "+ S Ex n" của lượt kế; ô trống sau nó không vẽ | cap-b1-ql | KHỚP |
| B1 | Lưới, ô MT, "+ MT ▾" (menu chuẩn), "Đã xoá · Khôi phục" | giữ | cap-b1-ql | KHỚP |
| B2 | Chân hộp | MỘT chân Đóng (Huỷ thay đổi khi đã sửa) · Lưu; bỏ "Nhật ký" + "Mở hồ sơ MT ›" | cap-b2 | KHỚP |
| B2 | Tên lượt | link hồ sơ MT, thêm "›" (gộp "Mở hồ sơ MT ›") | cap-b2 | KHỚP |
| B2 | Lịch sử | MỘT khối "Lịch sử · n" (việc lịch / điểm mọi môn, dòng ghi tên môn + lịch sử ghi chú), không lọc theo môn ([XM-3]) | cap-b2 | KHỚP |
| B2 | ⋯ môn | Dời hạn chấm · Huỷ điểm (đỏ); bỏ "Nhật ký" | cap-b2 | KHỚP |
| B2 | Nút mờ (Vắng khi đã có điểm…) | lý do tại nút: bong nổi khi rê / focus / chạm (`aria-describedby`), không làm hàng cao thêm | cap-b2 | KHỚP |
| B2 | ⓘ W | `NutLuat` bấm được | cap-b2 | KHỚP |
| B2 | "Xóa lịch" / "Xóa" | "Xoá" một chữ (hộp, Hướng dẫn) | — | KHỚP |
| B2 | "Xoá MT3" đầu hộp | nút viền đỏ | cap-b2 | KHỚP |
| B3 | Tên ngăn | "Xếp nhiều MT" = tên nút | cap-b3 | KHỚP |
| B3 | Khung FT / Lớp thường | thanh tab chuẩn (`HangTab`); cách xếp = đoạn chuẩn | cap-b3 | KHỚP |
| B3 | Ô Lớp | chip lớp nằm trong một ô, gõ tên lớp ngay sau chip | cap-b3 | KHỚP |
| B3 | Học viên: chip lọc ✓ ! ✕ + bảng có cột Mock Test | giữ (mockup vẽ nhóm có tiêu đề) | cap-b3 | KHÁC — GIỮ bảng + bộ lọc chip đã có (đổi nhóm = đổi bố cục bảng lớn, ngoài phạm vi ghi trong plan) |
| B3 | Đoạn "Xếp theo tuần / học viên" | dưới thanh tab (mockup: cùng hàng ô Lớp) | cap-b3 | KHÁC nhỏ — `tabs` của ngăn dùng chung cho tab "theo học viên" |
| B4 | Lớp thường | cùng hàng lọc / nút như FT | cap-b4 | KHỚP |
| B5 | GV chỉ xem | "Chỉ xem"; không ô S Ex trống | cap-b5 | KHỚP |
| B7 | 375 | lưới cuộn ngang, cột Học viên dính (thay thẻ từng em U05); FT / Lớp thường + chip hiện thẳng, "Lọc" chỉ khi nhiều chi nhánh | cap-b7 | KHỚP |
| B1 | Mũi mở lớp | tam giác đặc dùng chung (`MuiTenMo`, RA-UI-7) — mockup vẽ chevron | cap-b1-* | KHÁC — thành phần chung mọi danh sách gập; [XM] hỏi PTA |
| B1 | "Xếp MT1" của em mới | không có "đề xuất W4 SEP" dưới nút (máy chủ chưa trả tuần đề xuất cho FT) | cap-b1-chan | KHÁC — cần dữ liệu máy chủ, ngoài phạm vi |

**KHỚP 18 / 22 = 82 % tính mọi dòng; bỏ 2 dòng KHÁC vì dữ liệu / thành phần chung (đề xuất tuần FT, MuiTenMo) → 18 / 20 = 90 %.**

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau | Ghi chú |
|---|---|---|---|
| Xếp MTn kế tiếp · + MT ▾ (MT kế · S Ex) · + S Ex n · Khôi phục ô Đã xoá | có | giữ | GIỮ |
| Ô MT sau MT kế tiếp | "—" + lý do ở `title` | cột kế: nút mờ + lý do; sau nữa "—" | rõ hơn, không thêm thao tác |
| Mở tất cả lớp / Thu gọn tất cả · Hiện tất cả n · + Ghi chú lớp | chữ link | nút | GIỮ |
| Hộp: Dời · Vắng · Xoá / Khôi phục · ⋯ Dời hạn chấm · Huỷ điểm · Tuần chung · Ghi chú lịch Test · Lưu · Đóng / Huỷ thay đổi · Xoá MTn / Khôi phục MTn · Xoá lịch (lớp thường) | có | giữ | GIỮ |
| Hộp: Nhật ký cả lượt (chân) · ⋯ Nhật ký từng môn · Lịch sử ghi chú | 3 lối | MỘT khối "Lịch sử · n" trong hộp | GỘP ([XM-3] PTA) |
| Hộp: "Mở hồ sơ MT ›" | link ở chân | tên lượt đầu hộp (đã là link) + "›" | GỘP, cùng đích |
| Ngăn Xếp nhiều MT: mọi thao tác (đợt, tuần, kỹ năng, Lịch riêng, chọn em, Xếp lịch n em) | có | giữ | GIỮ |
| 375: thẻ từng em (Gần nhất · việc kế) | có | lưới cuộn ngang cột tên dính (mockup B7) | ĐỔI theo mockup — mọi ô / nút của lưới dùng được ở 375 |
| 375: "Lọc" (khung, chip, chi nhánh) | nút Lọc | khung + chip hiện thẳng; "Lọc" chỉ còn khi nhiều chi nhánh | GIỮ chi nhánh |

Không thao tác nào bị bỏ.

## [XM-1] "Cần xếp lại"
Mô tả tài khoản demo (`WelcomePage.tsx`) "Xếp lịch MT nhiều lớp, Cần xếp lại" → "…, Chưa đủ MT". Hướng dẫn "?" không còn câu "Cần xếp lại" (khoá dịch cũ trong `hdb.ts` / `hdV2b.ts` không còn nơi dùng). Chip "Cần xếp lại" ở ngăn **Xếp theo học viên** là bộ lọc em vắng chưa dời (nghĩa khác "Chưa đủ MT") — GIỮ.

## Hướng dẫn "?"
QL `ql-kh-ky-nang`, `ql-kh-ky-nang (bước ⋯)`, `ql-kh-xoa`; Admin bước ⋯ + `ad-kh-xoa`: "Bỏ khỏi đợt" / "Xóa" → "Xoá", ⋯ = Dời hạn chấm · Huỷ điểm, Lịch sử ở khối "Lịch sử · n" trong hộp, tên lượt mở hồ sơ MT. Khoá dịch `shared/i18n/en/gd11bKeHoach.ts`.

## Turso ([XM-6])
Mở trang: 0 câu thêm. Khối "Lịch sử · n" của hộp đọc khi mở khối — cùng hai đường "Nhật ký" + "Lịch sử ghi chú" cũ đã đọc khi bấm (`/attempts/:id`, `/ke-hoach-test/ghi-chu/lich-su`), nay gọi song song một lần.

## Đo ✕ / ⋯ (hộp một kỹ năng)
⋯ mỗi môn so nút Xoá cạnh nó: 1440 lệch tâm 0 px (36×30), 375 lệch 0 px (44×44). ✕ đầu hộp so tên lượt: lệch tâm 0 px (1440 cao 30, 375 cao 44), cách mép phải hộp 13 px ở cả hai cỡ.
