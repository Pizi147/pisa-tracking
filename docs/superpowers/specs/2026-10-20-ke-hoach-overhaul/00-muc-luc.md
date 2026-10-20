# 00 — Mục lục bộ tài liệu overhaul UX/UI + workflow · PISA Tracking (20–21/10/2026)

> **Trạng thái: CHỜ CHỦ SP DUYỆT VÒNG CUỐI.** Chưa sửa mã, chưa mockup mới, chưa PR, chưa deploy (master prompt "quy tắc trạng thái hiện tại").
> Nguồn yêu cầu: 4 vòng góp ý của chủ SP ngày 20/10 + **master prompt tổng hợp cuối** (`PISA_CRM_MASTER_PROMPT_UX_UI_OVERHAUL_FINAL.md`) + lời bổ sung 21/10 (luật 5: thu hồi / không tăng bậc qua QL; tạo Case nhiều kỹ năng trong một panel; góp ý GV về ô nhắc việc kiểu Base — phụ lục `v4d-case-thong-bao.md`).
> Soạn: session planning "PTA Plan" (Opus 5.5) điều phối 17 agent Opus (rà độc lập, chỉ đọc web demo + mã + DB demo).

---

## 1. Đọc gì trước (chủ SP — 15 phút)

1. **[02 — mục 0 "Tóm tắt" + mục 5 "17 câu PHẢI HỎI"](02-conflict-decision-log.md)** — trả lời 17 câu (5 nhóm, mỗi câu có khuyến nghị đứng đầu). Không câu nào hỏi lại 5 luật đã chốt.
2. **[02 — mục 4.7 A, B](02-conflict-decision-log.md)** — các mục PTA tự quyết **có đảo quyết định / mockup cũ** (A) hoặc **diễn giải luật** (B): chỉ cần phản đối mục nào không đồng ý.
3. **[07 — mục 0 "Đọc nhanh"](07-pr-plan.md)** — thứ tự làm, cái gì trước deploy.
4. (Khi cần chi tiết) [03](03-ux-ui-audit.md) mục 0 (điểm + 10 vấn đề nặng nhất) · [05](05-ia-workflow.md) mục 0 (bảng 40 quyết định thiết kế workflow).

## 2. Bộ tài liệu (master prompt XVII — 7 đầu ra bắt buộc)

| # | Tệp | Là gì | Trả lời câu hỏi |
|---|---|---|---|
| 01 | [Feedback Register](01-feedback-register.md) | **mọi** phản hồi của chủ SP (20/10 chiều → vòng 4 + 21/10, kèm quyết định trước 20/10 còn hiệu lực), mã FB ổn định, loại A–F, ưu tiên, nơi áp dụng, xử lý ở đâu; gộp thành vấn đề hệ thống HT; đối chiếu đủ mục IV–XV của master prompt | "Có sót ý nào của tôi không?" |
| 02 | [Conflict & Decision Log](02-conflict-decision-log.md) | 37 quyết định đã chốt (gồm **5 luật nghiệp vụ** + "Tạo Case nhiều kỹ năng" 21/10) · 74 xung đột + bên thắng · sổ 148 câu (đã trả lời / gộp / PTA tự quyết / **17 PHẢI HỎI**) · 63 mục PTA tự quyết | "Cái gì đã chốt, cái gì mâu thuẫn, tôi cần trả lời gì?" |
| 03 | [UX/UI Audit](03-ux-ui-audit.md) | kiểm định theo trang → thành phần → vai → luồng; mỗi vấn đề đủ 10 ý (ở đâu · biểu hiện · bằng chứng · nguyên nhân · ảnh hưởng · phương án · xuyên trang · luật · **cách kiểm thử** · cần xác nhận); điểm Nielsen | "Web đang hỏng gì, vì sao, sửa thế nào, kiểm ra sao?" |
| 04 | [Design System Proposal](04-design-system.md) | một hệ: chữ, khoảng cách, màu, **màu điểm trên chính con số**, `Bang` + kiểu cột, `ODiem`, `OSo`, panel ("Khung việc", panel C), badge, nút, trạng thái, ô nhập / `Khoảng tuần`, responsive, a11y, sân mẫu, 30 phép kiểm máy, giữ / thay / bỏ thành phần cũ | "Mọi màn sẽ trông và phản hồi thế nào cho nhất quán?" |
| 05 | [IA & Workflow Proposal](05-ia-workflow.md) | nhiều phương án cho từng khu lớn (trang theo vai, Tổng quan ↔ Công việc, chấm Test, **MT 12 trạng thái × 30 chuyển**, **vi phạm → TVV**, sửa sau lưu / khoá cứng, SOS / PA, lịch thi, Phân tích, xuất, Tutor), đếm bước theo vai, một phương án ưu tiên | "Mỗi vai làm việc theo luồng nào, ít bước hơn bao nhiêu?" |
| 06 | [Mockup-to-Implementation Gap](06-mockup-gap.md) | khớp % từng màn có mockup đã duyệt, nguyên nhân lệch (N1–N24), mockup hết hiệu lực / phải sửa / phải vẽ mới, **quy trình 12 bước + cổng PR** để lần này bám thiết kế | "Vì sao web khác mockup và lần này kiểm soát thế nào?" |
| 07 | [PR Implementation Plan](07-pr-plan.md) | nhóm PR GĐ0 → GĐ1 (trước deploy) → GĐ1b (việc TVV) → NEN → GĐ2 (mỗi màn một PR) → GĐ3 → GĐ4; phụ thuộc, phạm vi, rủi ro, tiêu chí nghiệm thu, kiểm thử hồi quy, đối chiếu màn hình | "Làm theo thứ tự nào, khi nào deploy, nghiệm thu ra sao?" |

## 3. Năm luật nghiệp vụ đã chốt (không hỏi lại — nguyên văn ở 01 mục 1, 02 mục 2.1)

1. GVCN **lưu xử lý vi phạm** → **ngay** sinh việc TVV ghi nhận kết quả xử lý (không đợi duyệt khác).
2. Hạn việc đó **5 ngày lịch** từ lúc GVCN lưu, gồm T7, CN (PTA làm rõ giờ: hết 23:59 giờ VN ngày lưu + 4; vd lưu T2 14/09/2026 → hết T6 18/09).
3. Có quyền sửa thì **được sửa sau khi lưu, có lịch sử**; giữ các bước duyệt bắt buộc.
4. MT, cùng chuỗi dời: **"-" lần 1 → dời tuần tiếp theo; lần 2 → huỷ**; áp cả lịch MT tuần cũ; MT hiện tại giữ luồng gửi duyệt.
5. (21/10) GVCN **thu hồi** lần xử lý đã lưu hoặc **xử lý không tăng bậc** → **gửi QL duyệt, lý do bắt buộc**.
Mã hiện tại **lệch 4/5 luật** (L1 chưa có việc TVV; L3 khoá R11 làm GV không sửa được điểm Progress; L4 "-" ở MT cũ / sau tuần thi thành "Không dự thi"; L5 GVCN đang xoá thẳng lần xử lý) → nằm trong GĐ1 / GĐ1b của 07.

## 4. Bằng chứng + lịch sử (không phải đọc hết)

- Tài liệu đánh giá gốc: [`../2026-10-20-danh-gia-lai-ux-ui-toan-dien.md`](../2026-10-20-danh-gia-lai-ux-ui-toan-dien.md) — mục 0–9 (rà 20/10: 23/40, 10 cặp ảnh mockup | web, X1–X11), mục 10 (vòng 1), 11 (vòng 2), 12 (vòng 3). **Từ 21/10, kế hoạch hiện hành là bộ 00–07**; mục 8 + 10.6 / 11.7 / 12.10 của tài liệu gốc giữ làm lịch sử.
- Phụ lục nghiên cứu (mỗi phát hiện đủ chi tiết, `tệp:dòng`, số đo): [`../2026-10-20-danh-gia-ux/`](../2026-10-20-danh-gia-ux/) — a1–a7, b (rà 20/10) · v1-nen-chung, v1-tong-quan (vòng 1) · v2a, v2b (vòng 2) · v3a, v3b (vòng 3) · **v4a-cong-viec, v4b-nghiep-vu, v4c-vai-tro-phu-web, v4d-case-thong-bao** (vòng 4 + bổ sung 21/10) · ảnh tiêu biểu `anh/`.
- Ảnh tạm (~800 ảnh vòng 2–4) ở scratchpad phiên PTA Plan, không lưu repo.

## 5. Sau khi chủ SP trả lời

PTA Plan ghi "Chủ SP chọn: …" dưới từng câu ở 02 → cập nhật 01, 04, 05, 07 cho khớp → chủ SP duyệt plan cuối (merge PR #486) → GĐ0 (tài liệu, công cụ, seed) → GĐ1 → deploy khi chủ SP bảo → GĐ1b → vẽ mockup từng màn → GĐ2…
