# Truy vết — `tong-quan.html` (V5-B1 · Tổng quan theo vai)

> V5-B1, 22/10/2026. Trạng thái: **ĐỀ XUẤT THIẾT KẾ**, chờ chủ SP duyệt. Dựa trên V5-A: `v5-nen.css`, `du-lieu-demo.md`, `07-huong-thiet-ke.md` mục 2 (**phương án B "Tình hình trái · Đi tiếp phải"** đã chọn).
> Rà soát mã: [`b1-ra-soat.md`](../../docs/superpowers/specs/2026-10-22-overhaul-v5/b1-ra-soat.md). Mở tệp: `tong-quan.html?k=<ql|qt|gv|tvv|admin|cx|ht>&tt=<tai|loi|rong>&p=<bc|bc2|duyet>&theme=dark`.
> Ảnh: `anh/tong-quan-*.png` (1440 sáng chính, 1440 tối, 1280, 375). Dữ liệu demo, không phải số liệu thật.

## 1. Yêu cầu → khung → thành phần

| Yêu cầu | Nội dung | Khung (ảnh) | Thành phần |
|---|---|---|---|
| C04, brief 6.1 | Đầu trang một hàng (tên trang · phạm vi · tuần) + 3–4 chỉ số + 2 khối trái + cột "Đi tiếp" phải; **không form làm việc** trên trang | `tong-quan-ql-1440-sang`, `-ql-1440-toi` | `.chi-so`, `.the`, `.bang` |
| C03, brief 15 | Mỗi tỷ lệ: % to + "n/N đơn vị" + kỳ / "hiện tại" | mọi khung | `.chi-so .mau` |
| brief 6.2 | QL: Đạt MT · Case có PA · Chờ duyệt (đề xuất) · Thi tuần này; Lớp cần chú ý (công tắc FT / Thường); GV cần chú ý (Hành chính / Học thuật) | `-ql-1440-sang`, `-ql-hoc-thuat-1280-sang` | công tắc ngoài tiêu đề bảng (G9) |
| brief 6.2 | Chờ duyệt: bảng gọn (loại · đối tượng · người gửi · thời gian chờ); bấm dòng → panel duyệt đủ bối cảnh | `-ql-panel-duyet-1440-sang` | `.panel` việc (vạch hồng "DUYỆT") |
| brief 6.3, T20 | QT: bảng theo chi nhánh, hàng "Toàn hệ thống" = Σ tử / Σ mẫu (23/38 = 61 %, không 57 %); bấm chi nhánh → mức QL | `-qt-1440-sang`, `-qt-1280-sang` | `.bang` + `hang-nhom` |
| brief 6.4 | GV: tách **"Kỹ năng tôi dạy"** và **"Lớp tôi chủ nhiệm"** (không cộng trùng); chỉ bài của mình (T02) | `-gv-1440-sang`, `-gv-1440-toi`, `-gv-375` | hai `.the` cạnh nhau |
| brief 6.5, C05 | TVV: 4 chỉ số (Báo PH đúng hạn · Chưa liên hệ được · Thi tuần này · Chờ KQ / bước tiếp); khối "Cần chú ý" dẫn sang danh sách đúng lọc; việc ở **Công việc** | `-tvv-1440-sang`, `-tvv-375` | `.ds-phai` |
| brief 6.6 | Admin: Lịch Test đủ % · Bài chưa nhập · Đề nghị dời; CX chỉ xem số phối hợp; Head tutor giữ vào thẳng Tutor | `-admin-`, `-cx-1440-sang`, khung `?k=ht` | `.bao-chi-xem` |
| brief 6.6 | Vai không có việc → không dựng khối "Không có việc" (QT, CX chỉ có "Đi tiếp") | `-qt-`, `-cx-` | — |
| C22, brief 14.3, T11, T17 | Số gạch chân → **panel chỉ đọc**: tiêu đề khớp số · phạm vi · cách tính · tử / mẫu / ngoài mẫu · bảng đúng 20 HV · "Đang thấy 1–10 / 20" · không nút xử lý | `-ql-panel-bc-1440-sang`, `-panel-bc-trang2-`, `-panel-bc-375` | `.oso`, panel "BÁO CÁO · CHỈ ĐỌC" |
| T06, T07, T08 | Panel: Trần Thu Hà ✓ Đạt (S 5.0 vẫn hiện ✗); Lê Quang Huy ✗ Chưa đạt; Tô Ngọc Hân ngoài mẫu "chưa đủ dữ liệu" | `-panel-bc-` | `.diem`, `.bd-kq` |
| T19 | Mẫu 0 → "– Chưa có dữ liệu" (Đạt Target MB; Báo PH đúng hạn của TVV), không 0 % | `-qt-`, `-tvv-` | `.bd-kq.thieu` |
| C08 | Không xếp hạng GV, không ngưỡng màu; chú thích quy tắc Overall dưới bảng GV | `-ql-` | — |
| brief 7 | Badge Công việc = việc của tôi (QL: đề xuất chờ duyệt); chuông = tin chưa đọc (số riêng) | thanh điều hướng mọi khung | `.dh .dem`, `.chuong` |
| trạng thái | Đang tải (khung xương) · lỗi tải chỉ che vùng bảng, số phía trên giữ · rỗng có câu + bước tiếp | `-dang-tai-`, `-loi-tai-`, `-rong-1440-sang` | `.bao-loi`, `.rong` |
| 375 | Một cột; chỉ số 2 × 2; cột "Chờ duyệt / Đi tiếp" lên trước bảng (07 mục 2); bảng → thẻ "nhãn · giá trị"; panel toàn màn | `-375` | `.bang.xep` |

## 2. GIỮ

- Nguồn số hiện có: `metrics.ts` (CX đã có mẫu số "đánh giá được"), `bangChiNhanh.ts` (`cheDo: 'chi-nhanh'`), `tongQuanQl.ts`, `/yeu-cau/dem` — đổi cách hiện, không đổi định nghĩa trừ chỗ `05-tu-dien-chi-so.md` ghi "~".
- Lọc chi nhánh `?cn=` của QT; "Góc nhìn" khi kiêm vai; Head tutor `/` → `/tutor`.
- Thứ tự menu G11; mã tuần `W3 SEP`; ⓘ = giải thích; "›" = đổi trang; tên ↗ = hồ sơ.

## 3. BỎ (so với mã hiện tại / V4)

| Bỏ | Nguồn |
|---|---|
| Form nhúng trên Tổng quan QL: `HopChoDuyet` duyệt tại chỗ, "Mở Case" (`NganCase`), "Chọn bước tiếp" (`PanelViec`), "Chốt lộ trình" (`PanelLoTrinhLop`) | `KhoiCanQuyet.tsx:87-144`, `TongQuanQl.tsx:231-246` — chỉ còn panel duyệt **khi bấm** |
| Dải "HV cần chú ý" lẫn đơn vị (HV / Case / bài / GV) | `KhoiCanQuyet.tsx:38-52` |
| Khối "Trễ chấm" trên Tổng quan (QL nhập điểm tại chỗ) | `TongQuanQl.tsx:194-215` — thành dòng "Đi tiếp" / số ở GV cần chú ý |
| V4 bố cục B (hàng đợi trái 540 + khung việc phải) và "Cần bạn quyết" là trung tâm | `mockup-v4-tong-quan` k1–k4 (brief mục 4) |
| TVV "Việc của bạn" trên Tổng quan (Q-A1 ①, G3 cho TVV) | thay bằng menu Công việc (C05) |
| Ô "Học viên của tôi" 6 ô đếm không mẫu số của TVV | `HocVienCuaToi.tsx:18-48` → 4 chỉ số + "Cần chú ý" |
| Màu ngưỡng < 50 / 50–69 / ≥ 70 ở bảng GV | `shared/domain/phanTichGv.ts:83-87` (07 mục 3) |

## 4. Giả định · dữ liệu [V5]

- GV có Tổng quan (**[ĐX]**, `03-ma-tran-vai.md` dòng GV): bật cờ nav `overview` cho GV, dữ liệu chỉ phạm vi của chính GV, không thêm quyền. Chủ SP muốn giữ "GV → Công việc" (G3) thì Tổng quan GV thành dải đầu trang Công việc.
- Số Đạt theo lớp ở "Kỹ năng tôi dạy" (73 % 16/22, 79 % 11/14), số Admin (Lịch Test đủ 1/2), 14 tên HV trong panel 15/20, CX 15/38 = 38 − 23: **[V5]** suy từ `du-lieu-demo.md`.
- "Báo PH đúng hạn", "Chưa liên hệ được": chỉ số #12, #13 của `05` — **chưa có nguồn trong mã** (việc TVV chưa có).
- Panel Đạt MT ghi "MT2 (thi W3 AUG)" trong kỳ W1 SEP – W2 SEP: theo `du-lieu-demo.md` mục 8 ("HV có lượt MT chốt trong kỳ") — V5-C kiểm lại cách gán lượt vào kỳ.

## 5. Đích đo (nghiệm thu web)

- 1440: QL thấy dải chỉ số + hai khối + cột phải gần trọn một màn (ảnh `-ql-1440-sang` cao ≈ 1 040 px — đo lại trên web).
- Từ Tổng quan tới đúng tập dữ liệu một số: **1 bấm, 0 đổi trang** (panel); tới danh sách đã lọc: 1 bấm + 1 đổi trang ("›").
- Không có ô nhập nào trên trang khi chưa bấm (C04).
