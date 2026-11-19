# S4 — Giảm bước (kế hoạch giao, 20/11/2026)

PTA Tutor. Nguồn: `bao-cao.md` mục 4 (15 đề xuất, có `tệp:dòng`) + mục 5 (7 câu — chủ SP 20/11 "câu hỏi theo khuyến nghị hết" → luật **N56**, `plan.md` 1.6).
**Chưa giao.** Chạy SAU khi S1 (PTA Plan) và S2 (PTA Tutor) merge — S4 đụng `FormPa.tsx` (S1) và thành phần chung (S2).
Luật mọi PR: như `docs/superpowers/specs/2026-11-19-tutor/06-ke-hoach-pr.md` mục 0 (karpathy-guidelines · ponytail · check đầy đủ · đo Turso · bảng thao tác TRƯỚC → SAU · không deploy).

## Chia hai gói (khác tệp, chạy song song được)

### S4-LUAT — PTA Plan giao (đổi luật kiểm, web + máy chủ cùng một PR mỗi mục)

| Mục | Việc | Chỗ (theo báo cáo) | Tiêu chí kiểm |
|---|---|---|---|
| N56 ① | Head mở việc của GV khác **vào thẳng form** + dải "Bạn đang làm thay {tên} · Thôi, chỉ xem"; bỏ bước bấm "Làm thay" | `web/src/modules/congViec/HoTroHocVienTab.tsx:705-708, 818` | quyền máy chủ không đổi; việc của chính mình không có dải; nhật ký vẫn ghi người làm thay |
| N56 ② | Chuyển lớp: "Lý do" **tuỳ chọn** mọi kiểu chuyển | `web/src/modules/students/ChuyenLopPanel.tsx:200, 204, 422` + kiểm máy chủ tương ứng | để trống lưu được; lịch sử vẫn có ai · lúc · lớp → lớp; có lý do thì lưu như cũ |
| N56 ③ | Xử lý vi phạm **đúng bậc mặc định**: "Mô tả" để trống được → máy ghi "{BẬC} · {vi phạm}"; khác mặc định (Không nâng · Vượt bậc · Ngoài thang) giữ bắt buộc như N1 | `web/src/modules/yThuc/XacNhanXuLyPanel.tsx:144, 438` · `server/src/yThuc/xuLy.ts` | 2 ca: đúng bậc trống → 200 + chữ tự ghi; khác bậc trống → 400 |
| N56 ⑤ | Hoàn thành Case, chọn **"Tiến bộ rõ"**: "Vì sao kết luận vậy" để trống được; mức khác giữ ≥ 8 ký tự | `web/src/modules/cases/ThaoTacCase.tsx:193` · `server/src/cases/cases.ts:224` | 2 ca như trên |
| Đề xuất 2 | Head điền thay bàn giao: **hỏi một lần cho cả phiếu** đang mở | `server/src/classes/banGiaoGv.ts:263, 287, 300`, `banGiao.ts:53` · `web/src/lib/api.ts:143` · `BanGiaoGvPanel.tsx:81` | 5 em × 2 môn: đúng 1 hộp hỏi; đóng phiếu mở lại thì hỏi lại |
| Đề xuất 9 | Ngưỡng chữ xử lý vi phạm web 10 → **8** (một hằng chung với máy chủ) | `yThuc/XacNhanXuLyPanel.tsx:25`, `yThuc/LoYThucPanel.tsx:20` | web và máy chủ cùng hằng |
| Đề xuất 10 | Rút tình hình: bỏ hộp hỏi của trình duyệt → rút thẳng + toast **Hoàn tác** (cần đường "bỏ rút" ở máy chủ) | `yThuc/ClassYThucCard.tsx:356`, `yThuc/StudentYThucSection.tsx:214` | Hoàn tác trả lại đúng trạng thái; có nhật ký |

N56 ④ (Nhận xét kết quả PA giữ bắt buộc): không làm gì. N56 ⑥ ⑦: đã ở gói S2.
Model gợi ý: Opus 5.5 · high (B: Sonnet 5.5 · high). Rà sâu `/code-review high` (đổi luật kiểm ở máy chủ). Thử bản chép: không migrate; chạy 2 ca mỗi luật trên bản tạm.

### S4-GD — PTA Tutor giao (thuần giao diện, không đổi luật)

| Mục | Việc | Chỗ |
|---|---|---|
| Đề xuất 1 | Menu ⋯ chỉ có MỘT mục → nút chữ bấm thẳng (sửa một chỗ, 33 nơi gọi hưởng) | `web/src/ui/MenuDong.tsx:51` |
| Đề xuất 3 | Xoá lịch Test lớp thường: xoá thẳng + toast Hoàn tác, như xoá MT (bỏ hộp hỏi) | `web/src/modules/test/keHoach/HopKyNang.tsx:360-363, 443, 283` |
| Đề xuất 4 | TVV · KQ thi thật: đủ 4 điểm hợp lệ → mở bước 2 (Bước tiếp); MỘT nút chân lưu cả hai | `web/src/modules/congViec/PanelSauThi.tsx:108, 191, 224` |
| Đề xuất 5 | + Case: GV chỉ dạy 1 kỹ năng của em → chọn sẵn kỹ năng | `web/src/modules/cases/QuickReport.tsx:85, 144` |
| Đề xuất 6 | Chọn / Thay PA: "Loại PA" thành chip một hàng, nhóm "cần Head duyệt" ghi trên chip | `web/src/modules/cases/FormPa.tsx:54-61` (**sau S1 merge**) |
| Đề xuất 7 | + Case: "Nhóm nguyên nhân" dùng cùng chip như trong panel Case | `QuickReport.tsx:452` (mẫu `CasePanel.tsx:491`) |
| Đề xuất 11 | "Bỏ chữ đang gõ?" còn 2 chỗ dùng hộp gốc trình duyệt → hộp chung | `web/src/modules/yThuc/TinhHinh.tsx:188`, `web/src/lib/ngonNgu.ts:20` |
| Đề xuất 12 | Tạo tài khoản: điền sẵn mật khẩu ban đầu ngẫu nhiên (sửa được, có nút chép) | `web/src/modules/platform/AccountsAdmin.tsx:586, 637` |
| Đề xuất 13 | Chốt ngày thi › "Dời tháng dự kiến": điền sẵn tháng kế | `PanelSauThi.tsx:247` |
| Đề xuất 14 | Nút / ô mờ thêm lý do tại nút | `classes/CuoiKhoaLop.tsx:601`, `classes/PanelXetLai.tsx:260`, `classes/TabBaoCaoPh.tsx:240` |

Model gợi ý: Sonnet 5.5 · high (B: Opus 5.5 · medium). Không cần mockup (theo mẫu sẵn có); mỗi mục ảnh trước │ sau; đề xuất 1 phải chụp đủ các nơi ⋯ đổi thành nút (liệt kê 33 nơi, nơi nào còn ≥ 2 mục giữ ⋯). Kiểm: bàn phím + 375 cho nút mới; Hoàn tác xoá lịch trả đúng lịch cũ.

## Để sau (không thuộc S4)

- Đề xuất 8 (làm mới hẹp sau lưu) = gói S5, PTA Plan, có đo câu / dòng trước → sau.
- Đề xuất 15 (hai bản giao diện KQ thi thật) = gói S6.
