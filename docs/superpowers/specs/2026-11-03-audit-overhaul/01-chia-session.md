# Audit overhaul 03/11 — chia việc cho session (PTA Plan)

Nguồn (CHỈ trên máy chủ SP, không commit): `D:/Download/Pisa tracking web/PISA-Tracking-Claude-Audit-Overhaul-2026-11-03.md` (gọi tắt `00`) + 4 ảnh ở `D:/Download/Pisa tracking web/audit-0311-anh/`:

| Tệp | Là | Nội dung |
|---|---|---|
| `anh-1-y-thuc-ho-so-lop.jpg` | **Ảnh 1** của yêu cầu gốc (mục 1.2) | Hồ sơ lớp CP FT 116 · tab Ý thức & Phối hợp mở Lê Thảo Nhi: thang xử lý, 6 vi phạm, bằng chứng, Phối hợp SOS, bảng điểm MT dưới |
| `anh-2-hanh-trinh-hop-cat-case-cuon.jpg` | **Ảnh 2** của yêu cầu gốc (mục 1.4) | Hồ sơ HV: hộp "Case Listening · MT3 · SOS 3" ở biểu đồ hành trình bị cắt đáy (gạch xanh); khung Case (gạch đỏ) = chỗ trỏ chuột không cuộn được trang |
| `anh-3-ho-so-hv-nhieu-case.jpg` | bổ sung (giống U02) | Hồ sơ HV Hà Trần Phúc · Overall: 4 Case mở hết, mô tả EN rất dài, "Tiến độ trên lớp" trống cột trái |
| `anh-4-hanh-trinh-ky-nang.jpg` | bổ sung (giống U07) | Hành trình CP FT 130: "5.0 Giảm 0.5 4.5" không tên mốc; Speaking "1 PA" cạnh "chưa có PA · Chờ xác nhận PA" |

Ảnh U01–U10 của mục 19 (10 tệp) chủ SP **chưa gửi** — session cần thì hỏi chủ SP đúng tên tệp; không giả vờ đã xem.

## Luật chung cho mọi session dưới
- Model: **Opus 5.5 · high** (phương án B: Sonnet 5.5 · high). Không dùng Fable.
- Đọc trước: `CLAUDE.md` · `plan.md` 1.6 + mục 4 khối "03/11 tối" · `00` (đủ mục 1–3 + phần của mình) · `DESIGN.md` khi có giao diện.
- Skill: `karpathy-guidelines` + `ponytail` (PR giao diện `/ponytail lite`); `superpowers:brainstorming` trước thiết kế; `impeccable` (`critique` + `ui-ux-pro-max` khi rà / mockup, `audit` + `web-design-guidelines` trước PR giao diện); `superpowers:systematic-debugging` cho lỗi.
- Đầu ra rà / quyết định ghi vào **`docs/superpowers/specs/2026-11-03-audit-overhaul/1x-<tên>.md`** của session (bảng xác minh: ID · mức · file:dòng · vai / lối vào · cách tái hiện · kết quả: tái hiện / không / đúng luật / đã sửa / thiếu dữ liệu).
- Hỏi chủ SP khi gặp quyết định nghiệp vụ thật: tình huống cụ thể, 1–4 câu mỗi đợt, một khuyến nghị. Không hỏi lại việc đã chốt (plan.md 1.6, `00` mục 3). Phần độc lập cứ làm.
- Mockup (đổi bố cục): `thiet-ke/`, 1440 + 375, tối + sáng, đủ trạng thái + vai; critique mục tiêu ≥ 35. **Chủ SP duyệt mockup trước khi code**; PR đổi bố cục nghiệm thu ảnh cặp ≥ 90 % KHỚP, chủ SP duyệt trước merge.
- Code: worktree `.claude/worktrees/<tên>`; một việc một PR nhỏ; `npm run check` đầy đủ trước khi mở PR ở ô **check-1 / check-2** theo `C:/Users/Admin/AppData/Local/Temp/pisa-slot/CACH-DUNG.txt` (check-3 của PTA). Đường API mới / đổi: trần câu + dòng ở `server/src/tests/tocDoDuong.ts`; tăng đọc Turso đáng kể → cảnh báo chủ SP trước.
- Mở PR xong → `SendMessage` tới **"PTA Plan"** (rà + merge). Không tự merge, không deploy, không gửi thông báo / email thật. Migrate mới → ghi trong mô tả PR (PTA thêm vào danh sách chờ deploy). PR đổi số liệu em thật → kèm SQL chỉ đọc.
- Không đụng phạm vi session khác (bảng dưới). Thấy việc ngoài phạm vi → ghi vào tệp rà của mình mục "Để PTA", không tự làm.

## Bốn session

| Session | Phạm vi (`00`) | Đầu ra đợt này | Không đụng |
|---|---|---|---|
| **AUDIT-BAN-GIAO** | F01 tự lưu nhận xét bàn giao báo đã lưu sai bản · F05 + mục 7 tách W1 / W2 (chuyển lớp + đổi GV) · câu 17.4 phiếu Writing cũ | PR1 F01 (sửa trước, chống mất chữ) · hỏi chủ SP câu phiếu cũ · PR2 W1/W2 (máy chủ + migrate + ô phiếu theo mẫu L/R/S — thêm ô theo mẫu sẵn có, ảnh trước / sau) | Ý thức, hồ sơ HV |
| **AUDIT-LOI** | Đợt 0 xác minh F02, F06, F07, F08, F09, F10, X01–X08 · Ảnh 2 | `10-xac-minh-loi.md` · PR nhỏ sửa lỗi tái hiện được: F02 CSS 14 khối rỗng (+ kiểm build bắt lỗi CSS), F06 khung Case không cuộn trang, F07 hộp hành trình bị cắt / lệch, F10 · F08 / F09 đo trước → sau rồi mới PR · X: kết luận từng mục, lỗi quyền nhỏ sửa luôn | Bàn giao, Ý thức (chỉ ghi lỗi thấy) |
| **AUDIT-Y-THUC** | Mục 5 hạn Báo PH (F04, câu 17.1–17.3) · mục 6 + F03 + U10 + Ảnh 1 Ý thức / vi phạm | Bảng loại việc Báo PH → người giữ → người sửa hạn → hạn mặc định · câu hỏi chủ SP · mockup Ý thức (hồ sơ lớp + hồ sơ HV + mở từ Công việc; vai GVBM / GVCN / TVV / QL; trạng thái mới / đã ghi nhận / bắt buộc xử lý / chờ duyệt / đã xử lý / thu hồi) + mockup task Báo PH sửa hạn · sau khi chốt quyền: PR máy chủ hạn Báo PH (không đổi bố cục) làm được trước mockup | Bàn giao, khung Case / hành trình |
| **AUDIT-UX** | U01–U09 · mục 8 (thông tin panel) · mục 9 (ma trận trang) · mục 21 · mục 22 · Ảnh 3, Ảnh 4 | `13-ra-ux.md`: ma trận phủ trang / luồng (đọc mã · gọi API · bấm thử · còn thiếu), bảng rà panel, nhãn bất thường (Chờ 0 kỹ năng, Đủ điểm cạnh hủy, 1 PA cạnh Chưa có PA, 4 nhóm / 5 tiêu đề, 32 / 33) có kết luận · đề xuất bỏ / gộp / chuyển (mục 22.1) đưa chủ SP quyết · mockup theo thứ tự U01 Công việc → U02 hồ sơ HV (gồm sửa của AUDIT-LOI) → U03 hồ sơ lớp → U07 hành trình. **Chỉ rà + mockup, không code** đợt này | Ý thức (AUDIT-Y-THUC), bàn giao |
