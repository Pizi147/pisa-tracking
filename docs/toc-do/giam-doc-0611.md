# GIAM-DOC-0611 — giảm dòng đọc Turso phía máy chủ (06/11 khuya)

Chủ SP 06/11 khuya: "Rà lại một lần nữa và giảm dòng đọc turso + tăng tốc độ website + cắt gọn code ở tất cả mọi nơi". Phần máy chủ (`server/src`).
Cách đo như `ra-doc-0611.md`: `tocDo.run` (`PISA_IN_JSON` + `PISA_IN_DO` + `PISA_DO_IT`) rồi `scripts/do-it.py` trên DB ×3.
Thêm: **quét thật** = dòng của bảng > 50 dòng bị `SCAN` không qua chỉ mục (bỏ `SCAN ids` / `json_each` / hằng — `do-it.py` đếm cả các bước đó vào "quét cả bảng").
Cỡ bảng bản chính lấy từ bản chép 29/10 (`D:\pisa-mig\mig.sqlite`, chỉ đếm).

## Đường chưa đo (đối chiếu `DUONG_DO` với mọi `api.get` + chỗ web gọi)

Thêm 13 đường (36 vai × đường) + trần câu / dòng: `/ref/periods` · `/classes/{lopFT}/phoi-hop-sos` · `/classes/{lopFT}/y-thuc/lo` · `/students/{hv}/phoi-hop-sos` ·
`/students/{hv}/s-expert` · `/cycles/{loTrinhHv}/suggested-mocks` · `/hoc-vien-lop/lich-thi/{loTrinhHv}/lich-su` · `/bao-cao-ph/lop?branchId=` ·
`/classes/{lopFT}/teachers` · `/tong-quan/gv-tre` (Admin; QL `?gv=`) · `/cham/lich-test/qua-han` · `/admin/mo-sua-lich-test`.
Đường GET còn lại chưa đo: trang quản trị / ops ít mở (`/admin/*`, `/demo/*`, `/auth/*`, `/thung-rac`, tệp đính kèm…) — không đáng thêm.

## Bản chính (29/10) — vì sao không làm vài ứng viên đã biết

| Ứng viên | Bản chính | Kết luận |
|---|---|---|
| `teacher_assignments` SCAN (`phanCongDangHoatDong`) | 504 / 517 dòng `active` (97 %) | chỉ mục `status` không bớt dòng — **không làm** |
| `case_interventions` SCAN (`iv.status IN ('planned','started')`, Công việc) | 376 / 467 PA đang chạy (80 %) | chỉ mục bớt ≤ 20 %, DOC-IT-2 đã thấy đổi kế hoạch tệ hơn — **không làm** |
| `bao_ph_tvv` mọi chi nhánh (`mywork.ts` 3c) | 21 dòng `pending` / 436 việc phối hợp | lọc theo lớp GV trong SQL phải đọc mọi em của lớp (≈ ngang SCAN) → **chỉ mục một phần** (PR-c) |
| `sc.status != 'done'` (quét nền, Case mở) | 502 / 573 Case chưa xong (88 %) | như DOC-IT — **không làm** |

## Sửa

Mọi PR: JSON mọi (vai × đường) giống hệt trước / sau (`PISA_IN_JSON`, chuẩn hoá giờ seed); số trong ngoặc là ×3.

| PR | Việc | Trước → sau | Ước / ngày |
|---|---|---|---|
| a (#1087) | `listCases` theo em (`COALESCE(...) = ?` → tập cha đi chỉ mục) + 13 đường mới vào `DUONG_DO` | panel một em: quét cả bảng 329 → 3 · Lịch thi −326 | ~0,4 triệu |
| b (#1086) | chip TVV / CX: cờ Thiếu thông tin không dựng cả danh sách Học viên & Lớp | CX Tổng quan 61 → 16 câu · 11 215 → 6 180 dòng · 986 k → 538 k bước VM | ~0,45 triệu |
| c (#1091) | chỉ mục một phần `idx_sca_cho` (migrate `prGiamDoc0611`) — việc phối hợp đang chờ | Công việc: SCAN `sos_coordination_actions` (bản chính 436) → ~21 | ~0,35 triệu |
| d | `napTruocPhamVi` nạp sẵn lớp đang học — hết N+1 `activeClassOf` | tab Phối hợp SOS của lớp 23 → 11 câu (×1; bản chính một câu mỗi em) | tốc độ (dòng ≈) |
| **Tổng** | | | **~1,2 triệu dòng / ngày (~36 triệu / tháng)** |

Giả định tần suất: ~50 GV · 8–10 QL · 13 CX · 14 TVV (bản chính 29/10); GV ~700 lần dựng Công việc / ngày, ~300 lần mở panel một em; CX ~6 lần trang đầu + Học viên.
Số đo là bước máy ảo + dòng quét / trả của SQLite, không phải đơn vị Turso — xác nhận bằng Turso Top Queries 2–3 ngày sau deploy.

## [XM] cho PTA — chưa sửa, lý do + đề xuất

1. **[XM-A] Lượt quét nền chạy lại sau MỌI lần ghi** (`quetTheoMoc`: ≥ 60 s, HOẶC sau một lần ghi qua API, HOẶC sang ngày). Mỗi lượt (`quetYeuCau` + dời quá hạn):
   +13 câu, ~450 dòng quét cả bảng ×3 (`sos_cases` cho Báo QL nguyên nhân, `students` cho Báo lên Ý thức, `yeu_cau_duyet`…) ≈ 600–1 000 dòng bản chính.
   GV nhập điểm / ghi việc liên tục → gần như mỗi lần ghi kéo theo một lượt quét ở GET kế tiếp. Ước 1 000 lần ghi / ngày ≈ **0,6–1 triệu dòng / ngày** (không đo được
   số lần ghi bản chính ở máy này). Đề xuất (đổi hành vi — thẻ tự tạo / tự đóng trễ tối đa N giây sau lần ghi): sau ghi chỉ quét lại khi lượt trước đã ≥ 10–15 s.
   Cần PTA / chủ SP quyết; xác nhận bằng Turso Top Queries trước.
2. **[XM-B] Quản lý / Admin / CX một chi nhánh đọc mọi Case cả hệ thống rồi lọc quyền trong mã**: `napCaseMo(null)` (Công việc QL) và `listCases(p, {})` (Danh sách Case,
   `/signals`, `/metrics/*`, Phân tích Báo cáo, Tổng quan V5 `kemBaoCao=1`) SCAN `sos_cases` (bản chính 573) + tra lượt / em từng Case. DOC-IT-3 / RA-DOC-0611b đã lọc tập cha
   cho GV (quyền theo lớp); với quyền theo chi nhánh tập cha phải gồm cả Case của em có ghi danh CŨ ở chi nhánh đó + `students.branch_id` (luật `branchesOfStudent`) + lớp có phân công
   → cần phép kiểm "giống hệt" mọi tài khoản như RA-DOC-0611b. Ước: QL ~150 lần Công việc / ngày × ~1 500 dòng bớt ≈ **0,2 triệu dòng / ngày** + trang Case / Phân tích ít mở.
   Đề xuất làm thành PR riêng nếu PTA đồng ý.
3. **[XM-3] còn lại**: `/hoc-vien-lop` GV / QL 48–50 câu · 5 200–7 000 dòng ×3; `/tong-quan/v5?ct=ft` QL 35 câu · 6 500 dòng ×3; Tổng quan GV 49 câu. Câu nặng nhất đều đi
   chỉ mục (lượt, điểm, Case của lớp mình) — dòng = em × lượt, không có câu thừa / lặp / quét cả bảng. Không làm.
4. `SELECT name FROM branches WHERE id = ?` hỏi lại trong cùng request (Tổng quan GV, hồ sơ GV: +1 câu) — `branches` không có trigger phiên bản để nhớ theo tiến trình; thêm trigger =
   migrate, lợi 1 câu / 1 dòng. Không làm.
