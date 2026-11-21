# Kế hoạch PR — BPXL · giao việc · Vận hành · gập / mở · trả lại vi phạm

Chủ SP duyệt mockup v22 20/11/2026. Luật: `plan.md` 1.6 **N57–N61**. Thiết kế: `thiet-ke.md` (cùng thư mục). Mockup: `thiet-ke/v22/` (+ `*-ghi-chu.md`).
Mọi PR: skill `karpathy-guidelines` + `ponytail`; PR giao diện thêm `/ponytail lite` + impeccable `layout / polish / harden / adapt` + `audit` + `web-design-guidelines`. Model code: Opus 5.5 · high (B: Sonnet 5.5 · high). Không deploy.

## Luật chung cho mọi PR của đợt này

- Dòng đọc Turso: đo trước → sau, thêm / sửa trần ở `server/src/tests/tocDoDuong.ts`. `/my-work` của GV đã sát trần dòng +3 % → KHÔNG thêm dòng; chỉ được +1 câu (việc giao cho tôi ngoài luật, có chỉ mục). Tab "Đang theo dõi" là đường riêng, chỉ tải khi mở tab, tab không có số đếm.
- Migrate: mỗi PR có migrate thì tệp `server/src/migrate/pr<Tên>.ts`, chạy hai lần không đổi, thử trên bản chép thật (`H:\My Drive\PISA TRACKING\back-up`; bản chính có cột ACTION / KEY viết hoa) và ghi kết quả trong mô tả PR. Chỉ mục mới: kiểm không đổi thứ tự dòng của câu không ORDER BY (memory `chi-muc-doi-thu-tu`).
- Quyền kiểm ở MÁY CHỦ, giao diện theo sau. Không bớt kiểm tra nhập, lịch sử, Hoàn tác.
- Không chữ "xếp lại" sau vắng ở bất kỳ đâu (N38, N57).
- Trước commit: `git fetch` + merge `origin/main`; `git add <tệp cụ thể>`; `git diff origin/main...HEAD --stat` soi tệp ngoài phạm vi; `npm run check` xanh. PR giao diện: ảnh cặp toàn trang mockup | web (1440 tối + 375 sáng), bảng thao tác TRƯỚC → SAU, bảng KHỚP / KHÁC; chủ SP duyệt ảnh trước merge.

## Đợt 1 — giao ngay (ba session song song)

| PR | Việc | Tệp chính | Xong khi |
|---|---|---|---|
| **BPXL-1** vai BPXL: máy chủ + menu + trang đầu | Vai `scheduler` ("Chuyên viên Xếp lịch", BPXL): migrate tạo vai + quyền (`attempt.view`, `test.view`, `plan.week`, `schedule.move`, `student.view`, `work.view`); phạm vi nhiều chi nhánh / trống = toàn hệ thống như CX; `duocSuaLichLop` cho lớp thường; KHÔNG `score.override`, `student.edit_info`, `case.view`, `analysis.view`, `attempt.cancel`; không là chủ việc theo luật nào (như `boVaiCx`); `GET /tong-quan/mock-test` cho BPXL; menu Test · Học viên & Lớp · Công việc; trang đầu → `/test/ke-hoach`; tài khoản demo BPXL; hướng dẫn `shared/huongDan/bpxl.ts` + EN. Dải 4 số + tin chuông vắng: để PR giao diện BPXL-2 | `server/src/seed/data.ts`, `migrate/prBpxl.ts`, `permissions.ts`, `platform/nav.ts`, `accounts.ts`, `shared/domain/people.ts`, `nhomQuyen.ts`, `dieuHuong.ts`, `web/.../OverviewPage.tsx`, `AccountsAdmin.tsx`, tests | Tài khoản BPXL đăng nhập vào thẳng Kế hoạch Test, xếp / dời MT được, sửa mốc lớp thường được; mọi đường sửa điểm / thông tin HV / Case / Ý thức trả 403 (phép kiểm từng đường); `/my-work` của BPXL không có việc theo luật |
| **GV-1** khung giao việc: máy chủ | Cột `phu_trach_id`, `giao_boi`, `giao_luc` trên `viec_bao_ph`, `sos_coordination_actions`, `tinh_hinh_hoc_tap`; bảng `viec_theo_doi (loai, ref_id, user_id, nguon, them_boi, luc)` + `viec_giao_lan` (lịch sử); API đổi người phụ trách / về mặc định / thêm bớt theo dõi / đặt hạn cho việc không hạn; quyền làm việc theo `phu_trach_id`; `notify()` cho người được giao + người theo dõi; `/my-work` tôn trọng ghi đè (+1 câu) + nhãn "{tên} giao"; đường mới `GET /my-work/theo-doi`; Meeting CX / GĐCN ba phần (Xếp lịch họp · BPXL, Kết quả meeting · CX + TVV nhập hộ, Báo PH · TVV giữ) — mỗi phần Hoàn thành / Hoàn tác, ngày giờ họp tuỳ chọn; người theo dõi mặc định theo N58; đổi GVCN / TVV thì dòng theo dõi tự động của việc còn mở chuyển theo | `server/src/schema.sql`, `migrate/prGiaoViec.ts`, `server/src/worklist/giaoViec.ts` (mới), `mywork.ts`, `yThuc/baoPhTvv.ts`, `yThuc/phoiHop.ts`, `yThuc/tinhHinh.ts`, `routes/index.ts`, `tocDoDuong.ts`, tests | Phép kiểm: giao Báo PH cho một Admin → Admin thấy ở `/my-work`, ghi kết quả được, TVV cũ thôi thấy ở "Của tôi" và thành người theo dõi; "Về mặc định" trả lại; người ngoài chi nhánh 400; người theo dõi chỉ đọc; ba phần Meeting độc lập; `/my-work` GV dòng không tăng |
| **GAP-MO** gập / mở mục (N60) | Mọi mục trong Công việc gập / mở bằng tiêu đề (dùng lại `DaiNhom`), nhớ `localStorage` theo người + tab, mục gập vẫn hiện "n việc · m quá hạn"; không thêm request | `web/src/modules/congViec/DanhSachViec.tsx`, `HoTroHocVienTab.tsx` | Ảnh cặp theo khung gập / mở của `thiet-ke/v22/giao-viec.html`; bàn phím (Enter / Space, `aria-expanded`); 375 |

## Đợt 2 — chỉ giao khi GV-1 đã merge

| PR | Việc |
|---|---|
| **VH-1** Vận hành máy chủ (N59) | Bảng nhóm tự đặt (`task_groups`: tên, thứ tự, ẩn, chi nhánh; 4 nhóm cũ → dòng khởi đầu; `tasks.group_id` NULL = Không phân loại); CX tạo / giao; nhiều người theo dõi qua `viec_theo_doi` (chuyển `watcher_user_id`, `task_followers`); `notify()` khi giao / đổi hạn / tiến độ / xong; người phụ trách sửa hạn, lý do tuỳ chọn; lặp lại hằng tuần / tháng (tạo bản mới trong hàm định kỳ sẵn có `doi-chieu-so`, không thêm function) + Dừng lặp; tệp đính kèm qua `attachmentSvc` |
| **TL-1** trả lại vi phạm máy chủ (N61) | Bảng `vi_pham_tra_lai` (mẫu `tinh_hinh_hoc_tap` chiều TVV → GVCN): trả một vi phạm / cả lần xử lý, lý do ≥ 8, hạn 3 ngày + sửa hạn, rút, Hoàn tác 60 giây, ba lựa chọn của GV, tạm dừng + tính lại hạn Báo PH, chặn khi Báo PH đã xong, việc "Vi phạm bị trả lại" trong `/my-work`, dùng khung giao việc (phụ trách, theo dõi), `violation_history` |
| **BPXL-2** giao diện trang đầu BPXL | Dải 4 số lặng + lọc + tin chuông vắng + 375 — theo `thiet-ke/v22/bpxl-trang-dau.html` |
| **GV-2** giao diện giao việc | Khối Phụ trách · Hạn · Theo dõi ở mọi panel việc phần B + hộp đổi người + tab "Đang theo dõi" + panel Meeting ba phần — theo `thiet-ke/v22/giao-viec.html` |
| **VH-2** giao diện Vận hành | Theo `thiet-ke/v22/van-hanh.html` (sau VH-1) |
| **TL-2** giao diện trả lại vi phạm | Theo `thiet-ke/v22/tra-lai-vi-pham.html` (sau TL-1) |

Một màn một PR; ≤ 2 PR giao diện song song, khác màn. PR quyền / migrate (BPXL-1, GV-1, VH-1, TL-1): PTA rà sâu (`/security-review` hoặc `/code-review high`) + thử migrate trên bản chép thật trước merge.

## Việc để sau (không thuộc đợt này)

- Rà chữ "xếp lại" / số `canXepLai` trên web thật ở Kế hoạch Test có trái N38 không.
- Ảnh "trước" của web thật cho 4 màn (session giao diện tự chụp khi làm ảnh cặp).

## N62 — Giao việc tay vào hạng mục + Mô tả (chủ SP duyệt 21/11)

Luật: `plan.md` 1.6 **N62**. Một cơ chế: việc tay = việc Vận hành (`tasks`) có thêm ô "Hạng mục". Không mockup riêng — thêm ô theo mẫu `thiet-ke/v22/van-hanh.html` (form V2) và `giao-viec.html` (khối G1).

| PR | Việc | Phụ thuộc |
|---|---|---|
| **VH-1b** máy chủ | `tasks.hang_muc` (khoá mục chính thống của Công việc, NULL = theo nhóm / Vận hành; danh sách khoá lấy từ `shared/domain/tongQuan.ts` `MUC_CV`, kiểm ở máy chủ) + `tasks.class_id` / học viên liên quan tuỳ chọn (dùng cột / bảng sẵn có nếu được) · `/my-work`: việc tay có `hang_muc` trả về đúng nhóm / mục đó kèm `giaoBoi`, mục tự hiện cho người nhận chưa có mục; không thêm câu · Mô tả tuỳ chọn cho việc N58: MỘT chỗ lưu chung theo (loai, ref_id) trong khung `giaoViec.ts` (≤ 500 ký tự, người phụ trách / người giao / Head / CX sửa, lịch sử ở `viec_giao_lan`), trả kèm khối giao việc, dọn trong `donViec` · phép kiểm + trần `tocDoDuong.ts` | VH-1 #1929 merge |
| **VH-2** giao diện (đang chờ) | thêm vào phạm vi: ô "Hạng mục" trong form giao việc (hai nhóm lựa chọn: Chính thống │ Tự đặt), ô lớp / HV liên quan, nút "+ Giao việc" ở trang Công việc cạnh "+ Task" (Head, Quản trị, CX), việc tay hiện trong đúng mục với nhãn "{tên} giao" | VH-1 + VH-1b merge |
| **GV-3** giao diện | dòng "Mô tả" (tuỳ chọn, sửa tại chỗ) trong khối Phụ trách · Hạn · Theo dõi của `KhoiGiaoViec` | GV-2 #1930 + VH-1b merge |
