# CV-TAB a — Công việc chia tab hạng mục · KHỚP / KHÁC

Mockup đã duyệt (chủ SP 06/11 khuya): `thiet-ke/v17-nhap/` a1 (GV · tab Chấm điểm · panel Nhập điểm), b (375). a2 (QL xem một GV, chi nhánh) là PR b — ảnh `cap-1440-ql.png` ở đây chỉ để xem tab / dòng ở vai QL.
Dữ liệu demo seed (ngày demo 14/09/2026): GV = vai 7, QL = vai 2. Phông Be Vietnam Pro tải từ `node_modules` của worktree.

| Ảnh | Khung | Web |
|---|---|---|
| `cap-1440-a1.png` | a1 `.man` | `/cong-viec?nhom=cham-diem&viec=…` · GV · 1440 tối |
| `cap-375-b.png` | b `.man` | `/cong-viec?nhom=case-hoc-thuat` · GV · 375 sáng |
| `cap-1440-ql.png` | a2 `.man` (tham khảo) | `/cong-viec?nguoi=tat-ca&nhom=case-hoc-thuat` · QL · 1440 tối |

## Bảng truy vết khung → thành phần → ảnh

| Khung (mockup) | Thành phần / tệp web | Ảnh | KHỚP / KHÁC |
|---|---|---|---|
| `.dau h1` 22 / 700 + `.tom` "12 việc · 5 quá hạn" | `HoTroHocVienTab` đầu trang (`demDongViec(items)`) | a1, b | KHỚP |
| `.tabs` hàng tab, gạch 2 px nhấn, kẻ dưới hết bề ngang | `HangTab` (`DanhSachViec.tsx`) | a1, b, ql | KHỚP |
| `.bd` badge tròn chỉ số: đỏ / vàng / trắng | `BadgeSo` + `badgeTab` (`shared/domain/tongQuan.ts`) | a1, b | KHỚP |
| `.than` 640 px + panel phần còn lại | lưới `xl:grid-cols-[640px_minmax(0,1fr)]` | a1 | KHỚP (1024–1279: 520 px như cũ) |
| `.muc.qua` "Quá hạn n" trên cùng, `.muc` theo loại việc | `chiaMucTab` + `DanhSachViec` | a1, b, ql | KHỚP |
| `.viec` [tên 14/600 + phụ 13 | hạn 132 | nút 104] | `DongViec`, `DongLop`, `CotHan`, `CotNut` | a1, b | KHỚP |
| `.cot-han` "⚠ quá hạn n ngày" / "⚠ còn n ngày" / mã tuần + "hạn dd/mm" | `CotHan` (`deadlineView`, `tuanLich`) | a1, b | KHỚP |
| `.pv-loai`, `.pv-tieu` chip hạn sát tiêu đề, ✕ góc phải | `KhungPanel` khi trong Công việc (`DauViecCongViec`) | a1 | KHỚP |
| `.pv-tieu h2` 20 / 700 | `KhungPanel` h2 22 / 700 (chỉ ở Công việc) | a1 | KHỚP — 20 không có trong thang cỡ chữ khoá (`prNenTypoMau` K-CHU-1: 12·13·14·15·17·22·28) → cỡ gần nhất 22 |
| `.pv` cao tối thiểu 560, chân dưới đáy | `KhungPanel` `lg:min-h-[560px]` (chỉ Công việc) | a1 | KHỚP |
| `.facts` "Lớp **MB FT 101** · Bài …" một hàng | dải sự kiện của từng panel (sẵn có) | a1 | KHÁC — mỗi panel tự vẽ dải đầu (Nhập điểm: "1 lớp · 4 bài"); đổi là đổi 9 panel, ngoài phạm vi màn danh sách |
| `.cn` thẻ chi nhánh MB / CP, dải "Tất cả chi nhánh · Monbay · Cẩm Phả" | — | — | PR b |
| 375: tab cuộn ngang, nút hiện cạnh dòng, hạn một hàng dưới tên | `HangTab overflow-x-auto`, `O_HAN` / `O_NUT` | b | KHỚP |
| (BỎ) vạch hạn Chấm điểm "Hạn đến … / Hạn sau … (gập)" | — | — | BỎ: thay bằng "Quá hạn" + mục theo loại bài (mockup a1) |
| (BỎ) khối em tầng ② (vòng chữ đầu + tên em) | — | — | BỎ: dòng phẳng, tên em lên dòng phụ và vẫn là link hồ sơ |
| (BỎ) chọn "Loại việc ▾" | — | — | BỎ: tab thay; `nhom=` / `loai=` cũ vẫn mở đúng tab |
| (BỎ) dải "👁 Đang xem việc của … — chế độ theo dõi" | — | — | BỎ: tên GV đứng đầu dòng tóm tắt (a2); panel vẫn ghi "THEO DÕI · …" |
| (GIỮ) Chờ bạn duyệt | tab đầu "Chờ bạn duyệt" (badge đỏ khi có quá hạn) + `HopChoDuyet gon` | ql | GIỮ — hộp thẻ giữ dáng cũ (khối em), xem [XM-1] |
| (GIỮ) Việc quản lý (+ Giao việc · Vận hành › · Họp đơn vị ›), Đã bỏ qua | tab "Việc quản lý" (luôn có với QL) | ql | GIỮ |
| (GIỮ) Yêu cầu của tôi · Lớp tôi dạy (GV, gập sẵn) | dưới danh sách mọi tab | a1 | GIỮ — mockup không vẽ |
| (GIỮ) Mọi hạn ▾ · Lọc thêm ▾ · Của tôi / Của GV / Tất cả | hàng lọc sẵn có; số trong "Mọi hạn" đếm trong tab đang mở | a1, ql | GIỮ |

Ước KHỚP: 13 / 14 khung đo được (KHÁC: dải sự kiện trong panel do từng panel tự vẽ) ≈ 93 %.

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Xem việc một nhóm | cuộn dọc qua các thẻ nhóm / chọn "Loại việc ▾" | bấm tab (hoặc ← → / Home / End trên hàng tab) |
| Biết nhóm nào gấp | đọc "⚠ n quá hạn" ở dải nhóm | badge màu trên tab; mở trang tự chọn tab đầu có quá hạn |
| Mở việc, Lưu · Việc tiếp ›, Hết việc nhóm → Việc tiếp | như cũ | như cũ; việc tiếp ở tab khác → danh sách tự sang tab đó |
| Dòng gộp "n em ▾", Xác nhận PA lô, Nhập điểm theo tuần | như cũ | như cũ |
| Gia hạn · Bỏ qua · Xuất lớp BC PH (nút phụ) | như cũ | như cũ (dưới nút chính) |
| Mở hồ sơ em | bấm tên em ở khối em | bấm tên em ở dòng phụ |
| Lọc hạn · Của tôi / GV / Tất cả · Lọc thêm (GV, khung, chi nhánh) | như cũ | như cũ |
| Link cũ `?nhom=` / `?loai=` (Tổng quan, chuông, Quay lại) | lọc nhóm / loại | mở đúng tab (`loai=` vẫn lọc đúng loại) |
| Quay lại về đúng chỗ | URL giữ lọc | URL giữ thêm tab (`nhom=`, ghi một lần khi mở trang) |
| ✓ n xong hôm nay | như cũ | như cũ (liệt kê theo tab) |
| Mở rộng "Hạn sau dd/mm" của Chấm điểm | bấm vạch gập | không còn vạch — việc nằm ở mục theo loại bài, "Xem thêm" khi > 10 dòng |

Không mất thao tác nào.

## Quyết định / lệch đã ghi

- **Tab ở `nhom=`**, không `?tab=` (brief): dùng tham số sẵn có để link Tổng quan / chuông / `quayLai.ts` cũ mở đúng tab, một khái niệm một tên.
- **Gần hạn = mốc sẵn có** `deadlineView().ganHan` (còn ≤ 3 ngày, gồm hôm nay — `HAN_GAN_NGAY`, chip vàng mọi nơi); mockup ghi "hôm nay – 2 ngày".
- **Tab "Bài thi Speaking"** = bài S chấm chéo (T03) tách khỏi Chấm điểm như dải "Speaking chấm chéo" cũ; badge đếm dòng (đỏ khi bài S đã quá hạn).
- **Bàn giao** không thành tab riêng: nằm trong tab "Vận hành" / "Việc quản lý" (nhóm sẵn có) thành mục "Bàn giao".
- **Dòng phụ giữ chữ "tuần W1 NOV"** (U01 #3: tránh nhầm W1 / W2 Writing); mockup ghi "W1 NOV".
- **Đọc Turso:** không thêm request — badge, mục, đầu trang đếm từ `/my-work` + `/yeu-cau/dem` đã nạp.

## [XM] hỏi PTA

- [XM-1] Hộp "Chờ bạn duyệt" (`HopChoDuyet gon`) vẫn dáng khối em cũ trong tab — làm phẳng theo dòng v17 là PR riêng (đụng `TheYeuCau`, trang Chờ duyệt đầy đủ)?
