# Ý THỨC V3 — tab Ý thức hồ sơ lớp + panel Việc · Ý thức & Phối hợp (session MOCKUP-YT, 12/11)

Mockup: `y-thuc.html` (cùng thư mục) · ảnh: `anh/`. Đề bài: `docs/superpowers/specs/2026-11-12-phan-tich-y-thuc/de-bai.md` mục 3–4.
Nền: Ý thức V2 #1316 (đã duyệt, mã #1327 #1328 #1330 #1355 #1358 #1367) · Phối hợp SOS V2 #1368 (mã #1384 #1388).
Mã đã đọc: `web/src/modules/yThuc/ClassYThucCard.tsx`, `BangLan.tsx`, `kieu.ts`, `PanelXemViPham.tsx`, `BangPhoiHop.tsx`, `congViec/PanelViec.tsx` (PanelPhoiHop),
`server/src/yThuc/board.ts` (`bangYThucLop`, `dongThoiGian`).

## 1. Brief (shape — không có người trả lời trực tiếp, giả định ghi rõ)
- **Ai, khi nào:** GVCN (chính), QL, TVV, GVBM mở tab Ý thức của một lớp 15–35 em, thường từ việc / thông báo hoặc khi rà lớp.
- **Việc chính:** thấy ngay em nào còn bước chưa xong + bấm làm bước của mình; tra được em bất kỳ đã vi phạm gì, xử lý thế nào.
- **Đầu ra:** không em nào bị bỏ sót bước (GVCN xử lý, QL duyệt, TVV báo PH), lịch sử từng em đọc được tại chỗ.
- **Giả định:** "chưa xử lý" = em còn ít nhất một bước chưa xong (Mới, Bắt buộc, QL từ chối, Chờ QL duyệt, Đã duyệt chờ thực hiện, Xin thu hồi, Chờ TVV báo PH / báo lại).
  "Thứ tự bình thường" = theo tên như danh sách lớp (roster).

## 2. Brainstorm — cách tách em (nội bộ, chọn một)

| PA | Cách | Được | Mất |
|---|---|---|---|
| 1 | Giữ bảng V2, kẻ dày giữa em | ít đổi | vẫn một em rải ở nhiều nhóm (Mới / Chờ TVV…) — gốc của "khó phân biệt" |
| 2 | Accordion: mỗi em một dòng, bấm mới mở | gọn nhất | việc cần làm bị giấu sau một bấm — trái "việc của tôi thấy ngay" |
| 3 | Thẻ lưới 2–3 cột / em | tách rõ | đọc ngang cột khó, 1440 lệch cột, không so được ngày / bước |
| **4 (chọn)** | **Một em = một khối** (nền `surface-2`, viền, cách 8 px) cho em còn bước; trong khối các lần xếp dọc (kẻ đứt); ô Học viên đứng cả khối. Em khác: **một thẻ danh sách**, mỗi em một dòng | tách rõ em có việc; cột thẳng hàng (dùng chung đầu cột); em sạch không chiếm chỗ | 1 em nhiều lần thì khối cao — chấp nhận (đúng là em đó nhiều việc) |

Lý do chọn 4: sửa gốc (một em một chỗ, không rải nhóm), giữ đọc cột trái → phải của V2, em sạch gọn một dòng.

**Cột (bỏ số):** `Học viên · Vi phạm · Đã xử lý · Bước đang làm` (248 · 1fr · 340 · 236 ở 1440).
"Đã xử lý" **gộp** "GVCN xử lý" + "TVV báo PH" của V2 thành hai dòng có nhãn (GVCN / TVV, trên → dưới đúng thứ tự) — bảng 4 cột cân đối hơn 5 cột, và tách rõ
**đã làm** (giữa) với **đang chờ** (cuối). Nội dung TVV ghi vẫn đọc được tại dòng + "Xem đủ ▾" (giữ ý chủ SP 11/11). Chưa ai làm → "—".

## 3. Đề bài → chỗ trong mockup (tự rà)

| # | Ý (de-bai mục 3–4) | Chỗ | Đạt |
|---|---|---|---|
| 1 | Đủ danh sách TẤT CẢ học viên trong lớp | A1: 7 khối + 23 dòng = 30 HV (đầu khu "Các em khác · 23 HV") | ✓ |
| 2 | Phân rõ chưa làm / làm rồi (lịch sử) ngay ô của em | Khối em chỉ có bước chưa xong; thanh "Xem lịch sử · n" trong ô Học viên | ✓ |
| 3 | Chỉ hiện cái chưa xử lý trên đầu | khối em: chỉ lần còn bước; lần xong vào lịch sử | ✓ |
| 4 | Thanh bấm "Xem lịch sử" mở hết vấn đề + đã xử lý thế nào | A1 Nguyễn Hoài An mở: vi phạm, GVCN (bậc, ngày, ai), TVV (kết quả, Nội dung), Đã xem, Đã thu hồi (ai, lý do) · A2b 375 | ✓ |
| 5 | Dễ phân biệt giữa các học sinh | khối riêng nền + viền + khoảng; một em không còn rải ở hai nhóm | ✓ |
| 6 | Em chưa từng vi phạm: rõ, sạch, gọn | một dòng "✓ Chưa có vi phạm" chữ mờ; A5c lớp sạch | ✓ |
| 7 | Em hư chưa xử lý lên đầu, rồi thứ tự bình thường | "Chưa xử lý xong" (theo độ gấp: quá hạn → bắt buộc → mới → chờ QL → chờ TVV) rồi "Các em khác · theo tên" | ✓ |
| 8 | Cột không số, rõ, cân đối | 4 cột, không ①②③ | ✓ |
| 9 | Cột cuối "Bước đang làm" | A1 · A6 theo vai | ✓ |
| 10 | Panel Ý thức & Phối hợp: bỏ 1 2 3 | B1 B2 B5 | ✓ |
| 11 | CV không cần danh sách đã làm (thấy cần thì làm đẹp) | B1 B2 bỏ; [XM-1] phương án giữ dạng gập | ✓ (chờ chủ SP) |
| 12 | Panel rõ: em · việc · nút tại dòng · Việc tiếp › | B1 2 cột Học viên · Cần làm; B2 Học viên · GVCN gửi · Báo PH; chân Việc tiếp › | ✓ |
| 13 | 1440 + 375, tối + sáng, đủ trạng thái | A1–A6, B1–B6 (tải, lỗi, rỗng, lọc = 0, lịch sử tải / lỗi, GVBM, Chọn nhiều, lưu lỗi, hết việc) | ✓ |

## 4. Bảng thao tác TRƯỚC → SAU (không mất thao tác)

### Tab Ý thức hồ sơ lớp
| Thao tác | Trước (V2) | Sau (V3) | |
|---|---|---|---|
| + Ghi vi phạm · Khai / sửa cấp bậc · Chọn nhiều · Điểm Mock Test › | đầu tab | đầu tab | GIỮ |
| Vi phạm | Phối hợp SOS | phân đoạn | phân đoạn | GIỮ |
| Cần làm | Lịch sử | phân đoạn, nhóm theo trạng thái | **bỏ phân đoạn**: một danh sách mọi em; lịch sử mở trong khối em | ĐỔI (đề bài) |
| Số "Cần làm n HV" (việc của người xem) | chip phân đoạn | chip lọc **"Việc của bạn · n HV"** (cùng tập G3-14, cùng Công việc) | GIỮ số, đổi chỗ |
| Lọc Lịch sử Đã xem / Đã xử lý / Đã thu hồi (toàn lớp) | chip | **bỏ** — lịch sử theo em; mỗi dòng ghi rõ Đã xem / Report… / Đã thu hồi | BỎ [XM-2] |
| Phạm vi Lộ trình / Cả lịch sử | đầu tab (Lịch sử) | đầu phần lịch sử đang mở | ĐỔI chỗ |
| Tìm em | chỉ ở Lịch sử | đầu tab, áp cả danh sách | GIỮ (rộng hơn) |
| Xác nhận xử lý · Đề xuất QL duyệt | cột Bước tiếp | cột Bước đang làm | GIỮ |
| Đã xem · n · Đã xem vi phạm này | cột Bước tiếp · dòng mở | như cũ | GIỮ |
| Hoàn tác · Xem lại (sau Đã xem) | hàng ở lại | hàng ở lại; "Xem lại" mở lịch sử em, dòng sáng | GIỮ |
| Bỏ xem · Xác nhận xử lý vi phạm đã xem (G3-6) | Lịch sử | dòng Đã xem trong lịch sử em | GIỮ |
| Sửa · Xoá vi phạm · + Tệp · + Liên kết | bấm tên vi phạm, mở tại chỗ | như cũ (hộp rê giữ) | GIỮ |
| Xem lần xử lý · Thu hồi… · Rút đề xuất | bấm ô ② | bấm badge GVCN ở "Đã xử lý" | GIỮ |
| Duyệt · Từ chối… · Duyệt thu hồi (QL) | Bước tiếp | Bước đang làm | GIỮ |
| Đánh dấu đã thực hiện | Bước tiếp | Bước đang làm | GIỮ |
| Ghi kết quả báo PH (TVV, QL) · Sửa hạn (GVCN, N34) | ô ③ / Bước tiếp | Bước đang làm ("Sửa hạn" link) | GIỮ |
| Xem đủ Nội dung Báo PH | ô ③ "Xem đủ ▾" | dòng TVV ở "Đã xử lý" | GIỮ |
| Chip bậc → Thang · Khai bậc · Lịch sử của em › | chip | chip; "Lịch sử của em ›" → mở thanh lịch sử của em | GIỮ |
| "Xong · 7 ngày" | nhóm riêng | bỏ nhóm; lần vừa lưu sáng xanh tại chỗ; lần xong vào lịch sử em | ĐỔI |
| Chưa xác nhận cấp bậc (khi Chọn nhiều) | nhóm riêng | em đó nằm ở "Các em khác", có ô chọn | GIỮ |
| `?hv=&mo=…` từ việc / thông báo | cuộn + panel | cuộn tới khối em (viền nhấn) + panel | GIỮ |

### Panel Việc · Ý thức & Phối hợp (Công việc)
| Thao tác | Trước | Sau | |
|---|---|---|---|
| Xác nhận tại dòng (Ngày · Nội dung · + Tệp · Người thực hiện) | ô ② | cột "Cần làm" | GIỮ |
| Hoàn tác 10 s sau lưu | dòng vừa lưu ở lại | như cũ | GIỮ |
| Sửa việc đã làm · Đưa lại Cần xử lý · ⋯ của việc đã làm | nhóm "Đã làm" trong panel | hồ sơ lớp › Phối hợp SOS (đã có đủ: Sửa, ⋯) — link chân "Đã làm · hồ sơ lớp ›" | ĐỔI chỗ [XM-1] |
| Sửa hạn… · Bỏ việc… (việc chờ) | ⋯ | ⋯ | GIỮ |
| TVV: Ghi kết quả (Đã báo PH / Chưa liên hệ được · Ngày · Nội dung) | ô ③ | cột "Báo PH" | GIỮ |
| TVV: Sửa kết quả đã báo | nhóm "Đã báo" | hồ sơ lớp › Phối hợp SOS (đã có "Sửa" khi `coTheGhi`) | ĐỔI chỗ [XM-1] |
| Việc tiếp › | chân | chân | GIỮ |
| Panel một em (Xem vi phạm mới / Xác nhận xử lý / Báo PH): dải ①②③ | số tròn | ba ô tên bước, "Bạn" | ĐỔI chữ (PT-SO-LOI bỏ số; V3 đổi dáng) |

## 5. [XM] chờ chủ SP / PTA
- **[XM-1] Bỏ khối "Đã làm" ở panel Công việc** (PTA quyết, vẽ theo). Thay bằng link chân "Đã làm · hồ sơ lớp ›". Nếu chủ SP muốn giữ: một dòng gập "Đã làm · n ▸" cuối danh sách, mặc định đóng.
- **[XM-2] Bỏ lọc Lịch sử toàn lớp** (Đã xem / Đã xử lý / Đã thu hồi). Lý do: lịch sử nay theo em (đề bài); mỗi dòng đã ghi rõ loại. Cần xem cả lớp theo thời gian → Phân tích › Ý thức (đã có).
- **[XM-3] Gộp hai cột GVCN xử lý + TVV báo PH thành "Đã xử lý"** (đổi so V2 đã duyệt) cho bảng cân đối. Không mất thông tin; chủ SP muốn giữ 5 cột thì đổi lại được, khối em vẫn như V3.
- Không đụng luật nghiệp vụ (L1–L5, N34, N36, quyền máy chủ).

## 6. Turso — tab đọc thêm gì
- **Mở tab: +0 câu.** `bangYThucLop` ĐÃ đọc mọi em của lớp (`emCuaLop` + câu tên / mã / TVV, `trangThaiYThuc(ids)` có bậc) nhưng chỉ trả em có việc. Code: trả thêm `emLop: [{id, ten, bacNhan, tvv, soLs}]` từ dữ liệu đã có — +~30 phần tử JSON, **0 dòng đọc thêm**.
- **Số "Xem lịch sử · n" + em sạch:** `dongThoiGian` đã đọc HẾT vi phạm + lần xử lý của lớp rồi mới cắt 150 dòng (`out.slice(0, 150)`) → đếm `soLs` từng em trước khi cắt, không câu mới. Em sạch = `soLs = 0` (đúng cả khi bị cắt).
- **Bấm "Xem lịch sử":** dữ liệu đã nạp (`dongThoiGian`) → **0 request**. Chỉ khi lớp bị cắt 150 dòng mà em thiếu dòng (máy chủ đánh cờ `catLs`) → gọi `GET /students/:id/y-thuc` CÓ SẴN khi bấm (trần `tocDoDuong` ~103 dòng); "Cả lịch sử" cùng đường `?phamVi=tat-ca`.
- Trần `tocDoDuong.ts`: `/classes/3/y-thuc` giữ 24 câu / ~440 dòng (đo lại sau code).
- **Panel Phối hợp ở Công việc:** bỏ khối Đã làm → bỏ `?includeDone=1` → không đọc lượt đã xong (ít dòng hơn; ước −10…−40 dòng / lần mở, tuỳ lớp). Dòng vừa lưu giữ ở trạng thái trình duyệt tới khi đóng panel.

## 7. Ghi cho session code (khi chủ SP duyệt)
- `ClassYThucCard.tsx` dựng danh sách theo em từ `emLop` + dữ liệu đã nạp (giữ `locCanLam` cho số "Việc của bạn"); `BangLan.tsx`: `KhoiLan` → khối em nhiều lần; `DauCot` bỏ `so()`.
- `BangPhoiHop.tsx`: bỏ `da` (nhóm Đã làm) ở `BangPhoiHop`, giữ ở `BangPhoiHopHoSo`; `PanelPhoiHop` bỏ `includeDone`.
- `TienTrinh` (panel một em) đổi dáng ba ô tên bước, không số (B5).
- Skill: impeccable `layout` + `adapt` + `harden`, `/ponytail lite`, `karpathy-guidelines`.

## 8. Vòng critique
Agent rà riêng (impeccable critique + ui-ux-pro-max, đọc đủ 16 ảnh khung):
- **Vòng 1: 29/40.** P1: lịch sử 375 vỡ bố cục · khung GVBM bị bóp cột · dòng "Đã xem" trong lịch sử trông như việc chờ. P2: thanh "Xem lịch sử" ba chỗ khác nhau · khoảng trống ô Học viên · ✓ không thống nhất · vùng chạm 375 < 44 · panel B1 nút "Xác nhận" không rõ việc, "không hạn" thừa · đầu cột lặp. P3: chữ 11 px, khối em tối khó tách, "Lộ trình / Cả lịch sử" khó hiểu. → sửa hết.
- **Vòng 2: 31/40, không còn P0 / P1.** P2: nút chọn Kết quả (TVV) thêm ✓ + 44 px ở 375 · P3: bỏ "—" trơ ở lần đã thu hồi. → sửa.
- Theo cổng (đã qua 30, không P0 / P1): dừng. Tự rà đề bài mục 3: đạt 13 / 13 ý (chủ SP chốt [XM-1] [XM-2] [XM-3]).
- Ảnh trong `anh/` (1440 + 375 tối); bản sáng xem trực tiếp trong `y-thuc.html` (A3 A4 B6).
