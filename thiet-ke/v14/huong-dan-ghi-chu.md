# v14 · Hướng dẫn (HD-V2) — ghi chú mockup

Đặc tả: `docs/superpowers/specs/2026-11-05-huong-dan-v2/de-xuat.md`. Mockup: `thiet-ke/v14/huong-dan.html`. Ngày 05/11/2026. Mã đối chiếu: main `a72a8012d`.

## 1. Đối chiếu bảng "Lối chính theo vai" (đặc tả mục 4) với mã main

✓ = khớp mã · ✎ = lệch, đã sửa trong mockup · ? = chưa chắc, builder bấm thử.

| # | Vai · việc | Đặc tả ghi | Mã main | Kết luận |
|---|---|---|---|---|
| 1 | GV · nhập điểm | Công việc › "Nhập điểm {môn}" | nhóm **Chấm điểm**, dòng "Nhập điểm Listening, Reading", nút **Nhập điểm** (`mywork.ts` `score`, v12) | ✓ |
| 2 | GV · lối tắt nhập điểm | Lịch Test tuần, Test › Chấm Test, Hồ sơ lớp › Nhập điểm, ⋯ dòng em, hồ sơ lượt | tab Test: **Chấm Test · Lịch Test tuần · Kế hoạch Test** (`TAB_TEST_LABEL`); ⋯ dòng em "Nhập điểm {đợt}" (`thaoTacDongHocVien`) | ✓ |
| 3 | GV Speaking · chấm chéo | Công việc › "Chấm Speaking · n bài" | dòng **Chấm Speaking · n bài** nằm ở nhóm riêng **Speaking chấm chéo** (`DanhSachViec` T03), KHÔNG ở nhóm Chấm điểm. Hướng dẫn cũ (`gv.ts` "đầu nhóm Chấm điểm") sai | ✎ ghi "nhóm Speaking chấm chéo" |
| 4 | GV · Case | Công việc › nhóm "Case học thuật" | nhóm **Case học thuật**; dòng: Xác nhận Case · Mô tả Case · Xác nhận PA · Thêm PA học thuật · Ghi kết quả PA | ✓ |
| 5 | GV · xem mọi Case | Hồ sơ HV › tab Học thuật › **Case và phương án** | khối tên **Case & phương án** (`CotCaseHv`) | ✎ "Case & phương án" |
| 6 | GV · tạo Case tay | Hồ sơ HV › "**+ Case**" | nút **+ Case cho {kỹ năng}** (vd "+ Case cho Reading") | ✎ |
| 7 | Hoàn thành · Mở lại · Xoá | trong panel Case | **Hoàn thành Case** · **Mở lại** · **Xoá Case** · **Đổi người…** (`NganCase`) | ✓ |
| 8 | GVCN · MT cũ | Công việc › "Nhập điểm MT cũ" | dòng **Nhập điểm MT cũ** ở nhóm **Thiếu dữ liệu đánh giá**, nút Nhập điểm; Lịch Test tuần link **MT cũ chưa nhập · {lớp}** | ✓ |
| 9 | GVCN · Mini Test | Công việc › "Ghi Mini Test" · lối tắt Hồ sơ HV › Học thuật › ô Mini Test | dòng **Ghi Mini Test** ✓; ở hồ sơ là nút **Ghi Mini Test** trong khối kết luận khoá (`KetLuanKhoa`), không phải "ô" | ✎ "nút Ghi Mini Test" |
| 10 | GVCN · đổi người phụ trách | lối tắt Công việc › "Chọn người phụ trách" | dòng này là việc **chưa có chủ** (`no_owner`, `mine: false`) — QL thấy; GVCN không chắc thấy | ? bỏ khỏi lối tắt GVCN tới khi builder kiểm |
| 11 | GVCN · kết quả thi thật | Hồ sơ HV › ⋯ › Kết quả thi thật | panel **Kết quả thi thật** mở từ hồ sơ (`StudentManagePanel`) và `?viec=thi-that`; tên nút ⋯ chưa kiểm | ? |
| 12 | GVCN · lối tắt thi thật | Hành trình › Tổng kết lộ trình | tab hồ sơ tên **Lộ trình & lớp** (`HO_SO_TAB_LABEL`), ngăn **Tổng kết lộ trình** | ✎ "Lộ trình & lớp" (hướng dẫn TVV cũ còn ghi "Hành trình") |
| 13 | QL · duyệt | Công việc › "Chờ bạn duyệt" | nhóm **Chờ bạn duyệt** + "Mở hộp duyệt ›" | ✓ |
| 14 | QL · nhập hộ | Tổng quan › "Bài chấm quá hạn" › Nhập hộ | cột **Bài chấm quá hạn** ở bảng GV Tổng quan (`TongQuanV5`); nút **Nhập hộ** có ở Công việc / lưới | ? builder bấm thử số → panel có Nhập hộ (V11 `kemViec`) |
| 15 | QL · xếp / dời MT | Test › Kế hoạch Test | ✓ | ✓ |
| 16 | QL · điểm tuần | Test › Lịch Test tuần | ✓ (QL không có tab Chấm Test: `!testPlan`) | ✓ |
| 17 | QL · khôi phục | Quản trị › Đã xoá | QL không có `nav.admin`: vào bằng menu Tài khoản › **Bảng quy đổi band** → tab **Đã xoá** (`AdminPage`, tiêu đề "Quản trị") | ✎ ghi "Tài khoản › Bảng quy đổi band › Đã xoá" — **PTA xem: lối này khó tìm** |
| 18 | TVV · thi thật | Công việc › "Cập nhật kết quả thi thật" | nhóm TVV **Sau thi** (`NHOM_CV_TVV_LABEL`: Báo PH · Sau thi · Chốt ngày thi · Bổ sung hồ sơ), dòng **Cập nhật kết quả thi thật** / **Chọn bước tiếp** | ✓ ghi rõ nhóm "Sau thi" |
| 19 | TVV / CX · xem Case | Hồ sơ HV › Case và phương án | **Case & phương án** | ✎ như #5 |
| 20 | Admin · chấm | Công việc › nhóm Chấm điểm | Admin: tab Công việc tên **Chấm điểm** (`nhanTabCongViec`) | ✓ |
| 21 | Thanh trên | "?" bên trái chuông | `Header.tsx`: ô Tìm · Thông báo · Tài khoản; "Hướng dẫn" đang ở menu Tài khoản | ✓ (mockup: Tìm · **?** · chuông · tên) |

**Chỗ lệch lớn với đặc tả mục 8 (cần PTA chốt):**
- **K1 · Case ở Hồ sơ HV không phải panel nổi.** Từ U02, Case mở NGAY TRONG CỘT "Case & phương án" của hồ sơ (`CotCaseHv` → `NganCase` trong `KhungTrongCot`); panel Case nổi chỉ có khi mở từ Công việc, chuông, ô số. Mockup trạng thái 2 vẽ đúng mã: hồ sơ HV có Case đang mở trong cột → bấm "?" → Hướng dẫn mở như mọi panel (nền mờ phủ trang, Case còn nguyên bên dưới, chữ đang gõ còn). Tab Màn này vẫn đưa mục **Case** lên trước (thuộc tính `hd="case"` đặt được cả cho `KhungPanel` trong cột). Không đổi gì ở đặc tả, chỉ đổi chữ "panel Case" → "Case đang mở".
- **K2 · Hướng dẫn cũ đã lệch web** (đặc tả mục 1 đã nói): `gv.ts` còn ghi "Test › Chấm Test" là lối chính, "đầu nhóm Chấm điểm" cho Speaking, "Menu Tài khoản › Hướng dẫn"; `tvv.ts` ghi tab "Hành trình". PR (a)/(c) sửa theo bảng trên.

## 2. Bảng ý → mockup

Trạng thái mockup: **A** GV · Lịch Test tuần · Màn này · **B** QL · Hồ sơ HV · Case đang mở → "?" · **C** Tôi muốn… gõ "nhập điểm" · **D** TVV · Tuần của tôi · **E** màn chưa có mục riêng · **F** 375. Mỗi trạng thái vẽ 1440 tối + 375 sáng (A, B, C, D); E 1440 tối + sáng; F 375 sáng + tối.

| Ý (đặc tả) | Trạng thái thể hiện |
|---|---|
| 3.1 nút "?" thanh trên, trái chuông, tròn, nhãn đọc "Hướng dẫn" | mọi khung (thanh trên) |
| 3.1 375 cùng chỗ, vùng bấm 44 px | F, mọi khung 375 |
| 3.1 chấm nhỏ khi chưa mở lần nào, không tự mở | F1 (chưa mở: chấm trên "?", trang bình thường) → F2 (đã mở: hết chấm) |
| 3.1 bỏ "Hướng dẫn" khỏi menu Tài khoản | F3 · menu Tài khoản (không còn mục Hướng dẫn) |
| 3.2 panel phải `KhungPanel` 480, đầu "Hướng dẫn" + vai | A, B, C, D, E |
| 3.2 QL / QT có "Xem vai khác" | B (QL) |
| 3.2 ô tìm, 3 tab, tab Màn này mở sẵn | A, B, E (tab Màn này) |
| 3.2 tìm lọc cả 3 tab → một danh sách | C |
| 3.2 cuối panel "Mở trang Hướng dẫn ›" | A, B, C, D, E |
| 3.3 khối 1 "Bạn đang ở": tên màn + 1 câu + Trước → Màn này → Sau (bấm được) | A, B |
| 3.3 khối 2 "Việc làm ở đây": gập/mở, 2–4 bước, nhãn đậm, Chỉ cho tôi, việc đầu mở | A, B |
| 3.3 dòng nhạt "Lối chính: Công việc › Nhập điểm. Ở đây mở cùng ô điểm." | A (việc đầu) |
| 3.3 khối 3 "Không làm ở đây": link đúng chỗ / chữ nhạt "việc của QL" | A (có "việc của QL"), B (link) |
| 3.3 màn chưa có mục: 1 câu + mở sẵn Tôi muốn… | E |
| 3.4 nhóm Điểm · Case và PA · Học viên và lớp · Lịch Test · Duyệt · Khác, nhóm trống ẩn | C (kết quả tìm vẫn ghi nhóm), E (danh sách đầy đủ GV) |
| 3.4 mỗi việc: Lối chính (Đi tới › + Chỉ cho tôi) · 2–4 bước · "Lối tắt: … — mở cùng chỗ" | C (việc mở) |
| 3.5 Tuần của tôi: nhịp chữ nhạt · tên việc · bấm mở mục Tôi muốn…, không lặp bước | D |
| 3.6 nhãn "Chỉ GVCN" / "GV Speaking" | A (việc MT cũ: GVCN), C (Chấm Speaking: GV Speaking), E |
| 3.6 QL xem vai khác thấy cả phần GVCN + S có nhãn | (ghi ở B: nút Xem vai khác; không vẽ riêng — cùng khung C) |
| 8 "?" khi đang mở Case: chồng lên, Esc / ✕ chỉ đóng hướng dẫn, mục của Case trước rồi màn nền | B |
| 8 Chỉ cho tôi: đóng hướng dẫn rồi khoanh | A2 (sau bấm Chỉ cho tôi: khoanh dòng lớp ở Lịch Test tuần + chú thích một dòng) |
| 8 không phím tắt "?" | không vẽ (không có gì để vẽ) |
| 2 "GV không thấy việc QL như việc mình" | A ("Xếp / dời MT — việc của QL" chữ nhạt, không link) |
| 3.8 chữ ít, mỗi bước ≤ 1 câu, đúng nhãn web | mọi khung; bảng mục 1 |
| 7.6 375 panel toàn màn | F2, khung 375 của A–D |

## 3. PTA chốt 05/11 (trả lời bảng trên)
1. **K1 đồng ý** — trạng thái B vẽ đúng mã: Case mở trong cột "Case & phương án", bấm "?" → Hướng dẫn mở như mọi panel, Case (và chữ đang gõ ở ô Ghi kết quả) còn nguyên dưới nền mờ. Chữ khối 1: "Bạn đang ở **Case đang mở** · trên Hồ sơ học viên"; mục **Case** lên trước, rồi **Hồ sơ học viên**. → PTA sửa đặc tả mục 8 sau ("panel Case" → "Case đang mở", `hd="case"` đặt được cho `KhungPanel` trong cột).
2. **Trước / Sau của GV ở Lịch Test tuần:** Trước = **Kế hoạch Test** (GV chỉ đọc) · Sau = **Công việc › Case học thuật** (ghi rõ đích).
3. **QL khôi phục (bản cuối, chủ SP 05/11 duyệt):** menu Tài khoản của QL / QT có mục **Đã xoá** (mở thẳng tab Đã xoá), đúng chỗ mục "Hướng dẫn" bỏ đi — session DA-XOA-MENU làm trên web. Lối chính "Khôi phục thứ đã xoá" = **Tài khoản › Đã xoá**; lối tắt: Bảng quy đổi band › tab Đã xoá; ngay sau xoá: **Hoàn tác** (5 giây). Mockup: B bước 3 "xoá nhầm: **Hoàn tác** trong 5 giây" + Không làm ở đây "Khôi phục Case đã xoá → Tài khoản › Đã xoá ›"; F3 vẽ menu Tài khoản của QL (Hồ sơ cá nhân · **Đã xoá** · Bảng quy đổi band · Giao diện · VI/EN · Đăng xuất). (Thay bản trước "Tài khoản › Bảng quy đổi band › Đã xoá".)
4. **Bỏ lối tắt "Chọn người phụ trách" của GVCN.** Hai mục để builder bấm thử ở PR (a)/(b): (#14) Tổng quan › số "Bài chấm quá hạn" → panel có **Nhập hộ**; (#11) tên nút mở **Kết quả thi thật** ở Hồ sơ HV.

## 4. Quyết định nhỏ của builder (ghi lại)
- Trước / Sau chỉ có ở **màn** (trang). Panel đang mở (Case) không có Trước / Sau — chỉ "trên {màn nền}".
- Tab của panel = hàng tab gạch chân (`HangTab`), không thêm dáng mới. Danh sách việc ở cả 3 tab cùng một kiểu dòng gập / mở (G4 "một danh sách một kiểu mở").
- Dòng gập ở Tôi muốn… có chữ nhạt dưới tên = **lối chính** (biết "ở đâu" không cần mở). Mở ra: ô **Lối chính** + **Đi tới ›** (đổi trang) · bước · **Lối tắt** · **Chỉ cho tôi**.
- Màn lối tắt (vd Lịch Test tuần): việc mở có dòng nhạt "Lối chính: Công việc › Nhập điểm ›. Ở đây mở cùng ô điểm." — sinh từ `loiTat` (đặc tả 9.5).
- Đang gõ ô tìm: hàng tab giữ nguyên, thân panel thành một danh sách việc khớp (gộp cả 3 tab, bỏ trùng), có nhóm, chữ khớp tô hồng (như ô tìm thanh trên — V14), đầu danh sách "n việc khớp". Xoá chữ (✕ trong ô) → về tab đang chọn.
- Tuần của tôi (bản 3b): nhóm theo nhịp, dòng gập có chữ nhạt = lối chính; bấm dòng mở ngay tại chỗ (Lối chính + bước), như Tôi muốn….
- QL / QT: ô chọn "**Vai: Quản lý** ▾" thay chip vai (một ô vừa nói vai đang xem vừa đổi được — "Xem vai khác" là tên đọc màn hình). Vai khác: chip vai chỉ đọc.
- Nhãn "Chỉ GVCN" / "GV Speaking": thẻ viền đứt nhỏ cuối dòng (khác thẻ lượt nền nhạt); chỉ hiện khi đúng vai (đặc tả 3.6) hoặc QL xem vai GV.
- Chấm trên "?": chấm trắng 8 px viền màu thanh (cùng họ chấm chuông — trắng trên nền xanh), không hồng (hồng chỉ để nhận diện, V2).
- Nút "?" khi panel mở: nền sáng hơn (`aria-expanded`). Ở 1440 nền mờ phủ cả thanh trên (KhungPanel `fixed inset-0`), như mọi panel.

- Dòng nhạt dưới tên việc khi gập = **luôn là đường lối chính** (không tiền tố), ở cả 3 tab. Việc chỉ làm ở chính màn này (vd Đổi người phụ trách trong Case) thì không có dòng nhạt.
- Tìm không ra việc của vai này → vẫn chỉ chỗ: nhóm "Việc của vai khác" (chữ nhạt "việc của QL", không link) + nút **Xem mọi việc của bạn** (về Tôi muốn… đủ). Thật sự không có gì thì chỉ câu + nút.

## 3b. PTA chốt sau rà ảnh #999 (05/11)
1. **Thêm F0** (1440 tối + sáng): panel đóng, thanh trên có **"?"** cạnh chuông, có chấm (chưa mở lần nào) — yêu cầu chính của chủ SP phải thấy rõ ở 1440.
2. **[XM-1] đồng ý:** tìm theo từ đồng nghĩa (mỗi việc khai vài từ: "đổi lớp" ↔ Chuyển lớp, "sửa điểm"…) + việc của vai khác hiện trong kết quả tìm, một dòng "Chuyển lớp — việc của QL". PTA thêm vào đặc tả.
3. **[XM-2] Tuần của tôi MỞ TẠI CHỖ:** nhóm theo nhịp (Mỗi sáng · Khi có · Khi gia đình báo · Trước khi em thi · Sau khi em thi), mỗi việc một dòng gập / mở như Tôi muốn… (mở ra: Lối chính + bước); bỏ mũi tên nhảy tab. Lý do: xử lý tại chỗ + một danh sách một kiểu mở. (Thay đặc tả 3.5 — PTA sửa đặc tả.)
4. **[XM-3]** "Không làm ở đây" không lặp đích đã có ở Sau — A bỏ dòng "Xác nhận Case, PA · ghi kết quả", thay "Xem điểm cả lớp qua các lượt → Hồ sơ lớp ›".
5. **P2:** giữ ô **Lối chính** một dáng ở cả 3 tab (thay "dòng nhạt" đặc tả 3.3) — đồng ý.

## 4b. [XM] đã gửi PTA (trả lời ở 3b)
- **[XM-1] Tìm theo từ đồng nghĩa và việc vai khác** (C2): gõ "đổi lớp" ra "Chuyển lớp một em — việc của QL". Đặc tả 3.2 chỉ giữ `locHd` (bỏ dấu). Muốn có: thêm trường `tuKhac` cho mỗi việc + đọc cả việc của vai khác (chỉ tên + "việc của …", không bước). Chữ khớp qua từ đồng nghĩa KHÔNG tô hồng. Không thì C2 chỉ còn câu "Không có việc nào khớp" + Xem mọi việc.
- **[XM-2] Tuần của tôi** giữ đúng đặc tả 3.5 (bấm dòng → tab Tôi muốn…, mở đúng việc). Bản rà critique đề xuất cho dòng gập / mở tại chỗ (chỉ ô Lối chính) cho cùng kiểu với hai tab kia, đỡ một bước — PTA xem.
- **[XM-3]** Sau của Lịch Test tuần ("Công việc › Case học thuật") trùng đích với dòng "Xác nhận Case, PA · ghi kết quả" ở Không làm ở đây — giữ cả hai theo PTA chốt; bỏ một nếu PTA thấy thừa.

## 4c. `impeccable critique` (A = rà thiết kế, subagent riêng · B = detector)
| Vòng | Điểm | P0 / P1 | Đã sửa sau vòng |
|---|---|---|---|
| 1 | 27/40 | P0 1 · P1 2 | P0 "Sửa điểm đã có — việc của QL" sai luật N3 (GV sửa được ô của mình) → bỏ · một lối chính một chữ một dáng ("Công việc › Chấm điểm", ô Lối chính ở mọi tab) · Trước / Sau không vòng (Công việc chỉ có Trước) · thêm C2 tìm không ra · E có "Bạn đang ở Phân tích" · Tuần có mũi tên vẽ · vùng bấm 44 px · chữ khớp tìm dùng `--hong-chu` / `--hong-nen` như web (B: hồng trên nền sáng 2,9 : 1) · h3 cho nhóm |
| 2 | 28/40 | P1 1 | C2 chỉ việc vai khác ("Chuyển lớp — việc của QL") · bước Hoàn thành Case đúng điều kiện máy chủ (chọn hướng xử lý, ghi kết luận) · ô Vai 44 px ở 375 · tên việc thống nhất |
| 3 | 30/40 | P1 2 | "Tạm dừng/ Kết thúc học" (N11, đúng nút web; trước ghi sai "Tạm dừng / Thôi học") · thêm việc TVV **Chốt ngày thi** (N6) · dòng nhạt = luôn đường lối chính |
| 4 | **32/40** | **0 · 0** | QL: "Công việc › **Của GV** › Case học thuật" (Công việc QL mặc định Của tôi) · nhãn vai viền liền |

Cổng (luật 28/10): đã chạm 30, sau đó không còn P0 / P1 → dừng. Sửa 3b sau đó chỉ đổi theo chốt PTA (không chấm lại). Detector (B) vòng 2–3: chỉ còn phát hiện đúng hệ thiết kế (vạch trái 3 px, khung không đệm, Inter cho chữ số, bóng hộp nổi).
P2 / P3 còn lại (không sửa, ghi để PTA biết): ô Lối chính ở màn lối tắt nặng hơn "dòng nhạt" đặc tả 3.3 (giữ ô để một dáng ở cả 3 tab — vòng 1 rà đòi thống nhất; PTA chọn) · ở 1440 nền mờ che trạng thái nút "?" (đúng `KhungPanel`) · chữ "ô điểm" là từ trong nhà · Speaking chấm chéo ở F1 có "⚠ 1 quá hạn" — giữ như web hiện tại (`DanhSachViec`, v12).
F3: QL Vy không dạy lớp nên menu không có "Hồ sơ giáo viên"; QL có dạy thì có, như web.

## 5. Ảnh (thiet-ke/v14/anh/)
Chụp bằng Chrome headless từ chính tệp mockup (`huong-dan.html?k={khung}&n={toi|sang}`), phông Be Vietnam Pro đã nạp (`document.fonts.check('600 15px "Be Vietnam Pro"', 'ợ')` = true).
A1 `a1-1440-toi` · `a1-375-sang` · A2 `a2-1440-toi` · B `b-1440-toi` · `b-375-sang` · C `c-1440-toi` · `c-375-sang` · C2 `c2-375-toi` · D `d-1440-toi` · `d-375-sang` · E `e-1440-toi` · `e-1440-sang` · F0 `f0-1440-toi` · `f0-1440-sang` · F `f1-375-sang` · `f2-375-toi` · `f3-375-sang`.
