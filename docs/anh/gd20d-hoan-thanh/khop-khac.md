# GD-20d HOAN-THANH-BAT-SAN — ô "Hoàn thành Case" bật sẵn (mockup ⑫ `thiet-ke/v21/gv-viet-it.html` D1–D3, E4)

## Ảnh cặp (trái mockup │ phải web; demo 14/09, Lê Minh Khoa, Case 12 / PA 13, `/hoc-thuat/Case/12?pa=13&viec=ghi-ket-qua`; chụp Chrome headless, cỡ thật 1:1)
| Ảnh | Trạng thái |
|---|---|
| `cap-1440-toi-d1.png` | D1 bật sẵn (Tiến bộ rõ + Kết thúc PA) — quy chế "Case hoàn thành, mở lại được ở thẻ Case" |
| `cap-1440-toi-d2.png` | D2 GV bỏ tick — khối gập, quy chế "Case còn mở · không hạn" |
| `cap-1440-toi-d3.png` | D3 Tiến bộ một phần — tắt sẵn, quy chế "Case còn mở · không hạn" |
| `cap-375-sang-d1.png` | E4 (375 sáng) bật sẵn |
| `cap-375-sang-d2.png`, `cap-375-sang-d3.png` | 375 sáng tắt sẵn / bỏ tick — mockup chỉ vẽ 1440 cho D2–D3 nên ảnh chỉ có phía web |

## Truy vết khung → thành phần → ảnh
| # | Khung mockup | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | D1 ô tick "Hoàn thành Case" bật sẵn khi đạt | `htTay ?? batSan` (`CapNhatTuan.tsx`), hàm `hoanThanhCaseBatSan` | cap-1440-toi-d1 | KHỚP |
| 2 | D1 khối là thẻ có viền (bật viền đậm), con thụt 28 px | thẻ `rounded-[10px] border`, `sm:pl-7` (đổi ở PR này) | cap-1440-toi-d1 | KHỚP |
| 3 | D1 mức điền sẵn theo Tiến triển, Kết luận điền sẵn Nhận xét (đếm) | `mucHt` / `noteHt` (giữ) | cap-1440-toi-d1 | KHỚP |
| 4 | D1 dòng quy chế "Case hoàn thành, mở lại được ở thẻ Case" | `quyCheGhiKetQua({ htCase })` | cap-1440-toi-d1 | KHỚP |
| 5 | D2 bỏ tick → thẻ gập viền nhạt + "Case còn mở · không hạn" | cùng thẻ, `htCase=false` | cap-1440-toi-d2 | KHỚP |
| 6 | D3 chưa đạt → tắt sẵn, GV tự bật được | `hoanThanhCaseBatSan` = false | cap-1440-toi-d3 | KHỚP |
| 7 | E4 375: chip mức 2 × 2, cỡ chạm | lưới `grid-cols-2`, nút 44 px | cap-375-sang-d1 | KHỚP (sau sửa tràn ngang) |

KHỚP 7 / 7 về bố cục + hành vi. KHÁC còn lại (hình, có lý do):
- **Chip mức dạng nút bo vuông, mockup dạng viên thuốc**: `NutChon` là thành phần chung cả web (NUT-CHON-DAU-TRONG 15/11) — PR này không đổi thành phần chung; nếu muốn viên thuốc thì một PR riêng cho `NutChon`. [XM] hỏi PTA Plan.
- Khung ngoài (Quay lại, "Lưu · việc tiếp ›", dòng Bối cảnh) thuộc luồng Việc ở Công việc, không phải form tại Case — không thuộc GD-20d.
- Dòng quy chế ở 375 cắt "…" (luật NT-SUA có sẵn: ⓘ đọc đủ).

## Sửa thêm theo PTA Plan: 375 lưới 4 chip tràn ngang
Nguyên nhân: `.the-pa` là phần tử của lưới `.ds-pa` có `min-width:auto` → giãn theo nội dung (426 px trong khung 333 px) làm cả thẻ PA tràn. Sửa `min-width:0` ở `web/src/index.css`. Đo sau sửa: thẻ 333 px, vùng cuộn 375 = 375 (không tràn), 4 chip 139 × 44 xếp 2 hàng.

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau |
|---|---|---|
| Ô tick khi kết thúc PA cuối + Tiến bộ rõ | tắt, GV tự tick | bật sẵn |
| Kết thúc PA cuối, kết quả chưa đạt | tắt | tắt (D3); GV tự bật được |
| Bổ trợ miễn phí lần cuối, Mini Test ≥ ngưỡng chung | tắt | bật sẵn (máy chủ đã tự hoàn thành Case khi lưu — form không gọi lần hai) |
| Bỏ tick | — | quy chế "Case còn mở · không hạn" (D2) |
| Mức / Kết luận | điền sẵn khi tick | như cũ |
| Hình khối tick | vạch trái | thẻ viền (theo mockup) |
| Sửa kết quả / Kết thúc sớm | không ô / ô tắt | không đổi |
Mất thao tác: không.

## Skill chạy thật
- **impeccable `audit`** (phạm vi PR): detector `impeccable detect` — `CapNhatTuan.tsx`: 0 phát hiện; `index.css:421` 1 advisory có sẵn (`border-radius: 10px` của `.the-pa`, ngoài thang DESIGN.md, không do PR thêm). Tay: a11y 4/4 (checkbox bọc trong `label`, một vùng bấm; 44 px ở 375; viền dùng token `--line` / `--line-strong`, sáng + tối); đáp ứng 4/4 sau sửa tràn; hiệu năng không đổi. P3: tick tự bật khi chọn Tiến bộ rõ không có thông báo đọc màn hình (`aria-live`) — để PR riêng nếu cần. Không P0–P2.
- **web-design-guidelines** (bản vercel-labs mới nhất): tick + nhãn một vùng bấm ✓ · không gỡ outline ✓ · lưới con có `min-w-0` / `grid` ✓ · không `transition: all` ✓. Một mục: như P3 ở trên (`aria-live`).
- **`/ponytail-review`**: 1 mục — tham số `paCuoi: true` luôn truyền cứng → đã bỏ (−3 dòng, kiểm bằng HTC-5). Không còn mục. Không thêm chú thích `ponytail:` nào.

## Kiểm
Bấm thật trên demo (không lưu): Rõ + Kết thúc PA → tick bật; Một phần → tắt; bấm tay giữ theo GV. `npm run check` đầy đủ chạy lại sau sửa (kết quả ở mô tả PR). Turso 0, máy chủ không đổi.
