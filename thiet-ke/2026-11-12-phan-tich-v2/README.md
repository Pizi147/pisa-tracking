# Phân tích V2 — mockup vòng 2 (chờ chủ SP duyệt)

Mở `phan-tich-v2.html` bằng trình duyệt (tự chứa, phông Google Fonts). Đặc tả: `docs/superpowers/specs/2026-11-12-phan-tich-v2-design.md` (mục 11 = sửa sau rà #1400, thắng các mục trước).
Nền hình ảnh chép nguyên từ mockup Phân tích v13 / V11 đã duyệt (token, bảng, chip SOS, panel có điểm `BangLuotPanel`, dải số `DaiChiSo`).
Dữ liệu giả: chi nhánh Monbay, dữ liệu đến 12/11/2026 (W2 NOV). Khung 1440 tối, 375 sáng (nút "Đổi sáng / tối" ở đầu tệp).

## Ảnh (`anh/`)

| Ảnh | Nội dung |
|---|---|
| `1-chi-nhanh-1440.png` | TRƯỚC Báo cáo HV (web seed) · SAU Chi nhánh FT (vòng 2: ô Thi thật, bảng 6 lớp / trang) |
| `2-thi-that-1440.png` | TRƯỚC KQ Thi thật (seed chưa có KQ thi thật nên trống — bố cục đầy đủ xem `thiet-ke/v13/anh/c1-1440-toi.jpg`) · SAU Thi thật (vòng 2: thứ tự khối mới) |
| `3-sos-1440.png` | TRƯỚC Test + SOS **và** Hiệu quả PA · SAU SOS (vòng 2: cột cân, khối PA gọn) |
| `4-giao-vien-1440.png` | TRƯỚC Phân tích GV · SAU Giáo viên (vòng 2: chỉ ẩn Xuất Excel) |
| `5…8-375-*.png` | 375 trước · sau: 5 Chi nhánh · 6 Thi thật · 7 SOS · 8 Giáo viên |
| `9-trinh-chieu-1280x720.png` | Chi nhánh ở 1280 × 720: 4 ô số + bảng 6 lớp / trang + hàng tổng + chuyển trang trong một màn |
| `khung/m-*.png` | Từng khung: A1–A6 Chi nhánh · B1–B4 SOS · C1–C4 Thi thật · D1–D4 Giáo viên · E1–E9 trạng thái (cả 27 khung chụp lại ở vòng 2) |

Khung: **A1** FT QL · **A2** lớp thường · **A3** QT Tất cả chi nhánh · **A4** máy chiếu (8 lớp, trang 1) · **A5** panel "Đạt MT" · **A6** 375 ·
**B1** FT (kèm khối PA nào hiệu quả) · **B2** lớp thường · **B3** 375 · **B4** QT xếp theo chi nhánh · **C1** ô "Đạt Target" đang chọn · **C2** ô "Tổng thể" + panel "Chưa đạt" · **C3** QT · **C4** 375 ·
**D1** QL · **D2** QT Tất cả chi nhánh · **D3** panel 3 tab · **D4** 375 · **E1** đang tải · **E2** SOS rỗng · **E3** Thi thật rỗng · **E4** lỗi · **E5** TVV không có tab Giáo viên + toast · **E6–E9** 375 tối (Chi nhánh · SOS · Thi thật · Giáo viên). Đang tải: một kiểu chung cho cả 4 báo cáo (khung xám theo hình số + bảng, E1).

## 1. Ý chủ SP → chỗ trong mockup (tự rà từng ý)

### Vòng 2 — rà mockup #1400 (plan.md mục 4, "12/11 Phân tích V2 — rà mockup #1400"; đặc tả mục 11)

| # | Lời chủ SP | Chỗ trong mockup | Đạt? |
|---|---|---|---|
| V2-1 | "Thi thật: nên là bảng thứ 2" | Hàng tab Chi nhánh · **Thi thật** · SOS · Giáo viên · Ý thức (mọi khung); trong tệp, khu C đứng trước khu B | Đạt |
| V2-2 | "Chi nhánh: nên thêm 1-2 box thông tin quan trọng nữa ở bên trái, liên quan đến thi thật" | Ô **Thi thật · trong kỳ** dưới ba ô cũ: "Đạt Target · trừ KCK" 70 % (26/37 em) và "Em thi" 48 · "Chưa có KQ 11 · hiện tại". Mỗi số bấm một lần ra danh sách, cùng hàm báo cáo Thi thật (A1, A3, A4, A6). Lớp thường không có ô này (Thi thật chỉ Fast Track) | Đạt |
| V2-3 | "lớp thì hiện 5-6 lớp 1 lần cũng được nhưng cần có dở sang trang sau khi có nhiều lớp" | Bảng Theo lớp 6 lớp / trang, "1–6 / 8 lớp · 1 2 · Trang sau ›" (mẫu `PhanTrang`); hàng tổng Monbay ở chân bảng, luôn hiện (A1, A4, A6). QT (5 chi nhánh) không cần chuyển trang | Đạt |
| V2-4 | Máy chiếu 1280 × 720 vẫn phải vừa (đặc tả 3) | A4: 4 ô số + bảng 6 dòng + hàng tổng + chuyển trang vừa một màn. Màn thấp dùng số 40 px, đệm gọn (`@media (max-height: 760px)` ở web); 1440 giữ 48 px | Đạt |
| V2-5 | "SOS: cần cân đối cột hàng hơn nhé cho nhìn chuẩn chỉnh và đẹp hơn" | B1, B4: cột theo nhóm cùng độ rộng (Kết quả 5 cột · Dưới kỳ vọng 5 cột bằng nhau · Xử lý 3 cột bằng nhau), mọi hàng (tuần, lớp con, tổng) cao 44 px, số căn giữa. B2 lớp thường 4 cột số bằng nhau | Đạt |
| V2-6 | "Bảng hiệu quả PA nên làm gọn lại, phần thời gian thường mất có vẻ không cần thiết… nên thiết kế lại" | Khối PA một thẻ: đầu thẻ "PA có kết quả 9 · có cải thiện 6 · 67 %"; hai bảng cạnh nhau (PA do GV thêm: vấn đề → loại PA, "Nên dùng" · PA theo quy chế). Bỏ "Thời gian thường mất", bỏ dải 4 ô và ô "Chưa tính" (vào ⓘ) | Đạt |
| V2-7 | "để 2 bảng theo kĩ năng và theo GV lên trên ngay dưới các thông tin chính, vì theo lớp rất ít…" | C1: số → **Từng kỹ năng + Theo GV** cạnh nhau → Theo lớp → Danh sách kết quả. 375 (C4) cùng thứ tự | Đạt |
| V2-8 | "Theo GV thì không cần tuần dạy… các con số vượt đạt chưa đạt cần là con số hẳn hoi và bên dưới có thể có thêm phần trăm" | Theo GV bỏ cột Tuần dạy và trọng số; Vượt · Đạt · Chưa đạt là số em nguyên (chữ chính), % nhỏ bên dưới. Từng kỹ năng, Theo lớp cũng vậy. ⓘ: "Mỗi GV đếm em mình từng dạy kỹ năng đó có KQ trong kỳ, trừ KCK." | Đạt |
| V2-9 | "bảng danh sách kết quả bên dưới các cột đang rất thiếu cân đối" | Danh sách: Học viên 20 % · Ngày thi 7 % · L R W S OVR Target mỗi cột 6,5 % · Kết quả 17 % · Bước tiếp 17 %; không còn khoảng trống lệch bên phải | Đạt |
| V2-10 | "Bảng GV tạm ổn" | D1–D4 giữ như vòng 1 (chỉ ẩn Xuất Excel — PTA chốt) | Đạt |
| V2-11 | PTA chốt XM vòng 1 | Vượt / Chưa đạt mọi nơi · Xuất Excel Chi nhánh / Giáo viên **ẩn** tới PR Excel (A1–A6, D1–D4, E1, E4, E5 không có nút) · toast khi về tab đầu (E5) · giữ ⚠ quá hạn, đỏ Chưa làm, cỡ 48 / 40, SOS lớp thường | Đạt |

### Vòng 1

| # | Lời chủ SP (plan.md mục 4, 12/11) / đặc tả | Chỗ trong mockup | Đạt? |
|---|---|---|---|
| 1 | "Báo cáo cần trực diện, không cần quá dày… các con số không nên trùng nhau trong các báo cáo chính" | 4 báo cáo, mỗi báo cáo 3–6 số đầu + 1 bảng chính; mục 2 dưới đây chứng minh không số nào lặp | Đạt |
| 2 | "Xuất file excel cho tất cả các phần báo cáo" · "để sau khi chốt mockup" | Vị trí chung: cuối phải hàng lọc (1440), nút vuông 44 cạnh ô đoạn đầu (375). Vòng 2: SOS, Thi thật giữ nút đang có; Chi nhánh, Giáo viên **ẩn tới PR Excel** (PTA chốt), nút sẽ vào đúng chỗ đó | Đạt (vị trí) |
| 3 | "Bảng Chi nhánh cần có những phần số quan trọng to hơn… trình chiếu" | A1: số 48 px, nhãn 17 px, dòng phụ 15 px, chữ sáng. A4: 4 ô số + bảng Theo lớp vừa 1280 × 720 không cuộn | Đạt |
| 4 | "SOS… bố cục khá giống với bảng SOS hiện tại là ok, không cần 'lên lại kỳ vọng'" | B1 giữ dải số + bảng Theo tuần, nhóm cột, dòng con, ⋯, chip SOS; không có số "Lên lại kỳ vọng" | Đạt |
| 5 | "Tôi cần số liệu 'không thi' thật" | C1 ô **Không thi** (trong kỳ) + chip "Không thi" trong danh sách; ô "Không thi" khi nhập KQ đã có sẵn (đặc tả 5.1) | Đạt |
| 6 | "GV KCK thì không tính vào số chính, nhưng vẫn cần có kết quả" · "KCK… bao gồm… Warning letter 2" | Số to **Đạt Target · trừ KCK**; em KCK / WL 2 vẫn trong Danh sách kết quả với chip **KCK** / **WL 2** (C1, C4) | Đạt |
| 7 | "Không cần số 'sau thi'" | Không có số Sau thi; cột Bước tiếp giữ, chỉ đọc | Đạt |
| 8 | "Vẫn cần số liệu tổng thể vì pass rate tổng thể vẫn cần thiết… dễ nhìn, không quá nhiều số cùng kể một câu chuyện" | Ô **Tổng thể · gồm KCK** cạnh Đạt Target, nhỏ hơn; một thanh duy nhất | Đạt |
| 9 | "Toggle… ngay khu vực 2 ô bên trên thì số liệu sẽ thay đổi" | Hai ô là công tắc (`aria-pressed`, viền sáng + "✓ đang xem"); bấm ô → thanh Vượt · Đạt · Chưa đạt đổi (C1: 6 · 12 · 7 → C2: 7 · 13 · 11). Bấm thử được trong tệp HTML | Đạt |
| 10 | "KCK… cho vào danh sách tổng hợp điểm thi/ danh sách thi là được" · đổi chữ "có cam kết", "mọi em có target" | Không thẻ / đoạn thanh KCK. Hai chữ cấm không xuất hiện (đã tìm trong tệp). Ⓘ: "KCK gồm em không cam kết Target và em đã nhận WL 2. Em không có Target không tính vào %." | Đạt |
| 11 | "Bấm 1 lần thôi thì ra box thông tin/ panel… hạn chế bấm nhiều lần" | Mọi số, đoạn thanh, ô bảng là một link mở panel. A5 / C2 / D3: đầu panel đã chia sẵn theo lớp (chip "MB FT 101 10…"), D3 có sẵn 3 tab. Không có thông tin chỉ hiện khi rê chuột | Đạt |
| 12 | "Báo cáo chi nhánh… theo tháng, còn lại theo 2 tuần… vẫn để phần khung tgian 2 tuần đầu cuối như bây giờ" | Chi nhánh W1 NOV → W4 NOV; SOS / Thi thật / Giáo viên W1 NOV → W2 NOV; ô Toàn bộ · Chọn khoảng tuần · tuần → tuần giữ nguyên | Đạt |
| 13 | Đặc tả 6: sổ nghĩa vụ, Chưa phân công, Tất cả chi nhánh | D1 Chấm Test và Việc (Đúng hạn · Làm muộn · Chưa làm, "+ 8 S chéo chung"), hàng Chưa phân công; D2 mỗi người một dòng, ▸ tách chi nhánh | Đạt |
| 14 | Hàng tab mới | Vòng 2: Chi nhánh · Thi thật · SOS · Giáo viên · Ý thức (mọi khung) | Đạt |
| 15 | Đủ trạng thái; QT Theo chi nhánh / QL Theo lớp | A3, B4, C3, D2 (QT) · A1, B1, C1, D1 (QL) · E1 tải · E2, E3 rỗng · E4 lỗi · E5 TVV · E6–E9 375 tối | Đạt |
| 16 | Không chú thích tĩnh, giải thích ở ⓘ | Cách tính đều ở ⓘ. Còn dòng mẫu 2–3 chữ dưới số ("38/61 HV", "không vào %", "đã qua ngày thi", "chưa có GV") — cùng kiểu dòng mẫu `DaiChiSo` đang có, ghi đơn vị / phạm vi, không phải câu giải thích | Đạt |
| 17 | Thời gian theo mã tuần | Khoảng, tuần, MT đều mã tuần; chỉ ngày thi, hạn bài ở panel ghi ngày (CLAUDE.md cho phép) | Đạt |
| 18 | Không đổi luật nghiệp vụ, không đổi quyền | Không luật mới; tab Giáo viên vẫn theo `nav.phanTichGv` (E5) | Đạt |

## 2. Nhà của từng số (không số nào lặp giữa 4 báo cáo, trừ một ngoại lệ chủ SP muốn)

| Số (chỉ số + cách chia) | Nhà | Đơn vị · kỳ | Hàm / nguồn (dùng lại) |
|---|---|---|---|
| Học viên đang học (+ theo lớp / chi nhánh) | **Chi nhánh** | HV · hiện tại | `/tong-quan/v5` (ô HV của Tổng quan) |
| Vào · Kết thúc | **Chi nhánh** (dòng phụ ô HV) | em · trong kỳ | **mới**: lần ghi danh đầu ở chi nhánh (`enrollments.started_at`) · `students.finished_at` (đặc tả 9.3) |
| Đạt MT (FT) / Đạt Test (lớp thường) | **Chi nhánh** | HV · trong kỳ | `datMt` / hàm "Đạt Test" (đặc tả 9.2) |
| Tiến bộ (ô) + Tiến bộ theo kỹ năng Tăng · Giữ · Giảm | **Chi nhánh** | lượt kỹ năng · trong kỳ | `baoCao.tienBo` |
| Cuối khoá Đạt · 60–69 · 50–59 · < 50 | **Chi nhánh** (lớp thường) | HV có Final · trong kỳ | cột Final Test của bảng Test lớp thường hiện nay (dời sang) |
| **Ngoại lệ có chủ ý (đặc tả 11):** Đạt Target thi thật · trừ KCK · Em thi · Chưa có KQ | **Thi thật**, chép lên ô **Chi nhánh** để trình chiếu | em · kỳ (Chưa có KQ hiện tại) | cùng hàm `/phan-tich/thi-that` (kèm trong lần tải Chi nhánh); bấm mở cùng danh sách |
| Lượt MT · SOS 1 · 2 · 3 · Thiếu điểm · Dưới kỳ vọng theo kỹ năng | **SOS** | lượt / HV · trong kỳ | `/phan-tich/tong-hop` |
| Chưa chốt PA · HV - Case · Đang xử lý | **SOS** | Case · hiện tại / trong kỳ | `/phan-tich/tong-hop` (thay ô "Case có PA" cũ: Case có PA = Case − Chưa chốt PA) |
| Lớp thường: Bài kiểm tra · Progress 1 môn trượt · ≥ 2 môn trượt · Thiếu điểm | **SOS** | bài / HV · trong kỳ | `/phan-tich/tong-hop?ct=thuong` |
| PA có kết quả · Có cải thiện · bảng PA do GV thêm · PA theo quy chế | **SOS** (khối PA nào hiệu quả) | PA · trong kỳ | `/phan-tich/hieu-qua-pa` (thay ô "PA cải thiện" cũ) |
| Đạt Target (trừ KCK) · Tổng thể (gồm KCK) · Vượt · Đạt · Chưa đạt | **Thi thật** | em · ngày thi trong kỳ | `/phan-tich/thi-that` + cờ KCK / WL 2 |
| Không thi | **Thi thật** | em · trong kỳ | `/phan-tich/thi-that` |
| Chưa có KQ | **Thi thật** | em · **hiện tại** | **mới**: `trangThaiSauThi = da_thi_cho_kq` (đặc tả 9.9) |
| Từng kỹ năng · Theo GV (số em, không trọng số tuần) · Theo lớp / chi nhánh · Danh sách kết quả | **Thi thật** | em · trong kỳ | `/phan-tich/thi-that` (`thongKeThiThat`; Phân tích GV / hồ sơ GV đổi theo, một hàm) |
| Chấm Test: Đúng hạn · Làm muộn · Chưa làm · S chéo chung | **Giáo viên** | bài · hạn trong kỳ | sổ nghĩa vụ (`/phan-tich/giao-vien`) |
| Việc: Đúng hạn · Làm muộn · Chưa làm | **Giáo viên** | việc · hạn trong kỳ | sổ nghĩa vụ |
| Chưa phân công | **Giáo viên** | bài · trong kỳ | sổ nghĩa vụ (gv = 0) |
| Đạt kỳ vọng Test của học trò GV | **Giáo viên** | **lượt** kỹ năng GV dạy · trong kỳ | cột đang có ở `server/src/phanTich/giaoVien.ts` (đặc tả 9.1) |

**Cặp dễ tưởng trùng nhưng không trùng:**
- *Đạt MT* (Chi nhánh, đếm **HV** của lớp / chi nhánh) ≠ *Đạt kỳ vọng Test* (Giáo viên, đếm **lượt** kỹ năng của học trò từng GV). Tên ghi kèm đơn vị: "Đạt MT · HV" / "Đạt kỳ vọng Test · lượt".
- *Chưa chốt PA* (SOS, Case đang mở chưa có PA, hiện tại) ≠ *Việc · Chưa làm* (Giáo viên, nghĩa vụ có hạn trong kỳ đã quá hạn của từng người).
- *Thi thật theo GV* chỉ ở Thi thật; Giáo viên có lối "Thi thật theo GV ›".
- *Cuối khoá* chỉ ở Chi nhánh; SOS lớp thường bỏ nhóm cột Final Test và cột "Đạt hết" của Progress.

**Bỏ khỏi 4 báo cáo:** Kết quả MT so Target (MT0 → MT3+ · Thi thật) · Đạt Target thi thật và Thi trong kỳ ở Báo cáo · Case có PA, PA cải thiện ở Báo cáo · ô / cột "Đạt" ở SOS ·
Tiến bộ, HV cần chú ý, Case có PA, PA cải thiện, Kết quả thi thật ở Phân tích GV · số "Sau thi" · "Lên lại kỳ vọng" · vòng 2: "Thời gian thường mất", "Chưa tính" ở khối PA · cột "Tuần dạy" và trọng số tuần ở Thi thật theo GV. **Tổng quan giữ nguyên** (không phải báo cáo chính).

## 3. Thao tác TRƯỚC → SAU (6 tab cũ)

| Tab cũ | Thao tác trước | Sau (V2) | Lý do nếu đổi |
|---|---|---|---|
| Chung | Hàng tab 6 mục | 5 mục Chi nhánh · Thi thật · SOS · Giáo viên · Ý thức | gộp (đặc tả 2, 11) |
| Chung | TVV / CX mở `?goc=giao-vien` | Về tab đầu + **toast** "Tab Giáo viên chỉ QL, Quản trị xem — đang mở Chi nhánh" (E5) | bị chặn thì nói lý do (PTA chốt) |
| Chung | Link `?goc=` cũ | `bao-cao` → Chi nhánh · `tong-hop` → SOS · `hieu-qua-pa` → SOS, cuộn tới khối PA (`#khoi-pa`) · `ket-qua-thi` → Thi thật · `giao-vien` → Giáo viên (`replace`) | giữ |
| Chung | Khoảng tuần giữ khi đổi tab (C29); ô Toàn bộ · Chọn khoảng tuần | Giữ; chỉ mặc định khác: Chi nhánh tháng, còn lại 2 tuần | lời chủ SP 12/11 |
| Chung | QT chọn chi nhánh ở đầu trang; bấm tên chi nhánh trong bảng → lọc | Giữ (A3, C3) | — |
| Báo cáo HV | Bấm số → panel; In (A4 ngang) | Giữ. Xuất Excel ẩn tới PR Excel | PTA chốt |
| Báo cáo HV | — | **Mới**: bảng Theo lớp chuyển trang (6 lớp / trang, hàng tổng luôn hiện); ô Thi thật bấm → danh sách | đặc tả 11 |
| Báo cáo HV | Bảng Kết quả MT: bấm ô → panel em | **Bỏ bảng**; điểm + kỳ vọng từng em xem ở panel ô "Đạt MT" (A5) | hai thước đo trên một bài dễ rối; dòng Thi thật trùng Thi thật (đặc tả 3) |
| Báo cáo HV | Tiến bộ theo kỹ năng: bấm ô → panel | Giữ | — |
| Báo cáo HV | Rỗng → "Xem Toàn bộ" | Giữ | — |
| Test + SOS | Xếp theo (tuần / lớp / đợt / chi nhánh) | Giữ ở hàng lọc | — |
| Test + SOS | Mở dòng con (`?mo-hang=`), mở sẵn tuần trước | Giữ | — |
| Test + SOS | ⋯ : Cột hiện · Xuất kết quả từng lượt · Excel Mock | Giữ, ⋯ đứng trước Xuất Excel | Xuất Excel luôn cuối hàng |
| Test + SOS | Xuất Excel Test + SOS | Giữ (nút cuối hàng) | — |
| Test + SOS | Bấm chip SOS / ô → panel bảng có điểm | Giữ | — |
| Test + SOS | Thẻ / cột "Đạt" | **Bỏ** | Đạt kỳ vọng ở Chi nhánh (không trùng) |
| Test (lớp thường) | Cột Progress "Đạt hết" + nhóm Final Test | **Bỏ khỏi SOS** → Đạt Test và Cuối khoá ở Chi nhánh | không trùng (đặc tả 4) |
| KQ Thi thật | Lọc lớp · Xuất Excel Thi thật · phân trang · Mỗi trang | Giữ | — |
| KQ Thi thật | Thẻ Exceed · Đạt · Fail bấm → panel | Thành **đoạn thanh** bấm → panel (một lần) | đặc tả 5.2 |
| KQ Thi thật | Từng kỹ năng, Theo GV bấm ô → panel; "Xem n GV còn lại" | Giữ; hai bảng ngay dưới dải số. Theo GV bỏ cột Tuần dạy (ô % theo tuần → số em, % nhỏ) | đặc tả 11 |
| KQ Thi thật | — | **Mới**: hai ô công tắc; ô Chưa có KQ (bấm → danh sách để gọi hỏi); bảng Theo lớp / chi nhánh | đặc tả 5 |
| Hiệu quả PA | Mở vấn đề ▸ · bấm số → panel · thẻ 4 số | Giữ mở vấn đề + bấm số; thành khối "PA nào hiệu quả" cuối trang SOS. 4 thẻ → 2 số ở đầu khối; **bỏ** Thời gian thường mất, Chưa tính (vào ⓘ) | chủ SP: gọn lại, "thời gian thường mất… không cần thiết" |
| Hiệu quả PA | Lọc `gv` từ hồ sơ GV (chip "GV: …" ✕) | Giữ ở hàng lọc của SOS; link hồ sơ GV mở SOS + cuộn khối PA | gộp tab |
| Phân tích GV | Tìm GV · bấm số → panel 3 tab · bấm tên → hồ sơ GV · phân trang | Giữ (D1, D3) | — |
| Phân tích GV | Tất cả chi nhánh | Giữ, mỗi người một dòng, ▸ tách chi nhánh (D2) | sổ nghĩa vụ 1.7 |
| Phân tích GV | Công tắc Gọn / Đầy đủ (`?cot=day`) | **Bỏ**; link cũ vẫn vào màn (bỏ tham số) | bảng chỉ còn 7 cột số |
| Phân tích GV | — | **Mới**: lối "Thi thật theo GV ›" (Xuất Excel ẩn tới PR Excel) | đặc tả 6 |
| Ý thức | Mọi thao tác | Giữ nguyên | — |

Không mất thao tác nào ngoài các dòng **Bỏ** có lý do ở trên.

## 4. Turso — số câu / dòng đọc mỗi lần mở (đo trên seed 11/11, `PISA_DEM_SQL=1`, QL Monbay)

| Báo cáo | Đường (dùng lại) | Hôm nay đo (seed) | V2 ước | Ghi chú |
|---|---|---|---|---|
| Chi nhánh FT | `/tong-quan/v5?kemBaoCao=1` + `/bao-cao/ket-qua-mt` | 60 + 14 = **74 câu, 3 254 dòng** | ≤ 40 câu với cờ chỉ tính phần Chi nhánh (PTA chốt XM-2) | bỏ Kết quả MT (−14 câu, −353 dòng) và phần Tổng quan không dùng; +1 câu "vào · kết thúc"; + ô Thi thật = phần tổng của `/phan-tich/thi-that` (~3 câu, kèm cùng GET). Chuyển trang bảng Theo lớp dùng dữ liệu đã nạp, không thêm request |
| Chi nhánh LT | `/tong-quan/v5?ct=thuong&kemBaoCao=1` | 36 câu, 2 241 dòng | ~37 câu | + Cuối khoá dùng lại hàm Final của Test lớp thường (+1 câu theo lô) |
| SOS | `/phan-tich/tong-hop` + `/phan-tich/hieu-qua-pa` | 8 + 8 = 16 câu, 248 dòng | như cũ | hai GET song song như hai tab cũ, một lần khi mở |
| Thi thật | `/phan-tich/thi-that` | 5 câu (seed không có KQ) | +2 câu, Theo GV nhẹ hơn | cờ WL 2 (`discipline_measures`, một câu theo lô em), Chưa có KQ (một câu theo `trangThaiSauThi`); bỏ trọng số tuần dạy → không đọc lịch sử phân công theo tuần |
| Giáo viên | `/phan-tich/giao-vien?cn=` | **104 câu, 2 688 dòng** (cột cũ) | ~6–10 câu | bỏ Tiến bộ / HV cần chú ý / Case / PA / KQ thi → còn sổ nghĩa vụ (QT không cn đo 5 câu, 266 dòng) + Đạt kỳ vọng Test |
| Panel (bấm số) | `/…/o` | 3–25 câu | như cũ | chỉ đọc khi bấm, đúng tập ô |

Ước theo ngày: ~40 lần mở báo cáo / chi nhánh / ngày × 5 chi nhánh × ≤ 3 000 dòng ≈ **0,6 triệu dòng / ngày** (trần 15 triệu). Không cần cảnh báo; Giáo viên V2 nhẹ hơn hẳn hôm nay.

## 5. [XM]

**Vòng 1 — PTA Plan đã chốt 12/11:** XM-1 đổi chữ Vượt / Chưa đạt **mọi nơi** (hồ sơ HV, Excel Thi thật) · XM-2 **có cờ** chỉ tính phần Chi nhánh cần · XM-3 Xuất Excel Chi nhánh / Giáo viên **ẩn tới PR Excel** · XM-4 SOS lớp thường như mockup · XM-5 giữ ⚠ quá hạn · XM-8 giữ đỏ Chưa làm · XM-10 giữ ngoại lệ cỡ 48 / 40 · XM-11 **có toast** khi về tab đầu (E5) · XM-6, XM-7, XM-9 như đề xuất (máy chiếu F11; vào · kết thúc chỉ ở ô số; cột "Chưa có KQ · hiện tại").

**Vòng 2 — còn hỏi:**
1. **[XM-12] Ô Thi thật ở Chi nhánh theo khoảng của Chi nhánh (tháng),** nên khác số mặc định của tab Thi thật (2 tuần) — vd 70 % (26/37, W1–W4 NOV) và 72 % (18/25, W1–W2 NOV). Cùng hàm, khác kỳ; chọn cùng khoảng thì số khớp. Đề xuất giữ (ô theo kỳ của trang đang xem).
2. **[XM-13] "Em thi" ở Chi nhánh** = em có ngày thi trong kỳ (gồm KCK, gồm Không thi): 48 = 37 có KQ trừ KCK + 9 KCK + 2 Không thi. Muốn chỉ em có KQ thì đổi nhãn "Có KQ". Đề xuất giữ "Em thi" (buổi họp hỏi bao nhiêu em đi thi).
3. **[XM-14] Màn thấp (cao ≤ 760 px) thu số Chi nhánh 48 → 40 px** để 4 ô vừa 720 (A4). Ở 1440 × 900 vẫn 48 px.
4. **[XM-15] Theo GV bỏ trọng số tuần dạy** áp cả Phân tích GV / hồ sơ GV (một hàm `thongKeThiThat`) — đặc tả 11 đã ghi; PR Thi thật đổi phép kiểm của hàm này.

## Ghi cho PR code (web-design-guidelines)

- Đoạn thanh Vượt · Đạt · Chưa đạt và ô số mở panel là `<button>` (mockup vẽ bằng `<a>` cho gọn); tên, mã lớp, "Thi thật theo GV ›", "Hồ sơ GV ›" là `<a>` thật.
- Ô chọn ở hàng lọc vẫn là `<select>` gốc (`OChon`), có màu nền / chữ rõ cho Windows tối. Nút Xuất 375 chỉ biểu tượng → `aria-label="Xuất Excel"` (mockup đã có).
- Hai ô công tắc: `aria-pressed`, cùng một `role="group"` có nhãn; đổi ô không gọi máy chủ (hai bộ số đã trong cùng lần tải).
- Số trong bảng `tabular-nums` (đã có trong `Bang`). Chữ đang tải kết thúc bằng "…".

## Cổng chất lượng

- **Vòng 2 (rà #1400):** sửa theo đặc tả mục 11, chụp lại cả 27 khung + ảnh trước | sau; tự rà bảng V2-1…V2-11 (11 / 11 đạt), tự cộng lại các dòng tổng (Chi nhánh 8 lớp = 105 HV · 43/71 · 59/149; Theo GV mỗi dòng Vượt + Đạt + Chưa đạt = số em).
- **Critique** vòng 1 (impeccable, Assessment A chạy bằng agent riêng, đọc ảnh từng khung): lần 1 **30/40** (P1: số QT của Thi thật / Tiến bộ lệch; "Cách tính" tĩnh trong panel) → sửa hết → lần 2 **33/40**, **không còn P0 / P1**; các P2 / P3 vòng 2 đã sửa (thẻ Chưa phân công 375, tuần MT chưa tới trong panel, nhãn "Xem" 375) hoặc ghi ở XM-6, XM-11. Dừng theo cổng (chạm 30 → tối đa 2 vòng).
- **Detector** `impeccable detect`: 0 lỗi nặng; 3 cảnh báo phông là báo nhầm ("vietnam pro" = Be Vietnam Pro; Consolas chỉ ở phần ghi chú mockup); các nhắc cỡ chữ ngoài thang = XM-10; màu ngoài bảng = nền giấy của phần ghi chú mockup.
- **Tự rà từng ý:** bảng mục 1 (18 / 18 đạt). Tự cộng lại mọi dòng Tổng / Toàn hệ thống khớp các ô số.
