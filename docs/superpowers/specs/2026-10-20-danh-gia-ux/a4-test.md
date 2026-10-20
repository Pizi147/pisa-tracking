> Phụ lục của [Đánh giá lại UX/UI toàn diện 20/10/2026](../2026-10-20-danh-gia-lai-ux-ui-toan-dien.md). Báo cáo gốc của agent rà (Opus 5.5), giữ nguyên chữ. Đường `SCR\anh\…` / `SCR\…` là ảnh và tệp tạm của đợt rà (không lưu trong repo); ảnh tiêu biểu đã lưu ở `anh/`.

# a4 · Rà UX/UI khu vực TEST + NHẬP ĐIỂM — 20/10/2026

Agent a4 · mã `main` e3405b93 · web demo :5621, ngày demo 14/09/2026 (W3 SEP) · chỉ đánh giá, không sửa gì.
Ảnh: `SCR\anh\a4\` (217 tệp) · spec chụp: `SCR\chup\a4-lt.json`, `a4-kh.json`, `a4-nd.json`, `a4-bu.json`, `a4-bu2.json`, `a4-mk.json` · đếm DOM: `SCR\chup\a4-dom.mjs` · đọc DB: `SCR\a4-db.cjs`.
SCR = `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad`.

---

## Phần 0. Phạm vi

**Đã chụp (id ảnh = tên tệp không đuôi):**

| Màn / panel | Vai · trạng thái | Ảnh |
|---|---|---|
| Lịch Test / Chấm Test | QT Monbay tuần này (tối, sáng), Tất cả / FT / Lớp thường, QT mọi chi nhánh, QL 2, GV 7, GV 9 (S), GV 10, 375 (QT, GV 10) | `lt-qt-mb*`, `lt-qt-mb-sang*`, `lt-qt-mb-ft*`, `lt-qt-mb-thuong*`, `lt-qt-tatca-cn*`, `lt-ql2*`, `lt-gv7*`, `lt-gv9*`, `lt-gv10*`, `lt-qt-mb-375*`, `lt-gv10-375*` |
| Lịch Test — khối | mở khối 1, bấm Nhập điểm dòng đầu, mở khối 3 (tuần này), tuần sau, tuần trước, tuần không có Test | `lt-qt-mb-k1*`, `lt-qt-mb-k1-nhap*`, `lt-qt-k3*`, `lt-qt-tuansau*`, `lt-qt-tuantruoc*`, `lt-qt-rong` |
| Lịch Test — panel / hộp | ô "Quá hạn chấm" → danh sách · ⓘ luật lưới · Xuất Excel · Dán từ Excel (dán thử 4 dòng, KHÔNG lưu) + ? · hộp S · hộp L · hộp Nhận xét lớp thường · menu ⋯ ô lớp thường · ↗ sang trang rồi Quay lại · Tab bàn phím | `lt-qt-mb-ds-quahan`, `lt-qt-luat`, `lt-qt-xuat`, `lt-qt-dan*`, `lt-qt-dan-hoi`, `lt-qt-hop-s*`, `lt-qt-hop-l`, `lt-qt-thuong-nx`, `lt-qt-thuong-menu`, `lt-qt-mo-ve*`, `lt-qt-tab` |
| Kế hoạch Test | QT Monbay FT (mọi lớp thu, MB FT 101 mở tối/sáng), Cần xếp lại, tìm "ha", chọn em từ ô tìm, ⓘ, Lớp thường (thu, MB FOU 12 mở), QL 2, GV 7 (bị chuyển về Lịch Test), 375 | `kh-qt-mb*`, `kh-qt-mb-101*`, `kh-qt-mb-canxeplai*`, `kh-qt-mb-tim*`, `kh-qt-mb-luat`, `kh-qt-mb-thuong*`, `kh-ql2*`, `kh-gv7`, `kh-qt-375*` |
| Kế hoạch Test — hộp / panel | hộp lịch (chưa điểm, đã có điểm → Xóa mờ, vắng 2 lần, ⋯ dòng, ⋯ đầu hộp), hộp "Đã huỷ" cũ, ⋯ → "Đổi tuần" dòng vắng → panel Xếp lại bài vắng, + Ghi chú lớp, Xếp nhiều MT (0 lớp / có lớp / Xếp theo học viên), Xếp lịch Test lớp thường, Xuất Excel 13 cột, Xuất điểm Test | `kh-qt-mb-101-hop*`, `kh-qt-hop-*`, `kh-qt-mb-ghichu*`, `kh-qt-mb-xepnhieu*`, `kh-qt-mb-thuong-xep`, `kh-qt-mb-xuatexcel`, `kh-qt-mb-xuatdiem`, `kh-qt-375-hop` |
| Nhập điểm trang riêng | `/nhap-diem/3` W2 SEP + tuần này (QT), GV 10 `kn=writing2`, 375 · `/bang-diem-thuong/28` (QT), `/17` (GV 7), 375 · panel Nhập điểm lớp (link cũ `/test/diem-lop?lop=3`) | `nd-*`, `lt-diemlop-cu` |
| Hồ sơ Mock | `/mock-test/171` (thiếu điểm) QT 1440 + 375, GV 9 · `/mock-test/128` (đủ điểm) | `mt-*` |
| Chấm Speaking | GV 9: Công việc, panel Chấm Speaking 1440 + 375, hộp chấm S | `cv-gv9*` |
| Lịch thi thật | từ "Lịch thi thật ›" | `lt-qt-lichthi*` |
| Mockup đã duyệt | ov14-4 Kế hoạch Test · ov14-2 lưới điểm · ov14-6 sửa 19/10 · lich-test-ba-khoi (5 kịch bản) · xep-lich-mt-gon · test-mt · mt-quy-trinh · diem-theo-lop · bo-vang-xoa-diem | `mk4-kh*`, `mk2-luoi*`, `mk6-sua*`, `mk-ltbk*`, `mk-xlgon*`, `mk-tmt*`, `mk-mtqt*`, `mk-dtl*`, `mk-bv*` |

**Đo thêm (DOM + DB, chỉ đọc):** hàng lưới Kế hoạch MB FT 101; số nút / ô nhập / chữ lặp ở Lịch Test; chiều cao trang; URL lỗi console.

**Chưa rà được / giới hạn:**
- **Phông chữ không tải trong máy demo:** mọi trang báo 22–35 lỗi console `403 /@fs/D:/Github/Pisa-tracking/node_modules/@fontsource/...woff2` (máy chủ dev của worktree chặn đọc `node_modules` ngoài thư mục). Ảnh hiện phông dự phòng, không phải Be Vietnam Pro / Inter → không chấm kiểu chữ; độ rộng chữ có thể lệch nhẹ. Đây là lỗi môi trường, không phải lỗi sản phẩm (bản build đóng gói phông).
- Không lưu gì nên không xem: dải "Đã lưu 14:32 · Hoàn tác" sau Dán Excel, Hoàn tác Xóa lịch, "lớp đủ điểm" sau ô cuối, lỗi mạng thật.
- Trình đọc màn hình: chỉ đọc mã (aria-label) + thử Tab; chưa chạy NVDA / VoiceOver.
- Bản tiếng Anh (GV nước ngoài) chưa rà. Tốc độ trên Turso thật chưa đo.

---

## Phần 1. Điểm

**Nielsen 10 nguyên tắc — khu vực Test + Nhập điểm**

| # | Nguyên tắc | Điểm | Lý do cụ thể |
|---|---|---|---|
| 1 | Trạng thái hệ thống | 3 | Tốt: trạng thái lưu từng ô (… / ✓ / "Lưu lại"), "n ô chưa lưu", Dán Excel "Đang lưu x/n dòng", Xóa lịch có Hoàn tác. Hụt: "Tuần này đã chấm 117/177" gộp cả bài thi tuần trước lẫn tuần này; tuần sau ghi "Còn phải chấm 44" cho bài chưa thi (`lt-qt-tuansau`); Quay lại từ ↗ mất khối đang mở (`lt-qt-mo-ve`). |
| 2 | Khớp đời thực | 2 | "13" ở "Test chấm tuần này" không đơn vị (= 13 ô điểm); "bài" lúc là một ô kỹ năng ("17/21 bài") lúc là bài kiểm tra; "vào muộn" dưới 20/33 em dù em đủ MT; "MT1 đang thi" cho lớp FT cuốn chiếu; ba dạng mã tuần (W2 SEP · W2 SEP/2026 · W2 SEP 2026). |
| 3 | Kiểm soát, thoát | 3 | Esc đóng hộp, "Bỏ · Gõ tiếp" khi đã gõ, hỏi trước khi thu khối còn ô chưa lưu, Hoàn tác Dán Excel / Xóa lịch. Hụt: Quay lại về Lịch Test mất trạng thái; hộp lịch 375 không nền mờ; menu "Đổi tuần" bật panel phải chồng lên hộp. |
| 4 | Nhất quán | 1 | Hai giao diện nhập điểm cả lớp (trang theo TUẦN vs panel theo LƯỢT); ba panel xuất, hai cái cùng là "xuất điểm"; "Xuất Excel" hai nghĩa ở hai tab; ⓘ chú giải màu trái màu thật; "xong" FT xanh lá vs lớp thường xám; người chấm S mặc định "Tôi" ở lưới nhưng "Chưa chọn" ở hàng đợi; một việc hai tên ("Tạo bài kiểm tra theo chương trình" = "Xếp cả lớp theo đề xuất"); "tổng … Điền cả cột" (1440) vs "Tổng số câu của đề" (375). |
| 5 | Phòng lỗi | 3 | Kiểm khoảng điểm ngay, nhận xét MT bắt buộc, nhóm nguyên nhân bắt buộc, Xóa mờ khi đã có điểm + lý do, Dán Excel xem trước ghi đè trước → sau, trùng tên → chọn em. Hụt: QT / QL mặc định thành "GV chấm S"; ô lớp thường tự lưu khi rời ô. |
| 6 | Nhận ra hơn nhớ | 2 | Phải nhớ nghĩa 9 trạng thái chip (chú giải sai); lý do "Không xếp được" chỉ ở tooltip; ⋯ ô lớp thường chỉ hiện khi rê chuột; "MT4 · chưa xếp" bấm được và không bấm được trông như nhau. |
| 7 | Linh hoạt, nhanh | 3 | Enter = "Lưu · em tiếp", Dán Excel, Điền cả cột, Xếp nhiều MT, tìm theo email, link sâu `?classId&kn`. Hụt: Lịch Test không có "Chỉ ô còn trống"; 28 lần Tab mới tới khối đầu (`lt-qt-tab`). |
| 8 | Tối giản | 1 | QT/QL Lịch Test: 2 172 px, 141 nút, 72 ô nhập; 32 nút "Nhận xét", 8 "Điền cả cột", 10 chip "Đã hoàn tất"; mở khối 3 → 5 476 px. Kế hoạch Test MB FT 101: "/2026" 108 lần, "L R W S" ~99 chip, "vào muộn" 20 lần. Dải 3 ô lặp đầu khối. |
| 9 | Nhận ra / sửa lỗi | 3 | Lỗi tại chỗ có nguyên nhân ("Ngoài 0–40 câu", "Dán 4 tiêu chí — Band tự tính", "Đã có điểm — không xóa được"), "Lưu lại" từng ô, chữ đã gõ giữ. Hụt: lý do xếp lịch thất bại ẩn; một ô lỗi chặn cả dòng dán. |
| 10 | Trợ giúp | 2 | Có ⓘ luật, "?" Dán Excel 6 bước + Sao chép mẫu, tooltip đầu cột. Nhưng ⓘ Kế hoạch Test nói sai màu → trợ giúp gây nhầm. |
| | **Tổng** | **23 / 40** | Mức "Acceptable" (20–27): nền kỹ thuật tốt, trình bày quá tải và thiếu nhất quán. |

**Cognitive load (8 mục):** trượt **6 / 8** → tải cao.
Trượt: một trọng tâm (Lịch Test trộn 3 ô + 3 khối + xuất + lịch thi thật + lưới đủ cột); nhóm ≤ 4 (hàng lọc Lịch Test 11 điều khiển, Kế hoạch Test 9, chip 9 trạng thái); phân cấp thị giác (8 nút chính "Nhập điểm" ngang nhau ở khối 1); ít lựa chọn (3 lối xuất, 4 cách xếp lịch); trí nhớ ngắn hạn (phải nhớ bảng màu chip, nghĩa "13"); lộ dần (lưới mở sẵn mọi em, mọi cột).
Đạt: nhóm khối rõ; một việc một lúc trong hộp nhập điểm.

**Có xứng ≥ 35/40 không? — KHÔNG (23/40).** Phần "lõi" (lưu ô, phòng lỗi, dán Excel, hàng đợi Speaking) đã ở mức 3. Kéo điểm xuống là Nhất quán (1) và Tối giản (1): cùng một việc có 2–3 lối với dáng khác nhau, và màn quản lý in ra mọi thứ cùng lúc. Lên 35 cần: một giao diện nhập điểm lớp, một panel xuất điểm, Lịch Test chỉ hiện ô còn nợ, chip Kế hoạch theo mockup 4 + chú giải đúng, sửa nhãn số (mục 1, 2, 4, 6, 8, 10 cùng lên 1 bậc).

**Persona (ngắn):**
- **Chị Vy (QL, 10 phút giao ban):** mở Lịch Test thấy 3 số (117/177 · 60 · 58) không biết số nào cần quyết; "58 bài · 4 lớp" ẩn trong khối gập, mở ra 8 dòng / 8 nút chính giống nhau; cuộn 2,4 màn lưới mà phần lớn em đã xong. Kế hoạch Test: 33 hàng × 4 chip nhiều màu, chú giải sai.
- **Cô Linh (GV 5 lớp, điện thoại):** 375 tốt ở phần nhập (một kỹ năng, ô 44 px, "Lưu · em tiếp"); nhưng hàng lọc + 3 ô + đầu khối chiếm ~1 000 px trước ô nhập đầu (`lt-qt-mb-375-p1`); lớp thường mỗi em 2 ô + Nhận xét + Vắng.
- **Alex (thạo việc):** thích Enter-em-tiếp và Dán Excel; khó chịu vì không lọc "chỉ ô của tôi còn trống", bị kéo sang trang ↗ rồi mất chỗ khi về.
- **Sam (bàn phím / trình đọc màn / tương phản):** aria-label ô điểm tốt, vòng focus rõ; 28 Tab tới khối đầu; lý do quan trọng chỉ ở `title` (không đọc được bằng chạm / bàn phím); chip "đã xếp" vs "chưa xếp" phân biệt bằng màu + viền.

---

## Phần 2. Phát hiện (nặng → nhẹ)

### TST-01 Lịch Test in quá nhiều: mọi lớp còn bài tự mở lưới đủ cột, đủ em
Loại [XÁC NHẬN-ẢNH 12b + PHÁT HIỆN] · **P1** · QL, QT (GV nhẹ hơn)
- Vấn đề: lớp còn bài ở khối 2 tự mở; lưới là component đầy đủ 10 cột (MT · L · R · W1 · W2 · W · S · Kỳ vọng · Overall · Kết quả) và MỌI em, kể cả em "Đã hoàn tất". MB FOU 14 còn 1 ô trống (P của Quan Hải Đăng) nhưng hiện 20 ô điểm (40 ô gõ đúng / tổng) + 20 "Nhận xét" + 4 "Điền cả cột".
- Bằng chứng: `lt-qt-mb-p1/p2` — QT/QL Monbay: 2 172 px, 141 nút, 72 ô nhập (đếm DOM `a4-dom.mjs`); mở khối 3: 5 476 px (`lt-qt-k3-p1…p6`); 375: 3 232 px. GV: 804–1 163 px (ổn). Mã: `HangLop.tsx:187-195` (mỗi hàng mở là một `LuoiNhung` đủ lưới), `moLop.ts:19-20` (`moSan` mặc định mở), `LuoiFT.tsx:122-137` (chế độ `gon` chỉ bỏ Trạng thái / Hạn).
- Nguyên nhân: triển khai OV-15b "lưới một component" (PR #469) thay lưới gọn của mockup ba-khối mà không giữ chế độ "chỉ em / cột còn nợ".
- Ảnh hưởng: QL đọc 2–6 màn để tìm vài ô trống; GV bị phân tán bởi hàng đã xong.
- Phương án: lưới ở Lịch Test mặc định **chỉ em còn ô trống + chỉ cột kỹ năng còn nợ + Kết quả** (đúng mockup ba-khối khung "Khối 1 mở + lưới HV" và mockup 2 khung 1a "chỉ cột của việc"), nút "Cả lớp" để xem đủ; **một lớp mở một lúc**; khối 3 (bài tuần này, chưa tới hạn) không tự mở lưới.
- Lý do tốt hơn: giữ đúng một component, chỉ đổi tham số (`chiCot`, `chiAttempt` đã có trong `LuoiChamLop`). Ước: 2 172 px → ~1 000 px, 141 → ~40 nút.
- Lệch mockup: `mockup-lich-test-ba-khoi` khung "Quản lý · tuần này" + "Khối 1 mở": lưới chỉ L R W1 W2 S, chỉ em còn nợ, ô "–" (`mk-ltbk--mac-dinh`, `mk-ltbk--k1`). Lệch có nguồn (OV-15b) nhưng hệ quả "trang dài" không ai quyết.

### TST-02 Hai giao diện "nhập điểm cả lớp" khác nhau, lối vào khác nhau
Loại [PHÁT HIỆN] · **P1** · GV, QL
- Vấn đề: ↗ ở hàng lớp / dòng khối 1 và nút "Nhập điểm" ở hồ sơ Mock mở **trang riêng** `/nhap-diem/:id` theo TUẦN (bộ chọn tuần, 13 cột có Trạng thái · Hạn chấm · MT). ⋯ hàng lớp, hồ sơ lớp, link cũ `/test/diem-lop` mở **panel** theo LƯỢT (MT1 · MT2 · MT3 + "n/33 đủ điểm", chọn môn, "Chỉ ô còn trống"). Cùng lớp, ba tập em khác nhau: lưới Lịch Test 5 em, trang W2 SEP 8 em, panel MT3 32 em.
- Bằng chứng: `nd-qt-ft` vs `lt-diemlop-cu` vs `lt-qt-mb-p1`; mã `ChamDiemPage.tsx:30-148` (theo tuần), `PanelNhapDiemLop.tsx:11-29` + `DiemTheoLop.tsx:46-254` (theo lượt), `HangLop.tsx:181`, `KhoiNo.tsx:174`, `MockDetailPage.tsx:290-297`.
- Nguyên nhân: kế hoạch OV-15b bỏ tab Điểm theo lớp sang panel nhưng giữ trang `/nhap-diem` cũ cho ↗.
- Ảnh hưởng: người dùng học hai cách đọc một lưới; ↗ là chuyển trang (trái luật "xử lý tại chỗ"); số em khác nhau gây nghi sai dữ liệu.
- Phương án: **một "Nhập điểm lớp" = panel theo lượt** cho mọi lối (↗, hồ sơ Mock, ⋯, hồ sơ lớp); route `/nhap-diem/:id` chuyển hướng mở panel đúng lượt (giữ link cũ). Bỏ cột Trạng thái / Hạn chấm khỏi lưới (hạn ở đầu panel).
- Lệch mockup: `mockup-ov14-2` khung 1b ("MT1 31/33 · MT2 24/33 · MT3 3/32 · Chỉ ô trống", cột L R W1 W2 W S Kỳ vọng Overall Kết quả) + khung 4 — trang theo tuần không có trong mockup.

### TST-03 Dải 3 ô số đầu Lịch Test trùng nghĩa và đặt tên sai
Loại [XÁC NHẬN-ẢNH 12b + PHÁT HIỆN] · **P1** · QL, QT, GV
- Vấn đề:
  - Ô 3 "Quá hạn chấm 58 bài · 4 lớp" = y đầu khối 1 "Test quá hạn chấm 58 · 4 lớp" (cả QT, FT 53·2, GV 9 3·2 — luôn bằng).
  - Ô 2 luôn = tổng ô 1 − đã chấm (177 − 117 = 60; 84 − 71 = 13; 44 − 0 = 44; 17 − 8 = 9). Hai ô cho một thông tin.
  - "Tuần này đã chấm 117/177" không phải "chấm trong tuần này": 177 = bài thi W2 SEP (khối 2, hạn 16/09) + bài thi W3 SEP (khối 3, hạn 23/09).
  - Tuần sau: "Còn phải chấm 44 bài" cho bài "Chưa đến lịch" (`lt-qt-tuansau`).
  - "Test chấm tuần này **13**": 13 = số ô điểm (một kỹ năng của một em) còn trống ở bài thi tuần trước (4 + 4 + 1 + 4 theo Tiến độ 17/21 · 2/6 · 19/20 · 8/12). Không đơn vị, cùng dáng số với "58".
- Bằng chứng: `lt-qt-mb`, `lt-qt-mb-ft-p1`, `lt-gv9-p1`, `lt-gv10-p1`, `lt-qt-tuantruoc-p1`, `lt-qt-tuansau`; `DaiSo.tsx:19-33`, `LichTestTab.tsx:198-216, 368-370`. Ô 3 còn mở panel thứ ba "Quá hạn chấm" 58 dòng / 6 trang, mỗi dòng một ô (`lt-qt-mb-ds-quahan`) — cùng dữ liệu khối 1, dạng khác.
- Nguyên nhân: thiết kế (mockup ba-khối 06/10 có dải này) + nhãn chưa sửa khi thêm khối 2.
- Ảnh hưởng: Chị Vy đọc 3 số mà không ra việc; nghĩ có 60 + 58 bài phải lo.
- Phương án: **bỏ dải 3 ô**; đầu mỗi khối ghi số có đơn vị: "Quá hạn chấm · 58 ô · 4 lớp", "Chấm tuần này (bài thi W2 SEP) · còn 13 ô · hạn 16/09", "Lịch Test tuần này (W3 SEP) · 47 ô · hạn 23/09". Nếu chủ SP muốn giữ một tóm tắt: một dòng chữ "Đã chấm 117/177 ô của bài thi W2 + W3 SEP". Bỏ panel danh sách 58 dòng (khối 1 đã là danh sách).
- Lệch mockup: dải 3 ô CÓ trong mockup đã duyệt → cần chủ SP quyết (Phần 4, Q1).

### TST-04 Ba lối xuất, hai cái cùng "xuất điểm", một nhãn "Xuất Excel" hai nghĩa
Loại [PHÁT HIỆN] · **P1** · QL, QT
- Vấn đề: Lịch Test "Xuất Excel" → panel **"Xuất kết quả Test"** (khung, chi nhánh, lớp, tuần/tháng/đợt, Mọi lượt/Chỉ đủ điểm, Cột gọn/đầy đủ; tệp `PISA-Tracking_MT_Monbay_W1SEP-W3SEP.xlsx`). Kế hoạch Test "Xuất điểm Test" → panel **"Xuất điểm Test"** (Điểm + nhận xét / Chỉ điểm; Theo tuần / Theo lớp nhiều MT / Lớp + khoảng tuần; tệp `PISA_DiemTest_…`). Kế hoạch Test "Xuất Excel" → **lịch** 13 cột.
- Bằng chứng: `lt-qt-xuat`, `kh-qt-mb-xuatdiem`, `kh-qt-mb-xuatexcel`; `NganXuatMt.tsx:146`, `NganXuatDiem.tsx:95`, `NganXuatKeHoach.tsx:43`, `LichTestTab.tsx:295-297`, `KeHoachTestTab.tsx:197-203`.
- Nguyên nhân: kế hoạch OV-15c thêm "Xuất điểm Test" (mockup 6 khung 9) mà không gộp với `NganXuatMt` có sẵn.
- Ảnh hưởng: QL không biết dùng cái nào; hai tệp khác cột cho cùng câu hỏi "điểm Test lớp này".
- Phương án: **một panel "Xuất điểm Test"** (mẫu mockup 6 khung 9) mở từ cả hai tab, thêm lựa chọn khung + "Chỉ lượt đủ điểm" của panel cũ; nút Kế hoạch Test đổi chữ **"Xuất lịch Test"**. Còn 2 nút, 2 tên, 2 nghĩa.
- Lệch mockup: mockup 6 khung 9 chỉ có MỘT "Xuất điểm Test"; panel cũ không được nhắc → lệch không lý do.

### TST-05 ⓘ chú giải màu Kế hoạch Test nói sai màu chip Fast Track
Loại [PHÁT HIỆN] · **P1** · QL, QT
- Vấn đề: ⓘ ghi "Xám = đã thi xong · xanh dương = đã xếp · vàng = đã dời vì vắng · nét đứt = chưa xếp … Cam = vắng · tím = chờ duyệt · viền đỏ = trễ · gạch ngang = đã huỷ · dấu nửa tròn = đợt dở". Chip FT thật: **xanh lá ✓ = xong**, xám chữ "chờ" = chờ chấm, **nền đỏ** chữ "trễ" = trễ chấm, vàng = vắng / huỷ / dời (không gạch ngang), không có nửa tròn.
- Bằng chứng: `kh-qt-mb-luat` vs `kh-qt-mb-101-p1`; `KeHoachTestTab.tsx:185-193` (chữ chú giải viết cho chip lớp thường cũ) vs `OMt.tsx:22-31` (`MAU_O_MT` của chip FT).
- Nguyên nhân: triển khai — chip FT đổi (PR-OMT, OV-15a) nhưng chú giải không đổi.
- Ảnh hưởng: trợ giúp duy nhất của bảng màu dạy sai → QL đọc nhầm "xám = xong".
- Phương án: sinh chú giải từ CHÍNH bảng `MAU_O_MT` (một nguồn), hiện thành dải chip mẫu nhỏ dưới hàng lọc khi mở lớp (không giấu trong ⓘ).

### TST-06 Chip Kế hoạch Test dày ký hiệu, không theo mockup 4
Loại [XÁC NHẬN-ẢNH 12a + PHÁT HIỆN] · **P1** · QL, QT
- Vấn đề: mỗi chip "L R W S · chờ  W1 JUL/2026"; 9 trạng thái (chưa xếp, đã xếp, đang thi, chờ chấm, trễ chấm, vắng / huỷ / dời, xong, không dự thi, "Đã huỷ" cũ) trên 5 họ màu + viền đứt + gạch ngang. Trang MB FT 101: "/2026" 108 lần, "L R W S" ~99 chip; "vào muộn" dưới 20/33 tên.
- Bằng chứng: `kh-qt-mb-101-p1/p2`, đếm DOM (`a4-dom.mjs`); `ChipKyNang.tsx:121-142`, `LuoiKeHoach.tsx:108`.
- Nguyên nhân: **kế hoạch** — OV-15c chỉ thêm năm (C20) vào chip cũ (G1 của mockup xep-lich-mt-gon), không đưa thiết kế ô của mockup 4 khung 1 vào phạm vi (`docs/superpowers/plans/2026-10-19-ov15-overhaul-6-pr.md` mục OV-15c; PR #464 không nhắc).
- Ảnh hưởng: QL quét 33 × 4 ô phải giải mã chữ + màu; khó thấy em nào cần làm.
- Phương án (theo mockup 4 đã duyệt): ô = **tuần + một chữ trạng thái** ("W4 AUG/2026 · Đã thi", "Chưa xếp" viền đứt); chỉ ghi kỹ năng khi tách tuần ("L/R W4 AUG/2026 · W/S W1 SEP/2026"); "Đã thi" nền xanh, "đã xếp" trung tính (không xanh dương); chữ việc chỉ khi có việc (trễ / vắng / huỷ · vắng 2 lần).
- Lệch mockup: `mockup-ov14-4` khung 1 (`mk4-kh-p1`) — ô, dòng email dưới tên, đầu lớp "· GVCN … · khai giảng W1 JUL/2026" đều không có trên web; khung 5 (375 = thẻ học viên) web vẫn là bảng cuộn ngang (`kh-qt-375-p1`). Lệch không lý do ghi lại.

### TST-07 "vào muộn" dưới 20/33 em — gây nhiễu, sai nghĩa với lớp FT cuốn chiếu
Loại [XÁC NHẬN-ẢNH 12a + PHÁT HIỆN] · **P2** · QL
- Vấn đề: hiện khi ngày vào lớp > khai giảng + 14 ngày. Thuật ngữ g6-147 định nghĩa "vào lớp muộn nên thiếu lượt đầu", nhưng em FT có lộ trình riêng: Chu Nhật Minh (vào 07/09) đủ MT1–MT3 đã xếp.
- Bằng chứng: `kh-qt-mb-101-p1`; DB `enrollments.started_at` lớp 3 (20/33 sau 15/06); `shared/domain/keHoachTest.ts:89-95`; `thiet-ke/THUAT_NGU_DA_CHOT.md:589`.
- Phương án: bỏ chữ; thay **email** dưới tên như mockup 4 (giúp phân biệt trùng tên, khớp ô tìm email). Nếu cần nói "thiếu lượt đầu" thì chỉ hiện khi em thật sự có MT lịch sử chưa nhập.

### TST-08 Lưới lớp thường: "Nhận xét" + "Điền cả cột" lặp mọi ô / cột; ô đã chấm vẫn là ô nhập
Loại [XÁC NHẬN-ẢNH 12b + PHÁT HIỆN] · **P2** · GV, QL
- Vấn đề: mỗi ô = nút "Nhận xét" + ô điểm + "/" + ô tổng + dòng "Đạt · 80%"; mỗi cột "tổng [25] Điền cả cột" kể cả khi cột đã đủ. Trang QT: 32 "Nhận xét", 8 "Điền cả cột".
- Bằng chứng: `lt-qt-mb-p2`, `nd-qt-thuong`, đếm DOM; `LuoiThuong.tsx:367-381` (tổng + nút ở mọi cột sửa được), `:505-509` ("Nhận xét" đứng TRƯỚC ô điểm).
- Nguyên nhân: triển khai — mockup 2 khung 1a vẽ đầu cột tĩnh "P · tổng 25", ô đã có điểm là chữ ("✕ 16/25 64%"), ô trống mới là ô nhập "[  ] / 25 Nhận xét" (Nhận xét SAU ô điểm).
- Phương án: theo mockup 2 — đầu cột chữ "P · tổng 25" (bấm sửa khi cần); "Điền cả cột" chỉ hiện khi cột còn ô trống thiếu tổng; ô đã có điểm hiện chữ, bấm mới thành ô nhập; "Nhận xét" sau ô điểm, chỉ ở ô đang làm hoặc ô thiếu nhận xét (đã có nhận xét: chấm nhỏ).
- Lệch mockup: `mockup-ov14-2` khung 1a (`mk2-luoi-p2`). Lệch không lý do.

### TST-09 Kết quả Progress Test lớp thường thiếu nhãn SOS (trái Rulebook §20.17)
Loại [PHÁT HIỆN] · **P2** · GV, QL
- Vấn đề: cột Kết quả ghi chip đỏ "3/4 môn đạt" + "Case G+V". Rulebook §20.17 (19/10) + mockup 2 khung 1a: Progress lớp thường **ghi nhãn SOS theo số môn trượt** (1 → SOS 1…; "SOS 2 tạm · L, R"). Chip đỏ chữ "3/4 môn đạt" đọc như kết quả tốt.
- Bằng chứng: `lt-qt-mb-p2`, `nd-qt-thuong`; `LuoiThuong.tsx:561-634`, `shared/domain/chamDiem.ts:81-92` (không có SOS).
- Phương án: Kết quả Progress = chip SOS chung (viền, như FT) "SOS 1 · G+V" + "Case …"; đủ môn đạt = "Đạt"; chưa đủ = "Chưa đủ điểm · còn P".

### TST-10 "Tạo bài kiểm tra theo chương trình" nằm trong lưới chấm; một việc hai tên
Loại [XÁC NHẬN-ẢNH 12b + PHÁT HIỆN] · **P2** · QL, QT
- Làm gì: gọi `POST /regular/classes/:id/plan` (`planRegularTests`) — tạo Progress / Final cho em CHƯA có bài theo mốc chương trình. Máy đã tự tạo bài khi em vào lớp (`taoBaiThuongMacDinh`, Rulebook §20.6 "Giữa khoá và Cuối khoá tự có"); nút chỉ còn cho ca hiếm (em vào sau tuần Progress).
- Vì sao ở đây: di sản thời lưới lớp thường là chỗ duy nhất của QL. Hiện ở cuối MỌI lưới lớp thường (2 lần trên trang QT), cả khi mọi em đã có bài (bấm chỉ ra toast "Mọi học viên đều đã có đủ bài kiểm tra").
- Trùng: Kế hoạch Test có nút **"Xếp cả lớp theo đề xuất"** gọi CÙNG API (`LopKeHoach.tsx:27`), chỉ hiện khi lớp còn em chưa có bài.
- Bằng chứng: `lt-qt-mb-p2`, `kh-qt-mb-thuong-p1`; `LuoiThuong.tsx:308-324, 405`.
- Phương án: bỏ khỏi Lịch Test / lưới chấm; giữ một nút ở Kế hoạch Test, một tên.

### TST-11 Quay lại từ trang ↗ mất trạng thái Lịch Test
Loại [PHÁT HIỆN] · **P2** · QL, GV
- Vấn đề: mở khối 1 → ↗ MB FT 101 → "‹ Lịch Test" → khối 1 thu lại, cuộn về đầu.
- Bằng chứng: `lt-qt-mo-ve--trang` → `lt-qt-mo-ve`; `LichTestTab.tsx:98` (`moKhoi` là state, không trên URL / không nhớ).
- Ảnh hưởng: trái luật CLAUDE.md "Quay lại về đúng nguồn (bộ lọc, tab, vị trí cuộn)"; QL phải mở lại, tìm lại dòng.
- Phương án: hết chuyển trang (TST-02: ↗ mở panel). Nếu giữ trang: ghi khối đang mở + dòng đang mở lên URL như `classId`.

### TST-12 Người chấm Speaking mặc định khác nhau theo lối vào; QT / QL thành người chấm
Loại [PHÁT HIỆN] · **P2** · GV S, QL, QT
- Vấn đề: lưới (Lịch Test, trang Nhập điểm, panel lớp) ghi "GV chấm S: {người đang xem}" (QT thấy chính tên mình); hộp S ở lưới "Người chấm: Tôi · Đỗ Vũ Tuấn Phong". Hàng đợi Chấm Speaking và hồ sơ Mock: "Người chấm: Chưa chọn" / "GV chấm: chưa chọn".
- Bằng chứng: `lt-qt-hop-s--mo`, `lt-ql2-p1` ("GV chấm S: Nguyễn Khánh Vy"), `cv-gv9-speaking-hop`, `mt-qt-171-p1`; `GvCham.tsx:42-52` (mặc định `{kieu:'toi'}`), `PanelChamSpeaking.tsx:99-100` (không truyền `gvMacDinh`).
- Nguyên nhân: luật chủ SP 06/10 (người lưu = người chấm) áp ở lưới, không áp ở hàng đợi / hồ sơ.
- Ảnh hưởng: GV nước ngoài không chắc phải chọn chính mình; QL nhập hộ dễ ghi nhầm bản thân là người chấm (tính trễ cho QL).
- Phương án: một hàm mặc định cho mọi lối: GV có kỹ năng S → chính GV; QL / QT → "Chưa chọn" và bắt chọn khi lưu điểm S (Phần 4, Q6).

### TST-13 Dán từ Excel: W1 / W2 / S phải dán "4 tiêu chí trong một ô"
Loại [PHÁT HIỆN] · **P2** · GV
- Vấn đề: ô W/S nhận "5.5 6 6 5.5" trong MỘT ô Excel; dán band "6" → lỗi "Dán 4 tiêu chí — Band tự tính" và cả dòng không lưu được (L, R, S của em đó cũng nằm lại nháp).
- Bằng chứng: `lt-qt-dan-p1` (Lương Bảo Anh: W1 lỗi → "Lưu được 1 dòng · 3 dòng còn nháp"); `DanExcel.tsx:50`.
- Nguyên nhân: luật OV-4c (band MT thường tự tính từ 4 tiêu chí) — PR #469 đã ghi lệch mockup 1d có lý do.
- Ảnh hưởng: GV giữ điểm 4 tiêu chí ở 4 cột Excel phải nối tay vào một ô.
- Phương án: nhận thêm dạng **4 cột liền nhau** cho mỗi kỹ năng W/S (TR · CC · LR · GRA / FC · LR · GRA · P), mẫu "Sao chép mẫu" sinh đúng các cột đó; ô lỗi chỉ chặn ô đó, các ô hợp lệ cùng dòng vẫn lưu (Phần 4, Q5).

### TST-14 Xếp nhiều MT: "✕ Không xếp được" không nói vì sao
Loại [PHÁT HIỆN] · **P2** · QL
- Vấn đề: MB FT 101, "MT mới" W4 SEP: "Sẽ xếp 6 · Cần xem 4 · Không xếp được 23"; cột "Sẽ xếp" chỉ ghi "✕ Không xếp được", lý do nằm ở `title`. Chip trong panel bỏ năm ("MT1 · W1 JUL") trong khi ô tuần có năm (C20).
- Bằng chứng: `kh-qt-mb-xepnhieu-lop`; `NganXepLichMt.tsx:421-428`.
- Phương án: ghi lý do ngắn ngay trên hàng ("MT3 còn ở W1 DEC") + nút "Lấy tuần sớm nhất hợp lệ"; đếm theo lý do ("23 em: MT trước chưa thi").

### TST-15 Hàng đợi Chấm Speaking thiếu hạn / quá hạn từng em
Loại [PHÁT HIỆN] · **P2** · GV S
- Vấn đề: dòng chỉ "lớp · MT · tuần"; em MT1 W4 JUL (quá hạn ~47 ngày) trông như em tuần này. Mockup 2b có "hạn 16/09 · ⚠ quá hạn 5 ngày" và đầu nhóm "⚠ 3 quá hạn".
- Bằng chứng: `cv-gv9-speaking`, `cv-gv9-speaking-375-p1`; `PanelChamSpeaking.tsx:93`.
- Phương án: thêm hạn + ⚠ quá hạn (cùng hàm `Han`), xếp quá hạn lên đầu.
- Lệch mockup: `mockup-ov14-2` khung 2b — lệch không lý do.

### TST-16 Dời lịch một em vắng: hộp → menu → panel chồng lên hộp
Loại [PHÁT HIỆN] · **P2** · QL
- Vấn đề: bấm chip "S · vắng" → hộp lịch → ⋯ dòng S → "Đổi tuần" → mở **panel phải "Xếp lại bài vắng"** phủ lên hộp vẫn đang mở; chữ menu "Đổi tuần" nhưng panel tên khác; ô tuần trong panel không có năm (C20).
- Bằng chứng: `kh-qt-hop-xeplai--hop`, `--menu`, `kh-qt-hop-xeplai`; `HopKyNang.tsx:291-293, 442-448` (`HopThaoTacMt trongHop` z-70 trên hộp z-60).
- Ảnh hưởng: 3 lớp chồng (trái "không panel lồng panel"); 6–7 thao tác.
- Phương án: dòng vắng trong hộp có nút "Xếp lại…" mở bộ chọn tuần NGAY TRÊN DÒNG (như "Đổi tuần" dòng thường), lưu bằng nút Lưu của hộp; panel riêng chỉ khi mở từ nơi không có hộp.

### TST-17 Khối 1 "Test quá hạn chấm": 8 nút chính giống nhau, chip "Chờ chấm" mọi dòng, một lớp 5 dòng
Loại [PHÁT HIỆN] · **P2** · QL
- Vấn đề: 8 dòng, 8 nút xanh "Nhập điểm", 8 chip "Chờ chấm" (không phân biệt); MB FT 101 chiếm 5 dòng (MT1·W1 JUL, MT1·W4 JUL, MT2·W2 AUG, MT2·W1 SEP, MT1·W1 SEP) với cùng 4 GV.
- Bằng chứng: `lt-qt-mb-k1`; `KhoiNo.tsx:132-139`.
- Phương án: gom theo lớp (một dòng "MB FT 101 · 49 ô · 5 đợt", mở ra từng đợt); nút làm việc dạng phụ (chỉ dòng của tôi là nút chính); bỏ chip "Chờ chấm" khi mọi dòng như nhau (QL), giữ "phần của bạn" cho GV.

### TST-18 375: hàng lọc + 3 ô chiếm nửa màn đầu; Kế hoạch Test không có dạng thẻ
Loại [PHÁT HIỆN] · **P2** · GV (Cô Linh), QL
- Bằng chứng: `lt-qt-mb-375-p1` (ô nhập đầu ở y ≈ 1 000 px; "Tuần này" một hàng riêng, công tắc khung 2 hàng), `lt-gv10-375-p1` (≈ 680 px trước lớp đầu), `kh-qt-375-p1` (toolbar 4 hàng ~280 px, bảng chỉ thấy MT1).
- Phương án: 375 gom Tuần + Khung + Lọc vào một hàng dính; bỏ dải 3 ô (TST-03); Kế hoạch Test 375 dùng thẻ học viên như mockup 4 khung 5.

### TST-19 "Tất cả" đôi và khung mặc định che việc FT của GV Speaking
Loại [PHÁT HIỆN] · **P3** · GV 9 (S)
- Vấn đề: hàng lọc GV 9 có "Tất cả | Fast Track | Lớp thường" sát "Lớp tôi dạy | Tất cả" — hai "Tất cả" khác nghĩa; mặc định "Lớp thường" nên bài S chấm chéo FT không thấy ở Test (chỉ thấy ở Công việc).
- Bằng chứng: `lt-gv9-p1`; `LichTestTab.tsx:168-175, 282-294`.
- Phương án: đổi nhóm thứ hai thành "Lớp của tôi · Mọi lớp"; khi GV có bài S chấm chéo thì khung mặc định "Tất cả".

### TST-20 Hồ sơ Mock: ba lối nhập điểm, nhận xét hai nơi, hai nút về cùng một hồ sơ
Loại [PHÁT HIỆN] · **P3** · GV, QL
- Bằng chứng: `mt-qt-171-p1/p2`, `mt-qt-171-375-p1` — ô lớn ("W1 Nhập · W2 Nhập"), bảng Lịch Test ("Nhập điểm / Sửa điểm"), nút đầu trang "Nhập điểm" (sang trang lớp); khối "Nhận xét" 4 ô + "Nhận xét *" trong hộp; "‹ Hồ sơ Lương Bảo Anh" và nút "Hồ sơ học viên"; "Lịch sử" vừa là tiêu đề vừa là nút.
- Phương án: nhập điểm chỉ qua ô lớn (hộp có nhận xét); bảng Lịch Test giữ thao tác lịch (⋯); bỏ nút "Hồ sơ học viên" (đã có ‹).

### TST-21 Mockup 2 bị bỏ: dải "Lớp xong · việc kế", "Mẫu" nhận xét
Loại [PHÁT HIỆN — tra mã] · **P3** · GV
- Vấn đề: mockup 2 khung 1e (dải "✓ MB FT 101 đủ điểm MT2 · Việc kế: … Mở ›" trên lưới) và chip "Mẫu" (3 câu gần nhất + "Như em trước") trong hộp nhập điểm không có trong `web/src/modules/cham` / `HopNhapDiem.tsx` (tìm "Việc kế", "Như em trước": 0 kết quả ngoài Công việc).
- Ghi chú: "Mẫu" nằm trong mục "Cần chủ SP chọn" của mockup 2 → chưa rõ đã duyệt; 1e là khuyến nghị (plan.md: "duyệt khuyến nghị").

### TST-22 Ba dạng mã tuần + chữ bị cắt
Loại [PHÁT HIỆN] · **P3** · mọi vai
- Bằng chứng: "W2 SEP" (lưới) · "W2 SEP/2026" (Kế hoạch) · "W2 SEP 2026" (tiêu đề Dán Excel `lt-qt-dan-p1`, tuần xa "W3 JAN 2027" `lt-qt-rong`); ô tuần cắt "W3 JAN 20…" (`lt-qt-rong`); cột Hạn chấm cắt "Nhập bù, không tính hạ" (`lt-qt-mo-ve--trang`).
- Phương án: một hàm định dạng tuần (ngắn / có năm theo C20); ô tuần đủ rộng cho năm; cột hạn xuống dòng.

### TST-23 "bài" hai nghĩa
Loại [PHÁT HIỆN] · **P3** · mọi vai
- "17/21 bài", "13", "Quá hạn chấm 58 bài" = ô điểm một kỹ năng; "Tạo bài kiểm tra", "Final Test" = cả bài kiểm tra. Phương án: dùng "ô" (hoặc "bài · kỹ năng") cho đơn vị chấm, "bài kiểm tra" cho bài.

### TST-24 Hộp / khung ba dáng trong cùng một lưới
Loại [PHÁT HIỆN] · **P3** · QL
- Hộp lịch neo chip (không nền mờ ở 375, có thể đè thanh trên `kh-qt-hop-vang`) · hộp "Đã huỷ" giữa màn có nền mờ (`kh-qt-hop-huy`) · panel phải (TST-16). Cùng lưới, ba kiểu đóng/mở. Phương án: hộp neo cho mọi thao tác một em × một đợt.

### TST-25 Xếp lịch Test lớp thường khác dáng panel FT
Loại [PHÁT HIỆN] · **P3** · QL
- Ngăn phải (lớp thường) vs toàn màn (FT); "Tuần chung" ở trên (FT) vs "Áp một tuần cho mọi môn" ở dưới (lớp thường); mở sẵn lớp đã hết khoá, tuần đã qua (`kh-qt-mb-thuong-xep`). Phương án: một khung, cùng thứ tự Lớp → Đợt → Tuần → Học viên.

### TST-26 Số và tóm tắt lệch nhỏ ở Kế hoạch Test
Loại [PHÁT HIỆN] · **P3** · QL
- Lọc "Cần xếp lại (5)" chỉ hiện 5 em nhưng vẫn ghi "38 học viên" (`kh-qt-mb-canxeplai-p1`); "MT1 đang thi" cho lớp FT có em ở MT1–MT3; "MB FT 104 · 0 HV" vẫn trong danh sách; "MT4 · chưa xếp" bấm được và không bấm được trông như nhau (`LuoiKeHoach.tsx:128-133`); header lớp "MT2 chưa xếp 1 em" vs tab Xếp theo học viên "Chưa có MT tiếp 2".

### TST-27 Tên học viên không xếp theo ABC tiếng Việt
Loại [PHÁT HIỆN] · **P3** · mọi vai
- Thứ tự DOM: Bùi, Chu, **Hoàng, Hà**, Hà, Hồ… Lương sau Lý, Ngô sau Nguyễn, **Tô, Tạ sau Trịnh**, Đoàn / Đặng / Đỗ cuối. Nguyên nhân: `ORDER BY s.full_name` theo byte (`server/src/keHoach/keHoachTest.ts:288`). Phương án: sắp ở web bằng `localeCompare(…, 'vi')` (đã dùng ở `NganXepLichMt.tsx:105`).

### TST-28 Nghi lỗi "hàng xuất hiện hai lần" ở MB FT 101 — KHÔNG phải lỗi web
Loại [XÁC NHẬN-ẢNH 12a → kết luận: lỗi ghép ảnh] · **P3 (thông tin)**
- DOM: 33 hàng, 33 tên khác nhau, 0 trùng (`a4-dom.mjs`, `kh-qt-mb-101-p1/p2`). DB: 33 ghi danh active, 33 HV khác nhau, không trùng tên.
- 6 tên chủ SP thấy lặp (Hoàng Bảo Ngọc → Kiều Minh Đức) là 6 hàng LIÊN TIẾP vị trí 3–8 → khớp vùng chồng mép khi công cụ chụp toàn trang ghép lát (đầu bảng dính khi cuộn làm lệch mép ghép). Không cần sửa web; nhắc chủ SP chụp bằng "lát" thay vì ghép.

---

## Phần 3. Đề xuất lớn

### Đ1. Lịch Test = hàng đợi chấm gọn
- **Hiện trạng:** 3 ô số + 3 khối; lớp còn bài tự mở lưới đủ 10 cột, mọi em; ↗ sang trang riêng theo tuần; QT/QL 2 172 px (khối 3 mở: 5 476 px).
- **Đề xuất:** bỏ dải 3 ô (số + đơn vị ở đầu khối); khối 1 gom theo lớp; lưới mở ra chỉ em còn ô trống + cột còn nợ + Kết quả, nút "Cả lớp"; một lớp mở một lúc; khối 3 không tự mở; ↗ mở panel "Nhập điểm lớp" (Đ3); bỏ "Tạo bài kiểm tra…".
- **Số bước:** QL tìm ô còn trống tuần này: cuộn ~2,4 màn + đọc 141 nút → 1 màn, ~40 nút. GV nhập một lớp: 2 bấm → 2 bấm (không đổi). QL từ khối 1 vào lưới đầy đủ rồi về: 3 bấm + mất chỗ → 2 bấm, không mất chỗ.
- **Rủi ro:** người quen xem điểm cả lớp ở Lịch Test cần bấm "Cả lớp"; chế độ gọn dùng tham số sẵn có (`chiCot`, `chiAttempt`) nên rủi ro mã thấp.
- **Chủ SP quyết:** bỏ dải 3 ô (đã có trong mockup duyệt 06/10); lưới gọn ẩn W / Kỳ vọng / Overall ở Lịch Test (mockup 2 / 6 vẽ đủ cột).

### Đ2. Kế hoạch Test đúng mockup 4
- **Hiện trạng:** chip "L R W S · trạng thái · tuần/năm" 9 trạng thái, chú giải sai, "vào muộn", 375 bảng cuộn ngang.
- **Đề xuất:** ô theo mockup 4 khung 1 (tuần + một chữ trạng thái, kỹ năng chỉ khi tách tuần); email dưới tên; đầu lớp GVCN · khai giảng; chú giải sinh từ bảng màu (một nguồn) hiện thành dải nhỏ; dòng vắng xếp lại ngay trong hộp (bỏ panel chồng); lý do "Không xếp được" trên hàng; 375 thẻ học viên (khung 5).
- **Số bước:** QL dời một em vắng: 6–7 thao tác, 3 lớp chồng → 4–5, 1 lớp. QL đọc trạng thái một em: giải mã 2–4 ký hiệu → đọc 1 chữ.
- **Rủi ro:** đổi chip ở mọi nơi dùng `ChipDotFT` (hồ sơ HV › Lộ trình) — làm cùng lúc.
- **Chủ SP quyết:** năm "/2026" ở mọi ô (C20) hay chỉ đầu cột / khi khác năm.

### Đ3. Một "Nhập điểm lớp", một "Xuất điểm Test"
- **Hiện trạng:** trang `/nhap-diem` theo tuần + panel theo lượt; 3 panel xuất (2 cho điểm).
- **Đề xuất:** mọi lối nhập điểm cả lớp mở panel theo lượt (mockup 2 khung 1b / 4), route cũ chuyển hướng; một panel "Xuất điểm Test" (mockup 6 khung 9 + khung + "Chỉ lượt đủ điểm") ở cả hai tab; nút lịch ghi "Xuất lịch Test"; người chấm S mặc định một luật.
- **Số bước:** QL xuất điểm một lớp: 6–8 (Lịch Test) hoặc 4–6 (Kế hoạch) → 4 ở cả hai nơi. GV học giao diện: 2 lưới → 1.
- **Rủi ro:** link / bookmark `/nhap-diem` — giữ bằng chuyển hướng; phép kiểm cũ đọc trang tuần phải sửa.
- **Chủ SP quyết:** bỏ trang theo tuần.

### Bước so sánh 6 việc (trước → sau)

| Việc | Trước (đo trên demo) | Sau đề xuất |
|---|---|---|
| QL xếp MT tiếp cho cả lớp | Kế hoạch Test (2) · Xếp nhiều MT (1) · chọn lớp (2) · chỉnh tuần (1–3) · Xếp (1) = 7–9 + rê chuột đoán 23 lý do | 5–6, lý do + tuần gợi ý trên hàng |
| QL xếp MT cho một em vào muộn | gõ tên + Enter (2) · bấm chip (1) · tuần (0–2) · Lưu (1) = 4–6 | giữ; bỏ chữ "vào muộn" |
| QL dời lịch một em vắng | Cần xếp lại (1) · chip (1) · ⋯ (1) · Đổi tuần (1) · tuần (1–2) · Xếp lại (1) = 6–7, 3 lớp chồng | 4–5, chọn tuần trên dòng, Lưu của hộp |
| GV nhập Progress Test cả lớp | Test (1) · bấm ô (1) · gõ + Enter… (lưới lẫn em đã xong, 20 ô / lớp) | 2 bấm, chỉ ô còn trống |
| GV dán điểm Excel | Dán (1) · Ctrl V (1) · nhóm nguyên nhân (k) · Lưu (1); W/S phải nối 4 tiêu chí vào 1 ô | như cũ + nhận 4 cột tiêu chí; ô lỗi không chặn cả dòng |
| GV S chấm chéo | Công việc → Chấm Speaking (1) · ô (1) · Enter = em tiếp ✓ (tốt); từ Test: đổi khung + tìm lớp + mở (3–5) | thêm hạn / quá hạn từng em; người chấm mặc định chính GV |
| QL xuất điểm Test một lớp | 2 panel khác nhau, 4–8 thao tác | 1 panel, 4 thao tác |

---

## Phần 4. Câu hỏi cho chủ SP + ảnh cần thêm

**Câu hỏi (mỗi câu một khuyến nghị):**
1. **Bỏ dải 3 ô đầu Lịch Test** (mockup ba-khối 06/10 đã duyệt có dải này)? Khuyến nghị: bỏ, số có đơn vị ở đầu khối.
2. **Lưới gọn ở Lịch Test:** chỉ em còn ô trống + cột còn nợ, ẩn W / Kỳ vọng / Overall (xem đủ bằng "Cả lớp")? Khuyến nghị: có. (W1, W2 vẫn là ô nhập theo luật; W chỉ đọc nên ẩn được ở chế độ gọn.)
3. **Năm "/2026" (C20):** giữ ở mọi ô Kế hoạch Test (108 lần một lớp) hay chỉ ở đầu cột / khi khác năm? Khuyến nghị: chỉ khi khác năm + đầu cột.
4. **"vào muộn":** bỏ, thay email dưới tên (mockup 4)? Khuyến nghị: bỏ.
5. **Dán Excel W/S:** nhận 4 cột tiêu chí liền nhau (thêm), giữ dạng "4 số một ô"? Khuyến nghị: nhận cả hai; ô lỗi chỉ chặn ô đó.
6. **Người chấm S khi QL / QT nhập hộ:** mặc định "chưa chọn" và bắt chọn? GV có kỹ năng S: mặc định chính mình ở mọi lối? Khuyến nghị: có.
7. **Lớp thường Progress:** hiện chip SOS (§20.17) thay "3/4 môn đạt"? Khuyến nghị: có — luật đã chốt, web chưa theo.
8. **Bỏ trang `/nhap-diem` theo tuần**, dùng panel theo lượt cho mọi lối? Khuyến nghị: có.
9. **Gộp "Xuất kết quả Test" vào "Xuất điểm Test"** (một panel, hai tab đều mở)? Khuyến nghị: có.
10. **"Mẫu" nhận xét** (mockup 2, mục "Cần chủ SP chọn") — làm hay bỏ hẳn? Chưa thấy quyết định ghi lại.

**Ảnh cần thêm (CẦN ẢNH):**
- Bản chính, vai QT, **Test › Lịch Test / Chấm Test**, chi nhánh có nhiều lớp nhất, **bấm mở khối "Lịch Test tuần này"** → chụp từng màn (không ghép) để đo độ dài thật.
- Bản chính, vai QL, **Kế hoạch Test › lớp FT đông nhất mở**, trên **điện thoại thật** (375) — thanh lọc + cuộn ngang.
- Bản chính, GV nước ngoài (S), **Công việc › Chấm Speaking**: có em quá hạn không, người chấm hiện gì sau khi lưu.
- Ảnh 12a: chủ SP chụp lại MB FT 101 bằng từng màn (không ghép) để xác nhận không có hàng trùng (TST-28).

---

## Phần 5. Ảnh tiêu biểu

1. `SCR\anh\a4\lt-qt-mb-p1.png` — Lịch Test QT: 3 ô trùng đầu khối, khối 2 mở lưới đủ cột (TST-01, TST-03).
2. `SCR\anh\a4\lt-qt-mb-p2.png` — lưới lớp thường: "Nhận xét" × 20, "Điền cả cột", "3/4 môn đạt" đỏ, "Tạo bài kiểm tra…" (TST-08, 09, 10).
3. `SCR\anh\a4\lt-qt-k3-p3.png` — mở khối 3: trang 5 476 px, lưới mọi lớp (TST-01).
4. `SCR\anh\a4\mk-ltbk--k1.png` — mockup ba-khối đã duyệt: lưới gọn chỉ cột / em còn nợ (so với 1).
5. `SCR\anh\a4\kh-qt-mb-101-p1.png` — Kế hoạch Test: chip "L R W S · …/2026", "vào muộn" (TST-06, 07).
6. `SCR\anh\a4\mk4-kh-p1.png` — mockup 4 đã duyệt: ô tuần + "Đã thi", email dưới tên, đầu lớp có GVCN (so với 5).
7. `SCR\anh\a4\kh-qt-mb-luat.png` — ⓘ chú giải màu sai (TST-05).
8. `SCR\anh\a4\nd-qt-ft.png` — trang Nhập điểm theo tuần (13 cột) (TST-02).
9. `SCR\anh\a4\lt-diemlop-cu.png` — panel Nhập điểm theo lượt, tiêu đề thiếu mã lớp (TST-02).
10. `SCR\anh\a4\lt-qt-xuat.png` — "Xuất kết quả Test" ở Lịch Test (so với `kh-qt-mb-xuatdiem.png`) (TST-04).
11. `SCR\anh\a4\lt-qt-dan-p1.png` — Dán từ Excel: lỗi W1 "Dán 4 tiêu chí" chặn cả dòng (TST-13).
12. `SCR\anh\a4\kh-qt-hop-xeplai.png` — panel "Xếp lại bài vắng" chồng lên hộp lịch (TST-16).

---

### Nền tốt — giữ
Trạng thái lưu từng ô + "Lưu lại"; hộp nhập điểm MT (Enter = em tiếp, Esc, "Bỏ · Gõ tiếp", nhận xét / nhóm nguyên nhân bắt buộc, "Đã chấm bởi … lúc …"); Dán từ Excel (xem trước, ghi đè trước → sau, trùng tên chọn em, Hoàn tác); Xóa lịch = bỏ tuần, mờ + lý do khi có điểm, Hoàn tác; tìm lớp / em / email chọn là cuộn tới hàng; hàng đợi Chấm Speaking; 375 một kỹ năng một lúc; aria-label ô điểm; link sâu `?classId&kn`.
