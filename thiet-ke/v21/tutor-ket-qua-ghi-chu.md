# v21 Ⓣ1 · Ghi kết quả PA Tutor + "PA đang chạy" — ghi chú cho người duyệt

Mockup: `thiet-ke/v21/tutor-ket-qua.html` + `tutor-ket-qua.css` (riêng). Chỉ đọc: `v21.css`, `bang-mau.css`, `gv-viet-it.css` (lưới ⑫), `ho-so-hv.css` (thẻ Case / PA ③).
Đề bài: `docs/superpowers/specs/2026-11-19-tutor/05-de-bai-mockup.md` — Luật chung G1–G6 + mục Ⓣ1 (R1.1–R1.25). Luật: `02-luat.md` TU1–TU19. Workflow: `03-workflow.md` mục 3, 4.
Session mockup "Ⓣ1" — Opus 5.5 · high. Skill: `superpowers:brainstorming` (bảng R → khung trước khi vẽ), `impeccable` (layout, clarify, adapt, critique), `ui-ux-pro-max` (trong critique).
Ảnh: `thiet-ke/v21/anh/tutor-ket-qua/` — `<khung>-toi.png` (1440 Tối) · `<khung>-sang.png` (1440 Sáng; khung 375 chỉ Sáng) · `truoc-*.png` (web thật) · `cap-*.png` (ảnh cặp TRƯỚC │ SAU). Phông Be Vietnam Pro + Inter đã nạp trước khi chụp (`document.fonts.check` = true ở cả web lẫn mockup).

Dữ liệu bịa: GV bộ môn Đinh Thu Hằng (L, R · Monbay); hôm nay thứ Năm 19/11/2026 · W3 NOV; tutor bịa Mai Thảo Vy, Quách Hữu Phúc, Hà Minh Khang; GV dạy tutor Trần Ngọc Hà. Ảnh TRƯỚC chụp DB seed (ngày demo 14/09/2026); tên thật lẫn trong seed đã thay bằng "Quản trị" trước khi chụp.

## 0. Lời chủ SP trong session này

(chưa có)

## 1. Bảng dòng R → khung (lập TRƯỚC khi vẽ)

| R | Nội dung | Khung |
|---|---|---|
| R1.1 | Thứ tự ô: Tiến triển → Quyết định → Số buổi → Tutor → Nội dung → 3 nút → Đánh giá thêm (gập) → + Tutor khác; giữ Ngày ghi, Lý do, dòng quy chế, chân | A1, A2, A4, A6 (Lý do khi Điều chỉnh) |
| R1.2 | Số buổi `[a] / [b]` một hàng, chữ trong ô "đã học" / "dự kiến"; b điền sẵn; PA có tổng → "Đã học 4 / 10" | A1 (trống), A2 (1 / 2), A4 (tổng 4 / 10), A12 (375) |
| R1.3 | a = 0 → ẩn Tutor, Nội dung, 3 nút, + Tutor khác | A5, A14 (375) |
| R1.4 | Ô Tutor mẫu A: Gợi ý → Giáo viên → Tutor → "Dùng tên"; dòng có nhãn phụ; kỳ sau điền sẵn | A3, A13 (375 toàn màn), A2 (điền sẵn "kỳ trước") |
| R1.5 | Nội dung một ô cho cả kỳ, "n / 300", ngưỡng 8 ("3 / 8") | A2, A4, A7 |
| R1.6 | 3 nút chỉ sau khi có tên Tutor, không *, bấm lại = bỏ chọn, "Cả 3 Có"; vẽ: chưa có tên · có tên chưa chọn · chọn 2 / 3 | A1 (chưa tên → không có khối), A2 (có tên, chưa chọn — lưu được), A4 (2 / 3) |
| R1.7 | Đánh giá thêm gập; mở / gập không mất chữ; Sửa có đánh giá → mở sẵn | A2 (gập), A4 (mở, 4 / 5 + nhận xét; dải gập vẫn hiện "4 / 5") |
| R1.8 | + Tutor khác: dòng mới (ô số buổi nhỏ · Tutor · Nội dung · 3 nút · Đánh giá thêm); dòng 1 lộ ô nhỏ; tổng ≠ a → lỗi tại ô; "Bỏ dòng"; vẽ 1 + 1 | A6 (1 + 1), A7b (tổng 3 ≠ 2) |
| R1.9 | Chân Đóng · Lưu nháp · Lưu / "Lưu · việc tiếp ›"; "✓ Đã lưu nháp · giờ" ở lại; dải "Nháp · ai · ngày"; Lưu không toast Hoàn tác | A2 (đã lưu nháp + dải Nháp), A4 (Lưu · việc tiếp ›), A11 (đã lưu, đã lưu nháp) |
| R1.10 | Bỏ "Người dạy kỳ này", "Hình thức", "Buổi 1 / 2", * ở 3 nút | mọi khung A (đối chiếu ảnh TRƯỚC `truoc-a-form-*`) |
| R1.11 | Trạng thái: mới mở · nháp tuần 1 · a = 0 · thiếu ô · đang lưu · lỗi máy chủ · 409 · đã lưu · Sửa lần ghi cũ · chỉ xem (TVV) · Kết quả cuối | A1 · A2 · A5 · A7 · A11 (đang lưu, lỗi, 409, đã lưu) · A8 · C2 (TVV) · A9 |
| R1.12 | 375: panel toàn màn, Số buổi một hàng, Có / Không chia đôi cao 44, ô Tutor danh sách toàn bề ngang | A12, A13, A14 |
| R1.13 | Xác nhận PA Tutor (một em + "Xác nhận n PA") bỏ "Số buổi / 2 tuần" + "Người dạy"; TRƯỚC │ SAU | B1 (+ ảnh TRƯỚC), B2, B5 (375) |
| R1.14 | Thêm / Sửa PA Tutor: bỏ Người dạy, "Tổng số buổi" tuỳ chọn; PA Tự học cạnh không đổi | B3 (+ ảnh TRƯỚC), B4 (Sửa tại chỗ) |
| R1.15 | Thẻ PA: "2 / 2 buổi · {tutor}"; nháp → "nháp 1 / 2 · 18/11" bấm mở form; bỏ "Người dạy: …" | C1, C2, C3 |
| R1.16 | Lịch sử: khối "Kỳ … · a / b buổi" → "{tutor} · {n buổi khi > 1 dòng}: {nội dung}" + ✓ / ✗ chỉ khi có trả lời + sao; lần ghi cũ như cũ | C1 (3 khối: mới 1 dòng · mới 2 dòng · cũ mỗi buổi một dòng + Hình thức) |
| R1.17 | Khối "PA đang chạy" dưới nhóm Kết quả PA, vạch trung tính + chip mờ; không cộng số việc / badge / chuông | D1 (18 việc, badge tab 1, menu 3 — không đổi) |
| R1.18 | Dòng: tên em · kỹ năng · MT · tên PA · hạn kỳ thường · nhãn nháp / "Ghi nháp"; gom theo lớp "n PA ▾" | D1 |
| R1.19 | Bấm em → form A (Lưu nháp cạnh Lưu); bấm dòng lớp → lưới E | D1 (nút) → A2 / E1 |
| R1.20 | > 10 dòng gập mặc định, nhớ theo người; mọi loại PA | D2 (25 PA gập), D3 (mở), D1 (Xếp tự học, Bổ trợ) |
| R1.21 | Bỏ cụm "Ghi kết quả PA" khỏi Sắp tới; giữ Test | D1 (cột phải: Test tuần tới · Báo cáo PH) đối chiếu `truoc-d-cong-viec-*` |
| R1.22 | Trạng thái: không có PA → không khối · đang tải · lỗi tải · nhiều lớp 25 PA · em KQ thi thật / Tạm dừng không có trong khối | D4, D2, D3 |
| R1.23 | 375: thẻ hai dòng (tên · hạn │ kỹ năng · PA · nhãn nháp); dải cao 44 | D5 |
| R1.24 | Lưới: cụm `[a] / [b]` + ô Tutor hẹp trước Nhận xét; 3 nút / Đánh giá / + Tutor khác → "Mở đầy đủ"; dòng khác để trống, cột thẳng | E1 (dòng Xếp tự học Đỗ Minh Khôi trống hai ô) |
| R1.25 | Trạng thái dòng Tutor: chưa ghi · nháp · thiếu · sẵn lưu · lỗi + Thử lại · đã lưu gập + Sửa; chân ba nút | E1, E2 (375) |

## 2. Bảng khung → thành phần web hiện có → TRƯỚC → SAU

| Khung | Thành phần web (mã) | TRƯỚC | SAU | GIỮ / BỎ / ĐỔI |
|---|---|---|---|---|
| A | `CapNhatTuan.tsx` — Tiến triển, Quyết định (đoạn 3 lựa chọn), Ngày ghi "Ghi ngày · Đổi", dòng quy chế, chân | có | như cũ, cùng chỗ | GIỮ |
| A | `CapNhatTuan` "Số buổi kỳ này *" (một ô) | một ô số | hai ô `[a] / [b]` + "Đã học x / tổng" khi PA có tổng | ĐỔI |
| A | `CapNhatTuan:368` ô "Người dạy" (kỳ này) | ô chọn người, mặc định GV bộ môn | — | BỎ (R1.10) |
| A | `BuoiTutorO` tiêu đề "Buổi n" + mỗi buổi một khối | n khối bắt buộc cho n buổi | một dòng gộp cả kỳ; thêm dòng chỉ bằng "+ Tutor khác" | ĐỔI (TU3) |
| A | `BuoiTutorO` Tutor * (`ChonNguoi` `tutor.chi`) | chỉ danh bạ + tên ngoài | mẫu A: Gợi ý → GV → Tutor → Dùng tên | ĐỔI (thêm GV — TU4) |
| A | `BuoiTutorO` Hình thức (Offline · Online) | có | — (lần ghi cũ: nhãn chỉ đọc "Offline" cạnh Tutor) | BỎ (R1.10) |
| A | `BuoiTutorO` "Nhận xét buổi *" | mỗi buổi một ô | "Nội dung *" một ô / dòng, n / 300 | ĐỔI |
| A | `BuoiTutorO` "Tutor buổi này *" 3 ô Có / Không + "Cả 3 Có" | bắt buộc, luôn hiện | chỉ hiện khi có tên Tutor, tuỳ chọn, bấm lại = bỏ chọn; "Cả 3 Có" giữ | ĐỔI (TU5) |
| A | `BuoiTutorO` "Đánh giá tutor · tuỳ chọn" (sao + nhận xét) | gập | "Đánh giá thêm" gập trong khối 3 nút; gập vẫn thấy "4 / 5" | GIỮ (đổi tên) |
| A | "Lưu nháp" + dải "Bản nháp mới hơn · … · Dùng bản mới · Lưu bản của tôi" (NHAP-KQ-PA) | nháp giữ mức + nhận xét | nháp giữ cả a / b, Tutor, Nội dung, 3 nút; câu 409 giữ | GIỮ + MỞ RỘNG (TU7) |
| A | Bối cảnh "Người dạy {tên}" ở đầu form / thẻ PA "người dạy …" | có | — | BỎ |
| B | Xác nhận PA (thẻ PA trong panel Case): Nội dung * · Số buổi * · Người dạy · Bắt đầu * · Đề xuất PA khác… · Không cần theo dõi… | có | bỏ Số buổi, Người dạy | ĐỔI (R1.13) |
| B | `XacNhanPaLo` cột "Số buổi / 2 tuần", "Người dạy" | có | bỏ | BỎ (R1.13) |
| B | `FormPa` Thêm / Sửa PA Tutor: Số buổi · Người dạy | có | "Tổng số buổi" tuỳ chọn, không Người dạy; PA khác không đổi | ĐỔI (R1.14) |
| C | Thẻ PA dòng tóm tắt "người dạy X · 5/12 buổi · KQ W2 SEP" | có | "Theo quy chế · đến MT3 · 2 / 2 buổi · Mai Thảo Vy" + nhãn nháp | ĐỔI |
| C | Nhật ký PA "Kết quả … · dạy 1 buổi · người dạy …" + `BuoiTutorO` lịch sử "Buổi n · tutor" | có | khối "Kỳ … · a / b buổi" + dòng tutor; lần ghi cũ giữ "Buổi n" | ĐỔI (mới) · GIỮ (cũ) |
| D | `HoTroHocVienTab` nhóm "Kết quả PA" (việc từ hạn − 2) | có | như cũ | GIỮ |
| D | — | không có | khối "PA đang chạy" | MỚI (TU8, TU9) |
| D | `SapToi.tsx` cụm "Ghi kết quả PA · {ngày} n" | có | — | BỎ (R1.21) |
| D | `SapToi.tsx` cụm Test, Báo cáo PH | có | như cũ | GIỮ |
| E | `LuoiKetQuaPa.tsx` chip Tiến triển + Nhận xét, trạng thái, Thử lại, chân 3 nút | có | như cũ | GIỮ |
| E | `LuoiKetQuaPa` dòng PA Tutor "Học theo buổi → Mở đầy đủ" | phải mở panel | ghi ngay: `[a] / [b]` + Tutor | ĐỔI (R1.24) |

## 3. Bảng thao tác TRƯỚC → SAU

| Thao tác | TRƯỚC | SAU | Ghi chú |
|---|---|---|---|
| Ghi Tiến triển, Quyết định, Lý do, Ngày ghi | có | giữ | |
| Ghi số buổi | một ô | a / b | b điền sẵn kỳ sau |
| Chọn người dạy kỳ này | có | **mất** | R1.10 — TU1 |
| Chọn tutor | mỗi buổi | một lần / kỳ (thêm dòng khi khác tutor / nội dung) | |
| Chọn GV làm tutor | không được | được | TU4 |
| Gõ tên tutor ngoài danh bạ | được | giữ ("Dùng tên") | |
| Chọn Hình thức | mỗi buổi | **mất** (dữ liệu cũ vẫn hiện) | R1.10 |
| Nhận xét buổi | mỗi buổi | Nội dung mỗi dòng | |
| 3 nút Có / Không, Cả 3 Có, bỏ chọn | bắt buộc | tuỳ chọn, giữ đủ thao tác | TU5 |
| Đánh giá sao + nhận xét về tutor | gập | giữ | |
| Thêm buổi / dòng | đổi "Số buổi" → thêm khối | "+ Tutor khác" | |
| Bỏ dòng | giảm số buổi | "Bỏ dòng" | |
| Lưu nháp, Dùng bản mới, Lưu bản của tôi | có | giữ | |
| Lưu / Lưu · việc tiếp › / Việc tiếp › | có | giữ | |
| Sửa kết quả đã lưu | lần ghi cũ chỉ sửa chữ | sửa mọi ô | TU18 |
| Xác nhận PA: nhập số buổi / 2 tuần, chọn người dạy | có | **mất** | R1.13 |
| Thêm / Sửa PA Tutor: chọn người dạy | có | **mất** | R1.14 |
| Thêm / Sửa PA Tutor: số buổi | có | giữ ("Tổng số buổi", tuỳ chọn) | |
| Bấm số "Ghi kết quả PA" ở Sắp tới → hộp danh sách PA | có | **mất** → thay bằng khối "PA đang chạy" (đủ danh sách, bấm từng em) | R1.21 — khối mới làm được nhiều hơn |
| Mở PA chưa tới hạn để ghi nháp | chỉ qua hồ sơ HV | khối PA đang chạy (bấm dòng em / nhãn nháp / "Ghi nháp") | mới |
| Gập / mở khối, mở khay lớp | — | "▾", "n PA ▾" | mới |
| Lưới: ghi PA Tutor | "Mở đầy đủ" | ghi ngay a / b + Tutor + Nhận xét; "Mở đầy đủ" giữ | |

Thao tác mất chỉ là các ô R1.10, R1.13, R1.14 và cụm Sắp tới R1.21 (đề bài cho phép / yêu cầu).

## 4. [XM]

1. **[XM-1] Quyết định: đoạn 3 lựa chọn hay 5 chip.** ① K4c vẽ 5 chip (Giữ nguyên · Điều chỉnh · Thay PA · Kết thúc PA · Xin hỗ trợ QL); web thật + ⑫ C4 dùng đoạn "Giữ nguyên · Điều chỉnh · Kết thúc PA" (Thay PA / Xin hỗ trợ trong "Cách điều chỉnh"). Mockup theo **web + ⑫ C4** (giữ thao tác đang có). Đề bài không đổi phần này.
2. **[XM-2] "Minh chứng" trong R1.1.** Đề bài ghi "Minh chứng … GIỮ", nhưng cả web lẫn K4c không có ô Minh chứng trong form Ghi kết quả (Bằng chứng nằm ở cấp Case: "+ Tệp · + Liên kết"). Mockup không thêm ô — giữ đúng như nay.
3. **[XM-3] Lần ghi cũ không có b.** Dữ liệu cũ chỉ có "Số buổi kỳ này" (= a). Khi Sửa, A8 **điền sẵn b = a** (2 / 2) để GV không phải bịa số (TU19 không migrate — chỉ điền trong form, lưu mới ghi). PTA chốt.
4. **[XM-4] Dòng một em trong khối PA đang chạy.** R1.18 nói "tên em đứng đầu"; luật ⑤ lời 1 (chủ SP 14/11) bắt dòng một em cùng dạng dòng gộp "Lớp · tên việc" + thẻ phụ tên em. Mockup: em **trong khay lớp** đứng đầu (như ① dòng con); lớp chỉ có 1 PA dùng dạng "MB FOU 15 · Bổ trợ Reading" + thẻ phụ tên em (theo lời 1). 
5. **[XM-5] Chân "Lưu" khi mở từ khối PA đang chạy (chưa tới hạn).** Bấm Lưu là chốt kỳ sớm (03 mục 4: "Muốn chốt sớm cũng được — như nay"). Mockup giữ "Lưu" chính + "Lưu nháp" cạnh; dòng quy chế đổi câu "Lưu nháp giữ tới hạn · Lưu là chốt, đổi bằng Sửa". Không thêm hộp xác nhận (không hậu quả lớn, sửa được).
6. **[XM-6] Màu nhãn nháp.** Web dùng màu `soon` (vàng) cho "Nháp" (lưới ⑫, chân form). Trong danh sách việc, vàng còn nghĩa "gần hạn" (V22). Sau critique, nhãn nháp ở khối PA đang chạy / thẻ PA dùng **viền đứt xám + chữ "nháp …"** (trung tính, không lẫn với vàng "gần hạn"); dải "Nháp" đầu form và "✓ Đã lưu nháp" ở chân giữ vàng như web.
7. **[XM-7] Lưới không có ảnh TRƯỚC từ web.** Seed không có lớp ≥ 2 PA cùng kỳ → TRƯỚC lấy ⑫ C2 (GD-20c đã vào mã: PA Tutor chỉ "Mở đầy đủ").
8. **[XM-8] Thẻ PA: "Ghi kết quả" khi chưa tới hạn.** C1 vẽ nút "Ghi kết quả" (như ③ K1) + nhãn nháp; nút có từ trước ("Cập nhật trước hạn" ở web). Giữ.

9. **[XM-9] "Tổng số buổi" (PA Tutor) cạnh "Số buổi" (PA khác) ở Thêm PA (B3).** Đề bài R1.14 bắt đổi nhãn riêng PA Tutor, PA khác không đổi → hai nhãn cho cùng một ô. Critique ghi P2. PTA / chủ SP chốt có đổi luôn PA khác thành "Tổng số buổi" không.
10. **[XM-10] Nhãn dưới ô a / b.** R1.2 nói chữ phụ "đã học" / "dự kiến" là placeholder (trong ô). Critique vòng 1 (P1): gõ xong là mất nghĩa "1 / 2". Mockup giữ placeholder khi trống VÀ thêm nhãn 12 px dưới mỗi ô ở form + thẻ 375; tiêu đề cột lưới 1440 "Buổi: đã học / dự kiến". Là nhãn ô, không phải chú thích tĩnh.

## 5. Bảng tự rà từng R

| R | Đạt / Chưa | Chỗ trong mockup |
|---|---|---|
| R1.1 | Đạt | A1, A2, A4: Tiến triển → Quyết định → Số buổi → Tutor → Nội dung → khối 3 nút (Đánh giá thêm bên trong) → + Tutor khác → Ghi ngày · Đổi → dòng quy chế → chân; Lý do khi Điều chỉnh: A10 |
| R1.2 | Đạt | `[a] / [b]` một hàng, chữ "đã học" / "dự kiến" (A1 trống, A2 1 / 2 điền b); "Đã học 4 / 10" A4; không chữ "vắng" (soát cả tệp) |
| R1.3 | Đạt | A5, A14: a = 0 → chỉ Tiến triển · Quyết định · Số buổi |
| R1.4 | Đạt | A3 / A13: Gợi ý · Monbay · Reading → Giáo viên → Tutor → "Dùng tên: «ha»"; nhãn phụ (GV: chi nhánh; tutor: nơi dạy · kỹ năng · …482); "kỳ trước" ở Mai Thảo Vy; A2 điền sẵn |
| R1.5 | Đạt | A2 "63 / 300"; A7 "3 / 8" + "Ghi rõ hơn — ít nhất 8 ký tự" |
| R1.6 | Đạt | A1 không khối (chưa tên) · A2 có tên chưa chọn (chân Lưu được) · A4 chọn 2 / 3; không *, không "n ô còn thiếu"; "Cả 3 Có"; bấm lại = bỏ chọn (bấm thử được) |
| R1.7 | Đạt | A2 gập · A4 mở (4 / 5 + nhận xét) · A8 Sửa có đánh giá → mở sẵn |
| R1.8 | Đạt | A6 (1 + 1, ô "Buổi" nhỏ cả hai dòng, "Bỏ dòng" ở dòng thêm) · A7b tổng 3 ≠ 2: lỗi tại ô a + ô dòng sai, chữ giữ |
| R1.9 | Đạt | Đóng · Lưu nháp · Lưu (A1) / "Lưu · việc tiếp ›" (A4); "✓ Đã lưu nháp · 14:20" (A2, A11); dải "Nháp · Đinh Thu Hằng · 18/11 14:20" (A2, A10, A12); đã lưu không toast Hoàn tác (A11) |
| R1.10 | Đạt | không "Người dạy", "Hình thức", "Buổi 1", * ở 3 nút trong form mới (soát chữ); lần ghi cũ chỉ hiện "Offline · ghi cũ" (dữ liệu, không phải ô) |
| R1.11 | Đạt | mới mở A1 · nháp A2 · a = 0 A5 · thiếu ô A7 · đang lưu / lỗi máy chủ / 409 / đã lưu A11 · Sửa lần ghi cũ A8 · chỉ xem TVV C2 · Kết quả cuối A9 · Head làm thay A10 |
| R1.12 | Đạt | A12 toàn màn; Số buổi một hàng; Có / Không chia đôi cao 44; A13 danh sách toàn màn; nút Quyết định 44 |
| R1.13 | Đạt | B1 (TRƯỚC │ SAU `cap-b-xac-nhan-1440-toi.png`), B2 lô 3 em, B5 375: chỉ Nội dung + Bắt đầu + Xác nhận PA |
| R1.14 | Đạt | B3 Học Tutor "Tổng số buổi · tuỳ chọn", không Người dạy, cạnh Xếp tự học không đổi; B4 Sửa tại chỗ ([XM-9]) |
| R1.15 | Đạt | C1 "Theo quy chế · đến MT3 · 2 / 2 buổi · Mai Thảo Vy" + nhãn "nháp 1 / 2 · 18/11" (bấm mở form); không "người dạy" |
| R1.16 | Đạt | C1: "Kỳ W1–W2 NOV · 2 / 2 buổi" · "Mai Thảo Vy · 1 buổi:" khi > 1 dòng · ✓ / ✗ kèm chữ chỉ ô có trả lời · ★ 3 / 5; lần ghi cũ "Buổi 1 · … Offline" |
| R1.17 | Đạt | D1: dải vạch trung tính + chip mờ "9 PA" + ⓘ; "18 việc", badge tab "1", menu "3" giữ nguyên |
| R1.18 | Đạt | D1: em (link) · tên PA · "Reading · MT2" · "hạn 24/11" màu thường · nhãn nháp / "Ghi nháp"; gom lớp "MB FT 101 · 4 PA ▴" ([XM-4]) |
| R1.19 | Đạt | dòng em / nhãn nháp / Ghi nháp → form A2 (Lưu nháp cạnh Lưu); dòng lớp → lưới E1 |
| R1.20 | Đạt | D2 25 PA gập (dải + "›"), D3 mở; D1 có Xếp tự học, Bổ trợ |
| R1.21 | Đạt | D1 Sắp tới: Test tuần tới · Báo cáo PH (so `cap-d-cong-viec-1440-toi.png`) |
| R1.22 | Đạt | D4: đang tải · lỗi tải · không PA → không khối · em KQ thi thật rời khối; D2 nhiều lớp |
| R1.23 | Đạt | D5: thẻ hai dòng; dải cao 44 |
| R1.24 | Đạt | E1: `[a] / [b]` + Tutor hẹp trước Nhận xét; dòng Xếp tự học để trống, cột thẳng; 3 nút → "Mở đầy đủ" (dòng quy chế nói) |
| R1.25 | Đạt | E1: lỗi + Thử lại · nháp · thiếu · sẵn lưu · a = 0 · chưa ghi · đã lưu gập + Sửa; chân Đóng · Lưu nháp · Lưu 3 dòng; E2 375 |

**Tiêu chí nghiệm thu Ⓣ1:** mọi R có khung · không chữ "vắng" / "Người dạy" / "Hình thức" / "Buổi 1" trong form PA Tutor mới · một kỳ thường gõ tối đa 5 ô (Tiến triển · Quyết định mặc định · a · Tutor điền sẵn · Nội dung; b điền sẵn) — A2 → A4 · khối PA đang chạy không đổi số "18 việc" (D1) · thao tác mất chỉ ở R1.10 / R1.13 / R1.14 (+ cụm Sắp tới R1.21 thay bằng khối).

## 6. Critique (impeccable `critique` + `ui-ux-pro-max`, hai agent độc lập)

| Vòng | Điểm | P0 / P1 | Sửa |
|---|---|---|---|
| 1 | 33 / 40 | 0 / 2 | P1 nghĩa a / b mất khi đã gõ → nhãn dưới ô ([XM-10]); P1 khối PA đang chạy trông như việc gấp → "Ghi nháp" thành nút không viền, nhãn nháp xám viền đứt ([XM-6] đổi sang trung tính); P2 Có / Không chỉ khác màu → ✓ / ✗ chỉ ở nút đang chọn; P2 Sửa lần ghi cũ bắt b → b = a điền sẵn, Hình thức thành dòng phụ chỉ đọc ([XM-3]); P2 dòng tutor lồng ba lớp viền → khối 3 nút trong dòng chỉ có vạch ngăn |
| 2 | **36 / 40** | 0 / 0 | P2 còn: nhãn a / b ở thẻ lưới 375 (đã sửa) · "Bỏ dòng" lệch (đã sửa) · [XM-9] |

Bộ dò (`impeccable detect`): 36 cảnh báo, đều ở phần chú thích cho người duyệt (số tròn vàng, hộp vàng, phông chưa khai trong DESIGN.md) hoặc mẫu sẵn có (vạch 3 px dòng đang chọn) — dương tính giả. Đo trong khung: không chữ < 12 px, không tràn ngang, tương phản ≥ 4,5 : 1 cả hai chế độ. 375: vùng bấm < 44 (Quyết định 40, ✕ ô Tutor 28, nhãn nháp trong thẻ 24) đã sửa lên 44. ✕ panel 1440 cùng vị trí (0 px lệch ngang); A8 lệch dọc 4 px do nút "‹ Case…" cao 44 → đã đưa về 36, thẳng hàng; "▾" khối cùng vị trí ở mọi khung (lệch < 1 px).
