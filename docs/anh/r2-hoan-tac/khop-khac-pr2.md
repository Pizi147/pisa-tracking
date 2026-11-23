# R2 PR2 — Hoàn tác tutor · việc · Case · KQ (C3 C8 C9 C10 C11 C12 C13) · khop-khac

Nguồn: `docs/superpowers/specs/2026-11-24-ra-chan-cung/bao-cao.md` mục 2. Đã đọc mã xác nhận cả 7 điểm đúng.

| # | Thao tác | TRƯỚC | SAU |
|---|---|---|---|
| C3 | Xoá tutor / xoá nhận xét tutor | DELETE cứng, mất hẳn nhận xét | Xoá mềm vào **Thùng rác** (N28: loại `tutor`, `nhan_xet_tutor`), toast **Hoàn tác** = khôi phục (tutor + nhận xét về y như trước); luật 24 giờ (H28) giữ |
| C8 | Giao nhầm việc vận hành | Chỉ "Dừng hẳn" + lý do, nằm bảng mãi | Toast **Hoàn tác** sau khi giao (việc không kèm việc con / tệp) + nút **Xoá việc** ở panel khi chưa có cập nhật (`DELETE /mgmt-tasks/:id` → Thùng rác, Khôi phục được). Đã có cập nhật / việc con / PA → ẩn nút, câu máy chủ chỉ về Dừng hẳn |
| C9 | Sửa nhận xét tutor | Chỉ người ghi — GV nghỉ thì kẹt | Thêm **Head tutor / Quản trị / Head chi nhánh nơi dạy** sửa được (`suaDuocTutor`); nhật ký trước → sau giữ người sửa. **Xoá** vẫn chỉ người ghi + 24 giờ |
| C10 | Khôi phục KQ MT khi kỹ năng đã huỷ phần thi | 400 chặn, không nói bước tiếp | **Hỏi một câu** ("mở lại kỹ năng rồi khôi phục?") → đồng ý thì mở lại kỹ năng (về chờ thi) cùng giao dịch, như lượt đã huỷ |
| C11 | Kết luận Kỳ vọng FT | Chỉ Đạt ↔ Không đạt, không về "chưa kết luận" | `PUT /students/:id/ket-luan-ft { dat: null }` bỏ kết luận; toast **Hoàn tác** ở hồ sơ HV + bảng Kết quả đầu ra cả lớp (về đúng kết luận trước). Case Kỳ vọng đã tạo giữ nguyên |
| C12 | Đổi người phụ trách Case | Không Hoàn tác | Toast **Hoàn tác** = đổi lại người cũ (so-và-đổi: người khác vừa đổi → 409) |
| C13 | Sửa Mô tả việc đã kết thúc | Chặn 400 | Sửa được (lịch sử + nhật ký như thường, 409 so-và-đổi); **Hạn / Phụ trách giữ chặn** |

Giữ: quyền kiểm TRƯỚC khi ghi, Thùng rác 30 ngày, nhật ký. Không mất thao tác nào.
Phép kiểm: `prR2HoanTac.tests.ts` (C3 C8 C9, so CẢ DB trước / sau khôi phục) · `prKv.tests.ts` R2-C11 · `prMta.tests.ts` R2-C10 · `prHangMuc.tests.ts` R2-C13. C12 web-only (đường đổi người sẵn có đã có phép kiểm so-và-đổi).
