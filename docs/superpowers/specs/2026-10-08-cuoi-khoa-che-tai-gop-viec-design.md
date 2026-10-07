# Cuối khoá lớp thường · Chế tài · Gộp việc — đặc tả

Chủ sản phẩm chốt 08/10 (brainstorm với planning). Nguồn luật: file "[P. Học thuật] Quy định và Chế tài lớp thường" (Pass 70%,
chế tài Progress / Final, kỳ vọng đầu ra BE/ELE). Đè lên: PR-LC (`docs/superpowers/plans/2026-10-07-pr-luong-chuyen-giao.md`) ở các
điểm ghi dưới; mockup `thiet-ke/mockup-viec-sau-deploy-2026-10-08.html` phần 3 (thay bằng §3 ở đây).

## Luật chung (nhớ khi làm mọi PR)
- **Quản lý quản lý lớp và luật**; Quản trị chỉ hơn ở hệ thống. Không đặt luật nghiệp vụ "chỉ Quản trị".
- **Ít nút**: dồn về thao tác sẵn có; gộp xử lý nhiều em / nhiều thứ một lần khi hợp lý; chữ trên màn ngắn.
- Pass lớp thường 70% và dải Final <50 / 50–59 / 60–69 / ≥70 **đã đúng trong mã** (`shared/domain/normal.ts:38`, `cuoiKhoa.ts:19-28`).

## §1. Quy trình cuối khoá (chốt theo dự kiến — phương án A)
| Khi nào | Ai | Việc |
|---|---|---|
| Hạn **hết CN tuần 7 (FOU) / tuần 9 (BE/ELE)** | **Quản lý** — MỘT việc "Chốt lộ trình · <lớp>" | Panel **"Lộ trình tiếp theo"** (gộp, mockup `mockup-panel-cuoi-khoa-2026-10-07.html`): hướng từng em + lớp chuyển đến theo nhóm hướng (ô **gõ tên lớp**) + Xác nhận = ra lệnh. Lên FT → MT0 tự xếp tuần Final, Target theo Q2 PR-LC (Target GVCN ghi → Target khoá → hỏi). Quá hạn đỏ, không chặn |
| Trước hạn (tuỳ) | GVCN | Ghi **đề xuất** hướng + ghi chú trong cùng panel. Không thành việc của GVCN. Sau khi QL gửi quyết định: GVCN không đổi Hướng (QM2) |
| Thứ Hai sau tuần Final | Web | Thi hành lệnh: em sang lớp mới đúng lịch, **không chờ điểm** |
| Thứ Tư tuần đó | GV | Hạn chấm Final **và MT0** (MT0 đổi từ CN → **thứ Tư tuần sau tuần thi**, `shared/domain/mt0.ts:25`) |
| Khi điểm về | Web | §2 (chế tài Final, lên lớp thường) · §3 (kỳ vọng đầu ra, lên FT) · điểm lệch hướng đã chốt → một việc gộp "Xem lại hướng · <lớp> · n em" (mở Chuyển lớp cho đúng các em) |

Bỏ: việc "Chuyển tiếp lớp" đứng riêng; hai việc "Chốt lên FT" + "Chuyển tiếp lớp" thành một ("Chốt lộ trình").
Lệch hướng = (lên lớp / lên FT) mà Final < 50%; hoặc học lại mà Final ≥ 70% — chỉ gợi ý xem lại, không tự đổi.

### Chuyển lớp (làm lại, dùng cho mọi đổi lớp kể cả "quay lại học")
- Ô "Lớp chuyển đến" = **ô gõ tên lớp** + danh sách gợi ý (cùng kiểu `ChonNguoi`), lọc theo chi nhánh/chương trình hợp lệ.
- **Thường → FT**, **FT → FT**: chỉ cần lý do.
- **FT → Thường** (học lại sau khi đã lên): web tự đóng lộ trình FT vừa mở, MT0 → "MT0 · không dùng", huỷ bài Mock **chưa có điểm**; điểm đã có giữ. Không giới hạn thời gian. QL + QT.
- Không thêm nút "Đưa về học lại". "Học lại" ở Lưu trữ (em đã kết thúc học) giữ như cũ.

## §2. Chế tài lớp thường (lên lớp thường)
- **Progress Test**: đã có Case + bổ trợ tới Final + Báo PH. **Bỏ bước "GV nộp kế hoạch bài giảng · QL duyệt 3 ngày"** (`server/src/cases/boTro.ts:133…`).
- **Final**: tạo Case + PA bổ trợ + Mini Test **khi Final đủ điểm** (không chờ lệnh thi hành thứ Hai như `cuoiKhoa.ts:206-378`).
  Sửa số buổi **50–59% FOU và BE→ELE**: 1 buổi/kỹ năng không đạt/tuần × 2 tuần = **2 buổi/kỹ năng** (nay 1, `cuoiKhoa.ts:61-65`). PreFOU và 60–69% giữ.
- **BE/ELE lên FT**: **không** bổ trợ / Mini Test theo Final — chỉ xét kỳ vọng đầu ra (§3).

## §3. Panel "Kỳ vọng đầu ra · <lớp>" (BE/ELE lên FT)
- Hiện khi MT0 của lớp đủ điểm (em thiếu: "Chờ MT0"). QL có **một việc mỗi lớp**. Bỏ việc mỗi em (`mywork.ts:1137-1157`, `metrics.ts:565-578`).
- Đạt = **Overall MT0 ≥ ngưỡng** (BE 4.0, ELE 4.5). Đạt → không tạo gì.
- Không đạt → nguyên nhân điền sẵn = các kỹ năng MT0 dưới ngưỡng; QL chọn:
  - **Trung tâm** (mặc định): mỗi kỹ năng trượt **một Case**, PA mặc định **"Tutor 10 buổi"**, người dạy = **GV cũ dạy kỹ năng đó ở lớp BE/ELE**, người theo dõi / ghi kết quả = **GVBM kỹ năng đó ở lớp FT mới** (nay giao nhầm GVBM mới, `cuoiKhoa.ts:182`).
  - **Học viên**: **lý do bắt buộc**; vẫn tạo Case "không đạt kỳ vọng đầu ra", **không có PA mặc định** (QL thêm sau).
- Lớp bình thường: điền sẵn → **Lưu một lần**; sửa từng em trong bảng; hồ sơ HV vẫn sửa riêng.
- QL **sửa được PA mặc định** (số buổi, nội dung), nhật ký cũ → mới. LUI-a2 có Sửa Case / Xoá PA — kiểm có sửa nội dung PA chưa; thiếu thì làm.

## §4. Hạn xác nhận (PR nhỏ riêng)
- Xác nhận **nguyên nhân Case SOS** và **xác nhận Phương án**: **5 ngày** (tính cả ngày bắt đầu).
- Case GVCN chọn **Gấp**, hoặc **SOS 3**: **3 ngày**. Hạn khác giữ nguyên.

## §5. Gộp việc (Công việc, Tổng quan "Cần xử lý", badge)
- **Một dòng = một lớp × một loại việc**; bên trong liệt kê em; làm xong em nào em đó rời danh sách; hạn = sớm nhất; có em quá hạn → dòng đỏ.
- Gộp: Báo PH · Ghi kết quả bổ trợ / PA · Xác nhận nguyên nhân sau Progress · Ghi điểm Mini Test · Kỳ vọng đầu ra · Xem lại hướng.
- Giữ từng dòng: Case SOS Fast Track, thẻ Chờ duyệt.
- Mục tiêu trên seed 14/09: GVCN 41 → ~15–18 dòng, QL 21 → ~12–14. Số Case / việc thật không giảm; badge đếm **dòng**.

## §6. Từ mockup #259 (đã duyệt 08/10)
- Phần 1 "Nhắc tất cả (n)" ở Công việc › Của GV: theo mockup.
- Phần 2 Chờ duyệt › Nhắc việc: **A** (bộ lọc khác mờ, không biến mất).
- Phần 4 "GV chấm S": hàng rõ trên 375; **có** ở Điểm theo lớp (nhớ theo lớp × MT); **MT cũ không bắt buộc**.
- Phần 3 thay bằng §3 ở trên.

## Chia PR (gợi ý cho kế hoạch)
1. **PR-HAN** (§4) — S, máy chủ.
2. **PR-VIEC-NHO-2** (§6 phần 1, 2, 4) — S, giao diện theo mockup #259.
3. **PR-LC** cập nhật theo §1 (một việc QL, hạn tuần 7/9, bỏ "Chuyển tiếp lớp" riêng, xem lại hướng) — LCa đang làm: phần chênh vào LCa-bổ sung hoặc LCb.
4. **PR-CL** Chuyển lớp làm lại (§1) — M, cần mockup.
5. **PR-CT2** Chế tài Final + MT0 thứ Tư + bỏ duyệt kế hoạch (§1, §2) — M, máy chủ.
6. **PR-KV** Kỳ vọng đầu ra cả lớp (§3) — M–L, cần mockup.
7. **PR-GOP** Gộp việc (§5) — M–L, cần mockup Công việc.
Thứ tự: 1, 2 song song ngay · 3 (LCa) → 5 → 6 · 4 song song 5 · 7 cuối (đọc mọi loại việc mới).

## Kiểm
Mỗi PR: phép kiểm đỏ trước theo hành vi; `npm run check`; PR giao diện ảnh 375/1440 sáng/tối; rà bởi agent khác; planning tự merge khi đạt.

## §7. Chốt thêm 08/10 (sau mockup `mockup-cuoi-khoa-2-2026-10-08.html` — DUYỆT, trừ hộp "Sửa PA" phần 3)
- Chuyển lớp (phần 2): **vẫn có ô chọn Tuần** (có mặc định).
- Lên FT / chuyển từ FT: **Target và Dự kiến thi giữ như cũ**, không đổi. Bỏ ô Target ở Chuyển lớp (Q2); chỉ hỏi khi em chưa có Target nào.
- Đổi chữ: "Xem lại hướng" → **"Xét lại lộ trình"**; "điểm lệch hướng đã chốt" → **"Kết quả không phù hợp lộ trình"**.
- Q1: **gộp mọi loại việc theo lớp** (Nhập điểm, Thêm PA lớp thường, Ý thức…), giữ từng dòng Case SOS FT và thẻ Chờ duyệt.
- Q3: GV cũ không còn dạy → **để trống người dạy**, QL chọn khi sửa PA.
- **PA phải đồng bộ một mẫu** (PA tay, PA mặc định chế tài, PA Bổ trợ): Số buổi (tuỳ chọn) cho Tự học / Tutor, tự đếm sau mỗi tuần; "Ghi kết quả" → **"Kết quả"**; người dạy / người theo dõi — mockup riêng `mockup-pa-dong-bo-2026-10-08.html` (đang soạn).
