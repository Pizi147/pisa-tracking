# TUYEN-3 (web) — khớp / khác mockup v27

Mockup: `tuyen-cong-viec.html` T8a – T8d, T9. Đặc tả: `docs/superpowers/specs/2026-11-26-tuyen-cong-viec-yt-phoi-hop/thiet-ke.md` mục 4.2, 4.3, 4.5, 7 (TUYEN-3).
Ảnh cặp mockup | web (seed 14/09/2026, Playwright, phông đã nạp): `docs/anh/tuyen-3/` — 1440 + 1280 tối, 375 sáng. GVCN Trần Ngọc Hà (vai 7), Head Nguyễn Khánh Vy (vai 2), GV chưa theo dõi gì (vai 11).

## Bảng truy vết khung → thành phần → ảnh

| Khung mockup (v27) | Thành phần web | Ảnh | |
|---|---|---|---|
| T8a: Đang theo dõi MỘT dòng một tuyến, mục theo tên tuyến (Vi phạm · Phối hợp SOS · Báo PH kết quả Test) | `DsTheoDoi` đọc `tuyen` của `GET /my-work/theo-doi` (TUYEN-0, 0 request thêm); việc N58 thuộc tuyến (`viec`) gom vào dòng tuyến, bỏ khỏi mục theo loại việc | t8a | KHỚP |
| T8a: dòng = lớp · em · chip SOS · "Đang ở {bước} · {người}" · hạn tô màu — MỘT tầng | `DongTheoDoiViec` + `ChipSos`; máy chủ tên bước NGẮN ("Báo PH" — nguồn ở tên mục); MỘT khuôn "Đang ở {bước} · {người}" cho cả việc N58 (trước: "Phụ trách … · Chưa báo"); việc không gắn em: tên ngắn để cột em vừa chữ; 375: ba tầng lớp + hạn · tên · chi tiết (`.td-A`, như Yêu cầu của tôi) | t8a, t8b | KHỚP |
| T8a: "MB FOU 15 · 4 em" — Báo PH kết quả Test gộp lớp × nguồn | `DsDong gop` (mục Báo PH — tuyến và việc N58): một dòng "n em ˅" · "Đang ở Báo PH · {người | n người}" · hạn sớm nhất; bấm bung danh sách em ngay dưới (mỗi em mở panel của mình) | t8a, t8b | KHỚP |
| T8a: "Vừa xong 7 ngày · n tuyến" gập sẵn, cuối danh sách | đếm đúng đơn vị: "n tuyến · m việc" | t8a | KHỚP |
| T8a: việc theo dõi tay không thuộc tuyến (Báo PH N58, Nhận thông tin…) | giữ mục theo loại việc như cũ, sau các mục tuyến | t8a | KHỚP |
| T8a / T8d: panel tiêu đề = tên tuyến · em · lớp · ngữ cảnh (MT2 · SOS 3) | `PanelTuyenTheoDoi` (mới, `dauViec`) | t8a, t8d | KHỚP |
| (chủ SP 27/11: panel không được chỉ một dòng) thân panel có thông tin làm việc | bước đang ở là một việc Báo PH → nhúng panel Báo PH chỉ xem (Phụ trách · Hạn · Theo dõi + Tuyến + Máy điền sẵn / bối cảnh + liên hệ PH + Lịch sử); còn lại → Tuyến mở sẵn nội dung bước đang ở + bước xong gần nhất | t8a, t8d | KHỚP |
| T8a: dải "Bạn đang theo dõi · chỉ xem" + "Bỏ theo dõi" (bỏ CẢ tuyến) | `DELETE /tuyen/:loai/:khoa/theo-doi`; toast Hoàn tác = `POST …/theo-doi` | t8a, t8d | KHỚP |
| T8a: khối Tuyến "Xong a/b" (không "đang n"), bấm bước mở nội dung theo quyền | `KhoiTuyen` từ `GET /tuyen/:loai/:khoa` (chỉ khi mở) | t8a, t8d | KHỚP |
| T8a: "Lịch sử 6 mục" gập dưới Tuyến | — | t8a | KHÁC — tuyến chưa có nguồn lịch sử chung (lịch sử nằm ở từng việc); các bước Tuyến đã ghi ai · ngày. Dòng việc N58 (không thuộc tuyến) vẫn mở panel cũ có Lịch sử |
| T8a: chân "Đóng" | chân KhungPanel | t8a | KHỚP |
| T8b: Head 375 — cùng dòng tuyến | cùng thành phần | t8b | KHỚP |
| T8c: rỗng — ✓ "Chưa theo dõi tuyến nào" + câu "Làm xong phần của bạn…" | khối rỗng (thay `Empty` "Bạn chưa theo dõi việc nào") | t8c | KHỚP |
| T8d: panel 375 | cùng thành phần (tầng hai người · chi tiết của `KhoiTuyen`) | t8d | KHỚP |
| T9: Chờ bạn duyệt — dòng mở TẠI DÒNG (giữ v24 H1) | `DsDuyet` / `TheYeuCau dong` | t9 | KHỚP |
| T9: khối Tuyến của lần xử lý trong phần mở (khác mặc định · thu hồi → tuyến Vi phạm; sửa cấp bậc → tuyến Sửa cấp bậc) | `TuyenDuyet` (mới, `GET /tuyen/vi_pham/{lần xử lý}` · `/tuyen/cap_bac/{yêu cầu}` khi dòng mở) | t9 | KHỚP |
| T9: "Head duyệt · Bạn · hạn" + bước ○ sau khi duyệt | `KhoiTuyen` (máy chủ TUYEN-0) | t9 | KHỚP |
| T9: nhãn "Sau khi bạn duyệt · cùng lúc" | `KhoiTuyen`: bước cùng lúc CHỜ bước người xem đang giữ → "Sau khi bạn duyệt · cùng lúc" (Head duyệt) / "Sau bước của bạn · cùng lúc"; còn lại "Cùng lúc · n bước" như cũ | t9 | KHỚP |
| T9: dòng "Lần trước: {bậc} · {ngày} · đã báo PH {ngày}" đầu khối | máy chủ `tuyen.ts` `lanTruoc` (lần xử lý đã duyệt / đã thực hiện trước đó của em; chỉ người xem được Ý thức em) → dòng nhãn đầu `KhoiTuyen` | t9 | KHỚP — seed: em Lương Gia Bảo không có lần trước nên ảnh không có dòng; phép kiểm TUYEN3-1 |
| T9 375 | cùng thành phần | t9-375 | KHỚP |

Đếm: 20 dòng · KHỚP 19 · KHÁC 1. **KHỚP thuần 19 / 20 = 95 %.**

Rà PTA #2281 vòng 1 đã sửa: chữ chi tiết một tầng (rút chữ, không cắt), cột chi tiết rộng nhất, gộp n em, một khuôn dòng, đếm Vừa xong đúng đơn vị; panel có nội dung (chủ SP 27/11). Phần mở Chờ duyệt giữ các hàng cũ (3 vi phạm, Sau khi duyệt, Hạn tự chốt, Mở ›) trước Tuyến.

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau | |
|---|---|---|---|
| Mở việc đang theo dõi | mỗi việc N58 một dòng → panel khối Phụ trách + Lịch sử, không nội dung | việc thuộc tuyến: MỘT dòng tuyến → panel Tuyến có nội dung theo quyền; việc không thuộc tuyến: như cũ | ĐỔI (N72 ①) |
| Bỏ theo dõi | bỏ từng việc (DaiChiXem) | dòng tuyến: bỏ cả tuyến + Hoàn tác; dòng việc lẻ: như cũ | GIỮ + THÊM Hoàn tác |
| Gập / mở mục, "Vừa xong 7 ngày", nhớ gập | có | có | GIỮ |
| Mở từ đường dẫn `theo=` (F5, Quay lại) | `loai:id` | thêm `tuyen:{loai}:{khoa}` | GIỮ |
| Chờ duyệt: Duyệt · Từ chối · chọn nhiều · mở tại dòng · Mở › | có | có + khối Tuyến trong phần mở | GIỮ + THÊM |

## Máy chủ
- `tuyen.ts`: `lanTruoc` cho tuyến Vi phạm (một câu con trong câu dựng tuyến, không thêm câu); trả khi người xem được Ý thức em.
- Không đường mới: `GET /tuyen/:loai/:khoa`, `DELETE|POST /tuyen/:loai/:khoa/theo-doi`, `GET /my-work/theo-doi` (`tuyen`) đều có từ TUYEN-0.

## [XM]
1. Lịch sử của tuyến trong panel Đang theo dõi (mockup "Lịch sử 6 mục") — cần nguồn lịch sử gộp các việc của tuyến (máy chủ); để sau nếu chủ SP cần.
