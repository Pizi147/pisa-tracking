# AUDIT-UX-A — Công việc · hồ sơ HV · hồ sơ lớp · hành trình (rà 03/11)

Session AUDIT-UX-A (Opus 5.5 · high). Chỉ rà + đề xuất + mockup, **không sửa code**.
Nguồn: `00` (bản audit chủ SP, mục 1–22) · `01-chia-session.md` mục AUDIT-UX-A · plan.md 1.6 · đánh giá 20/10 mục 11.3–11.4.

## 0. Cách rà và giới hạn

| Mục | Đã làm |
|---|---|
| Mã | main `4e1c0ed83` (sau #826, #827), worktree `.claude/worktrees/audit-ux-a` |
| Bản chạy | demo cục bộ dựng lại (`seed/run.js`, ngày demo 14/09/2026), API 4031 / web 5191, mở bằng `uxa.localhost` (cookie `localhost` dùng chung mọi cổng — session khác đăng nhập là đè phiên; xem mục 7) |
| Vai đã bấm | QL Monbay (Vy, id 2) · GVCN + GVBM L·R (cô Hà, id 7) · TVV (Lê Thu, id 28) · QL xem việc GV khác (theo dõi) |
| Khổ | 1440 tối · 375 sáng (hồ sơ HV) |
| Ảnh chủ SP | Ảnh 2, Ảnh 3 + `cac trang/` U01 `cong viec.jpg`, U02 `ho so HV ovr.jpg`, U03 `ho so lop.jpg`, U07 `lo trinh + lop.jpg` (có trên máy — `01` ghi "chưa gửi" nhưng thư mục `D:/Download/Pisa tracking web/cac trang/` đã có đủ 10 tệp) |
| Không làm | không bấm Lưu / Duyệt / Xoá (giữ dữ liệu demo) → trạng thái sau lưu kiểm bằng đọc mã · chưa thử trình đọc màn, zoom 200 % · phông Be Vietnam Pro không nạp ở máy thử (lỗi máy thử, `node_modules` ngoài allow list của Vite — không phải lỗi web) · chưa đo thời gian trên bản build |

Nhãn kết quả: **TÁI HIỆN** · **KHÔNG TÁI HIỆN** · **ĐÚNG LUẬT** (hành vi đúng định nghĩa, chữ / chỗ gây nhầm) · **ĐÃ SỬA** (trên main) · **THIẾU DỮ LIỆU**.

## 1. Quyết định chủ SP 03/11 (hỏi trong session này)

| # | Câu hỏi | Chốt |
|---|---|---|
| UA-Q1 | Hồ sơ HV: Case tóm tắt trước, mở chi tiết khi cần | **Đồng ý:** danh sách Case mỗi Case 1 dòng (kỹ năng · vấn đề · trạng thái · ai làm · hạn · việc tiếp); Case có việc của người xem mở sẵn; Case khác mở tại chỗ (mở nhiều được); Case đã xong / huỷ gập "n Case đã xong"; mô tả dài 3 dòng + "Xem đầy đủ". Không xoá dữ liệu |
| UA-Q2 | Cột "Tiến độ trên lớp" | **Chuyển thành dải** ngay trên khối Case (trống: 1 dòng + "+ Ghi tiến độ"; có: 2 ghi nhận gần nhất + "Xem tất cả"); Case dùng hết bề ngang; giữ ghi / sửa / xoá |
| UA-Q3 | Công việc — QL / QT mở việc GV khác | **Tóm tắt chỉ đọc + "Làm thay"**; bấm mới hiện form; quyền giữ nguyên |
| UA-Q4 | Nhãn "Đủ điểm" ở lưới Điểm MT | **Bỏ nhãn**; lượt chưa xếp tuần ghi "Chưa xếp lịch" thay "Chờ 0 kỹ năng" |

Chưa nhắn được "PTA Plan" (không thấy trong ListAgents lúc 03/11 tối) — nhắn lại khi PTA Plan mở; PTA ghi 4 dòng này vào plan.md 1.6.

## 2. Bảng xác minh

| ID | Mức | Nguồn (file:dòng) | Vai / lối vào | Cách tái hiện | Kết quả | Tác động |
|---|---|---|---|---|---|---|
| UA-01 | P2 | `HoTroHocVienTab.tsx:364` · `shared/domain/tongQuan.ts:59` (`demViec`) | QL / QT · Công việc | QL Vy, "Tất cả": đầu trang "4 nhóm" nhưng thấy 6 khối (Chờ bạn duyệt · Chấm điểm · Speaking chấm chéo · Case học thuật · Ý thức & Phối hợp · Việc quản lý) | **ĐÚNG LUẬT** — "nhóm" chỉ đếm 4 nhóm nghiệp vụ; Chờ duyệt (yêu cầu) và Speaking chấm chéo (không là việc của ai, R2) cố ý không đếm | Số "n nhóm" không giúp ai làm gì, lại lệch với số khối nhìn thấy. Đề xuất bỏ "n nhóm" khỏi đầu trang (giữ việc · HV · bài) — mockup U01 |
| UA-02 | P2 | `App.tsx:257` | QL / QT · thanh menu | QL Vy: badge Công việc = **12** (thẻ chờ duyệt, mọi chi nhánh); tab "Của tôi" = 5. Ảnh U01: 32 vs 33 | **ĐÚNG LUẬT** — badge QL = số yêu cầu chờ duyệt mọi chi nhánh (SL2, ghi trong `sr`), không phải số việc. Trùng gần nhau ở ảnh là tình cờ | Cùng dáng badge nhưng khác đơn vị giữa GV (việc) và QL (yêu cầu). Đề xuất: tooltip / tên đọc màn hiện chữ "12 yêu cầu chờ duyệt" (đã có ở `sr`) **và** nhóm "Chờ bạn duyệt" ghi "mọi chi nhánh: 12" khi đang lọc một chi nhánh khác số. Không đổi số |
| UA-03 | P1 | `HoTroHocVienTab.tsx:438` · `DanhSachViec` | QL "Tất cả" · Công việc | Ba dòng gộp **giống hệt** "Mô tả Case · MB FT 101 · 4 em · MT2 · W3 AUG · SOS 3" liền nhau (khác GV phụ trách), dòng gộp không ghi người phụ trách. Ảnh U01: "Mô tả Case · CP FT 139 · 2 em" ×2 | **TÁI HIỆN** | QL không phân biệt được dòng nào của ai, tưởng lặp. Sửa: dòng gộp hiện người phụ trách như dòng lẻ (đã có cột tên ở dòng lẻ) |
| UA-04 | P1 | `PanelViec` + `DaiTheoDoi` (`HoTroHocVienTab.tsx:481`) | QL xem việc GV khác | Mở "Kết quả PA Reading · Lý Minh Châu" ở "Tất cả": dải "Việc của Trần Ngọc Hà — chỉ theo dõi · Làm thay" + nguyên form (Tiến triển, Nhận xét, Lưu, Lưu · việc tiếp, Điều chỉnh…) mờ | **TÁI HIỆN** | Đúng U01 #5. Chốt UA-Q3: tóm tắt chỉ đọc + "Làm thay" |
| UA-05 | P2 | `PanelViec` (Xác nhận PA) | GVCN · Công việc | Mở "Xác nhận PA · Listening · Vũ Ngọc Lan": form (Nội dung, Số buổi, Người dạy, Bắt đầu) **trước**, bối cảnh (Nguyên nhân, Kết quả gần nhất) **dưới** form; 4 nút gần ngang nhau: Xác nhận PA · Xác nhận · việc tiếp › · Đề xuất PA khác… · Không cần theo dõi… | **TÁI HIỆN** (panel Kết quả PA thì bối cảnh ở trên — hai panel khác thứ tự) | Đúng U01 #6. Mockup: bối cảnh lên đầu (vấn đề · điểm / kỳ vọng · hạn · người phụ trách), một nút chính, hai thao tác khác thành link phụ |
| UA-06 | P3 | `DanhSachViec.tsx:115` | mọi vai · Công việc | "Xem thêm 6 việc" đếm **dòng** (dòng gộp "4 em · 8 việc" = 1) trong khi đầu nhóm đếm việc thật | **TÁI HIỆN** (bằng mã + bấm) | Lệch đơn vị nhỏ. Đổi chữ "Xem thêm 6 dòng" hoặc đếm việc thật |
| UA-07 | P3 | `shared/domain/cases.ts:511` | GV · Công việc | Dòng "Thêm PA học thuật Reading" có chip "Bình thường" rồi dòng phụ "Case" (Case báo tay, mức độ) | **ĐÚNG LUẬT** | "Bình thường" không giúp quyết định; chỉ hiện chip khi "Gấp" (mockup U01) |
| UA-08 | P2 | `HoTroHocVienTab.tsx:184` (gộp dòng) | GV / QL · Công việc | Trong một nhóm xen kẽ dòng gộp theo lớp (số tròn) và dòng theo em (chữ viết tắt), không có tín hiệu phân biệt ngoài hình tròn | **TÁI HIỆN** | U01 #4. Mockup: dòng gộp có nhãn "Cả lớp · n em" rõ, dòng em có tên em đầu dòng |
| UA-09 | P1 | `CotCaseHv.tsx:36-46` · `NganCase` | GVCN · hồ sơ HV · Overall | Hồ sơ Vũ Ngọc Lan (47) Overall: 3 Case mở đủ (gồm Case Speaking **đã huỷ** đầy đủ mô tả, PA, kết luận, lịch sử, "Chưa có bằng chứng"); Ảnh 3: 4 Case ~5 màn | **TÁI HIỆN** | Chốt UA-Q1 |
| UA-10 | P1 | `StudentDetailPage.tsx:383` · `TienDoTrenLop` | mọi vai · hồ sơ HV | Cột trái "Tiến độ trên lớp" chỉ "Chưa có ghi nhận nào", cột Case bị ép 7/12 bề ngang; TVV cũng thấy cột này | **TÁI HIỆN** | Chốt UA-Q2 |
| UA-11 | P2 | `StudentDetailPage.tsx:323` (`ThanhViec`) · `NganCase` | GVCN · hồ sơ HV | "Xác nhận PA" có ở thanh việc đầu hồ sơ **và** trong Case (Case Reading: nút trong thẻ PA; Case Listening: nút ở chân Case cạnh "+ Thêm PA") — cùng việc, hai chỗ, hai vị trí khác nhau giữa hai Case | **TÁI HIỆN** | Một việc hai chỗ (cùng gốc 20/10 11.4 "3 chỗ"). Mockup: thanh việc giữ; trong Case nút ở MỘT vị trí cố định (dòng "việc tiếp" của Case) |
| UA-12 | P1 (F06) | `KhungPanel.tsx` (thân `overflow-y-auto overscroll-contain`) | mọi vai · hồ sơ HV | `#noi-dung` scrollTop 500: lăn chuột trên khung Case → **500 (đứng)**; trên cột trái → 800. Phần tử cuộn bên trong `sh = ch` (không có gì để cuộn) nhưng `overscroll-contain` chặn chuyền cuộn | **TÁI HIỆN** trên main | Thuộc AUDIT-LOI (F06). Mockup U02 giả định Case dùng cuộn trang |
| UA-13 | P2 | `StudentDetailPage.tsx:364` (`overflow-hidden`) · `BieuDoD` | hồ sơ HV · hành trình kỹ năng | Ảnh 2 (hộp "Case Listening · MT3 · SOS 3" cắt đáy) | chưa tái hiện ở demo (biểu đồ demo ít làn) — cấu trúc clip **đã kiểm bằng mã** | Thuộc AUDIT-LOI (F07). Mockup U02 / U07 vẽ hộp thoát vùng cắt |
| UA-14 | P1 | `HanhTrinh.tsx:474,515` · `shared/domain/hanhTrinh.ts:234,245` | mọi vai · tab Lộ trình & lớp | Vũ Ngọc Lan · Listening: cột trái "từ W4 AUG · **1 PA**", dòng PA "**chưa có PA** · Trần Ngọc Hà", trục "**Chờ xác nhận PA**". Ảnh U07 Speaking giống hệt | **TÁI HIỆN** | Gốc: `dongPhuVanDe` đếm `soPa` (gồm PA chờ xác nhận), dòng PA đếm `v.pa.length` (chỉ PA vẽ được, bỏ PA chờ). Một PA, ba cách nói. Sửa chữ một nguồn: "1 PA chờ xác nhận" ở cả ba chỗ |
| UA-15 | P2 | `HanhTrinh.tsx` (khung Case) · chương lớp | mọi vai · tab Lộ trình & lớp | Case Speaking **Đã huỷ** (không cần theo dõi): badge "Đã huỷ" nhưng trục "✓ Xong W3 SEP" màu đạt; chương lớp ghi "xong ở MT1"; dòng PA "chưa có PA" + khối "Chưa có PA" dù Case có 1 PA đã huỷ | **TÁI HIỆN** | Huỷ ≠ xong (`00` mục 3.8). Trục / chương cần nói "Huỷ W3 SEP", không ✓ |
| UA-16 | P2 | `HanhTrinh.tsx:405` | mọi vai · hành trình | "5.0 Giảm 0.5 4.5" — không có tên hai mốc; chú giải "Tăng / Giảm so với lần trước" ở dải chú giải xa | **TÁI HIỆN** (Ảnh 4 + demo) | U07 #1. Mockup: "MT1 5.0 → MT2 4.5 · giảm 0.5" lấy mốc thật |
| UA-17 | P2 | `LuoiFT.tsx:385` (+ `LuoiThuong.tsx:413`, `MotKyNang.tsx:146`, `LuotThuongPage.tsx:200`, `MockDetailPage.tsx:331`) · `KHOA_HOAN_TAT_HINT` | hồ sơ lớp · Điểm Mock Test | Ảnh U03: "Nguyễn Quốc Trung Anh · **Đủ điểm**" mà L / R / S "Đã huỷ", W1 "Vắng", W2 trống "vắng W4 OCT" + "Chờ 4 kỹ năng" | **ĐÚNG LUẬT, SAI TÊN** — `hoanTat` = "mọi kỹ năng đã có điểm hoặc '-'" (sau CN cuối); Kết quả đếm ô **có điểm** | Chốt UA-Q4: bỏ nhãn |
| UA-18 | P2 | `LuoiFT.tsx:477` | hồ sơ lớp · Điểm Mock Test | Ảnh U03: "Trần Huyền Anh · MT4 · Chưa xếp tuần" → "Chờ 0 kỹ năng · 0 kỹ năng" | **TÁI HIỆN bằng mã** — `required.length = 0` (chưa xếp kỹ năng nào), `tuanChuaToi` null → rơi vào nhánh "Chờ {x}" với x = 0 | Chốt UA-Q4: "Chưa xếp lịch" |
| UA-19 | P2 | `shared/domain/hocVienLop.ts:259` (`lyDoChuaDu`) · roster | GVCN · hồ sơ lớp · Tổng hợp | Lê Minh Khang: ô MT2 5.0 / 5.0 / 7.0 / 7.0 / 6.0 hiện ở hàng, cột Kết quả "Chưa đủ dữ liệu · **chưa có lượt Test có điểm**". Roster: `history[0].lichSu = true` (MT nhập lịch sử), `standingLine` "Chưa có kết quả trong lộ trình này". Đoàn Khánh Chi tương tự (MT3 6.5 cả hàng) | **ĐÚNG LUẬT** (MT lịch sử không vào kết luận) — **chữ sai sự thật** | Người xem thấy điểm mà máy nói "không có điểm". Sửa lý do: "chỉ có MT lịch sử, chưa tính kết luận" + ô điểm hàng đó ghi nhỏ "lịch sử". Không đổi số |
| UA-20 | P2 | U03 ảnh · `ClassRoster` mở Case | hồ sơ lớp | Ảnh U03: PA Speaking dài **in đậm cả đoạn**; demo (PA ngắn) không thấy | **TÁI HIỆN theo ảnh** (demo thiếu PA dài — THIẾU DỮ LIỆU để bấm) | U03 #2. Mockup: nội dung PA chữ thường, 2 dòng + "Xem đầy đủ" |
| UA-21 | P3 | `HoTroHocVienTab.tsx` (tải) | mọi vai | Mở Công việc / hồ sơ HV / hồ sơ lớp ở dev: 5–7 s khung xám (dev, không build) | **chưa đo bản build** | Để AUDIT-LOI mục 11 đo; không kết luận |
| UA-22 | P3 | hồ sơ lớp mở trang | GVCN | Ở dev `roster`, `diem-theo-luot` gọi hai lần lúc mở trang | **chưa kết luận** — app bọc `React.StrictMode` (dev gọi effect hai lần) | Để AUDIT-LOI đo trên bản build (luật Turso "không gọi hai lần") |
| UA-23 | P2 | `StudentDetailPage` (vai xem) | TVV · hồ sơ HV | TVV thấy khối "Đang xử lý" (ai làm việc gì, hạn) — tốt; nhưng vẫn thấy cột "Tiến độ trên lớp" và chi tiết Case đầy đủ (chỉ đọc) | **ĐÚNG LUẬT** | UA-Q2 xử lý cột; Case với TVV mặc định gập theo UA-Q1 (không có việc của TVV → không Case nào mở sẵn) |
| UA-24 | — | `PanelViec.tsx:62` | GV · Công việc | `case 'yt_xem'` trùng (đánh giá 20/10 11.1e) | **ĐÃ SỬA** trên main (một `case`, Ghi nhận một em làm tại chỗ) | — |

## 3. Ma trận mục 9 (hàng của UX-A)

| Trang / luồng | Đọc mã | Gọi API | Bấm thử | Vai đã thử | Còn thiếu |
|---|---|---|---|---|---|
| Công việc | ✓ `HoTroHocVienTab`, `DanhSachViec`, `tongQuan.ts` | ✓ `/my-work` | ✓ mở việc, theo dõi, việc tiếp | QL, GVCN, TVV | 375 Công việc chưa bấm (đã xem mã `MAN_HEP`) · CX / Admin · lưu thật |
| Chờ duyệt / Yêu cầu của tôi | một phần (`HopChoDuyet`) | ✓ `/yeu-cau/dem` | xem (không bấm Duyệt) | QL, GV (Bị từ chối) | duyệt / từ chối trùng · lỗi lô (không bấm để giữ dữ liệu) |
| Hồ sơ HV | ✓ `StudentDetailPage`, `CotCaseHv` | ✓ | ✓ đổi kỹ năng, cuộn, tab | GVCN, TVV | QL, CX · nhiều lộ trình · liên kết sâu `?case=` |
| Case / PA | ✓ `NganCase` (đọc), `hanhTrinh.ts` | ✓ | xem | GVCN, TVV | S chéo, SOS tạm, đổi GV, sửa kết quả (không lưu) |
| Hồ sơ lớp | ✓ `LuoiFT`, `hocVienLop.ts` | ✓ roster | ✓ Tổng hợp, mở Case | GVCN | QL · lớp kết thúc (đã sửa #817, chưa bấm lại) · lớp thường |
| Hồ sơ lượt | — | — | — | — | **chưa rà** (ngoài trọng tâm 4 màn; ghi để PTA phân) |
| Cuối khoá / lộ trình / thi thật | đọc phần hiện ở hồ sơ HV | — | xem tab Lộ trình & lớp | GVCN | KET / PET thi thật đang hoãn — chỉ ghi khoảng trống; Tutor hoãn |

Không ghi "đã rà toàn bộ": còn các ô "chưa" ở trên.

## 4. Bảng rà panel (mục 8) — màn của UX-A

| Panel | Lối mở | Định danh | Thời điểm | Nguồn | Giá trị / ý nghĩa | Đồng bộ | Kết luận |
|---|---|---|---|---|---|---|---|
| Xác nhận PA (Công việc) | Công việc · thanh việc hồ sơ HV · trong Case | em · Case · kỹ năng · MT | hiện tại | `PanelViec` | bối cảnh ở **dưới** form (UA-05) | lưu → `/my-work` | đổi thứ tự (mockup U01) |
| Kết quả PA (Công việc) | Công việc · Case | em · Case · PA | hiện tại | `PanelViec` | Case + PA ở đầu — đúng | — | giữ; theo dõi → tóm tắt (UA-Q3) |
| Case trong cột (hồ sơ HV) | hồ sơ HV · Overall / kỹ năng | Case · MT · kỹ năng | hiện tại + "theo nhận xét MT1" | `/cases/:id` mỗi Case (F09) | Case huỷ / xong mở đủ như Case đang làm; bằng chứng trống chiếm khung | onChanged → board + hồ sơ | UA-Q1 |
| Mở Case trong bảng lớp | hồ sơ lớp · "n Case · n PA" | em · Case | hiện tại | roster + case tóm tắt | PA dài in đậm (UA-20) | — | mockup U03 |
| Hộp hành trình | biểu đồ / trục | Case · PA | khoảng tuần | `HanhTrinh`, `BieuDoD` | "1 PA" vs "chưa có PA" (UA-14); huỷ = ✓ xong (UA-15) | — | sửa chữ một nguồn + F07 |
| Đang xử lý (TVV) | hồ sơ HV vai xem | việc · người · hạn | hiện tại | `dauHoSo.viec` | đúng, cùng nguồn thanh việc | — | giữ |

## 5. Đề xuất bỏ / gộp / chuyển (22.1) — hiện ở đâu → bất tiện → làm sao → tìm lại ở đâu → ảnh hưởng

| # | Hiện ở đâu | Bất tiện | Làm sao | Tìm lại ở đâu | Ảnh hưởng | Trạng thái |
|---|---|---|---|---|---|---|
| D1 | Hồ sơ HV · mọi Case mở đủ | 4 Case ~5 màn; Case huỷ cùng cỡ Case cần làm | danh sách tóm tắt + mở tại chỗ; xong / huỷ gập | cùng chỗ, bấm dòng | giảm mở sẵn, không xoá; ít request `/cases/:id` hơn (F09) | **chốt UA-Q1** |
| D2 | Hồ sơ HV · cột Tiến độ trên lớp | cột cao chứa một dòng trống | dải gọn trên Case | cùng tab Học thuật | chuyển chỗ | **chốt UA-Q2** |
| D3 | Công việc · theo dõi | form mờ khó hiểu | tóm tắt + Làm thay | cùng panel | đổi cách hiện | **chốt UA-Q3** |
| D4 | Lưới Điểm MT · "Đủ điểm" | nói sai khi vắng / huỷ hết | bỏ nhãn | cột Kết quả | xoá một nhãn (không dữ liệu) | **chốt UA-Q4** |
| D5 | Công việc · "n nhóm" ở đầu trang | không giúp làm gì, lệch số khối (UA-01) | bỏ "n nhóm", giữ việc · HV · bài | — | xoá một số đếm | **chưa hỏi** — gửi kèm mockup U01 để chủ SP duyệt cùng |
| D6 | Công việc · chip "Bình thường" | chip không mang thông tin | chỉ hiện "Gấp" | — | xoá chip | **chưa hỏi** — kèm mockup U01 |
| D7 | Hồ sơ HV · bằng chứng trống mỗi Case | khung tải tệp + câu hướng dẫn lặp mỗi Case | dòng "Bằng chứng · chưa có · + Thêm" ; khung kéo thả mở khi bấm | cùng Case | giảm mở sẵn | nằm trong UA-Q1 ("gọn khung trống") |

## 6. Bảng thành phần chung (mục 21) — UX-A giữ; mỗi session ghi phần màn mình

| Thành phần | Quy ước đề xuất (một nghĩa, một tên, một chỗ) | Màn UX-A đang lệch |
|---|---|---|
| Tên thao tác | Ghi vi phạm · Ghi nhận · Xác nhận xử lý · **Xác nhận PA** · **Ghi kết quả PA** · **Kết luận Case**; không nút trần "Kết quả" | hồ sơ HV chân Case "Kết quả" (Ảnh 3) = Kết luận Case; thẻ PA "Ghi kết quả" — hai nút cùng chữ "Kết quả" khác việc |
| Đếm PA | "n PA" = PA đã xác nhận; PA chờ xác nhận ghi riêng "1 PA chờ xác nhận" — một hàm cho hành trình, hồ sơ, bảng lớp, Công việc | UA-14 |
| Trạng thái Case | Cần làm · Đang làm · Chờ duyệt · Quá hạn · **Xong {tuần}** · **Huỷ {tuần}** — huỷ không mang ✓ | UA-15 |
| Bộ đếm | luôn có đơn vị (việc / bài / em / dòng / yêu cầu); badge QL = yêu cầu | UA-01, UA-02, UA-06 |
| Chênh lệch điểm | "MTa x → MTb y · giảm z" — luôn hai mốc có tên | UA-16 |
| Rỗng / thiếu ở lưới điểm | Chưa xếp lịch · Chưa tới tuần · Chờ n kỹ năng · Vắng · Huỷ · MT lịch sử | UA-17, UA-18, UA-19 |
| Một việc một chỗ | việc ở thanh việc đầu trang + **một** nút trong đối tượng, vị trí cố định | UA-11 |
| Theo dõi vs làm | xem việc người khác = tóm tắt chỉ đọc; "Làm thay" mới ra form | UA-04 |
| Mô tả dài | 3 dòng + "Xem đầy đủ" tại chỗ, chữ thường; không in đậm cả đoạn | UA-09, UA-20 |
| Khung trống | một dòng + nút, không khung cao | UA-10, D7 |

## 6b. Mockup chờ chủ SP duyệt (mục 22.3) — `thiet-ke/audit-0311/`
Nâng cấp từ khung đã duyệt (v7 / v8), không làm lại; CSS chung `chung.css` chép nguyên v8. Mỗi tệp: 1440 tối + 375 sáng, trạng thái, bảng thao tác trước → sau. Chủ SP duyệt **từng màn**; PR sau đó một màn một PR, ảnh cặp ≥ 90 %.

| Tệp | Khung | Đổi chính | Cần chủ SP |
|---|---|---|---|
| `u01-cong-viec.html` | A1 GVCN Xác nhận PA · A2 QL theo dõi (tóm tắt) · A3 Làm thay · A4 sau lưu · B1–B3 375 · C1–C3 lỗi lưu / việc đã xong / không quyền | UA-Q3 · bối cảnh lên đầu, một nút chính · dòng gộp có người phụ trách · kết quả tại chỗ + Xem lại | duyệt + D5 (bỏ "n nhóm"), D6 (bỏ chip "Bình thường") |
| `u02-ho-so-hv.html` | A1 Overall GV W2 · A2 mở thêm Case (mô tả EN dài) · A3 kỹ năng L + hộp hành trình · A4 TVV · B1–B3 375 (khay đáy) · C1–C3 không Case / tải / lỗi | UA-Q1, UA-Q2 · nút "Ghi kết quả PA" · hộp nổi (F07) · cuộn trang (F06) | duyệt |
| `u03-ho-so-lop.html` | A1 Tổng hợp mở Case · A2 lưới Điểm MT4 · B1 375 thẻ em | ba mốc gọi tên · W1 / W2 có nhãn · Case gọn, PA chữ thường 2 dòng · "Chỉ có MT lịch sử" · UA-Q4 | duyệt + "n/7 có điểm đủ" (đổi chữ thẻ MT) |
| `u07-hanh-trinh.html` | A1 Tất cả kỹ năng + hộp nổi · B1 375 danh sách sự kiện | hai mốc có tên · tuần lịch chính · trạng thái ở cột nhãn · "1 PA chờ xác nhận" một nguồn · Huỷ ≠ Xong · 375 danh sách | duyệt + 375 mặc định danh sách |

**Cổng chất lượng (critique độc lập, 3 vòng, mỗi vòng agent Opus mới):** vòng 1 U01 34 · U02 28 · U03 27 · U07 28 → vòng 2 33 · 28 · 30 · 29 → vòng 3 **35 · 32 · 33 · 34**, 0 P0; 3 P1 vòng 3 đã sửa (U02 làn Case L sai tuần mở · U07 Reading MT2 dưới kỳ vọng mà không Case · U01 "Kết quả PA" ≠ "Ghi kết quả PA"). Hết số vòng theo luật (chạm 30 → tối đa 2 vòng nữa) — không còn P0 / P1. Lỗi các vòng chủ yếu là số liệu mẫu lệch giữa khung (đã đồng bộ: U02 ↔ U03 cùng em Hà Trần Phúc khớp mọi điểm).

**[XM] chờ chủ SP (UA-02):** badge Công việc của QL = số yêu cầu chờ duyệt mọi chi nhánh (mã SL2) — **lệch DESIGN.md V13** ("badge = việc của chính người xem"). Khuyến nghị: giữ số chờ duyệt (việc QL cần làm nhất) + chữ "chờ duyệt" cạnh số, thấy cả ở 375; sửa V13 cho khớp.

Turso: không đường API mới. U02 giảm đọc (`/cases/:id` chỉ cho Case đang mở). Các sửa chữ UA-14 / UA-15 / UA-17 / UA-18 / UA-19 là PR nhỏ không cần đổi bố cục (sau khi chủ SP duyệt chữ).

## 6c. Bảng ý → mockup (cách làm mới chủ SP 03/11 tối — lập TRƯỚC khi vẽ, PTA duyệt rồi mới vẽ)
Nguồn viết tắt: `00` = bản audit chủ SP (mục 12 chuẩn chung, 20 từng màn, 21 đồng bộ, 22 tinh giản) · N33 / N35 = plan.md 1.6 · "SP 03/11" = lời chủ SP khi xem mockup vòng 1 · UA-xx = bảng xác minh mục 2. Cột "Hỏi" để trống = không cần hỏi.

### U01 · Công việc (nền: khung v8 đã duyệt N26 — nâng cấp, giữ mọi thao tác)

| # | Ý (trích ngắn · nguồn) | Làm gì trong mockup (khu · thành phần · chữ thật) | Giữ / bỏ / đổi · vì sao | Hỏi chủ SP |
|---|---|---|---|---|
| 1 | Trên cùng chỉ phạm vi + lựa chọn thường dùng (`00` 20-U01 #1) — **chủ SP 03/11 (qua PTA):** không thêm chip mới, chỉ thêm "Hôm nay" vào ô hạn | Một hàng: phạm vi `Của tôi · Của GV · Tất cả` (QL) · `Mọi hạn ▾` (Quá hạn · **Hôm nay** · Hạn đến {ngày}) · `Loại việc ▾` · `Lọc thêm ▾` (Một GV, Mọi khung, Chi nhánh) | ĐỔI nhỏ — chủ SP | ĐÃ TRẢ LỜI |
| 2 | Danh sách – chi tiết cao theo màn; danh sách giữ vị trí; tiêu đề + hành động của việc đang mở luôn thấy; không hộp cuộn lồng (`00` #2, 12 "Cuộn/sticky") | Danh sách cuộn theo trang (không khung cuộn riêng — F06); panel phải **dính**, đầu panel (tên việc + hạn) và chân (nút chính) cố định, thân panel cuộn riêng chỉ khi form dài hơn màn | GIỮ bố cục v8 + chốt luật cuộn | — |
| 3 | Mỗi hàng: **việc gì → ai / lớp → hạn → ai chịu trách nhiệm**; số bài / HV là phụ có đơn vị; tách SOS khỏi mức khẩn (`00` #3) — **PTA sửa:** ghi rõ "ai / lớp" ở đâu cho từng loại dòng; tuần không nhầm W1 / W2 | **Dòng em:** dòng cha = tên em (link hồ sơ) + lớp + SOS; dòng việc con: ① tên việc (kỹ năng viết đủ "Writing Task 1") ② thẻ phụ `MT1` `tuần W4 AUG` `2 bài` ③ cột hạn ④ người phụ trách + nút. **Dòng gộp:** chính dòng = "Cả lớp {mã}" + tên việc, thẻ `4 em` `8 việc`, cột hạn, người phụ trách. Thứ tự đọc trái → phải đúng việc → ai/lớp → hạn → người. Tuần luôn có chữ "tuần" trước mã | ĐỔI cách trình bày — SP 03/11 "tách rõ trường"; `00` 21 "Tuần" | — |
| 4 | Nhóm theo loại hoặc theo HV, không trộn kiểu nhóm thiếu tín hiệu; việc khác cùng em = liên kết ngắn, không nhân bản (`00` #4) | Giữ 3 tầng V18: nhóm loại → em / dòng gộp lớp → việc. Dòng gộp có nhãn chữ **"Cả lớp {mã}"** + thẻ `4 em` `8 việc` + **người phụ trách** (UA-03); "+ 1 việc ở Ý thức" giữ dạng link | ĐỔI nhỏ — UA-03, UA-08 | — |
| 5 | Theo dõi = tóm tắt đọc được + "Làm thay"; bấm mới vào chế độ thao tác (`00` #5, **N33 ③**) | Panel "THEO DÕI": khung trường nhãn trái — Việc · Người làm · Hạn · Tới đâu (bước ✓ / ○) · Gần nhất; chân: **Làm thay** (nút chính) + Việc tiếp ›. Sau Làm thay: dải vàng "Bạn đang làm thay {tên} · Thôi, chỉ xem" + form | ĐỔI — N33 ③ | — |
| 6 | Form PA: vấn đề, điểm / kỳ vọng, hạn, người phụ trách **trước**; nhập sau; một hành động chính; không nhiều biến thể xác nhận ngang hàng (`00` #6) | Đầu panel = **dải sự kiện** (nhãn trên – giá trị dưới): Học viên · Lớp · Lượt · SOS · Hạn · Phụ trách. Rồi khối "Case" (khung trường: Điểm `✗ 5.0 / kỳ vọng 6.0`, Nguyên nhân thẻ, Mô tả ≤ 3 dòng). Rồi khối "Phương án" (form). Chân: **Xác nhận · việc tiếp ›** (chính) + Xác nhận PA (phụ); "Đề xuất PA khác…", "Không cần theo dõi…" thành link dưới form | ĐỔI thứ tự + tách trường — UA-05, SP 03/11 | — |
| 7 | Làm xong: kết quả tại chỗ, cập nhật đếm, đường xem việc vừa xong, đi tiếp theo lựa chọn; không mất việc im lặng (`00` #7) | Dòng vừa xong ở nguyên chỗ, mờ + gạch, dưới là "✓ Đã xác nhận PA Tutor · Listening · **Xem lại**"; **Hoàn tác một chỗ** (dải đầu panel việc kế — V20); đầu trang "✓ 1 xong hôm nay" bấm được → lọc **"Đã xong hôm nay"** (tìm lại không dò từ đầu) | GIỮ V12 / V20 + thêm lối tìm lại | — |
| 8 | Cần kiểm: "4 nhóm" mà 5 tiêu đề (`00` U01) | UA-01: đúng cách đếm. **Bỏ "n nhóm"**, giữ `việc · HV · bài` | BỎ — chủ SP đồng ý 03/11 | ĐÃ TRẢ LỜI |
| 9 | Cần kiểm: badge 32 vs "Của tôi" 33 (`00` U01) | UA-02 đóng theo **DESIGN V13**: badge QL = số việc "Của tôi", không thêm chữ (chủ SP 03/11: "thừa thì đừng thêm text") | ĐỔI — hết lệch số | ĐÃ TRẢ LỜI |
| 10 | Nghiệm thu: mở việc **cuối danh sách**, xử lý, quay lại, tìm việc vừa xong không dò lại (`00` U01) | Khung riêng: việc ở cuối nhóm (sau "Xem thêm") được mở → lưu → danh sách giữ vị trí cuộn + dòng vừa xong ở chỗ cũ + "Đã xong hôm nay" | MỚI khung | — |
| 11 | Nghiệm thu: người theo dõi hiểu ngay đang **xem** hay **làm thay** (`00` U01) | Loại panel đổi chữ: "THEO DÕI" ↔ "LÀM THAY"; dải trạng thái màu khác (xám ↔ vàng) | theo #5 | — |
| 12 | Nghiệm thu: mobile danh sách → chi tiết → quay lại giữ vị trí, không ép hai cột (`00` U01) | 375: danh sách → panel toàn màn "‹ Công việc" → về đúng dòng (khung B) | GIỮ v8 | — |
| 13 | Phân cấp 3 tầng trang → khối → trường; không toàn chữ nhỏ xám; nền / viền có mục đích (`00` 12) | Thang chữ: tiêu đề trang 22/700 · dải nhóm 15/700 nền `surface-2` · tên em 15/600 · tên việc 15/600 · thẻ phụ 12/600 · nhãn trường 12 `text-faint` trên giá trị 15/600. Không thêm nền lồng nền | ĐỔI tinh chỉnh — SP 03/11 | — |
| 14 | Một hành động chính mỗi vùng; nút phụ đủ tương phản; disabled có lý do (`00` 12, 21 "Nút và menu") | Mỗi dòng một nút (động từ đúng việc: Nhập điểm / Thêm PA / Ghi kết quả PA / Xác nhận PA / Làm thay); panel một nút chính | GIỮ + sửa chữ | — |
| 15 | Tên thao tác đúng nghĩa (`00` 21) | "Kết quả PA Reading" → **"Ghi kết quả PA · Reading"**, nút "Ghi kết quả PA" (không "Kết quả" trần) | ĐỔI chữ | — |
| 16 | Bộ đếm luôn có đơn vị; nhóm gộp không đếm trùng (`00` 21) | "Xem thêm 10 **dòng**" (UA-06); dòng gộp ghi `n em` `n việc` | ĐỔI chữ | — |
| 17 | Thông tin thiết yếu không giấu trong tooltip (`00` 12) — **luật chủ SP 03/11:** chữ không đổi quyết định của người dùng thì bỏ | Người phụ trách dòng gộp hiện chữ; bỏ mọi câu giải thích / dòng phụ không giúp làm việc (vd "không tính vào việc của bạn", "Lịch sử ghi tên bạn") | ĐỔI | — |
| 18 | Chip mức Case báo tay "Bình thường" không mang tin (UA-07) | Chỉ hiện thẻ **"Gấp"** | BỎ — chủ SP đồng ý 03/11 | ĐÃ TRẢ LỜI |
| 19 | Trạng thái hệ thống: đang tải / rỗng / lỗi / không quyền / việc đã xong mở từ chuông khác nhau (`00` 12, 21; 22.2 #1 "form dài và lỗi lưu") | Khung C: lỗi lưu (giữ chữ, Thử lại) · việc đã xong mở từ chuông (tóm tắt "✓ Đã xong 14/09 · Trần Ngọc Hà" + Xem Case) · không quyền làm thay (một câu ai làm được) · form dài (thân panel cuộn, chân dính) · đang tải | MỚI khung | — |
| 20 | Kiểm 375 · 1280 · 1440, sáng / tối, tên dài (`00` 12) | Khung 1440 tối, 375 sáng; một dòng tên em dài "Nguyễn Ngọc Phương Anh" + lớp "CP FT RF 01" để thử xuống dòng | thêm dữ liệu thử | — |
| 21 | Kiểm kê thao tác TRƯỚC → SAU (V5: giữ hết) — PTA thêm | Mockup bảng D liệt kê và vẽ đủ: **Bỏ qua** + khu "Đã bỏ qua" (Khôi phục) (#826) · **Gia hạn** (Bước tiếp) · **+ Giao việc** / nhóm Việc quản lý · Xem thêm · Làm thay · Hoàn tác · Việc tiếp › · Em này còn · Hết việc nhóm · "n em ▾" khay dòng gộp · Chờ bạn duyệt (Duyệt / Từ chối… / Mở ›, tích nhiều) · Lớp tôi dạy · Yêu cầu của tôi | GIỮ hết | — |
| 22 | `00` 12: tách "xem hồ sơ" với nút làm việc; không panel lồng panel — PTA thêm | Tên em / mã lớp = link hồ sơ (gạch chân khi rê); nút cột phải = làm việc; "Xem Case" trong panel = view kế trong cùng panel (‹ về), không panel thứ hai | GIỮ V19 | — |
| 23 | `00` 12: trạng thái lưu trong form — PTA thêm | Chân panel: `● Chưa lưu` → `Đang lưu…` (chỉ ở nút đã bấm, form không khoá chữ) → `✓ Đã lưu` / `⚠ Chưa lưu được — Thử lại` (chữ giữ) | ĐỔI hiện | — |
| 24 | `00` 12: link sâu / F5 `?viec=` mở đúng việc; đóng panel trả đúng dòng + bộ lọc; Tab: danh sách → Enter mở → Esc đóng, focus về dòng — PTA thêm | Chú thích hành vi trên khung A1 / A4 (không vẽ được thao tác bàn phím — ghi luật); dòng có viền focus | GIỮ (đã có) + ghi nghiệm thu | — |
| 25 | `00` 12: EN không cắt nút ("Confirm · next task") — PTA thêm | Khung C: chân panel tiếng Anh, nút xuống dòng / co chữ không cắt | MỚI khung | — |
| 26 | `00` 22.2: dữ liệu DÀY như ảnh `cong viec.jpg` (≥ 30 việc, nhiều nhóm, tên dài) + khung RỖNG — PTA thêm | A1 / A2: ≥ 30 việc, 5 nhóm, tên dài ("Nguyễn Ngọc Phương Anh", "CP FT RF 01"); khung C "Không còn việc đang mở" + "Xong hết hôm nay ✓" | MỚI dữ liệu | — |
| 27 | `00` 21 "Hạn": hạn xử lý / ghi kết quả / Báo PH khác nhau; Báo PH hiện hạn đã sửa (N34); "Màu": đỏ chỉ cho quá hạn, SOS không cùng màu quá hạn — PTA thêm | Cột hạn ghi loại khi khác mặc định: `hạn ghi KQ 10/11`, `hạn Báo PH 20/09 · đã sửa` (TVV, khung C); quá hạn = **chữ đỏ + ⚠, không nền** (DESIGN "Hạn — chỉ chữ") để không trùng chip SOS 3 nền đỏ đặc (V5 khoá màu SOS) | ĐỔI hiện quá hạn | [XM] SOS 3 đỏ đặc (V5) và quá hạn đỏ cùng họ màu — khuyến nghị: quá hạn bỏ nền, chỉ chữ + ⚠ |
| 28 | `00` 21 "Case / PA": Case trong panel PA cùng dữ liệu + cách ghi với hồ sơ HV (U02) — PTA thêm | Khối "Case" trong panel dùng đúng khung trường U02 (Nguyên nhân thẻ · Mô tả ≤ 3 dòng · Mở) | ĐỒNG BỘ | — |
| 29 | `00` 9 hàng Công việc: hiện "chờ ai" khi việc chờ người khác — PTA thêm | Dòng / tóm tắt: thẻ `chờ QL duyệt` (vd Case Reading chờ duyệt "không theo dõi"), `chờ GV chấm S` | MỚI thẻ | — |
| 30 | N30: mỗi dòng cho thấy chính lý do có mặt · N35: Nội dung PA ≤ 200 có bộ đếm — PTA thêm | Dòng phụ = lý do (vd `MT1 dưới kỳ vọng`, `2 bài quá hạn`); ô Nội dung PA `0 / 200`, quá → viền lỗi + "Còn dài hơn 200 ký tự — rút bớt", chữ giữ | MỚI | — |

### U02 · Hồ sơ HV (nền: hồ sơ HV web V5–V8; giữ mọi thao tác)

| # | Ý (trích ngắn · nguồn) | Làm gì trong mockup | Giữ / bỏ / đổi · vì sao | Hỏi chủ SP |
|---|---|---|---|---|
| 1 | Đầu hồ sơ: tên, lớp / lộ trình, mục tiêu, mốc thi, người phụ trách; tách liên hệ khỏi học thuật; phụ mở khi cần, không xoá tra cứu (`00` 20-U02 #1) | Dòng 1 tên + `+ Case` `⋯`; dòng 2 **dải sự kiện** nhãn trên – giá trị dưới: Lớp · Lộ trình · Target · Tuần học · Thi thật · GVCN · TVV; dòng 3 liên hệ **thẻ nhỏ mờ** riêng (PH · email · ngày sinh) | ĐỔI cách trình bày — SP 03/11 "tách trường" | — |
| 2 | Thẻ điểm ghi rõ **nguồn MT + thời điểm**; so **kỳ vọng nào** (`00` #2) — **PTA:** bỏ dòng phụ chênh lệch (đã có ở U07) | Mỗi ô: nhãn kỹ năng · số to ✓ / ✗ · **một** dòng phụ "MT2 · kỳ vọng 7.5". Ô đang chọn viền nhấn; tiêu đề khối dưới ghi đúng kỹ năng | ĐỔI chữ ô | — |
| 3 | Vùng "Kết quả … PA …" gần thẻ điểm chưa cho thấy kỹ năng / Case nào (`00` U02 quan sát) | Thẻ việc đầu hồ sơ: tên **"Ghi kết quả PA · Writing Task 2"** + thẻ `Kỳ W5 OCT – W1 NOV` `PA Học Tutor` + hạn + nút | ĐỔI chữ + tách trường | — |
| 4 | Case vùng đủ rộng; **danh sách tóm tắt theo kỹ năng** (vấn đề, trạng thái, người làm, hạn, bước tiếp); mở chi tiết Case đang chọn; giữ mở nhiều (`00` #3; **N33 ①**; 22.1 "Mọi Case mở đầy đủ") | Cột phải "Case & phương án": mỗi Case một **thẻ dòng** — dòng 1: thẻ kỹ năng · tên kỹ năng · SOS · hạn (phải); dòng 2 thẻ: `MT2 ✗ 6.0 / 7.5` · `PA Học Tutor · đang chạy` · `phụ trách {tên}`; nút "Ghi kết quả PA" chỉ khi là việc người xem. Case của người xem mở sẵn; bấm thẻ khác mở thêm; "1 Case đã đóng ▸" gập | ĐỔI — N33 ① | — |
| 5 | "Tiến độ trên lớp" (`00` #4) vs SP 03/11 hai cột (N33 ② sửa) — **PTA:** Overall mỗi kỹ năng một dòng gọn, không thẻ GV | Cột trái (5/12) cao theo nội dung. Overall: 5 dòng — thẻ kỹ năng · thẻ tuần · nội dung 1–2 dòng (không tên GV); không có thì "Chưa có ghi nhận". Chọn kỹ năng: danh sách tiến độ kỹ năng đó + "+ Ghi tiến độ" | SP 03/11 thắng `00` #4 | — |
| 6 | Trong Case: **vấn đề → PA đang thực hiện → việc / kết quả gần nhất**; đủ mô tả, lịch sử, bằng chứng nhưng mục chưa có không khung cao (`00` #5; 22.1 "Khung trống lớn") | Case mở: khung trường nhãn trái (Nguyên nhân · Mô tả · Mở) → **thẻ PA** (tên, thẻ `theo quy chế` `đến MT3` `người dạy`, nội dung ≤ 2 dòng, "Kết quả gần nhất" + nhãn kết quả màu) → 3 dòng gọn Kết luận / Lịch sử / Bằng chứng ("chưa có · + Thêm") → chân nút | ĐỔI | — |
| 7 | Mô tả 2–3 dòng + "Xem đầy đủ" tại chỗ; không cắt dữ liệu lưu; không tự dịch (`00` #6; 21 "Mô tả dài"; **N35**) | Mô tả ≤ 3 dòng + "Xem đầy đủ" · "Dịch" giữ (N19); khung C có ô sửa mô tả với **bộ đếm 300** | ĐỔI | — |
| 8 | Phân biệt **Ghi kết quả PA · Xem kết quả · Kết luận Case**; không nhiều nút "Kết quả" (`00` #7; 21 "Tên thao tác") | Nút: "Ghi kết quả PA" (thẻ PA / dòng) · "Kết quả gần nhất" là trường chỉ đọc · "Kết luận Case…" ở chân Case | ĐỔI chữ | — |
| 9 | Một việc một chỗ (UA-11) | Nút "Ghi kết quả PA" ở thẻ dòng Case (vị trí cố định) + thanh việc đầu hồ sơ; thẻ PA trong Case mở **không lặp** nút | ĐỔI | — |
| 10 | Khung Case không cuộn trang (`00` 1.4, F06) · hộp hành trình bị cắt (F07) | Case nằm thẳng trong trang; hộp hành trình nổi, lật khi gần mép, mở bằng bấm / Enter / rê (AUDIT-LOI #829 #830) | theo PR AUDIT-LOI | — |
| 11 | Nghiệm thu: 4 Case → nhận ra Case cần mình làm trước không đọc hết (`00` U02) | Thẻ dòng xếp: việc của người xem → quá hạn → hạn gần → còn lại; Case của người xem có nút + mở sẵn | MỚI thứ tự | — |
| 12 | Nghiệm thu: 1 Case, không Case, nhiều Case cũ, mô tả rất dài đều cân đối (`00` U02) | Khung: A1 4 Case (mô tả EN dài ở Speaking) · C 1 Case · C không Case ("+ Case cho {kỹ năng}") · C nhiều Case đã đóng ("3 Case đã đóng ▸") | MỚI khung | — |
| 13 | Phân cấp 3 tầng, không toàn chữ nhỏ xám, không chuỗi chữ một kiểu (`00` 12; SP 03/11) | Như U01 #13: tiêu đề khối 17/700 · tên Case 15/600 · thẻ 12/600 · nhãn 12 mờ trên / trái giá trị 15 | ĐỔI | — |
| 14 | Rỗng ≠ thiếu ≠ chưa tới (`00` 21) | Mock Test: "Chưa tới tuần" (MT3) khác "–" (không thi) khác "Vắng" | GIỮ / chỉnh chữ | — |
| 15 | Vai: TVV / CX chỉ xem (`00` 12 theo vai) | Khung TVV: "Đang xử lý" (ai làm gì, hạn) giữ; không Case nào mở sẵn; không nút ghi | GIỮ | — |
| 16 | 375 · sáng | Hai cột xếp dọc: **Case trước, Tiến độ sau** (PTA quyết: việc trước); thẻ Case 2 dòng; hộp hành trình = khay đáy | ĐỔI | ĐÃ QUYẾT (PTA) |
| 17 | Kiểm kê thao tác TRƯỚC → SAU (V5 giữ hết) — PTA thêm | Bảng D: + Case · ⋯ · Sửa · Đổi người… · + Thêm PA · Ghi kết quả PA · Cập nhật trước hạn · Kết luận · Đính kèm tệp / Thêm liên kết · Dịch · + Ghi tiến độ (sửa / xoá) · Trước / Sau · tab Học thuật · Ý thức & Phối hợp (AUDIT-Y-THUC, chỉ giữ lối vào) · Lộ trình & lớp | GIỮ hết | — |
| 18 | EN không cắt nút; dữ liệu dày như Ảnh 3 (4 Case, mô tả EN rất dài) — PTA thêm | Khung A4 Speaking mô tả EN dài (3 dòng + Xem đầy đủ + Dịch) · khung A5 EN nút "Record intervention result" xuống dòng không cắt | MỚI khung | — |

### U03 · Hồ sơ lớp (nền: v8 N26; ý chủ SP 03/11 thắng `00` khi khác)

| # | Ý (trích ngắn · nguồn) | Làm gì trong mockup | Giữ / bỏ / đổi · vì sao | Hỏi chủ SP |
|---|---|---|---|---|
| 1 | Bỏ hẳn bảng **"Cần hỗ trợ"** (SP 03/11) | Bỏ nút đoạn "Tổng hợp / Cần hỗ trợ"; tab Học viên chỉ một bảng | BỎ — SP 03/11 | — |
| 2 | Bỏ cột **Case · PA** (SP 03/11) — **PTA quyết:** không thêm chấm góc ô | Không cột; ✗ ở ô điểm đã báo vấn đề; Case xem qua bấm kỹ năng (#7) | BỎ — SP thắng `00` #1 | ĐÃ QUYẾT (PTA) |
| 3 | Bảng ổn định để so sánh; chỉ in đậm phần giúp quét (`00` #1, #2) | Hàng một dòng: tên 15/600 + TVV 11 · Target · MT · L R W S · Overall · Kết quả · Ngày thi · ⋯; chỉ tên và số đậm | GIỮ | — |
| 4 | Ô W **không** ghi W1 / W2 (SP 03/11) vs `00` #4 (nhãn W1 / W2) | Ô W chỉ số W; W1 / W2 riêng chỉ ở vùng mở rộng (ô kỹ năng W1, W2) | ĐỔI — SP thắng `00` #4 | — |
| 5 | MT nhập lịch sử hiện như MT (SP 03/11; UA-19) — **chủ SP trả lời 03/11:** Kết quả Đạt / Chưa đạt theo kỳ vọng của chính lượt + hiện trạng thái SOS, KHÔNG tạo Case / việc | Hàng Lê Minh Khang: `MT2`, điểm tô màu, Kết quả `SOS 2 · L, R` như em khác, không chữ thêm. Máy chủ: AUDIT-LOI (PR riêng) | ĐỔI | ĐÃ TRẢ LỜI |
| 6 | Bấm một em → **mở rộng** rộng hơn: điểm **1–2 MT trước** (hoặc đầu vào) (SP 03/11) | Vùng dưới hàng, hai khối: trái **"Điểm theo lượt"** bảng nhỏ (MT gần nhất đậm + 2 lượt trước; thiếu thì "Đầu vào") cột L R W1 W2 S OVR Kỳ vọng + thẻ "Lượt tới MT3 · W2 NOV"; phải **5 ô kỹ năng** | MỚI — SP 03/11 | — |
| 7 | Bấm **một kỹ năng** → tóm tắt ngắn: tiến độ điểm · Case · PA · kết quả hiện tại; "xem kỹ" → panel phải (SP 03/11) | Dưới 5 ô: tóm tắt 3 cột — Điểm (chuỗi lượt, kỳ vọng) · Case · PA · Kết quả hiện tại (nhãn màu). "Xem chi tiết" → panel phải (Case · PA · lịch sử kết quả · Ghi kết quả PA, bộ đếm 200); "Hồ sơ HV ›" | MỚI — SP 03/11 | ĐÃ QUYẾT (chủ SP qua PTA 03/11): giữ panel phải |
| 8 | Bấm ô điểm kỹ năng trên hàng = mở em với kỹ năng đó chọn sẵn | Ô điểm bấm được (viền nhấn khi chọn); hồ sơ lượt qua "MT2 ›" trong bảng Điểm theo lượt | ĐỔI | ĐÃ QUYẾT (PTA) |
| 9 | Giới hạn mô tả Case / PA / kết quả PA (SP 03/11 → **N35**) | Panel phải: ô Ghi kết quả PA có bộ đếm `78 / 200`; mô tả hiện ≤ 3 dòng | MỚI — N35 | — |
| 10 | Ba khái niệm lượt (`00` #3) — **PTA:** nhãn ngắn, bỏ câu giải thích | Đầu trang "Lượt mới nhất MT4 · W4 OCT" · cột "MT gần nhất" · lưới "Đang nhập MT4"; bỏ "Mỗi em: lượt gần nhất có điểm", "theo lượt gần nhất từng em" | ĐỔI chữ | — |
| 11 | Giữ nhập điểm nhanh + bảng điểm; đặt ở vùng "Điểm Test" / mở khi làm việc liên quan (`00` #5; đã chốt 20/10 "lưới gập") | "Điểm Mock Test" gập cuối tab Học viên, Nhập điểm mở + cuộn tới (giữ) | GIỮ | — |
| 12 | Dải "Việc của tôi" chỉ vài việc + xem tất cả; tên dài không làm mất nút / hạn (`00` #6) | 3 thẻ việc + "+n ở Công việc ›"; tên cắt bằng "…" nhưng hạn luôn thấy | GIỮ + chỉnh | — |
| 13 | Cần kiểm "Đủ điểm" cạnh huỷ / vắng; "Chờ 0 kỹ năng" (`00` U03; **N33 ④**) | Lưới MT4: bỏ "Đủ điểm"; "Chưa xếp lịch"; thẻ lượt "n/8 có điểm đủ" | ĐỔI — N33 ④ | — |
| 14 | Nghiệm thu: mở Case dài vẫn biết đang ở HV nào, trở lại so sánh nhanh; nhãn đủ / chờ / thiếu / huỷ tương thích (`00` U03) | Vùng mở rộng nằm ngay dưới hàng em (hàng tô nhấn); panel phải ghi tên em ở đầu; bảng bên trái vẫn thấy | theo #6–7 | — |
| 15 | Mockup: một Case dài, nhiều Case, bảng điểm đúng mốc; so mở gọn vs panel (`00` 22.2 #2) | Khung A1 (mở gọn) + A2 (panel phải) + dữ liệu Speaking EN dài ở panel (≤ 3 dòng + Xem đầy đủ) | MỚI khung | — |
| 16 | Phân cấp, tách trường (`00` 12; SP 03/11 cho U01 / U02 — áp cùng) | Đầu trang: phân công GV dạng dải sự kiện; số lớp dạng ô nhãn – giá trị | ĐỔI | — |
| 17 | 375 · trạng thái (`00` 12) | Thẻ em (lưới 5 ô — XM-BE-1) · mở thẻ = điểm theo lượt + 5 ô kỹ năng + tóm tắt dọc · C: kỹ năng không Case, em chưa có lượt, lỗi tải | MỚI khung | — |
| 18 | Kiểm kê thao tác TRƯỚC → SAU (V5 giữ hết) — PTA thêm | Bảng D: Nhập điểm · + Case · ⋯ lớp · ⋯ hàng (N26: + Case · + Ghi vi phạm · Xác nhận xử lý · Nhập điểm │ Sửa thông tin · Chuyển lớp) · Chọn nhiều / hàng loạt · Dán Excel · tab Ý thức & Phối hợp (AUDIT-Y-THUC, chỉ giữ lối vào) · Phân tích lớp | GIỮ hết | — |
| 19 | EN — PTA thêm | Khung A4 EN tóm tắt kỹ năng, nút không cắt | MỚI khung | — |
| 20 | Cột **cân đối, giãn đều, thoải mái** — hiện díu ở mấy cột đầu (SP 03/11 vòng 2) | Bảng 1440 trải đủ khung: cột Học viên giữ ~230px (tên + TVV một dòng); 5 cột điểm L R W S Overall **cùng rộng** (~76px, số canh giữa); Target · MT gần nhất · Kết quả · Ngày thi chia phần còn lại; khoảng đệm ngang ô 16px đều. Áp cùng bảng trái A2 (panel), lưới MT4 A3, EN A4. 375 không đổi (thẻ). Chạy `layout` | ĐỔI hình — SP | — |
| 21 | Ô **Kết quả PA**: bỏ dòng "lần ghi W5 OCT · ghi tiếp hạn 10/11"; có kết quả → chỉ tuần; chưa có (PA mới chạy) → "–" (SP 03/11 vòng 2) | Tóm tắt kỹ năng (A1, A4 EN, B1 375): ô Kết quả PA = nhãn màu + tuần (`Tiến bộ một phần · W5 OCT`) hoặc `–`. Panel phải (A2, A5) giữ lịch sử kết quả (chỗ xem kỹ). Hạn ghi tiếp vẫn ở Việc của tôi / Công việc (không mất thông tin). Chạy `distill` | BỎ chữ — SP | — |
| 22 | Hover / bấm ô **W hoặc S** → hiện đủ điểm thành phần c1–c4 (SP 03/11 vòng 2) | Ô W, S trên hàng (và ô W1 / W2 / S trong "Điểm theo lượt"): hover (máy tính) hoặc bấm giữ / chạm ⓘ (375) → thẻ nhỏ: W1 `TA 6 · CC 6 · LR 6.5 · GRA 6 → 6.0`, W2 `TR … → …`, S `FC · LR · GRA · P → band`; ô chưa có tiêu chí (nhập Band thẳng) ghi "Nhập Band thẳng". Bấm ô vẫn mở em (#8) — tiêu chí hiện bằng hover / ⓘ, không đổi thao tác bấm. Tên tiêu chí ngắn theo `tieuChiNganCua`. Chạy `clarify`. **Dòng đọc:** máy chủ `/classes/:id/roster` đã đọc `s.*` (gồm c1–c4) qua `diemCuaLuot` — chỉ thêm 4 số vào `history[].bands` trả về: **+0 câu, +0 dòng đọc**, không request mới | MỚI — SP | Bấm ô W/S đang = mở em (#8, PTA đã quyết) → em đề xuất hover + ⓘ cho tiêu chí, bấm giữ nguyên. PTA kiểm |

PTA duyệt bảng U02 / U03 có điều kiện (03/11 tối) — đã sửa / thêm dòng theo PTA. Luật chung chủ SP 03/11: chữ không đổi quyết định người dùng thì bỏ.

### Vòng vẽ 2 theo bảng 6c (03/11 tối) — cổng critique
Mỗi vòng một agent Opus độc lập, chấm từng dòng bảng 6c + Nielsen + ui-ux-pro-max. Mọi khung U01 / U02 dựng từ một nguồn dữ liệu (script trong tệp) để số liệu khớp giữa khung.

| Màn | Vòng 1 | Vòng 2 | Vòng 3 | Còn lại |
|---|---|---|---|---|
| U01 Công việc | 29 (7 P1) | 33 (4 P1) | **35** (2 P1) → kiểm lại 34, 2 P1 đã sửa | 0 P0 · 0 P1 |
| U02 Hồ sơ HV | 29 (3 P1) | 30 (3 P1) | **33** (1 P1 đã sửa) | 0 P0 · 0 P1 |
| U03 Hồ sơ lớp | 29 (4 P1) | **31** (2 P1) → kiểm lại 33, 1 P1 đã sửa | — | 0 P0 · 0 P1 |

U02 / U03 dừng dưới 35 theo luật "chạm 30 thì tối đa 2 vòng nữa, rồi chỉ cần không P0 / P1". Ảnh chụp: chạy `python -m http.server` thư mục `thiet-ke/` rồi mở `audit-0311/u0x-….html`.

## 7. Để PTA (ngoài phạm vi UX-A)
- **Máy thử:** cookie phiên `pisa_session` gắn host `localhost`, mọi cổng dùng chung → các session audit chạy song song đăng nhập đè nhau (bị đá về màn Đăng nhập). Cách tránh: mở web bằng `http://<tên>.localhost:<cổng>` (vd `uxa.localhost:5191`). Nên ghi vào plan.md 1.4 "Kỹ thuật dễ vấp".
- **Hồ sơ lượt** (mục 9 hàng "Hồ sơ lượt MT / lớp thường"): `01` gán UX-A ma trận nhưng không có trong 4 mockup; chưa rà — PTA phân lại hoặc để đợt sau.
- UA-12 (F06), UA-13 (F07), UA-21 / UA-22 (đo) → AUDIT-LOI. **03/11:** AUDIT-LOI mở PR #829 (F06) và #830 (F07: hộp nổi portal, lật, dịch ngang, mở bằng bấm / Tab / Enter **và vẫn mở khi rê** — giữ thao tác cũ, khớp mockup). Khay đáy 375 của U02 / U07 làm ở PR màn U07 sau khi chủ SP duyệt.
- UA-19: nếu muốn ô MT lịch sử có nhãn "lịch sử" ở hàng lớp, cần cờ `lichSu` đi cùng `scores` của roster (máy chủ đã có trong `history`) — PR nhỏ, không đổi số.
