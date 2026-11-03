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

## 7. Để PTA (ngoài phạm vi UX-A)
- **Máy thử:** cookie phiên `pisa_session` gắn host `localhost`, mọi cổng dùng chung → các session audit chạy song song đăng nhập đè nhau (bị đá về màn Đăng nhập). Cách tránh: mở web bằng `http://<tên>.localhost:<cổng>` (vd `uxa.localhost:5191`). Nên ghi vào plan.md 1.4 "Kỹ thuật dễ vấp".
- **Hồ sơ lượt** (mục 9 hàng "Hồ sơ lượt MT / lớp thường"): `01` gán UX-A ma trận nhưng không có trong 4 mockup; chưa rà — PTA phân lại hoặc để đợt sau.
- UA-12 (F06), UA-13 (F07), UA-21 / UA-22 (đo) → AUDIT-LOI. **03/11:** AUDIT-LOI mở PR #829 (F06) và #830 (F07: hộp nổi portal, lật, dịch ngang, mở bằng bấm / Tab / Enter **và vẫn mở khi rê** — giữ thao tác cũ, khớp mockup). Khay đáy 375 của U02 / U07 làm ở PR màn U07 sau khi chủ SP duyệt.
- UA-19: nếu muốn ô MT lịch sử có nhãn "lịch sử" ở hàng lớp, cần cờ `lichSu` đi cùng `scores` của roster (máy chủ đã có trong `history`) — PR nhỏ, không đổi số.
