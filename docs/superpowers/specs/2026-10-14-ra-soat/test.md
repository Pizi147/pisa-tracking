> Phụ lục rà soát 13–14/10 (báo cáo agent, planning đã đối chiếu các mục chặn). Đường ảnh `$SP/anh/...` chỉ có trên máy planning — tái hiện theo bước ghi trong mục.

# Rà chức năng — khu TEST / CHẤM ĐIỂM (agent N=4, mã TE)

Môi trường: web http://127.0.0.1:5514 · API 4414 · DB riêng a4.sqlite · ngày demo 14/09/2026 (W3 SEP) · bản build main.

## Đã đi (cập nhật dần)

| Trang | Vai | Thao tác đã thử |
|---|---|---|
| /test/lich (1440 tối) | QL, GVBM, GVW, GVCN | dải số, khối 1/2/3 (mở/thu), lưới dưới dòng khối 1 + "Lưu · em tiếp", công tắc FT / Lớp thường, lùi W2 SEP / tiến W4 SEP, "Lớp tôi dạy / Tất cả", dòng nhắc MT cũ |
| API /cham/lich-test (+ periodId=40, classId=6) | QL, QT, GVCN, GVBM, GVW, ADMIN, user 8 | so dải số / khối / nhãn "phần của bạn" / "Quá hạn" chỉ ô người xem |
| Hộp nhập điểm (Lịch Test, Điểm theo lớp) | QL, GVCN, GVBM, GVW | L số câu + lỗi 45 giữ chữ, Enter → em tiếp, W1/W2 4 tiêu chí (Band chỉ đọc), S + Người chấm, xoá trắng = xoá, MT cũ Band thẳng, MT0 một ô Band, nhận xét lớp thường |
| Dấu "-" / Vắng / Bỏ vắng / Khôi phục phần thi | QL, GVCN, GVBM, GVW, ADMIN (API) | "-" trong tuần (L, W1+W2, S trên 375) → dời; "-" nhập bù khối 2 → Không dự thi; MT cũ → Không dự thi; lần 2 (UI + API); Bỏ vắng theo vai; Báo vắng Kế hoạch Test; khôi phục phần huỷ; lớp thường "-" trong tuần + nhập bù |
| SOS tạm → chốt (OV-1c) | QL | Lương Bảo Anh MT3 (tạm 3/4 → SOS 2, Case lúc chốt, hạn 18/09); Vũ Hải Đăng MT3 (R dời vắng → chốt) |
| /test/ke-hoach (FT + lớp thường) | QL, QT, ADMIN, QLCP; GV (bị chuyển về Lịch Test) | lưới Ô MT, hộp một đợt + ⋯ từng dòng, Tuần chung + Lưu (Admin), Huỷ MT3 → Khôi phục → Huỷ → "Xếp MT3 mới" → chặn khôi phục có câu rõ, Xếp nhiều MT (xem trước + lưu), dời vượt lượt sau (chặn), dời hạn → khối 2 |
| /test/diem-lop | QL, GVBM, GVW, QT, ADMIN | danh sách lớp + số trống, lượt mt:N, thuong:mt0 (bảng band), MT cũ |
| /nhap-diem/3, /nhap-diem/6, /bang-diem-thuong/6, /mock-test/128 · 148 · 67 | 9 vai (quét) | trang mở / 403 đúng phạm vi, Chỉnh lịch theo vai, Khôi phục MT3 cũ bị chặn |
| Tổng quan QL · Công việc (Của GV, Quá hạn, Chấm điểm) · /metrics · badge Học viên & Lớp | QL, GVBM | đối chiếu số quá hạn / chờ chấm |
| API quyền ghi | TVV, CX, GVW, GVCN, GVBM, ADMIN | 403 khu Test (TVV/CX), ghi điểm 403, T19 400, Huỷ lượt 403 (GV, Admin), Huỷ điểm/sửa điểm Admin 200, S chấm chéo GV S ngoài phân công 200 |
| 375 sáng | GVBM (MotKyNang S + Vắng), QL (Kế hoạch Test, hộp một đợt, ⋯, Xếp nhiều MT) | không tràn ngang (scrollWidth 375) |

Ghi chú: thao tác ghi làm trên DB riêng a4 (đã đổi nhiều dữ liệu MB FT 101/102, MB FOU 12, CP FT 110; `env.sh 4 reset` để về sạch). Nhiều giờ "ghi lúc" hiện 13/10 (giờ máy thật) — chỉ là lệch ngày demo, không ghi là lỗi.

## Phát hiện

### TE-1 · chặn · Bài dời vì vắng bị khoá "Đợt đã hoàn tất" — GV đúng kỹ năng không nhập được điểm bù
- Trang · vai: Lịch Test › khối 2 "Test chấm tuần này" (MB FT 101) · GVBM (Phạm Thu Trang, GV S của lớp), GVCN; cũng đúng cho L/R/W.
- Tái hiện: GVBM → `/test/lich?loai=ft` → khối 2 mở MB FT 101 → ô S của **Lý Minh Châu (MT2)** "Vắng → W2 SEP" (S vắng W1 SEP, đã dời sang W2 SEP, hạn chấm T4 16/09) → hộp chỉ có "Vắng lần 1 · đã dời sang W2 SEP" + nút **Bỏ vắng**, không có ô điểm / "Lưu điểm", không nói vì sao. Gọi thẳng `PUT /api/attempts/133/scores/speaking {"criteria":[6,6,6,6]}` → **403 "Đợt này đã hoàn tất (hết Chủ nhật 13/09/2026). Chỉ Quản lý sửa được điểm"**. QL mở cùng ô thì có ô "Em có làm bài?" + Lưu điểm. Dưới tên em còn chip "Đã hoàn tất" dù S chưa có điểm.
- Thấy: bài thi bù (tuần mới, chưa có điểm, còn trong hạn) bị coi là xong → chỉ QL nhập. Từ Thứ Hai sau tuần thi bù, bài dời vì vắng (L/R/W/S) mà các kỹ năng khác của lượt đã có điểm đều rơi vào khoá này (trường hợp thường gặp: một em vắng một kỹ năng); bài vẫn được đếm "còn phải chấm" / sẽ sang khối 1 là nợ — người được giao không xoá được nợ.
  Đúng ra: dấu "-" của tuần cũ không làm kỹ năng "xong" khi kỹ năng đã dời sang tuần khác (đặc tả 3.3: lần 1 → dời tuần sau, GV nhập điểm ở tuần mới; R11 chỉ khoá đợt thật sự đủ điểm).
- Nguyên nhân: `server/src/fasttrack/hoanTat.ts:64-69` `coDau: r.no_show_period_id !== null` (không so với tuần hiện tại của kỹ năng) → `dotDaHoanTat` (`shared/domain/keHoachTest.ts:77`) coi kỹ năng có "-" là xong → `canEdit` (`attempts.ts:455-459`) chỉ còn `suaSauHoanTat` (QL). OV-1b (dời ngay, giữ "-" ở hàng điểm — `daChot`) chồng với R11.
- Đề xuất: `coDau` chỉ tính khi `no_show_period_id` = tuần đang xếp của kỹ năng (hoặc kỹ năng `absent`) — cùng luật `dauTruCuaO`/`sameWeek`; thêm phép kiểm "vắng lần 1 → dời → thứ Hai sau tuần mới GV vẫn nhập được". Sửa lỗi, không cần mockup.
- Ảnh: $SP/anh/test/hop-vang-S-GVBM.png (GVBM, chỉ Bỏ vắng) · so với QL (`node te/s4.mjs QL`, có ô nhập).

### TE-2 · chặn · Tuần thi bù: không ghi được "vắng lần 2" từ hộp — gõ "-" bị bỏ qua, hộp đóng như đã lưu
- Trang · vai: Lịch Test khối 3 (W3 SEP) MB FT 101 · QL (và GVCN — cùng hộp).
- Tái hiện: QL → `/test/lich?loai=ft` → khối "Lịch Test tuần này" → MB FT 101 → ô L của **Hồ Ngọc Diệp (MT1)** (đã vắng W2 SEP, dời sang W3 SEP — tuần này) → hộp "Vắng lần 1 · đã dời sang W3 SEP · Em có làm bài? Số câu đúng" chỉ có **Bỏ vắng · Lưu điểm**, không có nút **Vắng** → gõ "-" + Enter → hộp đóng, không báo gì; DB không đổi (L vẫn `scheduled`, count 1).
  Gọi thẳng `PUT /api/attempts/148/scores/listening {"noShow":true}` → 200, L thành `cancelled` (huỷ phần thi) — máy chủ làm đúng luật lần 2, chỉ giao diện không có đường.
- Thấy: em vắng lần 2 ở tuần thi bù thì GV/QL không ghi được từ Lịch Test / Nhập điểm; ô nằm lại thành "còn phải chấm" rồi sang khối 1 "quá hạn". Chữ "-" bị nuốt = báo xong khi chưa lưu.
  Đúng ra: đặc tả 3.3 "Gõ '-' hoặc bấm Vắng trong hộp khi tuần thi chưa hết: lần 1 → dời, **lần 2 → huỷ phần thi**".
- Nguyên nhân: `web/src/modules/fasttrack/HopNhapDiem.tsx:147` `vang = !!cell.daChot` (ô còn dấu "-" của tuần cũ ⇒ luôn chế độ vắng, kể cả ở tuần mới); `:182` `doiDiem = diem.doi && !(vang && 'noShow' in patch)` bỏ lệnh "-"; `:340-347` chế độ vắng không có nút Vắng.
- Đề xuất: ở tuần đích (`cell.weekStart` = tuần thi hiện tại của kỹ năng, `daChot.doiSang` có) hộp mở như ô thường (ô điểm + nút **Vắng** = lần 2 + dòng phụ "vắng lần 1 · dời từ W2 SEP" + Bỏ vắng); "-" luôn là lệnh. Sửa lỗi, không cần mockup (thêm nút theo mẫu sẵn có).
- Ảnh: $SP/anh/test/hop-tuan-bu-QL.png

### TE-3 · lỗi · Ô ở tuần thi bù hiện "Vắng → W3 SEP" ngay trong lưới W3 SEP (trông như đã xử lý xong)
- Trang · vai: Lịch Test khối 2 / khối 3, `/nhap-diem/3?periodId=…` · mọi vai.
- Tái hiện: khối 3 W3 SEP, MB FT 101: cả 5 ô của Hồ Ngọc Diệp (MT1) là nút tím "Vắng → W3 SEP"; khối 2 W2 SEP: ô S Lý Minh Châu (MT2) "Vắng → W2 SEP". Các ô này vẫn được đếm "còn phải chấm" (khối 3 MB FT 101 4/26 tính cả 5 ô của em).
- Thấy: ở tuần đang phải thi/chấm, ô nói "Vắng → (chính tuần này)" — GV đọc thành "em vắng, đã dời", không thấy là việc phải nhập; nhãn khác với số đếm. Đúng ra (OV-1d #357): nút "Vắng → W3 OCT" chỉ ở **lưới tuần gốc**; ở tuần đích ô là "Nhập" (+ dấu nhỏ "vắng lần 1").
- Nguyên nhân: `HopNhapDiem.tsx:62` `chuO` trả `Vắng → ${doiSang}` khi `daChot.doiSang` có, không so tuần đang xem; `LuoiFT.tsx:270` chỉ tách tuần gốc / tuần khác bằng `khacTuanFt`.
- Đề xuất: `chuO` / `KIEU_O` chỉ dùng kiểu "vắng" khi `tuanDangXem !== cell.weekStart`; cùng lúc sửa TE-2. Không cần mockup.
- Cũng gặp: QL "Khôi phục và đặt tuần" (Kế hoạch Test ⋯ Đổi tuần) phần L đã huỷ (vắng 2 lần) của Hồ Ngọc Diệp vào W3 SEP → ô L vẫn hiện "-" và hộp "Vắng lần 1 · Bỏ vắng · Lưu điểm" (dấu "-" W3 SEP còn trên hàng điểm, `daChot.doiSang = null`) dù em phải thi lại tuần này; ô vẫn được đếm "còn phải chấm". Khôi phục nên xoá dấu "-" của lần vắng đã huỷ (hoặc hộp coi như ô trống).
- Ảnh: $SP/anh/test/sau-dau-tru.png (hàng Hồ Ngọc Diệp; Trần Thu Hà là ô tuần gốc đúng kiểu) · $SP/anh/test/khoi-phuc-phan.png

### TE-4 · lỗi · Cùng "bài quá hạn": Tổng quan / Lịch Test 58, Công việc (lọc Quá hạn) "92 bài cần chấm"
- Trang · vai: Tổng quan QL → "58 bài quá hạn chưa nhập điểm · Xem và nhắc" → `/cong-viec?nhom=cham-diem&loc=qua-han&khung=tat-ca` · QL (MB).
- Tái hiện: Tổng quan = 58 · Lịch Test ô "Quá hạn chấm" (FT 53 + Lớp thường 5) = 58 · `/metrics/bai-qua-han-nhap-diem` = 58 · badge "n bài chờ chấm" từng lớp = tổng 3 khối Lịch Test (MB FT 101: 49+1+20 = 70 ✓). Bấm "Xem và nhắc" → dòng phạm vi Công việc: **"Đang xem: Monbay · Của GV · Quá hạn · Chấm điểm · 9 nhóm việc · 92 bài cần chấm"**.
- Thấy: 92 = 58 bài quá hạn + 34 bài CHƯA quá hạn nằm trong cùng nhóm (vd "Nhập điểm · MB FT 101 · 3 việc · 2 việc quá hạn": MT1, MT2 quá hạn + MT3 W3 SEP tuần này; MB FOU 12: Progress quá hạn + Final tuần này). Người bấm từ "58 quá hạn" sang thấy 92 dưới bộ lọc "Quá hạn".
  Đúng ra: CLAUDE.md "cùng một số liệu ở nhiều nơi phải cùng nguồn, cùng hàm tính"; dòng phạm vi dưới lọc Quá hạn = 58.
- Nguyên nhân: `shared/domain/congViec.ts:80` `soBai` cộng mọi `con` của dòng gom, không áp lọc nhanh đang chọn (dòng gom được giữ vì có ít nhất một con quá hạn).
- Đề xuất: khi lọc Quá hạn / Hôm nay / Tuần này, đếm `soBai` chỉ trên `con` khớp lọc (cùng `khopLocNhanh`); kèm: một đơn vị cho nhóm Chấm điểm — hiện lẫn "3 việc" và "2 em" (`Nhập điểm · MB FOU 12 · 2 em` cạnh `· 4 việc`), đề xuất ghi "n bài". Không cần mockup.
- Ảnh: $SP/anh/test/cv-ql-chamdiem.png

### TE-5 · lỗi · Hai luật cho cùng "vắng sau tuần thi": "-" ở lưới = Không dự thi, "Báo vắng" ở Kế hoạch Test = dời tuần
- Trang · vai: Lịch Test khối 2 + Kế hoạch Test (hộp một đợt ⋯ Báo vắng) · QL (GVCN cũng có Báo vắng).
- Tái hiện: em **Kiều Thu Trang · MB FT 102 · MT1**, L/R/W thi W2 SEP (tuần đã hết, hôm nay T2 14/09).
  (a) Lịch Test → khối 2 → MB FT 102 → ô R → gõ "-" Enter → ô "- Không dự thi · Tuần W2 SEP", R vẫn W2 SEP (`no_show_cu=1`) — đúng đặc tả.
  (b) Kế hoạch Test `?classId=4` → chip MT1 của em → ⋯ dòng L → **Báo vắng** → hộp "Lần vắng đầu máy tự dời sang tuần kế tiếp" → Báo vắng → toast **"Đã tự dời Listening sang W3 SEP (vắng lần 1)"**, DB: L W3 SEP, count 1.
- Thấy: cùng một em, cùng một tuần đã qua, hai cổng cho hai kết quả (Không dự thi vs dời + tính lần vắng → lần sau thành huỷ phần thi). Đúng ra: đặc tả 3.3 + plan.md mục 3 (11/10) "nhập bù sau tuần thi / MT cũ = Không dự thi (không dời)"; T14 "luật mới ở máy chủ nên áp cho mọi cổng".
- Nguyên nhân: `server/src/fasttrack/absence.ts:948-981` `baoVang` chỉ chặn tuần chưa tới (`:960`), không xét tuần thi đã hết → luôn `settleGroup` (dời). `saveScore` thì đi nhánh Không dự thi.
- Đề xuất: `baoVang` dùng chung luật với "-" (tuần đã hết → ghi Không dự thi, không dời) hoặc ẩn/mờ "Báo vắng" khi tuần thi đã hết (lý do "Tuần thi đã qua — ghi Không dự thi ở ô điểm"); câu trong hộp nói đúng hệ quả. Không cần mockup.
- Ảnh: $SP/anh/test/k2-dau-tru-sau-tuan.png · $SP/anh/test/bao-vang-kh.png

### TE-6 · lỗi · Lớp thường: "-" nhập bù sau tuần thi dời môn vào một tuần ĐÃ QUA → vẫn là nợ quá hạn
- Trang · vai: Lịch Test khung Lớp thường / `/nhap-diem/6?kind=progress` · QL (cùng đường `PUT /regular/attempts/:id/scores/:skill {"noShow":true}` của ô gõ "-").
- Tái hiện: MB FOU 12 · Progress Test W3 AUG (đã quá hạn 26/08) · em **Âu Nhật Nam** · R → ghi "-" → máy trả `{"moved":true,"tuanCu":"W3 AUG","tuanMoi":"W4 AUG"}`; khối 1 Lịch Test hiện thêm dòng **"Progress Test · W4 AUG · R · lùi lịch · 1 bài · hạn 02/09 ⚠ quá hạn 12 ngày"**.
- Thấy: GV gõ "-" để ghi em vắng, bài vẫn nằm ở khối nợ (chỉ đổi từ quá hạn 19 ngày sang 12 ngày), em không có lịch thi bù thật (W4 AUG đã qua). Hành vi khác hẳn MT (nhập bù = "Không dự thi"). Đúng ra: "-" phải ra một đầu ra dùng được — hoặc dời tới tuần hiện tại / tuần sau tính từ hôm nay, hoặc "Không dự thi" như MT. **Luật lớp thường chưa được chốt cho nhập bù → cần chủ SP quyết** (không tự đổi luật).
- Nguyên nhân: `server/src/normal/regular.ts:~800-875` `moi` = tuần kế của tuần thi cũ (`cu`), không xét hôm nay; `setSkillWeek(..., force: true)` cho phép tuần đã qua.
- Đề xuất (chờ chủ SP chọn): (A) như MT — sau tuần thi "-" = Không dự thi, ô hết nợ; (B) dời sang tuần sau của tuần HIỆN TẠI. Khuyến nghị A (cùng một luật cho dấu "-", ít nợ ảo). Không cần mockup.
- Ảnh: $SP/anh/test/k1-thuong-dau-tru.png

### TE-7 · lỗi · GV: ô "Quá hạn chấm" (đỏ) ở Lịch Test đếm cả bài của GV khác — Tổng quan của chính GV đó báo 0
- Trang · vai: `/test/lich?loai=ft` (mặc định "Lớp tôi dạy") · GVBM (Phạm Thu Trang — GV S của MB FT 101, S Mock là chấm chéo); GVCN, GVW cũng vậy.
- Tái hiện: GVBM mở Lịch Test, khung Fast Track → dải số **"Quá hạn chấm 49 bài · 1 lớp"** chữ đỏ, khối 1 "Test quá hạn chấm 49" + mỗi dòng MB FT 101 "⚠ quá hạn 68 / 47 / 26 / 5 ngày" đỏ, nhãn "Chờ GV khác". Cùng lúc `GET /tong-quan/lop-toi-day` của GVBM: MB FT 101 `baiQuaHan: 0`.
- Thấy: con số đỏ "quá hạn" trên màn của GV là nợ của người khác (L/R/W1/W2 + S chấm chéo); với Speaking chấm chéo còn trái T18 ("không số đỏ, không tính quá hạn" cho GVBM S / GVCN). Nhãn dòng đã đúng OV-1b ("Chờ GV khác"), nhưng ô đếm trên cùng vẫn tính cả lớp → "số ô đếm ≠ nhãn dòng" (đặc tả 3.5).
- Cùng gốc, badge: GVBM ở Học viên & Lớp thấy MB FOU 12 **"4 bài chờ chấm"** (đúng phần của cô: P Progress ×2, S MT0, P Final) → bấm badge → Lịch Test lọc lớp hiện "Còn phải chấm **15**" + "Quá hạn chấm **4**" (4 này gồm cả G+V, R của GV khác) — số trên badge không xuất hiện ở trang nó mở ("số = danh sách nó mở").
- Nguyên nhân: `server/src/cham/canCham.ts:700` `no.bai` cộng `conBai` mọi dòng khối 1 trong phạm vi lớp; `web/src/modules/test/lichTest/DaiSo.tsx:22` tô `text-late` khi > 0; `KhoiNo.tsx` `<Han>` luôn đỏ.
- Đề xuất: với người có phân công, ô "Quá hạn chấm" (và màu đỏ ở khối 1) chỉ đếm/tô phần của người xem; phần GV khác ghi nhạt "n bài của GV khác" như dòng lớp khối 2/3. Không cần mockup (đổi số + màu theo mẫu "phần của bạn" sẵn có).
- Ảnh: $SP/anh/test/lich-k1-GVBM.png

### TE-8 · lỗi · "MT cũ chưa nhập · 5 em" mở lưới một tuần chỉ có 1 em
- Trang · vai: Lịch Test (dòng mờ cuối trang) + Công việc "Nhập điểm MT cũ · 5" · QL (GVCN cũng thấy).
- Tái hiện: `/test/lich` → cuối trang "MT cũ chưa nhập · 5 em · MB FT 101 **Nhập điểm**" → mở `/nhap-diem/3?periodId=30` (W4 JUN) → lưới chỉ có **Lê Minh Khang MT1**. 4 em còn lại (Bùi Thảo Vy W1 JUL/W2 AUG, Lý Minh Châu W4 JUL, Đỗ Minh Khôi W4 JUL, Ngô Thanh Tùng W2 JUL/W3 AUG, Lê Minh Khang MT2/MT3) nằm ở tuần khác — không có đường tới từ dòng nhắc. Việc Công việc cùng `href`.
- Thấy: số "5 em" ≠ danh sách nó mở (1 em); người nhập phải tự dò từng tuần. Đúng ra: CLAUDE.md / BRIEF "badge / ô đếm = số dòng danh sách nó mở".
- Nguyên nhân: `server/src/cham/canCham.ts:146-149` `href` lấy `periodId` của lượt MT cũ SỚM NHẤT của lớp.
- Đề xuất: link sang Điểm theo lớp `/test/diem-lop?lop=3&luot=mt:<n>` + bật "Chỉ ô còn trống", hoặc liệt kê theo lượt ("MT1 · 3 em · MT2 · 2 em"). Không cần mockup.
- Ảnh: $SP/anh/test/mt-cu-link.png (lưới W4 JUN chỉ 1 em) · $SP/anh/test/lich-QL.png (dòng nhắc cuối trang)

### TE-9 · lỗi · GVCN / GVBM không có đường "dời môn lớp thường" trên giao diện (máy chủ cho)
- Trang · vai: `/nhap-diem/6?kind=final` (MB FOU 12) ⋯ từng ô · GVCN (Trần Ngọc Hà), GVBM.
- Tái hiện: GVCN mở ⋯ ô L/R: chỉ "Báo vắng · Lịch sử"; GVBM: chỉ "Lịch sử". Kế hoạch Test ẩn với GV. Gọi thẳng `POST /api/attempts/31/skills/listening/week {"periodId":43}` bằng GVCN → **200** (L của Dương Ngọc Ánh sang W4 SEP).
- Thấy: đặc tả mục 2 (ma trận vai): GVCN / GVBM "dời môn lớp thường"; T11 "Dời Test lớp thường tự do… người khác GVCN dời → chuông cho GVCN"; máy chủ `SCHEDULE_MOVE` (`server/src/permissions.ts:413`) cho GVCN mọi môn + GVBM đúng môn. Giao diện chỉ cho QL: `shared/domain/thaoTacMt.ts:55-57` thêm `doi-lich` khi `ql`; `LuoiThuong.tsx:421` truyền `quanLy: sheet.canPlan` (= PLAN_WEEK). Không file web nào dùng `SCHEDULE_MOVE`.
- Đề xuất: lưới lớp thường gửi cờ `coTheDoi` (= SCHEDULE_MOVE của ô) và `thaoTacKyNang` cho `doi-lich` khi cờ đúng; hoặc chủ SP xác nhận "chỉ QL dời" thì sửa đặc tả + bỏ quyền máy chủ (đỡ cửa API thừa). Cần chủ SP chọn; sửa nút theo mẫu sẵn có, không cần mockup.
- Ảnh: $SP/anh/test/gvcn-menu-thuong.png

### TE-10 · gợi ý · Điểm theo lớp: "còn ô trống" đếm cả bài chưa tới tuần thi (không nhập được theo T19)
- Trang · vai: `/test/diem-lop` · QL, GVBM, GVW. Danh sách lớp: **MB FT 101 · 393 trống** (GVW 387), trong khi Lịch Test cùng lớp còn 70 bài; phần lớn là MT3 W4 OCT … W4 DEC chưa tới tuần.
- Nguyên nhân: `server/src/cham/diemTheoLuot.ts:84-90` đếm mọi ô bắt buộc chưa có điểm, không xét `week_start <= tuần này`.
- Đề xuất: chỉ đếm ô đã tới tuần thi (cùng luật T19), hoặc đổi nhãn "chưa có điểm". Không cần mockup. Ảnh: $SP/anh/test/diemlop-ql-ft101.png

### TE-11 · gợi ý · Điểm theo lớp mở sẵn MT0 (1 em) thay vì Final Test (cả lớp) khi hai bài cùng tuần
- `/test/diem-lop?lop=6` (MB FOU 12, sau khi QL chốt Lên FT cho Hoàng Thanh Mai → MT0 W3 SEP) → tự mở `luot=thuong:mt0` (0/1) dù Final Test W3 SEP còn 20 ô của 6 em. Nút "Nhập điểm" ở hồ sơ lớp dùng cùng lượt mở sẵn.
- Nguyên nhân: `shared/domain/diemTheoLuot.ts:39-46` `luotMacDinh` hoà tuần thì lấy phần tử cuối (`at(-1)`) = MT0. Đề xuất: hoà tuần → lượt nhiều ô trống hơn (hoặc Final trước MT0). Ảnh: $SP/anh/test/diemlop-mt0.png

### TE-12 · gợi ý · Chữ / nhãn nhỏ (không chặn)
- Hộp nhập điểm: nút **"Vắng"** vẫn ghi "Vắng" ở bài đã hết tuần thi / MT cũ, nhưng kết quả là "Không dự thi" (không dời) — đổi nhãn theo trạng thái (`HopNhapDiem.tsx:347`).
- Admin · hộp một đợt (CP FT 110 MT4 tuần này): "Dời hạn chấm" mờ với lý do **"Không thi đợt này"** — sai lý do (đúng: "Chỉ Quản lý"); `shared/domain/thaoTacMt.ts:90` nhánh mặc định.
- Công việc: việc MT0 lớp thường ghi tên môn FOU — "Nhập điểm **Grammar + Vocabulary** · MT0" (MT0 chấm IELTS: Writing); `mywork.ts` dùng tên môn theo chương trình lớp.
- GV Speaking (S chấm chéo) thấy dòng lớp "L, R, W, **S: GV khác**" ở lớp mình là GV S (BC FT 205, MB FT 101) — T18 gọi là "Chấm chéo".
- Hộp "Huỷ MT3?" (Bùi Thảo Vy) chỉ nêu "Case Speaking đóng", không nêu PA (chưa kết quả) đóng theo; hộp Khôi phục sau đó nói "1 Case, **1 PA** trở lại" — nêu đủ ở hộp huỷ (đặc tả 3.4).
- Hồ sơ MT › Lịch sử: "Tạo lại (số dùng lại) · **W4 SEP 2026**" — mã tuần kèm năm cùng năm (G-6).
- Hộp Khôi phục phần thi: "Tuần thi mới **\* (bắt buộc)**" — hai dấu bắt buộc.
- Khối 2/3 lưới: hàng chỉ còn ô "Đã huỷ phần thi" ở tuần đang xem (Lý Thanh Tâm, Ngô Bảo Châu, Võ Minh Triết — MB FT 101 W2 SEP) vẫn hiện, không có gì để làm → ẩn (thừa).
- Hồ sơ MT (`/mock-test/128`, MT3 W4 SEP chưa tới tuần): nút "Nhập điểm" vẫn hiện, mở lưới toàn ô "Chỉ xem" (thừa).
- 375: nút ⋯ trong hộp một đợt 28×28 px, nút "Đổi" (Người chấm) 42×28 px (< 44); hàng tab Test bị cắt "t / Chấm Test" khi đang ở Kế hoạch Test. Ảnh: $SP/anh/test/m375-kh-menu.png, m375-hop-S.png
- TVV / CX mở thẳng `/nhap-diem/:id` được (route không chặn theo `nav.test`, `web/src/App.tsx:201`) — trang "‹ Test · Bạn được nhập: không kỹ năng nào", chỉ đọc; không có link nào dẫn tới, máy chủ đúng quyền (ghi 403).
- Kế hoạch Test lớp thường: chip bài đã qua tuần mà chưa chấm (MB FOU 12 Progress P của Bùi Khánh Linh, R G+V P của Âu Nhật Nam) vẫn màu "đã xếp", không có "· trễ" như FT — `keHoachTest.ts:221-240` chỉ lưới FT truyền `them`.

