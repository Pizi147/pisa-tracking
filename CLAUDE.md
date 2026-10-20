# PISA Progress — luật mặc định cho mọi session Claude

Tệp này tự nạp vào mọi session của repo (planning, code, worktree), nên giữ ngắn. Chi tiết nằm ở
`plan.md` (kế hoạch duy nhất: việc còn lại, thứ tự, model, prompt), `CODE_MAP.md` và đặc tả trong `docs/superpowers/specs/`.

## Khi các nguồn mâu thuẫn (chủ SP 20–21/10 — overhaul `02` mục 1, 2.3)
1. Luật nghiệp vụ đã chốt (`plan.md` 1.6) + quyết định chủ SP (lời mới hơn thắng lời cũ về cùng điều) + phần nghiệp vụ, quyền, chống mất dữ liệu của
   `thiet-ke/PISA-Rulebook-2026-09-19.md`.
2. **Khung mockup đã duyệt** trong `thiet-ke/` thắng kế hoạch, đặc tả, `DESIGN.md` và luật giao diện cũ hơn ngày duyệt (trừ mục 1); quyết định mới trái khung → sửa mockup.
3. Kế hoạch PR, đặc tả, `DESIGN.md`.
4. Skill (impeccable, ponytail, superpowers, ecc, web-design-guidelines, ui-ux-pro-max). Skill gợi ý trái với mục 1–3 thì không tự làm: ghi vào báo cáo để
   chủ sản phẩm quyết.

## Overhaul 21/10 (chủ SP duyệt #486) — nguồn `docs/superpowers/specs/2026-10-20-ke-hoach-overhaul/` (02 quyết định · 04 hệ thiết kế · 05 workflow · 06 mockup · 07 PR)
- Luật nghiệp vụ: 5 luật (luật 4 bản sửa 21/10) + việc TVV + S chéo theo kỹ năng hồ sơ GV — mỗi luật một dòng ở `plan.md` 1.6; không đổi luật nào khác.
- PR đổi bố cục: **một màn một PR** · bảng truy vết khung → thành phần → ảnh (có dòng BỎ / GIỮ) · ảnh cặp toàn trang mockup | web · cổng **≥ 90 % KHỚP** ·
  **chủ SP duyệt ảnh cặp trước merge, không merge qua đêm** (`plan.md` 1.6, 06 mục 5.4).
- Luật giao diện (chi tiết `DESIGN.md` mục "Luật 21/10"): Thi = thi thật, Test = MT / Progress / Final… · việc của tôi ở trang đầu vai · một danh sách một kiểu mở ·
  thang làm tại chỗ 0–5 · ô số = mở tại chỗ, chữ "›" = đổi trang, ⓘ = giải thích · báo cáo thuần · cấm điều khiển trong tiêu đề bảng · "Toàn bộ" chỉ ở Phân tích.

## Luật cứng của chủ sản phẩm (08/10)
- Nghĩ tới **đầu ra** trước (em có lịch, có điểm…). Việc không ảnh hưởng đầu ra thì KHÔNG thêm bước, câu hỏi, trạng thái hay điều kiện chặn.
- Workflow đơn giản, ít thao tác, không để người dùng kẹt; sửa trên nền có sẵn, không làm lại.
- Mặc định làm điều hiển nhiên (vd đổi mốc lớp thì bài dời theo) — không hỏi lại.

## Nguyên tắc workflow + UX (chủ SP 11/10, gốc: prompt Overhaul mục A)
- Trước mỗi quyết định ảnh hưởng workflow, trả lời: việc phát sinh từ đâu · ai làm / ai chốt / ai cần biết · cần thông tin gì để làm ngay ·
  đầu ra và thế nào là xong · bước nào bắt buộc, bước nào gộp/bỏ được · làm sai thì sửa / huỷ / khôi phục đường nào. Không thêm bước cho "đủ quy trình".
- Xử lý tại chỗ: thao tác mở panel / hộp ngay trang đang làm; tách nút **làm việc** với link **xem hồ sơ**; chỉ chuyển trang khi cần không gian lớn;
  Quay lại về đúng nguồn (bộ lọc, tab, vị trí cuộn); không panel lồng panel.
- Thông tin vừa đủ, đúng vai: cái quan trọng trước, chi tiết mở khi cần; cùng một số liệu ở nhiều nơi phải cùng nguồn, cùng hàm tính
  (việc đã xong không được nơi nào còn báo chờ / quá hạn). Giao diện theo vai đi cùng quyền máy chủ.
- Nhất quán: một khái niệm một tên; cùng loại thao tác cùng vị trí, thứ tự, phản hồi; dùng lại component sẵn có; việc ngắn → hộp nhỏ, việc nhiều thông tin → panel.
  Đọc bảng, gõ phím và màn 375 đều phải tốt; trạng thái không chỉ phân biệt bằng màu.
- Trạng thái rõ + đường sửa sai: phân biệt đang lưu / đã lưu / lỗi / nháp / đã chốt; không báo xong khi chưa lưu; không mất chữ đang gõ;
  xác nhận chỉ khi hậu quả lớn (nêu đúng đối tượng bị ảnh hưởng); bị chặn thì nói lý do + bước tiếp theo.
- Đánh giá phương án bằng tình huống thật (số bước, số lần chuyển trang, nhập lại, sửa sai; thiếu dữ liệu, nhiều vai, đổi lịch, lô lỗi một phần);
  đưa một khuyến nghị kèm lý do, không bày nhiều lựa chọn.
- Với chủ SP: phân biệt hiện trạng đã kiểm / lỗi chủ SP báo / yêu cầu đã chốt / đề xuất / câu hỏi. "Đề xuất", "cân nhắc" ≠ đã duyệt. Luật nghiệp vụ không tự đổi.

## Skill `karpathy-guidelines` (chủ SP cài 11/10)
- Dùng ở mọi session có viết / sửa / rà code hoặc viết kế hoạch PR: nghĩ trước khi làm, nêu giả định, chọn cách đơn giản nhất, sửa đúng chỗ cần sửa,
  có tiêu chí kiểm được. Đi cùng `ponytail` (không thay); mâu thuẫn thì theo thứ tự mục "Khi các nguồn mâu thuẫn" ở trên.
- Câu hỏi đơn giản, đọc log, trả lời chủ SP: không cần gọi.

## Giao diện và UX: dùng `impeccable`
- PISA là công cụ làm việc cho giáo viên (chế độ Operate): dễ hiểu, dễ dùng, nhất quán trước; trang trí sau.
- Không dùng taste-skill (đã tắt; không dành cho dashboard, bảng dữ liệu).
- Tinh chỉnh, không làm lại: phông Be Vietnam Pro (PR-SANG; chữ số lấy từ Inter), bảng màu, bố cục đã khoá — giữ, trừ khi kế hoạch PR ghi rõ là đổi hoặc màn có mockup mới đã duyệt (06 Q7).
- Màn / luồng MỚI hoặc đổi bố cục: phải có mockup HTML trong `thiet-ke/` chủ sản phẩm đã duyệt trước khi code (1440 + 375, tối, đủ trạng thái khác nhau); chưa có thì dừng, soạn mockup. Đổi chữ, thêm nút/ô theo mẫu sẵn có: không cần mockup (plan.md 1.3b). Chuẩn giao diện: `DESIGN.md`.
- Tiết kiệm token: làm theo plan.md 1.2 + 1.3b (Task trong session, check + bấm thử một lần ở session code, planning rà diff + ảnh).
- Thời gian trên màn: ưu tiên **mã tuần** `W2 OCT`; ngày chỉ cho hạn cụ thể, ngày thi, ngày sinh, nhật ký (chủ sản phẩm 30/09).
- Ô nhập ngày ở MỌI nơi: ô gõ được + nút lịch (`ONgay`), KHÔNG làm hàng nút "Hôm nay · Hôm qua · 2 ngày trước" (chủ sản phẩm 06/10).
- Lệnh dùng: `critique` (+ `ui-ux-pro-max` khi rà UX lớn) ở session planning để tìm vấn đề · `clarify`, `layout`, `harden`, `adapt` ở
  session code, chỉ trong phạm vi PR (PR sửa nhỏ không `polish`; PR làm lại màn được `layout` + `polish` — plan.md 1.3b) · `audit` + skill `web-design-guidelines` trước khi mở PR có sửa giao diện.
- Session code không chạy `init`, `document`, `hooks on`, `npx impeccable install|update`. PRODUCT.md / DESIGN.md
  chỉ do session planning tạo, khớp Rulebook, sau khi chủ sản phẩm đồng ý.
- `.impeccable/` đã gitignore; không commit gì trong đó.

## Model
- **Không dùng Fable** (mọi session, kể cả subagent/agent) — chủ sản phẩm 06/10. Phương án B: Opus 5.5 hoặc Sonnet 5.5.

## Code: `ponytail` luôn bật
- Code logic giữ mức mặc định `full`. PR có sửa giao diện: gõ `/ponytail lite` đầu phiên để không đè impeccable.
- Việc kế hoạch PR đã ghi là yêu cầu rõ ràng: làm đủ, không cắt theo YAGNI. Muốn bớt thì hỏi, không tự bớt.
- Không bao giờ bớt: kiểm tra dữ liệu nhập, xử lý lỗi chống mất dữ liệu, phân quyền, bảo mật.
- Chú thích `ponytail:` được phép, nhưng liệt kê chúng trong mô tả PR. Trước khi mở PR: `/ponytail-review`.

## Rà PR bằng ECC (chủ SP duyệt 20/10)
- Chỉ khi **rà sâu** (plan.md 1.3), planning chạy agent theo phạm vi PR, tối đa 2:
  quyền, đăng nhập → `ecc:security-reviewer` · có thể mất dữ liệu, migrate, API → `ecc:silent-failure-hunter` ·
  logic máy chủ / React lớn → `ecc:typescript-reviewer` hoặc `ecc:react-reviewer`. PR thường: không chạy (planning đọc diff là đủ).
- Không dùng `ecc:browser-qa`, `ecc:click-path-audit` (trùng bước bấm thử một lần ở session code).
- Không dùng `orch-*`, `multi-*`, `gan-*`, `loop-*` (tốn token, trùng quy trình PTA Plan).
- Plugin superpowers, ponytail, ecc khai báo trong `.claude/settings.json` để session cloud cũng có.

## Session planning soạn prompt cho session code
- Có việc giao diện: ghi rõ lệnh impeccable cần chạy và `/ponytail lite`.
- Không cài thêm plugin/skill (toàn máy hoặc vào repo) khi chưa hỏi chủ sản phẩm: mục tiêu là giảm token, và mỗi plugin
  luôn bật đều tốn token ở mọi phiên.

## Bộ nhớ khi chạy kiểm
- `prepare()` của libsql 0.5.29 rò ~4,9 KB mỗi lần gọi (`gc()` không trả). `server/src/db.ts` (PR-BN) nhớ câu lệnh theo
  (kết nối, câu SQL) để tránh việc đó: KHÔNG gỡ, KHÔNG gọi `prepare` của libsql bằng đường vòng; `get()` của câu dùng lại đi qua `all()[0]`.
- `npm run check` đỉnh ~1,3 GB RAM (sau PR-BN): chạy song song TỐI ĐA 3 lần trên máy là được (chủ sản phẩm 07/10 — ưu tiên nhanh); OOM / exit 127 thì chạy lại từng bước.

## Worktree
- Worktree chỉ tạo trong `.claude/worktrees/<tên-nhánh>`, không tạo thư mục ngang hàng `Pisa-tracking-*`.
