# Audit overhaul 03/11 — chia việc cho session (PTA Plan)

Nguồn (CHỈ trên máy chủ SP, không commit): `D:/Download/Pisa tracking web/PISA-Tracking-Claude-Audit-Overhaul-2026-11-03.md` (gọi tắt `00`, 787 dòng, mục 1–22) + 4 ảnh ở `D:/Download/Pisa tracking web/audit-0311-anh/`.
**Mọi session đọc TOÀN BỘ `00`** (không chỉ phần của mình, không chỉ 4 ảnh): mục 3 là luật phải giữ, mục 12 / 16 là chuẩn nghiệm thu chung, mục 18 là đầu ra chủ SP cần.

| Tệp ảnh | Là | Nội dung |
|---|---|---|
| `anh-1-y-thuc-ho-so-lop.jpg` | **Ảnh 1** của yêu cầu gốc (mục 1.2) | Hồ sơ lớp CP FT 116 · tab Ý thức & Phối hợp mở Lê Thảo Nhi: thang xử lý, 6 vi phạm, bằng chứng, Phối hợp SOS, bảng điểm MT dưới |
| `anh-2-hanh-trinh-hop-cat-case-cuon.jpg` | **Ảnh 2** của yêu cầu gốc (mục 1.4) | Hồ sơ HV: hộp "Case Listening · MT3 · SOS 3" ở biểu đồ hành trình bị cắt đáy (gạch xanh); khung Case (gạch đỏ) = chỗ trỏ chuột không cuộn được trang |
| `anh-3-ho-so-hv-nhieu-case.jpg` | bổ sung (giống U02) | Hồ sơ HV Hà Trần Phúc · Overall: 4 Case mở hết, mô tả EN rất dài, "Tiến độ trên lớp" trống cột trái |
| `anh-4-hanh-trinh-ky-nang.jpg` | bổ sung (giống U07) | Hành trình CP FT 130: "5.0 Giảm 0.5 4.5" không tên mốc; Speaking "1 PA" cạnh "chưa có PA · Chờ xác nhận PA" |

Ảnh U01–U10 của mục 19 (10 tệp) **đã có** ở `D:/Download/Pisa tracking web/cac trang/` (tên tệp như `00` mục 19.1). DB demo cục bộ cũ thiếu bảng `doi_phan_cong` → `npm run seed` trước khi bấm thử.

## Hiện trạng để so (`00` mục 2)
- Ảnh chủ SP chụp bản đang chạy (deploy 30/10 23:40, main `3a38444ad`). Main nay mới hơn nhiều PR (8 migrate chờ deploy) → **tái hiện trên main trước**; lỗi đã hết trên main ghi "đã sửa trên main, chờ deploy".
- `00` audit ở main `9472cb0f2` (sau #817); sau đó thêm #825 (plan), #826 (Bỏ qua việc Xếp lịch MT). Không chép danh sách cũ thành lỗi hiện tại.

## Luật chung
- Model: **Opus 5.5 · high** (phương án B: Sonnet 5.5 · high). Không dùng Fable. Chế độ Auto (cùng PTA, để tin nhắn giữa session không bị giữ).
- Đọc trước: `CLAUDE.md` · `plan.md` 1.6 + mục 4 khối "03/11 tối" · `00` toàn bộ · `DESIGN.md` khi có giao diện · `docs/superpowers/specs/2026-10-20-danh-gia-lai-ux-ui-toan-dien.md` khi rà / mockup giao diện.
- Skill: `karpathy-guidelines` + `ponytail` (PR giao diện `/ponytail lite`) · `superpowers:brainstorming` trước thiết kế · `superpowers:systematic-debugging` cho lỗi · `impeccable` (`critique` + `ui-ux-pro-max` khi rà / mockup; `audit` + `web-design-guidelines` trước PR giao diện) · `/ponytail-review` trước PR.
- Đầu ra rà ghi vào tệp của session trong thư mục này (bảng xác minh: ID · mức · file:dòng · vai / lối vào · cách tái hiện · kết quả: tái hiện / không / đúng luật / đã sửa / thiếu dữ liệu · tác động). Không ghi "đã rà toàn bộ" khi còn ô trống.
- Hỏi chủ SP thẳng trong session (chủ SP đang ở máy) khi gặp quyết định nghiệp vụ thật: tình huống cụ thể, 1–4 câu mỗi đợt, một khuyến nghị. Không hỏi lại việc đã chốt (plan.md 1.6, `00` mục 3). Chủ SP chốt gì → ghi tệp rà + SendMessage "PTA Plan" để ghi plan.md 1.6. Phần độc lập cứ làm.
- Bỏ / gộp / chuyển trường, khối, thao tác, chức năng: chỉ đề xuất (`00` 22.1), hỏi trước khi bỏ. Phân biệt giảm mở sẵn ≠ chuyển chỗ ≠ xoá.
- Mockup (đổi bố cục): `thiet-ke/`, 1440 + 375, tối + sáng, dữ liệu dày như ảnh thật, đủ trạng thái + vai; bảng thao tác trước → sau (giữ / bỏ / đổi vì sao). Vòng critique → sửa: mục tiêu ≥ 35/40; chạm 30 thì tối đa 2 vòng nữa, rồi chỉ cần không còn P0 / P1. `00` cho làm lại bố cục khi có lý do; phông / màu / token giữ làm điểm xuất phát (`00` mục 12). **Chủ SP duyệt mockup trước khi code**; PR đổi bố cục: một màn một PR, ảnh cặp ≥ 90 % KHỚP, chủ SP duyệt trước merge.
- Giữ: không khoá cứng (Hoàn tác ngắn + khôi phục + lịch sử) · không mũi tên ↗ · ô ngày `ONgay` · thời gian = mã tuần · không gửi thông báo / email thật.
- Code: worktree `.claude/worktrees/<tên>`; một việc một PR nhỏ; `npm run check` đầy đủ trước khi mở PR ở ô **check-1 / check-2** theo `C:/Users/Admin/AppData/Local/Temp/pisa-slot/CACH-DUNG.txt` (check-3 của PTA). Tắt máy chủ dev khi không dùng. Đường API mới / đổi: trần câu + dòng ở `server/src/tests/tocDoDuong.ts`; tăng đọc Turso đáng kể → cảnh báo chủ SP trước.
- Mở PR → SendMessage **"PTA Plan"** (rà + merge). Không tự merge, không deploy. Migrate mới → ghi trong mô tả PR. PR đổi số liệu em thật → kèm SQL chỉ đọc. Mỗi PR có bảng ảnh hưởng (`00` mục 15 cuối).
- Không đụng phạm vi session khác. Thấy việc ngoài phạm vi → mục "Để PTA" trong tệp rà của mình.

## Bảng phủ `00` → session
| Mục `00` | Session |
|---|---|
| 1.1 thông tin mọi panel · mục 8 | mỗi session rà panel ở màn của mình (UX-A, UX-B, Y-THUC, BAN-GIAO) |
| 1.2 Ý thức · mục 6 · F03 · U10 · X08 · Ảnh 1 | AUDIT-Y-THUC |
| 1.3 hạn Báo PH · mục 5 · F04 · X04 · X05 · câu 17.1–17.3 | AUDIT-Y-THUC |
| 1.4 khung Case không cuộn + hộp hành trình · F06 · F07 · Ảnh 2 | AUDIT-LOI |
| 1.5 W1 / W2 · F05 · mục 7 · F01 · X01 · câu 17.4 · mockup 14.4 | AUDIT-BAN-GIAO |
| 1.6 mọi trang còn lại · mục 9 · 19–22 · U01–U09 · Ảnh 3, 4 | AUDIT-UX-A (U01, U02, U03, U07) · AUDIT-UX-B (U04, U05, U06, U08, U09) |
| F02 · F08 · F09 · F10 · X02 · X03 · X06 · X07 · mục 11 hiệu năng · mục 13 quyền / dữ liệu / vận hành | AUDIT-LOI |
| mục 14 mockup ưu tiên | 1–2 Y-THUC · 3 UX-A (cùng sửa của LOI) · 4 BAN-GIAO |
| mục 21 đồng bộ xuyên màn | UX-A giữ bảng thành phần chung; mỗi session ghi phần màn mình |
| mục 12 chuẩn UX · mục 16 checklist | mọi session, phần của mình |
| mục 15 đợt 0–6 · mục 18 đầu ra gộp · phép thử người dùng (cuối mục 12) | PTA Plan (`20-tong-hop.md`); đợt 6 giao sau |

## AUDIT-BAN-GIAO — worktree `.claude/worktrees/audit-ban-giao` · tệp rà `11-ban-giao.md`
1. **F01** tái hiện trên main → sửa (`OGopY` `banGiaoChung.tsx` + nơi dùng): theo dõi bản nháp vs bản máy chủ đã nhận; response cũ không báo đã lưu bản mới; lưu tuần tự theo ô; không mất chữ khi đóng / đổi em / lỗi mạng / 409; không xác nhận phiếu khi còn ô chưa lưu. Phép kiểm hành vi theo nghiệm thu F01 + checklist "Tự lưu" mục 16. **PR1, làm ngay.**
2. **X01** (quyền theo phân công `status='active'` không xét ngày: `quyenChuyenLop.ts`, `coGvcn` ở `banGiao.ts`): kết luận; lỗi thật → PR nhỏ.
3. Rà W1 / W2 ở cả chuyển lớp (`banGiao.ts`) và đổi GV (`banGiaoGv.ts`, `BanGiaoGvPanel.tsx`) theo bảng mục 7 → hiện trạng, phương án dữ liệu, dữ liệu cũ. Hỏi chủ SP câu 17.4 (phiếu Writing cũ) bằng tình huống + khuyến nghị.
4. **Mockup bàn giao** (mục 14.4 — yêu cầu mới 03/11 thắng luật cũ "thêm ô theo mẫu không cần mockup"): W1 / W2 hai GV, cùng GV, một môn không học, Writing cũ, đang lưu / lưu lỗi.
5. Sau câu 17.4: PR máy chủ W1 / W2 (+ migrate chỉ thêm) — không đổi bộ môn lịch Test, cách gộp Writing / Overall / SOS. Giao diện sau khi mockup duyệt.

## AUDIT-LOI — worktree `.claude/worktrees/audit-loi` · tệp rà `10-xac-minh-loi.md`
1. Đợt 0: xác minh F02, F06, F07, F08, F09, F10, X02, X03, X06, X07 trên main bằng mã + trình duyệt (1440 / 1280 / 375, zoom 125 / 200 %; chuột, PageDown, bàn phím).
2. Sửa ngay, mỗi lỗi một PR: **F06** (tách cuộn panel nổi / panel tại chỗ / card trong trang; không gỡ `overscroll-contain` của modal) · **F07** (hộp hành trình thoát vùng cắt, toạ độ từ phần tử đã vẽ, lật / dịch chống tràn, cập nhật khi cuộn / đổi cỡ; giữ đường bàn phím + aria; không tăng z-index) · **F02** (gốc 14 khối CSS rỗng + kiểm build bắt lỗi CSS; không tắt cảnh báo) · **F10**.
3. Mục 11: đo tác vụ trọn vẹn (trang đầu theo vai; mở hồ sơ → Case → lưu; dán điểm một dòng / lô) trước → sau trên cùng dữ liệu. F08 (nạp trước theo vai / lúc rảnh / Save-Data), F09 (Case chi tiết khi mở / theo lô) chỉ PR khi đo có lợi; ước dòng Turso / ngày; không hứa % khi chưa đo.
4. Mục 13: capability UI khớp máy chủ, ghi lô / lưu đồng thời, tệp bằng chứng, lỗi mạng / 500 / hết phiên; `multer@1.4.5-lts.1` tra advisory chính thức, cần thì đề xuất PR nâng riêng (không nâng hàng loạt).
5. X02, X03, X06, X07: kết luận từng mục; lỗi quyền nhỏ → PR riêng, kiểm máy chủ; cần luật → hỏi chủ SP.

## AUDIT-Y-THUC — worktree `.claude/worktrees/audit-y-thuc` · tệp rà `12-y-thuc-bao-ph.md`
Đọc thêm: Rulebook phần Ý thức · `thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md`, `thiet-ke/SOS_VA_PHOI_HOP_V3.md` (cũ hơn plan.md 1.6 thì 1.6 thắng).
1. Rà trên main theo vai GVBM / GVCN / TVV / QL: Ghi vi phạm → Ghi nhận → Xử lý / đề xuất / duyệt → Báo PH → thu hồi → lịch sử; **X04** (ghi kết quả Báo PH gửi lại có nhân đôi?), **X05** (việc Báo PH của QL lọc chi nhánh trong JS), **X08** (phạm vi Ý thức vs Phối hợp SOS). Bảng mọi task "báo phụ huynh": loại → người giữ → ai sửa hạn → hạn mặc định → màn mở.
2. Hỏi chủ SP 17.1–17.3 + chữ nút (Ghi nhận / Đã xem…) — tình huống + khuyến nghị.
3. Chốt quyền xong: PR máy chủ hạn Báo PH (mặc định / hạn chọn / hạn hiệu lực; một hàm cho Công việc, Tổng quan, hồ sơ, chuông, báo cáo; lịch sử; kiểm quyền + 409; hạn chọn không trượt theo tạm dừng) — làm được trước mockup.
4. brainstorming → một phương án → **mockup Ý thức** (hồ sơ lớp + hồ sơ HV + mở từ Công việc; vai GVBM / GVCN / TVV / QL; trạng thái mới / đã ghi nhận / bắt buộc xử lý / chờ duyệt / đã xử lý / thu hồi; sau Ghi nhận phản hồi tại chỗ + lối xem lại; Phối hợp SOS + bảng điểm MT dưới tab: đề xuất chỗ, hỏi trước khi chuyển) + **mockup task Báo PH** (mặc định / tuỳ chỉnh / quá hạn / sau lưu / lịch sử). Chủ SP duyệt → code từng màn.

## AUDIT-UX-A — Công việc · hồ sơ HV · hồ sơ lớp · hành trình · tệp rà `13-ra-ux-a.md` · chỉ rà + mockup, không code
1. Bấm thử main theo vai (QL, GVCN, GVBM, TVV; 1440 + 375): ma trận mục 9 các hàng Công việc · Chờ duyệt / Yêu cầu của tôi · Hồ sơ HV · Case / PA · Hồ sơ lớp · Hồ sơ lượt · Cuối khoá / lộ trình / thi thật (KET-PET thi thật, Tutor đang hoãn: chỉ ghi khoảng trống); bảng rà panel mục 8 cho các màn này; nhãn bất thường (4 nhóm / 5 tiêu đề, badge 32 / 33, "1 PA" cạnh "Chưa có PA", "Đủ điểm" cạnh huỷ / vắng, "Chờ 0 kỹ năng") có kết luận. Giữ bảng thành phần chung mục 21.
2. Đề xuất bỏ / gộp / chuyển (22.1): hiện ở đâu → bất tiện → làm sao → tìm lại ở đâu → ảnh hưởng.
3. Mockup theo 22.3: **U01 Công việc → U02 hồ sơ HV** (Case tóm tắt trước; khung Case cuộn trang + hộp hành trình như AUDIT-LOI sửa) **→ U03 hồ sơ lớp → U07 hành trình**. Chủ SP duyệt từng màn.

## AUDIT-UX-B — Tổng quan · HV & Lớp · Test · Phân tích · phần còn lại · tệp rà `14-ra-ux-b.md` · chỉ rà + mockup, không code
1. Bấm thử main theo vai (QL, GVCN, GVBM, TVV, Quản trị, CX; 1440 + 375): ma trận mục 9 các hàng Đăng nhập / phiên / đổi góc nhìn · Tổng quan + menu tài khoản · Học viên & Lớp · Lịch Test · Kế hoạch Test · Chấm Test / nhập điểm · Lưu trữ / Đã xoá · Phân tích / Báo cáo · Hồ sơ GV / cá nhân · Quản trị · Hướng dẫn / EN / xuất tệp (+ link Tutor còn sót); bảng rà panel mục 8; mẫu số / phạm vi (U06 "0 bài quá hạn" vs 3 bài GV khác, U08 18 / 8 / 10 · 13 %, 31 % ở Tổng quan vs Phân tích). Phần mục 21 của các màn này ghi vào tệp mình.
2. Đề xuất bỏ / gộp / chuyển như UX-A.
3. Mockup theo 22.3: **U04 HV & Lớp → U05 Kế hoạch Test → U06 Lịch Test tuần → U09 Tổng quan + menu → U08 Phân tích**. Chủ SP duyệt từng màn.

## PTA Plan
- Rà + merge PR; ghi quyết định chủ SP vào plan.md 1.6 trong lượt.
- Khi các session nộp đợt 0: gộp đầu ra `00` mục 18 vào `20-tong-hop.md` (tóm tắt dễ hiểu · bảng xác minh chung · ma trận phủ · thiết kế · mockup chờ duyệt · plan PR nhỏ · danh sách hoãn có lý do · đối chiếu U01–U10 + mục 21, 22) + đề xuất phép thử người dùng (1 GV + 1 TVV làm 5 việc, cuối mục 12).
- Đợt 6 (Hướng dẫn trên web theo luồng mới, thuật ngữ VI / EN, checklist hồi quy) giao sau khi các PR giao diện merge.
