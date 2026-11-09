# RKC-2b ③ — Gộp bước Xác nhận Case → PA (chủ SP 11/11)

Không đổi bố cục (không mockup mới): thêm một link theo mẫu sẵn có ("Đề xuất PA khác…", "Không cần theo dõi…") và một câu dải lưu.

## Luật đã làm

| Luật (chủ SP 11/11) | Máy chủ | Web |
|---|---|---|
| Sửa Case chưa xác nhận (lưu) = Xác nhận Case | `suaCase` → `xacNhanCase` (cùng luật nhóm + mô tả ≥ 15, quyền `coTheXacNhanCase`, nhật ký `case.confirm` + `nguon: 'sua_case'`, Hành trình "Xác nhận Case (khi sửa Case)") | Không đổi: Case chưa xác nhận đã hiện form Xác nhận tại chỗ (sửa = xác nhận một bước). |
| Ghi KQ PA lần đầu = Xác nhận PA | `updateResult` PA quy chế chờ → `xacNhanPaQuyChe` (nguyên văn nội dung PA, bắt đầu = ngày ghi) + ghi KQ trong **một giao dịch**: KQ lỗi thì PA vẫn chờ. Nhật ký `case.preset.confirm` + `nguon: 'ghi_ket_qua'` | Form Xác nhận PA có link **Ghi kết quả…** → form Kết quả PA; lưu xong dải "✓ Đã lưu kết quả · đã xác nhận PA · Hoàn tác". |
| Nút Xác nhận riêng vẫn còn | Đường `/cases/:id/xac-nhan`, `/interventions/:id/xac-nhan-pa` giữ nguyên | Nút "Xác nhận Case", "Xác nhận PA" giữ nguyên |
| Quyền giữ nguyên | Xác nhận ngầm đi qua đúng hàm xác nhận → kiểm quyền xác nhận (người ghi KQ được mà không được xác nhận → 403 như nút) | Link chỉ hiện khi form Xác nhận PA hiện (`canEdit`) |

## Bảng thao tác TRƯỚC → SAU

| Việc | Trước | Sau |
|---|---|---|
| PA quy chế chờ, GV đã làm, muốn ghi KQ | Xác nhận PA (gõ nội dung ≥ 15, ngày) → lưu → bấm Ghi kết quả → chọn KQ, nhận xét → lưu (2 lần lưu) | Mở thẻ PA → **Ghi kết quả…** → chọn KQ, nhận xét → lưu (1 lần lưu) |
| PA quy chế chờ, xác nhận trước | Xác nhận PA | Giữ nguyên |
| Đề xuất PA khác / Không cần theo dõi từ form Xác nhận PA | Có | Giữ nguyên |
| Hoàn tác lần ghi KQ đầu | — | PA về **chờ xác nhận** đúng như trước (nội dung, người, ngày, hạn), mốc Hành trình gỡ |
| Sửa Case chưa xác nhận qua API (`PATCH /cases/:id`) | 400 "Case chưa xác nhận — Xác nhận Case trước." | = Xác nhận Case (thiếu nhóm / mô tả → nói đúng lý do) |
| PA Tutor chưa có Số buổi | Xác nhận PA (nhập Số buổi) | Giữ nguyên; **không** có link Ghi kết quả… (máy chủ đòi Số buổi — không để GV bấm rồi bị chặn) |

Không mất thao tác nào.

## Hoàn tác

- Hoàn tác **Ghi KQ lần đầu** có huỷ xác nhận ngầm: PA về chờ (`traXacNhanNgam`, nhật ký `case.preset.confirm_undo`). Giữ xác nhận khi PA còn KQ khác hoặc có thay đổi khác sau lần xác nhận (Sửa PA…) — không đè chỗ người khác đã sửa.
- Chỉ **người đã ghi** (= người xác nhận ngầm) mới trả PA về chờ, như Hoàn tác xác nhận PA. Người khác hoàn tác KQ → chỉ gỡ KQ, PA vẫn chạy.
- **Xoá kết quả** (QL, N37) không trả PA về chờ: xoá là việc khác Hoàn tác — PA đã chạy giữ nguyên, QL đổi tiếp nếu cần.
- **Sửa Case = xác nhận**: Sửa Case không có Hoàn tác riêng; lần xác nhận ghi đúng nhật ký `case.confirm` nên `POST /cases/:id/hoan-tac-xac-nhan` dùng được như nút Xác nhận (phép kiểm GXN-1). Trên web không có đường này (Case chưa xác nhận hiện form Xác nhận, đã có toast Hoàn tác).

## "Chờ xác nhận" tự hết (phép kiểm `prHoanTacXn` GXN-1…3)

Công việc (`myWork`) · chuông (`thongBaoCua` — `con_viec`) · sổ nghĩa vụ (`tinhViecChiNhanh`, Phân tích đọc sổ này): việc "Xác nhận Case" / "Xác nhận PA" hết ngay sau xác nhận ngầm, hiện lại sau Hoàn tác.

## Bản chép thật `D:\pisa-mig\mig.sqlite` (07/11, chép ra thư mục tạm; không migrate)

Chạy đường mới bằng tài khoản Quản trị trên mọi Case / PA đang chờ:

| | Trước | Sau |
|---|---|---|
| Case Progress / KCK chờ xác nhận | 35 | **0** (35/35 Sửa Case thành công) |
| PA quy chế chờ xác nhận | 115 | 103 (12 ghi KQ thành công) |
| Công việc "Xác nhận Case" | 35 | 0 |
| Công việc "Xác nhận PA" (theo Case) | 59 | 47 |

103 PA còn chờ đều bị chặn **đúng luật như nút Xác nhận PA**: 54 "Case chưa có mô tả — ghi Mô tả Case trước" · 49 "PA Tutor cần Số buổi / 2 tuần" (web ẩn link với PA này). Không lỗi 500.

## Turso (GXN-5, seed)

| Đường | Câu SQL |
|---|---|
| Xác nhận PA + Ghi KQ (hai lần lưu) | 194 |
| Ghi KQ lần đầu = xác nhận (một lần) | **117** |
| Xác nhận Case (kèm sửa PA) | 177 |
| Sửa Case = xác nhận | 101 |

Không thêm đường GET, không thêm câu đọc khi mở trang.

## Việc 2 — hộp Chờ duyệt xin `boiCanh`

Đã có từ B6: `HopChoDuyet` gọi `/yeu-cau?hop=cho-duyet&boiCanh=1` (trần 29 câu ở `tocDoDuong.ts`); danh sách + panel hiện chip SOS / Điểm / Lịch sử (kiểm seed 11/11: "SOS 3 · L, R, S"). Không sửa code; dòng [XM] cũ ở plan.md đã gạch.

## Ảnh (seed, QL Monbay, Case 40 · PA Xếp tự học chờ xác nhận)

- `truoc-xac-nhan-pa-1440.png` | `sau-xac-nhan-pa-1440.png` — link **Ghi kết quả…** cạnh Đề xuất PA khác…
- `truoc-xac-nhan-pa-375.png` | `sau-xac-nhan-pa-375.png`
- `sau-ghi-kq-1440.png` — bấm Ghi kết quả… → form Kết quả PA ngay trong thẻ
- `sau-da-luu-1440.png` — lưu → PA "Đang chạy · KQ hạn 13/10", dải "✓ Đã lưu kết quả · đã xác nhận PA · Hoàn tác"

## [XM] / ghi chú

- PA đang chờ QL duyệt đổi PA (đề xuất PA khác): Ghi KQ vẫn bị chặn như cũ — không xác nhận ngầm PA gốc.
- Case chưa xác nhận: `PATCH` kèm `luc` cũ → 409 như Sửa Case thường.
- Rà `/code-review high`: 9 mục, sửa 5 (PA chờ đổi, `luc`, quyền Hoàn tác, chữ dải theo quyết định, trần `tocDoDuong.ts` 153 / 132 câu); bỏ qua 4 (Xoá KQ — xem trên; luật Tutor ở web; vài câu đọc lặp — tổng vẫn 117 < 194; lọc nhật ký — mọi đường sửa PA đều ghi nhật ký PA).

- PR-S4F #9 (Q28-5) "mô tả PA do người xác nhận gửi": đường Ghi KQ dùng **nguyên văn** nội dung PA (xác nhận "giữ nguyên"); GV sửa Nội dung tại chỗ sau nếu cần. Theo chủ SP 11/11 (ghi KQ = xác nhận).
- Ngày bắt đầu PA khi xác nhận ngầm = ngày ghi KQ (mốc quy chế tính từ đó).
