# PHỐI HỢP SOS V2 — mockup 11/11 (session PHOI-HOP-SOS-V2)

Mockup: [`phoi-hop-sos-v2.html`](phoi-hop-sos-v2.html) (thêm `?chi=k1` … `?chi=k8` để xem một khu). Ảnh web hiện tại: `anh/truoc-*.jpg`.
Thao tác TRƯỚC → SAU: [`khop-khac.md`](khop-khac.md). Thế giới hình ảnh: CSS chung V8 + U10 + Ý thức V2 (#1316), chỉ thêm phần riêng.

## 0. Luật dùng cho mockup

| Nguồn | Luật |
|---|---|
| Chủ SP 11/11 (qua PTA, mới nhất) | Mọi việc Phối hợp SOS là của **GVCN**; **QL** thấy và bấm thẳng như GVCN (không nút / chữ "làm thay"). |
| như trên | **Meeting CX/GĐCN (sau Mock)** (HV và HV / PH): GVCN xác nhận → **sinh việc cho TVV của em**: báo gia đình, sắp xếp buổi họp, báo lại kết quả — **như Báo PH Ý thức**. |
| Báo PH Ý thức (áp theo "như phần ý thức") + **PTA chốt 11/11** | **Nội dung bắt buộc** khi GVCN xác nhận · hạn TVV **5 ngày** từ ngày GVCN xác nhận (N34; lưu ý mã `HAN_BAO_PH_NGAY` hiện = 4 — PR code đọc lại N34 rồi dùng chung một hằng) · em **chưa có TVV → GVCN** báo ("Chưa có TVV — GVCN báo") · form Kết quả (Đã báo PH / Chưa liên hệ được) · Ngày · Nội dung · "Chưa liên hệ được" giữ việc mở, đếm lần. |
| Giữ (không đổi) | Bảng việc theo mốc SOS (`DEFAULT_SOS_COORDINATION`) · hạn Meeting CX bước GVCN (`hanPhoiHop`, tạo + 5) · Sửa hạn (N34) · Bỏ việc / Khôi phục / Đưa lại · + Thêm việc · Tệp · Báo PH qua TVV lớp thường (GVCN). |
| CAU-HINH-CASE-SOS | "ai làm / hạn / bắt ghi KQ / bước TVV" sẽ đọc từ cấu hình mốc SOS — code KHÔNG viết cứng; mặc định ngày đầu = bảng trên (đã báo session đó). |

## 1. Recon trên seed (14/09/2026, GVCN Trần Ngọc Hà · MB FT 101) — HIỆN TRẠNG ĐÃ KIỂM

**Sinh từ đâu:** chấm xong lượt Mock có SOS → `syncSosCoordination` (`server/src/yThuc/phoiHop.ts`) điền sẵn việc theo bảng §5.3 (SOS 1: Trao đổi ngắn HV + gia đình · SOS 2: gia đình + GVCN meeting · SOS 3: + Meeting CX/GĐCN MT2–MT4); sửa điểm → hồi / bỏ việc điền sẵn; GVCN tự thêm được. Lớp thường: `dongBoBaoPh` sinh "Báo phụ huynh qua TVV".
**Ai làm:** `canManageDiscipline` = GVCN lớp em đang học + QL. TVV, GVBM chỉ xem. **Hạn:** chỉ Meeting CX (tạo + 5, sửa được N34); việc khác không hạn.

| Nơi | Hiện ra thế nào | Số bước làm một việc | Lệch / rối (thấy trên seed) |
|---|---|---|---|
| Công việc GVCN | tab **Case học thuật**, mục "Phối hợp SOS", **một dòng / lớp** "Phối hợp SOS · 10 lượt", phụ "MB FT 101 · Phối hợp SOS · 10 HV" + 3 thẻ điểm (tên · MT · ✗ 5.5 / 6.0 · trượt…) + "+7 lượt nữa" | 3 (Phối hợp → Xác nhận → Lưu) | "Phối hợp SOS" lặp 3 lần (mục, tên dòng, chip); "10 lượt" vs "10 HV"; dòng cao gấp 3 dòng khác; tên, lượt, điểm, kỹ năng cùng một cỡ chữ → "trường khác nhau mà nhìn y như nhau" |
| Panel Công việc | `/classes/:id/phoi-hop-sos`, mỗi em một thẻ: "1/2 việc hoàn thành" + "Học thuật theo dõi ở bảng kỹ năng" + "Đang làm"; mỗi việc: tên, ngày, **"Sửa · Đưa lại Cần xử lý · Bỏ việc…"** (3 nút) + "Xong"; việc chờ: "không hạn" + Xác nhận + ⋯; "+ Thêm việc" mỗi em | form: Ngày · Người · Ghi chú (tuỳ chọn) · + Tệp · + Liên kết · Lưu | **Kết quả (ghi chú) KHÔNG hiện ở đâu** — chỉ ngày; tiêu đề panel lặp mã lớp 2 lần |
| Công việc tab Ý thức | mục "Xử lý vi phạm" › dòng "Xử lý vi phạm" (lặp tên mục) · chip "1 em quá hạn" lặp cột hạn đỏ · khay em: chip "3 vi phạm · bậc kế tiếp: Report 2 · Ý thức" | — | cùng lỗi phân cấp: tên mục = tên dòng, chip dài lặp |
| Hồ sơ lớp › Ý thức & Phối hợp › Phối hợp SOS | đầu em: tên · SOS · MT · ✗ điểm · trượt · "1/2 việc xong" · + Thêm việc; việc như panel | như panel | không thấy kết quả; GVBM thấy "Xong" nhưng không biết đã làm gì |
| Hồ sơ HV › Phối hợp SOS | như hồ sơ lớp, đầu lượt "SOS 2 · MT2 · ✗ 6.0 / 6.5" + "Học thuật ›" | như panel | như trên |
| Chuông | không có tin Phối hợp SOS FT (chỉ Báo PH qua TVV lớp thường, kind `phoi_hop`) | — | — |
| Tổng quan / Phân tích | chỉ số `phoi-hop-qua-han` (Meeting CX quá hạn), `phoi-hop-*`; sổ nghĩa vụ đếm Meeting CX đúng hạn (`viecDaXong`) | — | giữ, cùng hàm hạn |
| TVV | **không có việc Phối hợp nào** | — | trái lời chủ SP |

## 2. Ý chủ SP → chỗ trong mockup (tự rà từng ý)

| # | Ý (nguyên văn / đã duyệt) | Chỗ | Đạt? |
|---|---|---|---|
| 1 | "đơn giản là thấy những việc cần làm, xác nhận đã làm và báo cáo kết quả" | K1 dòng = việc thật · panel ①②③ · Xác nhận tại dòng: Ngày + Nội dung | đạt |
| 2 | "TVV thì cần thấy task trong công việc, và nhập luôn kết quả trên công việc" (luật mới: chỉ Meeting CX) | K3 (1440) · K4c (375) · K7b (hồ sơ HV 375) | đạt |
| 3 | "khi vào HS lớp / HS HV thì cũng thấy tương tự" | K5 · K6 · K7 cùng ô ①②③, nút tại ② | đạt |
| 4 | "khung bên trái… trường thông tin khác nhau nhưng nhìn y như nhau… chú ý cả phần ý thức" | K1 mục Vi phạm + Phối hợp SOS: tên 15/600 · số em 13 mờ · lớp chữ mờ không khung · chip tên tròn viền · hạn cột riêng · một nút · cao đều 64 px | đạt |
| 5 | "ý thức thì đừng nhét thêm điểm" | ô việc Ý thức không điểm; panel Ý thức không đổi (YTHUC-GON) | đạt |
| 6 | "phần phối hợp SOS cũng cần phải hiển thị kết quả" | cột ③ ở panel, hồ sơ lớp, hồ sơ HV; Meeting CX = kết quả TVV báo | đạt |
| 7 | Không điểm / kỹ năng trượt trong ô việc; điểm chỉ một dòng chữ phụ đầu khối em | K1 ô việc · `diem1` ở panel / bảng | đạt |
| 8 | Tên em thành chip ≤ 2 + "+n", không cắt tên | K1 (không đủ chỗ → 1 + "+n") | đạt |
| 9 | Việc Phối hợp SOS sang tab "Ý thức & Phối hợp" | K1 tab | đạt |
| 10 | Hoàn tác 10 s | K2a (Kiều Thảo Nhi), K5 | đạt |
| 11 | 1440 + 375, tối, đủ trạng thái: chưa làm · đã xác nhận chưa kết quả · có kết quả · quá hạn · nhiều em · rỗng | chưa làm K1/K5 · "Chưa ghi kết quả" K5 (Ngô Bảo Châu) · có KQ K1/K5/K6 · quá hạn K2/K5 · nhiều em K1/K5 · rỗng K8 · chờ TVV K2/K5 · chưa liên hệ được K3 | đạt |
| 12 | Không chú thích tĩnh (bo-chu-thich) | chỉ giữ hậu quả cần thiết: "Lưu xong: việc cho TVV…, hạn 5 ngày" (K2b) | đạt |
| 13 | QL làm thẳng, không "làm thay" | ⓘ: QL thấy cùng màn K1/K5 (cùng nút) | đạt (không vẽ riêng — giống hệt GVCN) |

## 3. Turso — đọc bao nhiêu khi mở trang

| Chỗ | Trước | Sau |
|---|---|---|
| `/my-work` dòng Phối hợp GVCN | `dongPhoiHopLop`: 1 câu việc + 1 lô thẻ điểm ≤ 3 lượt / lớp | cùng 1 câu việc (đã đọc `x.kind`) chia theo (lớp, loại việc); thẻ điểm **bỏ** → tên em ≤ 2 / dòng từ `students` cùng câu (JOIN). **Ít hơn**: bỏ lô điểm (`theSosCuaLuot`, ~3–4 câu) |
| `/my-work` việc TVV Meeting CX | — | +1 câu: việc TVV chưa xong của TVV đó (chỉ mục theo `user_id`, như Báo PH) — vài chục dòng |
| Panel Công việc | `/classes/:id/phoi-hop-sos` khi bấm (`turnsOf` ~10 câu) | giữ đường, chỉ lọc loại việc ở web (một request khi mở panel, không thêm) |
| Hồ sơ lớp / HV | `/classes/:id/phoi-hop-sos`, `/students/:id/phoi-hop-sos` | **giữ một request**; Nội dung (`note`) đã có trong `shapeAction` — chỉ hiện lên; kết quả TVV Meeting CX nạp **theo lô** cùng câu (JOIN bảng việc TVV theo `action_id`), không request theo dòng |
| Sau khi Lưu | `invalidate('/classes','/students')` | chỉ tải lại phần vừa đổi (dòng / panel) |

Ước: không tăng đọc (bỏ lô thẻ điểm bù câu TVV mới). Code đo trước → sau ở `tocDoDuong.ts`.

## 4. [XM] — cần PTA / chủ SP chốt

1. ĐÃ CHỐT (PTA 11/11): Nội dung bắt buộc khi GVCN xác nhận. Còn hỏi: Meeting CX bước GVCN — mockup để "Nội dung gửi TVV" **tuỳ chọn** (kết quả do TVV ghi ≥ 10 ký tự); muốn bắt buộc cả bước này thì báo. Việc xác nhận trước PR không có Nội dung → "Chưa ghi kết quả · Ghi", không chặn.
2. ĐÃ CHỐT (PTA 11/11): hạn TVV 5 ngày · em chưa có TVV → GVCN báo.
3. **Một dòng mỗi (lớp × loại việc)** ở Công việc → số "n việc" trên menu tăng (CP FT 131: 1 → 4). Mockup chọn vậy để thấy đúng việc cần làm; muốn giữ một dòng / lớp thì báo.
4. Tab Ý thức & Phối hợp gộp mục "Xử lý vi phạm / Xem vi phạm / Ghi đã thực hiện / Xác nhận cấp bậc" thành **một mục "Vi phạm"** (tên dòng nói loại việc) — tránh tên mục = tên dòng.
5. Hoàn tác 10 s của Meeting CX = gỡ cả việc TVV vừa sinh; sau 10 s "Đưa lại Cần xử lý" (⋯) khi TVV **chưa** ghi → huỷ việc TVV; TVV đã ghi → giữ kết quả TVV, chỉ mở lại bước GVCN.
6. Báo phụ huynh qua TVV (lớp thường) giữ GVCN như cũ (luật mới chỉ nói Phối hợp SOS FT).

## 5. Phối hợp với session khác
- **YTHUC-GON** đang sửa tab Phối hợp SOS (hiện kết quả TVV báo PH) — PR code của tôi đọc lại nhánh đó trước, dùng chung ô ③.
- **CAU-HINH-CASE-SOS**: đã gửi bảng loại → vai (mục 0).

## 6. PR code sau duyệt (mỗi màn một PR)
1. Ô việc Công việc (Phối hợp + Ý thức) + chuyển tab + máy chủ dòng (lớp × loại) + việc TVV Meeting CX.
2. Panel Phối hợp SOS ①②③ + form tại dòng + Hoàn tác.
3. Tab Phối hợp SOS hồ sơ lớp + hồ sơ HV.
Mỗi PR: ảnh cặp mockup | web, check đầy đủ, `tocDoDuong.ts`.
