# V8-TQ — Tổng quan theo mockup v8 (chủ SP duyệt 29/10) · CHỜ CHỦ SP DUYỆT ẢNH CẶP

Loại PR: **làm lại màn** (một màn một PR). Mockup `thiet-ke/v8/tong-quan.html` + `tong-quan-ghi-chu.md`. Nhánh từ `origin/main` 8020aab85 (#694 NEN-V8, #692 MENU-DONG).
13 câu hỏi `thiet-ke/v8/README.md`: làm đúng như mockup đang vẽ; chỗ mockup không vẽ (QT, CX, Admin, Head tutor) giữ web, đồng bộ hình ảnh.

## Ảnh cặp (mockup v8 | web, cùng vai; 1440 tối, 375 sáng; toàn trang)
| Tệp | Khung | Vai web |
|---|---|---|
| `a-ql-1440-toi.png` · `a-ql-375-sang.png` | A · QL Fast Track | QL Monbay (2) |
| `b-ql-thuong-ht-1440-toi.png` · `b-ql-thuong-ht-375-sang.png` | B · QL Lớp thường + GV › Học thuật | QL Monbay (2) |
| `c-gv-1440-toi.png` · `c-gv-375-sang.png` | C · GV (GVCN + dạy) | Trần Ngọc Hà (7) |
| `d-tvv-1440-toi.png` · `d-tvv-375-sang.png` | D · TVV, Báo PH chưa có dữ liệu | TVV Cẩm Phả (23) |
| `zoom-ql-lop-1440-toi.png` · `zoom-gv-bang-1440-toi.png` · `zoom-the-375-sang.png` | zoom đầu trang + dải số + Lớp cần chú ý + Chờ bạn duyệt · hai bảng GV · thẻ lưới 375 | |

Số liệu khác mockup là dữ liệu demo (vd MB FT 101 "Đạt MT —"), không phải lệch hình.

## Đo `getComputedStyle` (mockup ↔ web, `tq/do.mjs`)
- 1440 tối, khung A / C / D: h1 22 · công tắc khung (14 / 700 / gạch đáy 2 px nhấn, cao 36) · thẻ chỉ số (nhãn 13 / 500, số 28 / 700, mẫu 12) · thẻ khối (nền, viền, bo 12, đầu thẻ đệm 14 16 12, **không vạch dưới**) · h2 17 / 700 · th (13 / 600, nền surface-2, cao 40, đệm 0 14, căn giữa dọc) · td (cao 60, đệm 8 14, căn giữa dọc) · chip SOS 1 / 3 · công tắc Hành chính (13 / 700 / gạch đáy) · dòng Chờ bạn duyệt / Điều hướng (cao 59–60, 14 / 12) · "Hộp duyệt ›" màu nhấn — **trùng**.
- 375 sáng: thẻ chỉ số đệm 12 · thẻ dòng có vạch trên · nhãn lưới 13 / số 17 / mẫu 12 · "– Chưa có dữ liệu" viền đứt `--thieu-vien` — **trùng**.
- Còn lệch: chữ phụ `--text-dim` 183 194 216 / `--text-faint` 154 168 194 vs mockup 186 198 222 / 158 172 200 (token chung, phạm vi NEN-V8 — như #697 không sửa ở đây); nút đoạn khung 375 chữ 13 (mockup 14) — dùng `BoLocDoan v8` chung với #697.

## Truy vết khung → thành phần → ảnh
| Khung | Thành phần | Kết quả | Ghi chú |
|---|---|---|---|
| A | Đầu trang: h1 22 · phạm vi · **W3 SEP** · kỳ — công tắc Fast Track / Lớp thường bên phải | KHỚP | `CongTacKhung v8` (= `BoLocDoan v8` của #697, cùng đoạn mã) |
| A | Dải 4 chỉ số: Đạt MT ⓘ · Case có PA (+ "n chưa PA" ô số) · Chờ duyệt · Thi tháng này | KHỚP | |
| A | Thẻ khối: đầu thẻ không vạch dưới, dải đầu cột nền phụ tách | KHỚP | CSS `.tq-v8` chỉ trang Tổng quan |
| A | Lớp cần chú ý: Lớp linh hoạt · Đạt MT 120 · SOS 340 trái · Case chưa PA 130 · Thi 130; hàng 60 căn giữa | KHỚP | cột `linhHoat` (tuỳ chọn mới của `DinhNghiaCot`) |
| A | **SOS một kiểu**: chip mức + ô số + "HV" chữ phụ, một cụm không xuống dòng | KHỚP | `SosDem` dùng chung Lớp cần chú ý + Lớp tôi chủ nhiệm |
| A | GV cần chú ý Hành chính: 150 · 180 · 130, ⚠ n + "bài" | KHỚP | |
| A | Công tắc Hành chính / Học thuật dáng `.doan.nho` (30, 13, chọn đậm + gạch đáy) | KHỚP | `CongTac v8` |
| A | Chờ bạn duyệt: tiêu đề + "n đề xuất" · dòng không cắt chữ (xuống dòng) · ⚠ quá hạn / n ngày · "Hộp duyệt ›" màu nhấn | KHỚP | |
| A | Điều hướng: 5 dòng, mỗi dòng có vạch trên, "›" nhấn 15 | KHỚP | |
| A 375 | Cột phải (Chờ bạn duyệt · Điều hướng) lên trước | KHỚP | |
| A 375 | Thẻ lưới: tên + dòng phụ · nhãn 13 trên (căn đáy) · số 17 · mẫu 12 · SOS hàng riêng dưới | KHỚP | `Bang theLuoi` (chỉ bảng Tổng quan bật; bảng khác không đổi) |
| A 375 | GV cần chú ý thẻ: "Chấm Test đúng hạn" gãy 2 dòng, số vẫn thẳng hàng | KHỚP | subgrid; thử đo cùng `top` |
| B | Lớp thường: Đạt MT "—" + "chỉ Fast Track" · Lớp cần chú ý lớp thường | KHỚP | |
| B | Học thuật: Đạt kỳ vọng Test 180 · Case có PA 150 (bỏ Tiến bộ ở lớp thường) | KHỚP | |
| B 375 | Nút đoạn liền full bề rộng (khung, Hành chính / Học thuật) | KHỚP | |
| C | Dải 4 chỉ số GV | KHỚP | |
| C | **Hai bảng xếp chồng** cột trái (~1010 px) · Điều hướng phải 360 | KHỚP | trước: 3 cột ~500 px |
| C | Kỹ năng tôi dạy: Lớp linh hoạt đủ chữ ("MB Pre FOU 03", "tuần 5/5 · Final Test · W3 SEP · tuần này") · chip 130 · 170 · 120 · 130 | KHỚP | hết cắt "…" |
| C | ⓘ ngay sau tiêu đề khối, kỳ / "n lớp · hiện tại" chữ phụ sau ⓘ | KHỚP | |
| C | Chờ chấm: ⚠ n đỏ + dòng phụ "quá hạn" / "hạn dd/mm" chữ phụ | KHỚP | trước dòng phụ đỏ đậm |
| C | Lớp tôi chủ nhiệm: 140 · SOS 340 một kiểu · 100 · 130; lớp FT không SOS "0", lớp thường "—" | KHỚP | |
| C 375 | Chip kỹ năng cạnh tên lớp; lưới 3 số; SOS hàng riêng | KHỚP | |
| C | Điều hướng GV: n việc của tôi · Hồ sơ GV của tôi | KHỚP | |
| D | 3 chỉ số: 1440 ba cột đều; 375 thẻ đầu full bề rộng (hết thẻ mồ côi) | KHỚP | |
| D | "– Chưa có dữ liệu" = viên viền đứt | KHỚP | `ChuaCoDl` (cả `PhanTram` / `ptChu` dạng không gọn) |
| D | "0 · 1": 0 mờ không bấm, 1 ô số gạch chân nhấn (link đổi trang) | KHỚP | `SoDen`; vùng chạm 44 ở 375 |
| D | Thi thật 3 dòng có dòng phụ nói đích | KHỚP | |
| E | QL chi nhánh rỗng: "Không lớp nào cần chú ý" + Học viên & Lớp › | GIỮ | chữ gợi ý web; demo không có chi nhánh rỗng để chụp |
| E | Lỗi tải một khối (bảng GV) báo lỗi + Thử lại trong khối, khối khác vẫn dùng | KHÁC | đã có (`ErrorState` trong thẻ) nhưng dáng chữ đỏ giữa thẻ, mockup dải `.bao-loi` nền đỏ — `ErrorState` là thành phần chung mọi màn → [XM] PR riêng |
| E | GV chưa phân công: thẻ "Lớp của tôi" rỗng · Chờ duyệt 0 → ẩn khối | KHỚP | giữ chữ web |
| QT · CX · Admin · Head tutor | Không vẽ — áp cùng thẻ khối, bảng hàng 60, thẻ lưới 375, "0 · n" | GIỮ | đồng bộ hình ảnh, thao tác như cũ |
| Mọi khung | Màu / nền / viền / bo 4 tầng (bg → surface → surface-2 → chữ) | KHÁC | token chung NEN-V8; `--text-dim` / `--text-faint` lệch 3–6 đơn vị |

**KHỚP 28 / 32 · tính 2 dòng GIỮ có lý do: 30 / 32 ≈ 94 %.** 2 KHÁC có lý do (thành phần / token chung mọi màn).

Ngoài mockup: 1100–1279 px bố cục một cột (trước hai cột) — bảng trái cần ~860 px (cột SOS 340); 768 px bảng cuộn ngang trong thẻ (như trước, rộng hơn ~90 px).

## Thao tác TRƯỚC → SAU (không mất thao tác)
| Thao tác | Trước | Sau |
|---|---|---|
| Công tắc Fast Track / Lớp thường (QL, QT, CX) | nút đoạn có ✓ | nút đoạn liền v8 (375 full bề rộng), nhớ theo máy như cũ |
| Chọn chi nhánh (QT, CX, Admin) | có | có |
| Ô số dải: Đạt MT · Case có PA · "n chưa PA" · Thi tháng này → panel | có | có · ⓘ Đạt MT giữ |
| Lớp cần chú ý: mã lớp → hồ sơ lớp · Đạt MT · SOS từng mức · Case chưa PA · Thi tháng này là ô số | có ("n HV" gạch chân cả cụm) | có (chỉ số gạch chân, "HV" chữ phụ) |
| GV cần chú ý: Hành chính / Học thuật (`?gv=`) · tên GV → hồ sơ · ô số · ⚠ Quá hạn → panel GV trễ chấm | có | có |
| Chờ bạn duyệt: bấm dòng → panel duyệt · Hộp duyệt › | có (dòng cắt "…") | có (dòng xuống dòng) |
| Điều hướng QL / QT / CX / GV / TVV / Admin | có | có |
| GV: Việc của tôi · Case đang xử lý · Đạt kỳ vọng Test · Tiến bộ (ô số) | có | có |
| GV: bảng kỹ năng (Đạt / Tiến bộ / Chờ chấm / ⚠ quá hạn) · ⓘ · bảng chủ nhiệm (Dưới kỳ vọng / SOS / Case / Thi) | 3 cột cạnh nhau | xếp chồng, ⓘ cạnh tiêu đề |
| TVV: ⓘ Báo PH · Thi tháng này · Chờ KQ · Lộ trình tiếp · Thi thật 3 link · Điều hướng | có | có (+ dòng phụ đích) |
| QT: bấm hàng chi nhánh → lọc chi nhánh | có | có (375: bấm thẻ) |
| Admin: dải "Mới dùng" Xem / Ẩn | có | có |

## Thử (Playwright `tq/thu.mjs`, 375 + 1440, mọi yêu cầu ghi bị chặn) — **132 / 132 ĐẠT**
QL: 3 ô số dải + Esc · ⓘ Đạt MT · mã lớp link · SOS 1 → panel em · Case chưa PA → panel · SOS một cụm nowrap · thẻ 375 số thẳng hàng (cả thẻ GV nhãn 2 dòng) · tên GV link · ⚠ Quá hạn → panel GV trễ chấm · % Chấm Test → panel · Học thuật (`?gv=ht`) đổi cột + Case có PA → panel · Hành chính trở lại · Chờ bạn duyệt mở panel DUYỆT có nút Duyệt (KHÔNG bấm) · dòng không cắt chữ · Hộp duyệt › · 5 link Điều hướng · công tắc Lớp thường / Fast Track · không gửi ghi.
QT: ô số Theo chi nhánh → panel · bấm hàng → `?cn=` · ô chọn chi nhánh về Tất cả. GV: 3 ô số dải · ⓘ hai khối · % Đạt · ⚠ Chờ chấm → panel bài · mã lớp không bị cắt · SOS 3 / Dưới kỳ vọng → panel · 1440 hai bảng cùng cột trái · Điều hướng. TVV: ⓘ · viền đứt · link đúng đích (0 không bấm) · 375 thẻ đầu full · Thi thật dòng phụ. CX: ô số · link Chờ KQ · bảng chi nhánh. Admin: dải Mới dùng · Ẩn (ghi bị chặn → dải hiện lại + báo "Không lưu được") · Xem → /huong-dan · Điều hướng.
Tràn ngang (`tq/tran.mjs`): 375 / 1100 / 1280 / 1440 không tràn trang, không bảng cuộn; 768 bảng cuộn trong thẻ.

## Critique (Nielsen, tự chấm sau khi làm, một ngữ cảnh)
Trạng thái 4 · Ngôn ngữ 4 · Kiểm soát 3 · Nhất quán 4 · Phòng lỗi 3 · Nhận ra 4 · Linh hoạt 3 · Tối giản 4 · Sửa lỗi 3 · Trợ giúp 4 = **36 / 40** (web trước: QL 28 · GV 27 · TVV 29). Không P0 / P1.
P2 còn: trang QL 375 dài (~3400 px, như mockup); lỗi tải một khối dáng `ErrorState` chung ([XM]); 768 bảng cuộn trong thẻ.
`impeccable detect` các tệp sửa: 0 anti-pattern (3 ghi chú cỡ chữ: 17 = số thẻ lưới theo mockup; 14 có sẵn). `audit` / `web-design-guidelines`: thêm vùng chạm 44 cho link số TVV / CX; còn lại đạt.

## Phép kiểm sửa mốc (Q-7, mockup v8 đã duyệt)
- `prBang0` BANG-4: cho cỡ 17 ở `Bang.tsx` khi là số thẻ lưới `luoi-g` (mockup v8 `.luoi-so .g` 17 px).

## [XM] để sau
- `ErrorState` dáng dải `.bao-loi` (nền đỏ nhạt, ⚠, chữ trái + Thử lại) như mockup E — thành phần chung mọi màn → PR riêng.
- Token `--text-dim` / `--text-faint` lệch mockup 3–6 đơn vị — token chung (NEN-V8).
