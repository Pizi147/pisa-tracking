# HD-V3 — Hướng dẫn + nút "?" phủ mọi việc, mọi màn (13/11)

## Lời chủ SP (13/11, đi vắng, PTA tự duyệt / rà / merge)
"chủ động nâng cấp và sửa lại các tác vụ liên quan đến hướng dẫn và nút '?', để phủ tất cả các đầu việc, hỗ trợ mọi nơi và trang cần thiết
(không cần quản trị) tôi đi vắng, tự duyệt, rà, merge, archive những thứ đã xong, giao việc cho session thì chọn sẵn model + effort hợp lý. Cần gì thì hỏi luôn"

## Hiện trạng (PTA đọc mã main 8008ca52d)
- Khung HD-V2 (#1003 #1005 #1007, mockup `thiet-ke/v14/huong-dan.html`, đặc tả `../2026-11-05-huong-dan-v2/de-xuat.md`): nút "?" cạnh chuông, panel 3 tab
  (Màn này · Tôi muốn… · Tuần của tôi), nội dung là dữ liệu `shared/huongDan/<vai>.ts` (`lam` / `man` / `tuan` / `vaiKhac`), "Chỉ cho tôi" qua `data-hd`.
  Phép kiểm `server/src/tests/prHd.tests.ts` (HD-NAV, HD-CHI, HD-VAI-B/C).
- Nội dung viết 05/11. Sau đó đổi nhiều: chuông V2, Case & SOS, Phối hợp SOS V2 (chỉ GVCN làm, QL theo dõi / làm thay), Ghi kết quả PA có Lưu nháp
  (bấm Lưu là lưu, không Hoàn tác, Sửa lại được), Dán Excel chỉ để thêm HV, Ý thức V2, sổ nghĩa vụ, Cuối khoá / chuyển lớp, Bàn giao hai phía,
  Báo cáo PH (tab Hồ sơ lớp + việc Admin xuất), Phân tích V2 + Excel, Test "Xuất Excel…" + panel Nhập điểm lớp thường, môn chương trình (KET / PET L+S · R+W),
  "tuần 5/8" lớp thường, "Báo PH kết quả Test", Ghi vi phạm chọn môn, Hạn mặc định, lộ trình theo HV, Đã xoá ở menu Tài khoản…
- Chỉ 2 panel có mục riêng (`PanelHd` = `ngan-case`, `nhap-diem`); web có ~99 tệp dùng `KhungPanel`. Màn còn thiếu theo vai (vd `/hoc-thuat/case/:id`,
  `/giao-vien/:id`, nhiều tab `/cong-viec/:tab`, `/test` của TVV / CX, `/hoc-vien/luu-tru` của vai ngoài QL).

## Mục tiêu
1. Mỗi việc thật của mỗi vai (trừ Quản trị hệ thống) có trong "Tôi muốn…" với MỘT lối chính đúng mã main + bước đúng nhãn nút hiện tại.
2. Mỗi màn / tab mà vai vào được có "Màn này" (Bạn đang ở + việc làm ở đây + không làm ở đây).
3. Mỗi panel LÀM VIỆC hay dùng có mục riêng khi bấm "?" lúc panel mở (cùng cách `ngan-case` / `nhap-diem`).
4. Không còn chữ cũ / sai luật (đối chiếu `plan.md` 1.6 + các lời chủ SP 06–13/11 ở mục 4).

## Không làm (anti-goal)
- Vai Quản trị hệ thống + màn `/quan-tri` (chủ SP "không cần quản trị"; #1411 vừa sửa). Tutor / Head tutor chỉ sửa chỗ sai (Tutor hoãn).
- KHÔNG đổi bố cục panel "?" / trang `/huong-dan` (khung v14 đã duyệt). Thêm mục / dòng theo mẫu sẵn có → không cần mockup (CLAUDE.md, plan.md 1.3b).
- Không thêm đoạn chú thích tĩnh trên màn làm việc (bộ nhớ "Bỏ chú thích" 07/11) — giải thích nằm trong panel "?".
- Không thêm request / đọc Turso (nội dung là dữ liệu tĩnh). Không kéo nội dung Hướng dẫn vào gói JS chính.

## Cách làm
- Bước 1 — bảng đối chiếu (mỗi session phần vai của mình) `doi-chieu-<vai>.md`: vai × màn / tab / panel × việc → CÓ / THIẾU / SAI / CŨ, kèm tệp:dòng mã.
  Đối chiếu bằng mã (route, quyền máy chủ, nhãn nút), không theo trí nhớ. Việc làm được ở nhiều nơi: chọn lối chính theo luật "một việc một lối chính"
  (HD-V2), lối khác ghi lối tắt.
- Bước 2 — sửa nội dung + mở rộng khung tối thiểu: thêm giá trị `PanelHd` + `hd=` cho panel làm việc hay dùng (session chọn theo bảng, mỗi panel một
  dòng lý do), thêm `data-hd` cho "Chỉ cho tôi" khi cần, đủ bản Anh (`t()`).
- Phép kiểm mở rộng `prHd.tests.ts`: mỗi route trong `App.tsx` mà vai vào được (trừ `/quan-tri`, `/dev`, `/tutor`) khớp một màn của vai đó; mỗi tab
  Công việc / Test của vai có màn; mỗi `PanelHd` có mục ở mọi vai mở được panel đó; mỗi `KhungPanel hd=` trỏ giá trị có mục. Nếu làm được không ồn:
  chữ đậm `<b>…</b>` là nhãn nút phải có trong nguồn web.

## Chia PR (nối tiếp, không đụng tệp nhau ngoài phần đã nêu)
- **HD-V3-A** (Opus 5.5 · high, B Sonnet 5.5 · high): khung (PanelHd mới + `hd=` + phép kiểm phủ route) + nội dung GV. Merge trước.
- **HD-V3-B** (Sonnet 5.5 · high, B Opus 5.5 · medium): QL + Admin. Bước 1 làm ngay; code sau khi A merge (PTA nhắn).
- **HD-V3-C** (Sonnet 5.5 · high, B Opus 5.5 · medium): TVV + CX (+ Head tutor chỉ sửa sai). Như B.

## Nghiệm thu
- `npm run check` xanh; phép kiểm mới đỏ trên main cũ (chứng minh có tác dụng).
- Ảnh 1440 + 375 (tối) panel "?" ở 2–3 màn / panel mới để PTA rà (không đổi bố cục → không cần ảnh cặp mockup).
- Mô tả PR: bảng đối chiếu tóm tắt (bao nhiêu việc thêm / sửa / bỏ), danh sách `ponytail:`, KB gzip mảnh Hướng dẫn trước → sau, Turso 0 câu mới.
