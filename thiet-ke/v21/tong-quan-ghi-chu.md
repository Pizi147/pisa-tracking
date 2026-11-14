# v21 · mockup ⑧ — Tổng quan QL / Quản trị / CX / Admin văn phòng + Hồ sơ GV — ghi chú cho người duyệt

Tệp: `thiet-ke/v21/tong-quan.html` (+ `tong-quan.css`) · `thiet-ke/v21/ho-so-gv.html` (+ `ho-so-gv.css`, dùng lại bảng / thẻ / panel nổi của `tong-quan.css`). `v21.css`, `bang-mau.css` chỉ đọc.
Đề bài: `docs/superpowers/specs/2026-11-13-overhaul-v6/11-de-bai-mockup-dot-2.md` mục ⑧ (R8.1–R8.7) + G1–G5; chỗ lệch + thao tác GIỮ: `10-ra-dong-bo.md` C3, C4.
Mã đã đọc: `worklist/OverviewPage.tsx`, `TongQuanV5.tsx`, `MockTestAdmin.tsx`, `Highlights.tsx` (LichSapToi), `LopToiDay.tsx` (HaiKhoiGv), `giaoVien/HoSoGiaoVienPage.tsx`.
Web thật đã chạy (seed, cổng riêng 4183 / 5183) theo từng vai: QL Monbay · Quản trị · CX · Admin VP Monbay · Head tutor · GV xem hồ sơ mình · QL xem hồ sơ GV — ảnh TRƯỚC ở `anh/tong-quan/truoc-*.png`, `anh/ho-so-gv/truoc-*.png`.
Tên người bịa (QL Tôn Bảo Ngân · Quản trị Trịnh Quốc Dũng · CX Lưu Thanh Tâm · Admin VP Kha Thanh Xuân · GV Đinh Thu Hằng — cùng người mockup ①). Hôm nay thứ Hai 14/09/2026 · W3 SEP.

## Điểm chủ SP cần nhìn (PTA Overhaul 15/11)

1. **Ô "Case chưa có PA"** (XM-2): số to là số Case **chưa có PA** (38), dòng phụ "trong 45 Case đang mở" — thay ô "Case có PA 16 %". Một tên cho ô, cột bảng, tiêu đề panel.
2. **Bảng "Theo chi nhánh" một bộ cột cho Quản trị và CX** (XM-3): Đạt MT · Đạt Target thi thật · SOS 2–3 · Case chưa có PA · Thi tháng này — đổi lời 23/10 (CX từng có bộ cột riêng).

## 0. Lời chủ SP trong session này

**Lời 37 (15/11, PTA Overhaul chuyển lại) — CHƯA duyệt:**

> "M8: những chỗ phần ghi việc mà có text ở dưới đêm việc đúng hạn/ quá hạn đang hơi bị intrusive và loạn quá, nên nghĩ làm thế nào để hiển thị tốt hơn đi"

Đã sửa (mục 10): mỗi ô bảng một thành phần — không dòng chữ phụ dưới số; bảng Giáo viên tách cột theo tên Phân tích GV (phương án A, vẽ thêm B để chủ SP chọn); ô số thẻ lớn dòng phụ tối đa một ý, chỉ khi cần làm.

## 1. Ý chính (lời 35: "Gom chung cái gì được thì gom chung")

**Tổng quan — ba vai một khung** (R8.3): hàng ô số thẻ lớn → khối danh sách chính bên trái → cột phải 400 (khối phụ). Ô đầu luôn **"Việc của tôi"**, rồi **"Chờ duyệt"** (vai nào có), rồi ô tình hình của vai. Trang vẫn là trang tình hình, không form.

| Khối | QL một chi nhánh | Quản trị / QL nhiều chi nhánh | CX | Admin văn phòng | Gom gì |
|---|---|---|---|---|---|
| Đầu trang (tên · phạm vi · tuần · kỳ │ link · khung · chi nhánh) | ✓ | ✓ | ✓ | ✓ (không khung) | một dáng; công tắc khung = đoạn chuẩn `.doan`; "Báo cáo HV ›" → "Báo cáo ›" |
| Ô "Việc của tôi ›" | ✓ | **thêm** | — (không quyền, XM-1) | ✓ | cùng nguồn badge Công việc / chuông (`useSoViecCuaToi`) |
| Ô "Chờ duyệt ›" | ✓ | **thêm** | — (không quyền, XM-1) | — (không duyệt) | cùng nguồn hộp duyệt (một GET với cột phải) |
| Ô tình hình | Đạt MT · Case chưa có PA · Thi tháng này | + Đạt Target thi thật | Đạt MT · Đạt Target · HV SOS 2–3 › · Chờ KQ › · Chưa chốt lộ trình tiếp › | Lượt MT tuần này › · Bài chưa nhập điểm › · HV chưa đủ MT › | một dáng ô; một tên cho số Case |
| Khối chính trái | Lớp cần chú ý + Giáo viên | Theo chi nhánh | Theo chi nhánh (một chi nhánh: Lớp cần chú ý) | GV chấm quá hạn | **"Theo chi nhánh" của Quản trị và CX = MỘT bảng** (cột hợp, cả hai bấm được dòng) |
| Cột phải 400 | Chờ duyệt | **Chờ duyệt** (thêm, cùng khối QL) | — (rỗng → bảng rộng hết) | **Lịch sắp tới** (chuyển từ dưới khối chính) | khối phụ của mọi vai cùng một chỗ |

**Hồ sơ GV — 9 khối thành 3 tab chuẩn** (R8.5): đầu trang + dải chuẩn Đúng hạn · Làm muộn · Chưa làm (cố định trên tab) → **Lớp · Học thuật · Việc & Case**.

| Khối web hiện tại | Sau | Gom / lý do |
|---|---|---|
| Đầu trang (tên · Vai · Kỹ năng · GVCN n lớp · kỳ · nút việc) | GIỮ, dáng đầu hồ sơ ③; GVCN = mã lớp link | — |
| Dải 4 ô (Đúng hạn · Đạt kỳ vọng Test · Case có PA · Kết quả thi thật) | tách theo nơi số thuộc về: Đúng hạn → **dải chuẩn đầu trang** (Chấm Test │ Việc × Đúng hạn · Làm muộn · Chưa làm); Đạt kỳ vọng · Tiến bộ · Thi thật → **dải tab Học thuật**; Case có PA → chip **"Chưa có PA"** ở khối Case | mỗi số một chỗ, cùng tab với bảng của nó |
| "Kỹ năng tôi dạy" (Tổng quan GV cũ, chỉ hồ sơ mình) | **gom vào "Lớp đang dạy"** (tab Lớp) | cùng hàng lớp × kỹ năng; Test kế tiếp → dòng phụ; Chờ chấm → cột "Bài chưa nhập" (+ hạn / ⚠ quá hạn); Đạt / Tiến bộ theo lớp đã có ở bảng "Theo lớp" tab Học thuật |
| "Lớp tôi chủ nhiệm" (Tổng quan GV cũ) | tab Lớp, tên "Lớp chủ nhiệm", chỉ hồ sơ mình | GIỮ như GD-1 |
| 3 ô số Tổng quan GV cũ (Case đang xử lý · Đạt kỳ vọng Test · Tiến bộ) | Case → khối Case (đếm + chip trạng thái); Đạt / Tiến bộ → dải tab Học thuật | đã trùng với dải hồ sơ → không vẽ hai lần |
| "Lớp đang dạy" (thẻ lớp) | tab Lớp, **bảng** (cùng dáng bảng Tổng quan) | thẻ 4 cột → bảng có cột thẳng hàng |
| "Học thuật" (Theo kỹ năng │ Theo lớp) | tab Học thuật, GIỮ | công tắc khung = đoạn chuẩn |
| "Việc đang tồn" (4 ô số) | tab Việc & Case, cột phải: số đếm chuẩn + **nút-chip "Việc cần làm"** | cùng thành phần ①; bốn link "n quá hạn" → một "⚠ 9 quá hạn ›" |
| "Em đang bổ trợ" | tab Lớp, GIỮ | — |
| "Case đang phụ trách" | tab Việc & Case, khối chính; "Cần làm trước" = **dòng việc chuẩn**, bấm → panel việc tại trang | lời 24, ⑤ B |
| "Yêu cầu đã gửi" | tab Việc & Case, cột phải, một dải | — |

## 2. Bảng truy vết khung → thành phần → TRƯỚC → SAU

### Tổng quan (`tong-quan.html`)

| Khung | Thành phần | TRƯỚC (web) | SAU (mockup) | Loại |
|---|---|---|---|---|
| T1 | Đầu trang QL | "Tổng quan · Monbay · W3 SEP · kỳ…" · Lịch thi › · Báo cáo › · `CongTac v8` | như cũ; công tắc = `.doan` chuẩn | GIỮ / ĐỔI dáng |
| T1 | Ô Việc của tôi › | có (XM 3 cũ); "›" cả khi 0 | có; 0 → mờ, không "›", không bấm | GIỮ / SỬA (C3) |
| T1 | Ô Chờ duyệt › | có | có | GIỮ |
| T1 | Ô Đạt MT ⓘ | % · "2/3 HV · 8 chưa đủ dữ liệu" | như cũ | GIỮ |
| T1 | Ô "Case có PA" | 16 % · "7/45 Case · 38 chưa PA" (38 là ô số riêng) | **"Case chưa có PA" 38** · "trong 45 Case đang mở" (45 ô số → panel Case đang mở) | ĐỔI tên + số chính (XM-2) |
| T1 | Ô Thi tháng này ⓘ | 0 (mờ) | như cũ | GIỮ |
| T1–T7, H1–H7 | Số bấm được trong bảng | gạch chân màu nhấn (`OSo`) | **hộp viền** như Phân tích (`.o-so-hop .so-bam`, chủ SP 12/11 "hộp = bấm được, màu = cần làm"): quá hạn = hộp đỏ + ⚠; 0 / không bấm = chữ thường; ô số thẻ lớn + dải mỏng giữ dáng | ĐỔI dáng (việc dở luat/5 mục 6) |
| T1 | Lớp cần chú ý | Lớp · Đạt MT · SOS · **"Case chưa PA"** · Thi tháng này; tối đa 5 lớp | cột **"Case chưa có PA"**; đếm "4" ở đầu khối | GIỮ / ĐỔI tên cột |
| T1 | Giáo viên | công tắc Hành chính / Học thuật `CongTac v8`; cột Việc đúng hạn · Chấm Test đúng hạn · Bài chấm quá hạn | công tắc `.doan`; cột GIỮ; Học thuật: cột "Case có PA" → "Case chưa có PA" | GIỮ / ĐỔI dáng |
| T1 | Chờ bạn duyệt | tên khối "Chờ bạn duyệt"; 5 dòng + "Hộp duyệt ›" | tên **"Chờ duyệt"** (một tên với ô và tab Công việc); 5 dòng + **"+ 5 yêu cầu"** mở thêm tại chỗ; "Hộp duyệt ›" BỎ (trùng ô Chờ duyệt ›) | GOM (XM-6) |
| T2 | Panel số | `KhungPanel` tiêu đề "Case chưa chốt PA" / "Case đang mở" | tiêu đề **"Case chưa có PA · Monbay · 38"** | ĐỔI chữ |
| T3 | Ô Quản trị | Đạt MT · Case có PA · Đạt Target thi thật · Thi tháng này | **+ Việc của tôi › + Chờ duyệt ›** · Case chưa có PA | THÊM (R8.2) |
| T3 | Theo chi nhánh (QT) | Chi nhánh · Đạt MT · Case có PA % · Đạt Target · Thi tháng này · bấm dòng | cột hợp với CX: + SOS 2–3; "Case có PA %" → "Case chưa có PA" (n / tổng); tên chi nhánh là link, không chevron (chevron chỉ cho đổi trang) | GOM (XM-3) |
| T3 | Cột phải QT | không có | Chờ bạn duyệt (như QL) | THÊM (XM-4) |
| T4 | Ô CX | 5 ô | 5 ô GIỮ (không thêm Việc / Chờ duyệt — XM-1 PTA chốt) | GIỮ |
| T4 | Theo chi nhánh (CX) | 4 cột số, **không bấm dòng**, không hàng Toàn hệ thống | **cùng bảng T3**, bấm dòng, có Toàn hệ thống | GOM / THÊM (R8.2) |
| T4 | Link đầu trang CX | Lịch thi › · **Báo cáo HV ›** | Lịch thi › · **Báo cáo ›** | ĐỔI chữ (một tên) |
| T5 | Ô Admin | Việc của tôi › · Lượt MT tuần này › · Bài chưa nhập điểm › · HV chưa đủ MT › ("đã thi hết lượt MT đã xếp" ở dòng phụ) | như cũ; định nghĩa vào ⓘ | GIỮ / BỎ chú thích |
| T5 | GV chấm quá hạn | một GV nhiều dòng (mỗi lượt × kỹ năng một dòng), dòng chỉ đọc, có dòng "chờ chấm"; số GV đầu khối → panel | **gom: mỗi GV một dòng** (lượt ghi trong dòng — cùng hạt với cột "Bài chấm quá hạn" của QL: Hằng 12 ở cả hai); **bấm dòng → panel GV trễ chấm của GV đó** (Nhập hộ); hạn = chip hạn (lâu nhất); dòng "chờ chấm" bỏ khỏi khối "quá hạn" (bài đó vẫn ở ô "Bài chưa nhập điểm"); "Speaking chấm chéo" → "Chấm Speaking" | GOM / ĐỔI (lời 19, ⑤, XM-12) |
| T5 | Lịch sắp tới | dưới khối chính, rộng hết; tab "Tuần này · W3 SEP **25 em**"; "Xem toàn bộ lịch ›" | **cột phải 400**; thanh tab chuẩn, badge mờ "25"; link đổi tên "Kế hoạch Test ›" | ĐỔI chỗ / chữ |
| T5 | Link đầu trang Admin | Lịch tuần › · Kế hoạch Test › | Lịch tuần › ("Kế hoạch Test ›" gom vào ô + đầu khối) | GOM (XM-7) |
| T6 | Trạng thái | Skeleton · ErrorState · rỗng có "Học viên & Lớp ›" | giữ chỗ cùng hình; lỗi trong khối + Thử lại; rỗng; Lớp thường "chỉ Fast Track", bảng bỏ cột SOS | GIỮ |
| T7 | 375 | ô 2 cột; cột phải lên trước; bảng thẻ; thanh dưới 5 mục | như cũ; Chờ bạn duyệt 375 hai hàng (loại · hạn / tên em) để tên không bị cắt; số việc trên thanh dưới thành viên tròn | GIỮ / SỬA |

### Hồ sơ GV (`ho-so-gv.html`)

| Khung | Thành phần | TRƯỚC (web) | SAU (mockup) | Loại |
|---|---|---|---|---|
| H1 | Đầu trang | nhãn Vai · Kỹ năng (Sửa) · **GVCN 8 lớp** · Từ tuần – đến (ONgay) · ⓘ · Mở Công việc › | dáng `.o-tin` ③; **GVCN = mã lớp link** | GIỮ / ĐỔI (R8.4) |
| H1 | Dải chỉ số | thẻ 4 ô số to (kiểu thứ ba) | **dải chuẩn 44**: Chấm Test │ Việc × Đúng hạn · Làm muộn · Chưa làm (+ %), + "S chéo chung" | ĐỔI (R8.4, C4) |
| H1 | Ba chỉ số học thuật ở đầu trang web (Đạt kỳ vọng Test · Case có PA · Kết quả thi thật) | dải 4 ô đầu trang | **nay sau tab**: Đạt kỳ vọng Test (+ Tiến bộ) và Kết quả thi thật → **dải đầu tab Học thuật** (H2); Case có PA → chip **"Chưa có PA 9"** đầu khối Case, **tab Việc & Case** (H3) — không mất số (ảnh cặp `cap-h2-…`, `cap-h3-…`) | ĐỔI chỗ |
| H1 | Tab | không tab, 9 khối xếp chồng | thanh tab chuẩn Lớp (mờ 8) · Học thuật · Việc & Case (đỏ 9) | ĐỔI (R8.5) |
| H1 | Kỹ năng tôi dạy + Lớp đang dạy | hai khối (bảng + thẻ) cùng lớp × kỹ năng | **một bảng "Lớp đang dạy"**; lớp mình chủ nhiệm = chip "GVCN" (cột GVCN để trống, chỉ ghi tên GV khác) | GOM |
| H1 | Lớp chủ nhiệm | "Lớp tôi chủ nhiệm" (chỉ hồ sơ mình) | "Lớp chủ nhiệm" tab Lớp; Case → "Case đang mở" | GIỮ |
| H1 | Em đang bổ trợ | khối riêng | tab Lớp; hạn Mini Test = chip hạn | GIỮ |
| H2 | Học thuật | thẻ có `CongTac` cũ + ⓘ `NutLuat` | dải tab (Đạt kỳ vọng Test · Tiến bộ · Thi thật) + `.doan` + ⓘ bấm; hai bảng GIỮ | GIỮ / ĐỔI dáng |
| H3 | Case đang phụ trách | chip trạng thái + "Cần làm trước" bảng 4 cột (link sang hồ sơ HV) | chip trạng thái (Case quá hạn · Cần làm · Chờ duyệt · Đang làm) │ vạch │ chip lọc (Có việc quá hạn · **Chưa có PA**); "Cần làm trước" = dòng việc chuẩn, bấm → panel việc | ĐỔI (lời 24) |
| H3 | Việc đang tồn | 4 ô số to "7 việc · 4 quá hạn", `Goi` ⓘ rê chuột | số đếm chuẩn "34 việc · ⚠ 9 quá hạn ›" + nút-chip "Chấm điểm 7 · ⚠ 4 ›" (loại + số + số quá hạn, không đơn vị); ⓘ bấm | ĐỔI (C4) |
| H3 | Yêu cầu đã gửi | dòng chữ + link | một dải số + link | GIỮ |
| H4 | QL xem | Việc của {tên} › · Sửa kỹ năng (Lưu · Đóng, **không Hoàn tác**) · Hiệu quả PA › · Chờ duyệt › · kỳ mặc định 4 tuần | như cũ + **"✓ Đã lưu · Hoàn tác"**; badge tab mờ "⚠ 9"; **kỳ đi theo trang nguồn** (mở từ Tổng quan → W1 SEP – W2 SEP, số dải = dòng GV ở bảng Giáo viên) | GIỮ / THÊM (R8.4, XM-13) |
| H5 | Panel việc | (không có — đổi trang) | `PanelViec` nổi phải, dòng quy chế Q13, tên em = link hồ sơ; chân G2 lời 36 "Đóng · Lưu · **Lưu · việc tiếp ›**" | THÊM |
| H6 | Trạng thái | Skeleton · ErrorState · Empty · lỗi kỳ | như cũ, cùng dáng chuẩn; chưa phân công → dải một câu "Chưa có số liệu trong kỳ" (không sáu số 0) | GIỮ |
| H7 | 375 | `BangGon` thẻ | dải 375 hai nhóm 3 ô thẳng cột; bảng → thẻ lưới; tab cuộn ngang | GIỮ / SỬA |

## 3. Bảng thao tác TRƯỚC → SAU (không mất thao tác)

### Tổng quan

| Thao tác hiện có | Sau | Ghi chú |
|---|---|---|
| Bấm cả ô số (mọi ô) | GIỮ | "›" = đổi trang, không "›" = panel; 0 không bấm (C3: "Việc của tôi ›" nay còn "›" khi 0 → sửa) |
| Ô Việc của tôi › → Công việc | GIỮ (QL, Admin), THÊM (Quản trị) | CX không có (XM-1) |
| Ô Chờ duyệt › → Công việc · Chờ duyệt | GIỮ (QL), THÊM (Quản trị) | CX không có (XM-1) |
| Ô Đạt MT / Đạt Target / Thi tháng này → panel | GIỮ | |
| Ô Case có PA → panel Case đang mở; số "38 chưa PA" → panel Case chưa chốt PA | ô "Case chưa có PA" → panel Case chưa có PA; số "45" ở dòng phụ → panel Case đang mở | cả hai panel còn, một tên |
| CX: HV SOS 2–3 › · Chờ KQ thi thật › · Chưa chốt lộ trình tiếp › | GIỮ (đích cũ) | |
| Admin: Lượt MT tuần này › · Bài chưa nhập điểm › · HV chưa đủ MT › | GIỮ | |
| Mã lớp / tên GV = link hồ sơ | GIỮ | |
| Số trong bảng (Đạt MT, SOS theo mức, Case, Thi, %, Bài chấm quá hạn) → panel | GIỮ | |
| Giáo viên: Hành chính / Học thuật | GIỮ (dáng đoạn chuẩn) | |
| Chờ bạn duyệt: bấm dòng → panel duyệt (Duyệt / Từ chối, "Mở ›") | GIỮ | |
| "Hộp duyệt ›" cuối khối | **gom vào ô "Chờ duyệt ›"** (cùng đích `/cong-viec?nhom=duyet`, ngay trên cùng màn); thêm "+ n yêu cầu" mở thêm tại chỗ | lý do: hai link một đích trên một màn |
| Quản trị: bấm dòng chi nhánh → xem chi nhánh | GIỮ; **CX cũng có** | |
| Công tắc FT / Lớp thường · ô Chi nhánh | GIỮ | |
| Link đầu trang: Lịch thi › · Báo cáo › · Phân tích GV › · Báo cáo HV › · Lịch tuần › | GIỮ; "Báo cáo HV ›" đổi chữ "Báo cáo ›" | |
| Admin "Kế hoạch Test ›" đầu trang | **gom**: ô "Lượt MT tuần này ›" (tuần này) + đầu khối Lịch sắp tới "Kế hoạch Test ›" (đúng tuần đang xem) | XM-7 |
| Admin: số GV đầu khối GV chấm quá hạn → panel theo GV | GIỮ; **thêm** bấm từng dòng (mỗi GV một dòng) → panel của GV đó | lượt cụ thể vẫn thấy trong dòng và trong panel |
| Admin Lịch sắp tới: tab tuần · mã lớp link · chip đợt (link) · "Xem toàn bộ lịch ›" · "+ n lớp" | GIỮ hết; link đổi tên "Kế hoạch Test ›" | |
| Thử lại khi lỗi | GIỮ | |

### Hồ sơ GV

| Thao tác hiện có | Sau | Ghi chú |
|---|---|---|
| ‹ quay lại (DuongVe) | GIỮ | |
| Từ tuần / đến (ô gõ + nút lịch) · ⓘ kỳ | GIỮ; **mở từ Tổng quan / Phân tích GV thì kỳ đi theo trang nguồn** (tham số URL), vào thẳng thì mặc định 4 tuần | XM-13 |
| "Mở Công việc ›" (mình) / "Việc của {tên} ›" (QL) | GIỮ | |
| Sửa kỹ năng → 5 ô → Lưu / Đóng (QL, Quản trị) | GIỮ + **Hoàn tác 10 giây** sau lưu | R8.4 |
| Mọi số → panel (`/giao-vien/:id/o`, `/chi-so/o`) | GIỮ (dải, bảng, chip Case, Yêu cầu) | |
| % đúng hạn → panel 3 tab mở sẵn tab Đúng hạn | GIỮ: mỗi số Đúng hạn / Làm muộn / Chưa làm mở đúng tab | cùng panel Phân tích GV |
| Mã lớp link · chip Bàn giao → hồ sơ lớp việc Bàn giao | GIỮ | |
| Số HV đang học → panel | GIỮ ("65 HV" ở đầu bảng Lớp đang dạy) | |
| Bài chưa nhập / quá hạn theo lớp → panel | GIỮ (cột Bài chưa nhập) | |
| Kỹ năng tôi dạy: Đạt KV / Tiến bộ theo lớp → panel | **tab Học thuật bảng "Theo lớp"** (cùng panel `ket-qua-lop`, `tien-bo-lop`) | gom; theo kỳ đang chọn |
| Kỹ năng tôi dạy: Chờ chấm / quá hạn → panel `/tong-quan/lop-toi-day/o` | cột "Bài chưa nhập" (+ ⚠ quá hạn) của bảng Lớp đang dạy | gom; cùng tập |
| Lớp chủ nhiệm: Dưới kỳ vọng · SOS · Case · Thi → panel | GIỮ | |
| Học thuật: công tắc FT / Lớp thường · % → panel · phân trang 7 lớp · ⓘ ký hiệu thi thật | GIỮ | |
| Việc đang tồn: số nhóm → Công việc đúng tab; "n quá hạn" → Công việc lọc quá hạn | nút-chip nhóm → Công việc đúng tab; **"⚠ 9 quá hạn ›"** một link lọc quá hạn mọi nhóm | gom bốn link quá hạn (XM-8) |
| Em đang bổ trợ: tên → hồ sơ HV (Case + Mini Test) | GIỮ | |
| Case: số Case · chip trạng thái · "Case có việc quá hạn" → panel | GIỮ; chip đổi tên "Có việc quá hạn"; + "Chưa có PA" | |
| Cần làm trước: tên em / Case / việc → hồ sơ HV (Case mở sẵn) | dòng việc → **panel việc tại trang**; tên em (thẻ phụ, và ở ngữ panel) vẫn là link hồ sơ HV | XM-9 |
| "Hiệu quả PA của {tên} ›" (QL) | GIỮ | |
| Yêu cầu: chờ duyệt / bị từ chối → panel · "Yêu cầu của tôi ›" / "Chờ duyệt ›" | GIỮ | |

## 4. Số không mất

Mọi số của hai màn còn, mỗi số MỘT chỗ: Tổng quan — 38 số / vai giữ nguyên tập (Case có PA % thay bằng số chưa có PA + tổng đang mở: cùng hai số 7/45 → 38/45). Hồ sơ GV — 4 ô dải cũ + 2 bảng + 3 ô Tổng quan GV cũ: Điểm đúng hạn % → "Chấm Test 92 %"; Việc % + chưa làm → "Việc 76 %" + Chưa làm; Đạt kỳ vọng Test + Tiến bộ → dải tab Học thuật; Case có PA → chip "Chưa có PA"; Kết quả thi thật (% Pass + ▼ ▲ ★) → dải tab Học thuật (+ bảng); Đạt / Tiến bộ / Chờ chấm của "Kỹ năng tôi dạy" → bảng Theo lớp + cột Bài chưa nhập.

## 5. Dòng đọc Turso (ước, đo khi code)

- Tổng quan QL: không đổi (giữ `/tong-quan/v5`, `/yeu-cau?hop=cho-duyet`, `/phan-tich/giao-vien?v2=1`).
- Quản trị: số ô "Chờ duyệt" lấy từ số đã có (cùng nguồn badge / chuông — 0 request); **chỉ khi số > 0** mới GET `/yeu-cau?hop=cho-duyet` cho cột phải (đường QL đang dùng, ước vài câu / < 100 dòng). Không có yêu cầu → 0 request thêm. "Việc của tôi" đọc từ bản badge đã tải (0).
- CX: bảng hợp cột dùng `DongCn` đã có (`sos23`, `caseChuaPa`, `thiThangNay`) → 0. Không có ô Việc / Chờ duyệt (XM-1) → 0.
- Admin: bấm dòng dùng đường `/tong-quan/gv-tre?gv=` đang có → 0 khi mở trang.
- Hồ sơ GV: dòng phụ "Test kế tiếp" chỉ khi xem hồ sơ của mình (lấy từ đường người gọi đang có) → QL xem không thêm câu; GV xem mình: phần "day" của `/tong-quan/lop-toi-day/hai-khoi` không còn cần (chỉ giữ phần chủ nhiệm) → giảm. Tab Việc & Case của chính mình: badge lấy từ bản badge đã tải → `/giao-vien/:id/viec` có thể tải khi mở tab (−1 GET lúc mở trang).

## 6. [XM] — cần PTA / chủ SP quyết

1. **[XM-1] — PTA chốt: ẨN.** Vai không có quyền (CX) không có ô "Việc của tôi" / "Chờ duyệt"; Quản trị nhiều chi nhánh vẫn có (T4 đã bỏ hai ô, CX còn 5 ô như web). Bản đề xuất: CX: ô "Việc của tôi", "Chờ duyệt".** Đề bài R8.2 yêu cầu có; CX hôm nay không có menu Công việc, không duyệt (luật A6 "CX theo dõi, không giữ việc") → hai ô luôn 0. Mockup vẽ theo đề bài (0, mờ). Đề xuất: **ẩn ô khi vai không có quyền** (`workSupport` / `workApprove`), hiện lại khi có — đỡ hai ô chết.
2. **[XM-2] — PTA chốt: đồng ý** (điểm chủ SP cần nhìn). "Case có PA" % → "Case chưa có PA" (số).** Một tên cho ô, cột, panel (R8.1). Số chính đổi từ % (16 %) sang số Case cần làm (38), tổng đang mở ở dòng phụ. Cùng thông tin; nếu chủ SP muốn giữ % làm số to thì đổi tên ô thành "Case chưa có PA" vẫn giữ được, nhưng % là "đã có" còn cột là "chưa có" → không còn một tên.
3. **[XM-3] — PTA chốt: đồng ý** (điểm chủ SP cần nhìn). Bảng "Theo chi nhánh" một bộ cột cho Quản trị và CX.** Hợp cột hai bảng cũ: Quản trị thêm SOS 2–3, CX thêm Thi tháng này + hàng Toàn hệ thống; không bỏ cột nào. Chủ SP 23/10 chọn cột riêng cho CX ("thiên về điểm + tình trạng HV") — lời 35 mới hơn.
4. **[XM-4] — PTA chốt: đồng ý, chỉ gọi khi số "Chờ duyệt" > 0** (mục 5). Quản trị có cột phải "Chờ bạn duyệt"** (như QL) → +1 GET (mục 5).
5. **[XM-5] — PTA chốt: đồng ý gom; "Test kế tiếp" chỉ hiện khi xem hồ sơ của chính mình** (không thêm câu đọc; QL xem → dòng phụ trống). Hồ sơ GV gom "Kỹ năng tôi dạy" vào "Lớp đang dạy".** Cột Đạt / Tiến bộ theo lớp chỉ còn ở tab Học thuật (theo kỳ đang chọn, một nguồn). Dòng phụ "Test kế tiếp" khi QL xem cần thêm trường (mục 5) — hoặc chỉ hiện khi xem hồ sơ mình.
6. **[XM-6] — PTA chốt: đồng ý.** Bỏ "Hộp duyệt ›"** cuối khối Chờ bạn duyệt (trùng đích ô "Chờ duyệt ›"), thay "+ n yêu cầu" mở thêm tại chỗ.
7. **[XM-7] — PTA chốt: đồng ý.** Admin bỏ link đầu trang "Kế hoạch Test ›"** (đã có ở ô và đầu khối Lịch sắp tới); Lịch sắp tới sang cột phải.
8. **[XM-8] — PTA chốt: đồng ý; lời 37 thay: KHÔNG gom nữa** — Việc đang tồn thành bảng nhỏ, mỗi nhóm có hộp đỏ quá hạn riêng (giữ link quá hạn từng nhóm như web). Bản đề xuất cũ: Việc đang tồn: bốn link "n quá hạn" → một "⚠ 9 quá hạn ›"** (lọc quá hạn mọi nhóm). Cần `duongViecCuaGv(…, nhom=null, chiQuaHan)` chạy được — kiểm khi code.
9. **[XM-9] — PTA chốt: đồng ý.** "Cần làm trước" mở panel việc tại hồ sơ GV** thay đổi trang. QL xem GV khác cũng mở panel (QL làm thay — luật A4, như Công việc QL đang làm).
10. **[XM-10] — PTA chốt: giữ "em"** (lời 35 chỉ áp nút-chip việc và badge). Chip "Bàn giao 0/5 em"** là chip trạng thái (không phải nút-chip việc) → giữ chữ "em". Nếu lời 35 áp cả chip trạng thái thì thành "Bàn giao 0/5".
11. **[XM-11] — PTA chốt: đồng ý.** Head tutor** (R8.6): không vẽ Tổng quan riêng — xem như GV (trang đầu Công việc, mockup ①); hồ sơ của mình vẽ ở H6c (chưa phân công, không nút Công việc). Head tutor không có Công việc (LG-7) → không badge tab Việc & Case.
12. **[XM-12] — PTA chốt: đồng ý, với điều kiện bấm dòng GV mở panel có ĐỦ từng lượt × kỹ năng như nay** (panel `gvTre` theo GV: lớp · lượt · kỹ năng → em còn trống → Nhập hộ — không mất thông tin). Admin "GV chấm quá hạn" mỗi GV một dòng** (nay mỗi lượt × kỹ năng một dòng) — cùng hạt với bảng Giáo viên của QL và với panel theo GV; dòng "chờ chấm" (Chấm Speaking chưa tới hạn) ra khỏi khối "quá hạn". Số bài vẫn cùng tập Trễ chấm.
13. **[XM-13] — PTA chốt: đồng ý.** Kỳ của hồ sơ GV đi theo trang nguồn** (Tổng quan / Phân tích GV truyền `tu`, `den` qua URL) — để số GV trên hồ sơ bằng số ở dòng GV vừa bấm. Vào thẳng: 4 tuần như nay.
14. **[XM-14] — PTA chốt: đồng ý.** Số phụ "45" (Case đang mở) nằm trong ô "Case chưa có PA" vốn bấm cả ô**: số phụ nổi trên vùng bấm cả ô (mẫu web đang có ở "38 chưa PA") — giữ; 375 vùng bấm số phụ ≥ 44 khi code.

## 7. Tự rà từng dòng R8.x (+ G)

| R | Yêu cầu | Đạt? | Ở đâu |
|---|---|---|---|
| R8.1 | Tổng quan là trang tình hình, không form | ✓ | T1–T5: chỉ ô số, bảng, danh sách; thao tác duyệt trong panel (GIỮ) |
| R8.1 | Ô số thẻ lớn, cả ô bấm được, 0 không bấm và không "›" | ✓ | `.o-lon`, `.o-lon.khong`; T6c (mọi ô 0) |
| R8.1 | Một dáng cho số đổi trang | ✓ | đổi trang = tên ô có "›" (cả ô là link); trong bảng không số nào đổi trang (chỉ panel); link chữ đầu trang "… ›" |
| R8.1 | Một tên cho số Case ở ô, cột, tiêu đề panel | ✓ | "Case chưa có PA" T1 ô + cột, T2 panel, T3/T4 cột, hồ sơ GV chip (XM-2) |
| R8.2 | QL / Quản trị nhiều chi nhánh có "Việc của tôi ›", "Chờ duyệt" cùng nguồn badge; CX không (XM-1, PTA chốt) | ✓ | T3; T4 5 ô |
| R8.2 | Bảng "Theo chi nhánh" của CX bấm được dòng như Quản trị | ✓ | T4 `tr.bam` + chevron; T7b thẻ bấm |
| R8.3 | Ba vai chung một khung: ô số → khối chính → cột phải; khối hai vai cùng có thì cùng dáng, cùng chỗ; liệt kê khối đã gom | ✓ | mục 1 bảng khối; T1, T3, T4, T5 |
| R8.4 | Đầu hồ sơ GV giữ (Vai · Kỹ năng sửa tại chỗ có Hoàn tác · "Việc của {tên} ›") | ✓ | H1, H4, H4b |
| R8.4 | "GVCN n lớp" → mã lớp link | ✓ | H1 `.o-tin` |
| R8.4 | Dải chuẩn cùng số / tên Phân tích GV, mọi số mở panel | ✓ (lời 37) | H1 `.dai-cs`: Việc │ Chấm Test × % đúng hạn · Chưa làm (Đúng hạn / Làm muộn trong panel 3 tab) |
| R8.5 | 9 khối → 3 tab chuẩn Lớp · Học thuật · Việc & Case | ✓ | H1 / H2 / H3; mục 1 bảng 9 khối |
| R8.5 | Nhận hai bảng + 3 ô số Tổng quan GV vào tab Lớp, chỉ hồ sơ mình | ✓ (gom) | "Lớp chủ nhiệm" chỉ hồ sơ mình (H1, không có ở H4); "Kỹ năng tôi dạy" gom vào "Lớp đang dạy"; 3 ô → nơi số thuộc về (XM-5) |
| R8.5 | "Em đang bổ trợ" giữ | ✓ | H1 |
| R8.6 | Head tutor xem như GV, không Tổng quan riêng | ✓ | không khung riêng; H6c (XM-11) |
| R8.7 | 375 cả hai màn | ✓ | T7a–c, H7a–b |
| G1 | Nâng cấp, không dựng lại; giữ mọi thao tác | ✓ | mục 3 |
| G2 | Thành phần chuẩn: tab + badge · nút-chip loại + số · dải 44 (Tổng quan giữ số to) · "Lịch sử · n" (không có ở hai màn) · ⓘ bấm · "›" đổi trang · chip hạn · "n việc · ⚠ m quá hạn" · mã tuần | ✓ | H1 tab, H3 chip, H1 dải, T5 chip hạn, H3 số đếm |
| G3 | Không chú thích tĩnh / tab / màn mới ngoài đề bài | ✓ | chú thích dòng phụ "đã thi hết lượt MT đã xếp" → ⓘ; tab hồ sơ GV là đề bài |
| G4 | Tệp + ảnh 1440 Tối / Sáng, 375 Sáng; phông đã nạp; ảnh cặp | ✓ | mục 9 |
| G5 | PR chỉ `thiet-ke/v21/`, không merge | ✓ | — |
| Chỉnh PTA 1 | Số bấm được trong bảng = hộp viền, 0 / không bấm chữ thường | ✓ | `.bang`, thẻ 375 `.cap`, "⚠ n quá hạn" ở Lớp đang dạy; tile + dải mỏng giữ |
| Chỉnh PTA 2 | CX bỏ hai ô chết → 5 ô như web | ✓ | T4 |
| Chỉnh PTA 3 | Ba chỉ số học thuật đầu trang cũ → ghi rõ tab mới + khung tab Học thuật, Việc & Case có ảnh cặp | ✓ | bảng truy vết dòng H1 "Ba chỉ số học thuật…"; H2, H3 + `cap-h2-1440-toi.jpg`, `cap-h3-1440-toi.jpg` |
| Tâm ✕ / ⓘ / ⋯ ≤ 1 px | đo vùng mực so với tâm nút trên ảnh ×2 (máy) | ✓ | tong-quan: ⓘ 12 nút lệch tối đa 0,5 px ngang · 0,5 px dọc; ✕ 1 nút 0 · 0,5 px. ho-so-gv: ⓘ 14 nút 0,5 · 0,5 px; ✕ 1 nút 0 · 0,5 px. Không có ⋯ trên hai màn |

## 8. Critique impeccable

Chạy theo `impeccable critique`: hai agent tách (A đánh giá thiết kế · B máy dò `impeccable detect`), rồi một vòng xác nhận.

| Vòng | Điểm Nielsen | P0 | P1 | Đã sửa |
|---|---|---|---|---|
| 1 | 28/40 | 0 | 4 | số cùng một việc lệch giữa khung (Hằng 11 / 7 / 12 → **12 ở mọi nơi**; Admin ⚠ 37 = tổng dòng) · kỳ hồ sơ GV đổi khi mở từ Tổng quan → **kỳ đi theo nguồn** (XM-13) · 375 rút gọn chữ quá hạn → giữ "⚠ n quá hạn" · chevron trên dòng mở panel → bỏ; thứ tự ô cố định (Việc · Chờ duyệt · Đạt MT · Đạt Target · …); badge QL xem "⚠ 9" mờ · P2: "Chờ bạn duyệt" → "Chờ duyệt", GVCN không lặp "tôi", chip Case chia hai nhóm, rỗng bỏ công tắc, Lớp thường bỏ cột Đạt MT, "+ 27 Case" thành nút |
| 2 | **30/40** | 0 | 3 | "+ 8 S chéo chung" thừa ở hồ sơ GV dạy L · R → bỏ · T7c thiếu một GV → thêm · H7b mất chip Case → đủ 6 chip cùng thứ tự · P2: "⚠ n chưa làm", ⓘ "quá hạn tính tới hôm nay" ở Giáo viên / Lớp đang dạy, SOS 2–3 + Đạt Target trong bảng chi nhánh bấm được, "+ 3 chi nhánh" ở 375, giá trị thẻ 375 thẳng hàng, H7b có dải + kỳ + GVCN, chân panel H5 theo G2 lời 36 |

Sau vòng 2: **không còn P0 / P1** (cổng: chạm 30 → chỉ cần không P0 / P1).
P2 / P3 còn để chủ SP / PTA xem: hai nút cùng sang Công việc ở hồ sơ của chính mình ("‹ Công việc" + "Mở Công việc ›" — GIỮ thao tác cũ) · ô "Chờ duyệt 10" và đếm khối "10" cùng màn (đề bài cần cả hai) · ⓘ trong ô bấm được cả ô (mẫu web đang có) · "Tuần này" ở tab Lịch sắp tới chưa ghi mã tuần (giữ chữ web).
Máy dò (B): tong-quan 88 · ho-so-gv 78 · bang-mau (đã duyệt) 129 — gần hết là kế thừa từ `v21.css` / `bang-mau.css` hoặc báo nhầm (số chú thích `.so-mk` tương phản thấp — khung mockup; phông khoá Be Vietnam Pro / Inter; "—" là dấu ô trống); một chỗ thật (`font-size` viết thẳng ở thẻ 375) đã sửa.

## 10. Lời 37 — bỏ chữ phụ dưới số việc (đúng hạn / quá hạn)

Nguyên tắc: **mỗi ô bảng một thành phần** (một hộp số, hoặc một chữ); số chi tiết xem khi bấm hộp → panel đang có. Ô số thẻ lớn: dòng phụ **tối đa một ý, chỉ khi cần làm**. Cùng tên, cùng cách đếm ở Tổng quan · Hồ sơ GV · Phân tích GV: **% đúng hạn** · **Chưa làm** (theo kỳ, sổ nghĩa vụ) và **Bài quá hạn** (tới hôm nay, tập Trễ chấm).

Kiểm "Bài chấm quá hạn" có trùng "Chưa làm" của Chấm Test không: **KHÁC tập** → giữ cả hai. Chưa làm = bài có hạn **trong kỳ** chưa chấm (`viecDungHan` / `chamDiem` của Phân tích GV); Bài quá hạn = mọi ô kỹ năng còn trống đã qua hạn, **tính tới hôm nay**, kể cả kỳ trước (`/tong-quan/gv-tre`, panel Nhập hộ). Ví dụ Hằng: 5 trong kỳ W1–W2 SEP, 12 tới nay. Đầu cột ghi nhóm "Tới hôm nay" + ⓘ ở đầu khối.

| Chỗ | TRƯỚC (bản mockup trước / web) | SAU | Số bỏ khỏi mặt bảng nay ở đâu |
|---|---|---|---|
| T1 Giáo viên (QL) | 3 cột: Việc đúng hạn "67 %" + "4 đúng hạn · ⚠ 2 chưa làm" · Chấm Test đúng hạn "71 %" + "12 đúng hạn · ⚠ 5 chưa làm · + 8 S chéo chung" · Bài chấm quá hạn | **A**: Việc (% đúng hạn · Chưa làm) │ Chấm Test (% đúng hạn · Chưa làm) │ Tới hôm nay (Bài quá hạn); hàng cuối "S chéo chung · chưa ai nhận" (⚠ 8 ở Chưa làm Chấm Test + Bài quá hạn) — như Phân tích GV. **B** (để chọn, T1b): mỗi nhóm một ô = hộp % + thanh mảnh đúng hạn │ làm muộn │ chưa làm + hộp đỏ ⚠ n | "n đúng hạn", "n làm muộn" → panel sổ nghĩa vụ 3 tab (bấm hộp %); "+ 8 S chéo chung" → hàng cuối bảng |
| T1 / T3 / T4 / T6 Lớp cần chú ý, Theo chi nhánh | dưới % / số: "2/3", "/ 45", "1/1" | chỉ hộp số | mẫu "2/3" → panel Đạt MT; "/ 45" → ô "Case chưa có PA" (dòng phụ "trong 45 Case đang mở") và panel Case đang mở |
| Ô số thẻ lớn (mọi vai) | "11 / việc · ⚠ 6 quá hạn" · "10 / yêu cầu · ⚠ 1 quá hạn" · "2/3 HV · 8 chưa đủ dữ liệu" · "HV" · "3 lớp" · "bài · ⚠ 37 quá hạn" · "1/1 HV" | "⚠ 6 quá hạn" · "⚠ 1 quá hạn" · "8 HV chưa đủ dữ liệu" (GIỮ: chủ SP U09 #5 "không giấu em ngoài mẫu") · (không dòng phụ) · "⚠ 37 quá hạn" · "trong 45 Case đang mở" (XM-2) · "chỉ Fast Track" (giải thích "—") | đơn vị đã rõ ở tên ô; "2/3 HV", "1/1 HV" → panel của ô; "3 lớp" → trang Kế hoạch Test (đích ô) |
| T5 / T7c Admin GV chấm quá hạn | "Listening, Reading · MB FT 101 (MT1 W1 JUL, …)" · "12 bài" · "quá hạn 68 ngày" | GV · kỹ năng · lớp · hộp đỏ ⚠ 12 · "lâu nhất 68 ngày" | danh sách lượt → panel GV (từng lượt × kỹ năng · em còn trống · Nhập hộ — XM-12) |
| T7a thẻ GV 375 | % + chữ phụ | 5 cặp nhãn – hộp (Việc % · Việc chưa làm · Bài quá hạn · Chấm Test % · Chấm Test chưa làm) | như T1 |
| H1 / H4 / H7 dải đầu hồ sơ | Chấm Test 92 % · Đúng hạn 67 · Làm muộn 0 · Chưa làm ⚠ 6 │ Việc 76 % · Đúng hạn 13 · Làm muộn 0 · Chưa làm ⚠ 4 | **Việc · % đúng hạn 76 % · Chưa làm ⚠ 4 │ Chấm Test · % đúng hạn 92 % · Chưa làm ⚠ 6** — cùng cột với bảng Giáo viên T1 | Đúng hạn, Làm muộn → panel 3 tab khi bấm % (lời 37 mới hơn R8.4 "Đúng hạn · Làm muộn · Chưa làm") |
| H1 Lớp đang dạy | "Bài chưa nhập" = "21" + "⚠ 11 quá hạn" (chữ đỏ dưới) / "2" + "hạn 16/09" | hai cột **Chưa nhập** (hộp) · **Quá hạn** (hộp đỏ) | hạn → panel bài chưa nhập của lớp |
| H3 / H4 / H7b Việc đang tồn | "34 việc · ⚠ 9 quá hạn ›" + nút-chip "Chấm điểm 7 · ⚠ 4 ›" | bảng nhỏ: Nhóm (› Công việc đúng tab) · Việc (hộp) · Quá hạn (hộp đỏ → Công việc lọc quá hạn của nhóm) + hàng Tất cả 34 · ⚠ 9 | — (giữ cả link quá hạn từng nhóm của web — thay XM-8) |
| H3 / H4 / H7b Yêu cầu đã gửi | "Chờ duyệt 5 ⚠ 1 quá hạn duyệt · Bị từ chối (60 ngày qua) 3" | bảng nhỏ: Chờ duyệt 5 · Quá hạn ⚠ 1; Bị từ chối · 60 ngày qua 3 | — |

Không đổi: Chờ duyệt (loại · em · hạn — một dòng, không chữ phụ) · dòng việc "Cần làm trước" (dòng việc chuẩn ⑤, thẻ phụ là tên em / Case — không phải chữ đúng hạn) · bảng Học thuật (ô tỉ lệ % · thanh · n/N một dòng, đã duyệt).
Ảnh so sánh: `anh/tong-quan/so-sanh-gv-truoc-a-b.jpg` (TRƯỚC web │ A │ B) + `t1ga-1440-toi.png`, `t1gb-1440-toi.png`.

## 9. Ảnh

- SAU từng khung: `anh/tong-quan/<khung>-1440-toi.png`, `-1440-sang.png`, `<khung>-375-sang.png` (t1–t7c) · `anh/ho-so-gv/<khung>-…png` (h1–h7b).
- TRƯỚC (web thật, seed): `anh/tong-quan/truoc-{ql,qt,cx,admin,ht}-{1440-toi,1440-sang,375-sang}.png` · `anh/ho-so-gv/truoc-{gv-cua-minh,ql-xem-gv}-…png`.
- **Ảnh cặp TRƯỚC │ SAU**: `anh/tong-quan/cap-<khung>-1440-toi.jpg` và `cap-<khung>-375-sang.jpg` (24 ảnh cặp; bản Sáng 1440 xem ở ảnh SAU riêng). Khung trạng thái T6 / H6 ghép với trang thường của web — web không chụp được trạng thái lỗi / tải.
- Chụp bằng chrome-headless-shell có sẵn, `document.fonts.check('600 14px "Be Vietnam Pro"')` = true; soát tự động: không phần tử tràn khung, không chữ < 12 px.
