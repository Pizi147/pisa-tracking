# 06 — Kế hoạch PR Tutor (19/11/2026) — gửi PTA Plan

PTA Tutor (Fable 5.2 · high). Luật: `02-luat.md` TU1–TU19 (đã chốt — `plan.md` mục 4 khối "Chủ SP 19/11", 1.6 N54). Workflow: `03-workflow.md`. Mockup: `05-de-bai-mockup.md` (Ⓣ1 `thiet-ke/v21/tutor-ket-qua.html`, Ⓣ2 `thiet-ke/v21/tutor.html` — **Ⓣ2 ĐÃ DUYỆT + merge #1857, 19/11**; [XM] đã quyết ghi ở `tutor-ghi-chu.md` mục 4 + dòng API dưới) — **PR giao diện chỉ giao sau khi mockup tương ứng được chủ SP duyệt + merge**; PR máy chủ giao được ngay.
**Ai giao (chủ SP 19/11):** PR máy chủ / luật **TU2-1, TU2-2, TU2-5 → PTA Plan** giao, rà, merge · PR giao diện **TU2-3, TU2-4, TU2-6 + hai mockup → PTA Tutor** tự giao session con, rà, duyệt ảnh cặp, merge. Người giao soạn kế hoạch chi tiết từng PR (Task, mã phép kiểm) theo mẫu `plan.md` mục 10-A; tài liệu này chốt **phạm vi, giao diện dữ liệu, tiêu chí kiểm** — session code không tự đổi các điều đó, thấy vướng → [XM] nhắn PTA Plan.

## 0. Luật mọi PR

- Skill: `karpathy-guidelines` + `ponytail` (PR giao diện: `/ponytail lite`); trước PR `/ponytail-review`, liệt kê chú thích `ponytail:` trong mô tả PR.
- PR giao diện thêm: impeccable `layout` + `polish` + `harden` + `adapt`, rồi `audit` + skill `web-design-guidelines`; bảng truy vết khung → thành phần → ảnh (dòng GIỮ / BỎ); bảng thao tác TRƯỚC → SAU; ảnh cặp toàn trang mockup │ web (1440 Tối + 375 Sáng), ≥ 90 % KHỚP, soi ✕ / ⋯ ≤ 1 px; **PTA Tutor duyệt ảnh cặp trước merge (chủ SP giao 19/11) và gửi ảnh cho chủ SP xem**; Hướng dẫn "?" (`shared/huongDan/`) sửa cùng PR; bản EN (`shared/i18n/en/`) cho chữ mới.
- Turso: đo câu + dòng TRƯỚC → SAU trong mô tả PR; đường mới / đổi có trần ở `server/src/tests/tocDoDuong.ts`; JSON các đường không đổi phải trùng trước / sau trên bản chép (`scripts/do-ban-chep.mjs`).
- Bản chép thật: PR có migrate hoặc đụng luồng ghi kết quả / nháp / quyền thử trên bản chép mới nhất ở `H:\My Drive\PISA TRACKING\back-up` (chép ra tạm, không sửa bản gốc), báo số ca.
- `npm run check` đầy đủ trước khi mở PR; phép kiểm cũ đọc luật cũ (`prTu`, `prTub`, `prOv12h`, `prOv13b`, `prCxN52`, `form.tests`) sửa theo luật mới — liệt kê trong PR.
- Không bớt: kiểm dữ liệu nhập ở máy chủ, phân quyền, chống mất chữ đang gõ.

## 1. Bảng PR

| Mã | Phạm vi | Phụ thuộc | Model · effort (B) | Mockup | Turso (ước) |
|---|---|---|---|---|---|
| **TU2-1** LUAT-KQ-TUTOR (máy chủ + luật chung) | Luật ghi kết quả PA Tutor mới (a / b, dòng gộp, 3 nút tuỳ chọn) · nháp giữ phần Tutor · Xác nhận PA thôi bắt Số buổi · ô Tutor có GV · migrate `prTutor2` | — | Opus 5.5 · high (B: Sonnet 5.5 · high) | — | ghi kết quả ± 0; `/tutors/chon` + 1 câu, + ≤ 80 dòng |
| **TU2-2** PA-DANG-CHAY-MC (máy chủ) | `/my-work` vai GV trả `paDangChay` (thay `sapToi.paToiKy`) · lưới Kết quả PA trả trường Tutor | TU2-1 | Opus 5.5 · high (B: Sonnet 5.5 · high) | — | `/my-work` GV: ± 0 câu, + ≤ 40 dòng (TB + 10) |
| **TU2-3** FORM-KQ-TUTOR (giao diện — màn Ghi kết quả PA) | Form Ghi kết quả PA Tutor · Xác nhận / Thêm / Sửa PA Tutor · thẻ PA + lịch sử trong Case | TU2-1; **Ⓣ1 duyệt** | Opus 5.5 · high (B: Sonnet 5.5 · high) | Ⓣ1 mục A, B, C | 0 |
| **TU2-4** PA-DANG-CHAY (giao diện — màn Công việc GV) | Khối "PA đang chạy" · lưới ghi được PA Tutor · bỏ cụm "Kết quả PA" ở dải Sắp tới | TU2-2, TU2-3; **Ⓣ1 duyệt** | Sonnet 5.5 · high (B: Opus 5.5 · medium) | Ⓣ1 mục D, E | 0 (dùng dữ liệu `/my-work` đã nạp) |
| **TU2-5** TRANG-TUTOR-MC (máy chủ) | Quyền: CX xem, Head sửa danh bạ chi nhánh + gộp · "Buổi" = tổng số buổi · người dạy là GV · xuất số buổi theo tháng | TU2-1 | Sonnet 5.5 · high (B: Opus 5.5 · medium) | — | `/tutors` ≤ 20 câu · ≤ 300 dòng; xuất ≤ 6 câu |
| **TU2-6** TRANG-TUTOR (giao diện — màn Tutor) | Mở lại menu + trang Tutor theo Ⓣ2 · Hướng dẫn Head tutor / Head / CX | TU2-5; **Ⓣ2 duyệt** | Opus 5.5 · high (B: Sonnet 5.5 · high) | Ⓣ2 | 0 thêm |

Thứ tự: **TU2-1** → (TU2-2 ∥ TU2-5) → TU2-3 → (TU2-4 ∥ TU2-6). Cùng lúc ≤ 2 PR giao diện, khác màn. TU2-1 lùi tương thích: web cũ (mỗi buổi một dòng, đủ 3 ô) gửi lên vẫn hợp lệ → merge trước giao diện được.
Rà sâu (PTA Plan): TU2-1 `/code-review high` (luật ghi + migrate) · TU2-5 `/security-review` (quyền) · còn lại đọc diff + ảnh.
Deploy: migrate `prTutor2` TRƯỚC mã (chỉ thêm cột + quyền, chạy lặp được).

## 2. Giao diện dữ liệu chốt (mọi PR dùng đúng tên này)

**Cột mới (migrate `server/src/migrate/prTutor2.ts`, khớp từng chữ `server/src/schema.sql`):**
- `case_followup_buoi.so_buoi INTEGER NOT NULL DEFAULT 1` — số buổi của dòng (dòng gộp > 1; 59 dòng cũ = 1).
- `case_followups.buoi_du_kien INTEGER NULL` — "b" của lần ghi ("a" là `case_followups.so_buoi` đang có).
- `tutors.user_id INTEGER NULL REFERENCES users(id)` + chỉ mục UNIQUE một phần `WHERE user_id IS NOT NULL` — dòng danh bạ của một GV (tạo khi GV đó được chọn lần đầu).
- Quyền: vai `cx` thêm `tutor.view` (`role_permissions` + `server/src/seed/data.ts`).
- **Không đổi dữ liệu cũ.** `case_interventions.so_buoi` giữ; từ nay nghĩa là **Tổng số buổi** và chỉ dùng (đếm "Đã học x / tổng", gợi ý Kết thúc) với PA **không có mốc quy chế SOS**; PA quy chế SOS (`moc_quy_che IN ('until_exam','until_next_mt')`) không đếm tổng — giá trị cũ (nhập dưới nhãn "/ 2 tuần") chỉ dùng điền sẵn "b" kỳ đầu.

**Luật chung web + máy chủ (`shared/domain/paDongBo.ts`):**
- `BuoiTutor` thêm `soBuoi?: number | null` (thiếu = 1) và `gvId?: number | null` (chọn GV).
- `kiemBuoiTutor(a: number, buoi: unknown): string | null` — a = 0 → mảng rỗng; a ≥ 1 → 1…a dòng, **Σ (soBuoi ?? 1) = a**, mỗi dòng có tên tutor (hoặc `tutorId` / `gvId`) + nhận xét không trống; `chuanBi` / `taiLieu` / `feedbackGv` = `true` | `false` | `null` (**không bắt**); giữ kiểm hình thức, sao 1–5, độ dài (tên ≤ 100, chữ ≤ 1000 ở máy chủ — ô mới trên web `maxLength` 300). Bỏ tham số `cu3`.
- `kiemSoBuoiKy(a: unknown, b: unknown): string | null` — a nguyên 0–60 (bắt buộc); b nguyên 1–60 hoặc trống ở máy chủ (web mới bắt b); không ràng buộc a ≤ b.
- `coTongBuoi(pa: { kind: string; soBuoi?: number | null; mocQuyChe?: string | null }): boolean` — có đếm tổng không (luật ở trên); thay các chỗ đang coi `soBuoi != null` là có tổng.
- `coNguoiDay(kind)` trả `false` với `'tutor'` (ẩn ô Người dạy ở Xác nhận / Thêm / Sửa PA và "Người dạy kỳ này"); máy chủ vẫn nhận nếu web cũ gửi.
- Ghi chú của lần ghi (`note`) = ghép nhận xét các dòng như nay; ngưỡng ≥ 8 ký tự chỉ khi a ≥ 1; a = 0 cho `note` trống.

**API:**
- `POST /interventions/:id/result` · `POST /followups/:id/sua`: thân thêm `buoiDuKien?: number | null`, `buoi[].soBuoi?`, `buoi[].gvId?`. Chọn GV (`gvId`): trong cùng giao dịch tìm / tạo dòng `tutors` có `user_id = gvId` (tên = họ tên tài khoản, kỹ năng từ `user_skills`, nơi dạy = chi nhánh đầu của GV) rồi lưu `tutor_id` như tutor thường. Sửa lần ghi **cũ** sửa được mọi trường phần Tutor (nay chỉ sửa chữ).
- `PUT /interventions/:id/nhap`: thân + `NhapKetQuaPa` thêm `soBuoi?: number | null`, `buoiDuKien?: number | null`, `buoi?: BuoiTutor[]` — không bắt đủ, chỉ kiểm kiểu + trần độ dài; giữ luật 409 hiện có.
- `GET /tutors/chon`: mỗi dòng thêm `loai: 'gv' | 'tutor'`, `gvId?: number`; nhóm: gợi ý → GV (cùng chi nhánh lớp trước; gõ thì tìm mọi GV đang làm việc) → tutor; tutor đã gắn `user_id` chỉ hiện một lần (dưới nhóm GV). `dienSan` = tutor của lần ghi gần nhất.
- Xác nhận PA (`POST /interventions/:id/xac-nhan-pa` → `xacNhanPaQuyChe`, `server/src/cases/sosAuto.ts`): bỏ 400 "PA Tutor cần Số buổi / 2 tuần"; không còn nhận / đòi `soBuoi` cho PA Tutor quy chế.
- `GET /my-work` (vai GV, phạm vi "Của tôi"): khoá `paDangChay?: { paId; caseId; studentId; studentName; classId; classCode; topic; kind; tenPa; han; nhap: { soBuoi: number | null; buoiDuKien: number | null; luc: string } | null }[]` — PA người xem **giữ việc Kết quả PA**, đang chạy, `action_due` > hôm nay + 2 (chưa thành việc); không có → không trả khoá. Bỏ `sapToi.paToiKy`. Cùng luật ẩn em Tạm dừng / có KQ thi thật (N46) như việc.
- `GET /interventions/luoi-ket-qua`: dòng thêm `buoiKy: number | null` (b điền sẵn), `tutorTruoc: { tutorId: number | null; gvId: number | null; ten: string } | null`, `nhap` mở rộng như trên; nhận cả PA chưa tới kỳ.
- `GET /tutors` · `/tutors/:id`: "Buổi" = `SUM(so_buoi)`; ba tỉ lệ đếm theo **lần ghi** (dòng): số dòng "Có" / số dòng **có trả lời** (mockup Ⓣ2 XM-1, PTA Tutor duyệt 19/11); "Cần chú ý", nhận xét + kết luận áp cả người dạy là GV (XM-2); xuất số buổi gồm cả tên gõ tay chưa gộp, ghi "{tên} (gõ tay)" (XM-8); dòng thêm `loai`, `gvId`. Phạm vi CX = như Head theo chi nhánh của CX (bỏ trống = toàn hệ thống), chỉ đọc.
- Sửa danh bạ: `POST /tutors`, `PATCH /tutors/:id`, `POST /tutors/tai-len`, `POST /tutors/gop` (+ hoàn tác), `GET /tutors/go-tay` — thêm Head: chỉ tutor có nơi dạy = chi nhánh mình (hoặc Chỉ online do mình tạo) và tên gõ tay của buổi thuộc lớp chi nhánh mình. Nhận xét / kết luận / xoá tutor: giữ `tutor.manage`. Dòng danh bạ của GV (`user_id`): không ai sửa tên / xoá ở trang Tutor.
- `GET /tutors/xuat-buoi?tu=YYYY-MM&den=YYYY-MM` → xlsx "người dạy × tháng" (tháng theo ngày ghi của lần kết quả — cùng mốc trang Tutor đang lọc), quyền `tutor.view`, theo phạm vi người xem, ghi nhật ký xuất như các đường xuất khác.

## 3. Từng PR

### TU2-1 LUAT-KQ-TUTOR
- **Tệp:** `shared/domain/paDongBo.ts` · `server/src/cases/cases.ts` (`updateResult`, `ghiBuoiTutor`, `suaKetQua`, nháp `luuNhapKetQua` / `docNhapKetQua`) · `server/src/cases/sosAuto.ts` (:708, :262-265 cho nhất quán) · `server/src/tutors/chon.ts` · `server/src/migrate/prTutor2.ts` + đăng ký migrate · `server/src/schema.sql` · `server/src/seed/data.ts` (+ seed có buổi tutor: `pb2bSeed`, `duyetSeed`, `tuSeed`) · `server/src/platform/xoaTaiKhoan.ts` (xoá tài khoản: `tutors.user_id` → NULL) · `server/src/tests/tocDoDuong.ts`.
- **Phép kiểm mới `server/src/tests/prTutor2.tests.ts`** (tối thiểu): (1) a = 2, một dòng `soBuoi: 2`, 3 nút `null` → 200, đọc lại đúng · (2) a = 2, hai dòng thiếu `soBuoi` (thân kiểu web cũ) → 200 · (3) a = 2, tổng dòng = 3 → 400 nêu tổng · (4) a = 0, không dòng, `note` trống → 200 · (5) a = 1 thiếu tên tutor → 400 · (6) `gvId` → tạo đúng MỘT dòng `tutors.user_id`, lần hai dùng lại · (7) nháp có `buoi` + `soBuoi` + `buoiDuKien` lưu / đọc lại / chốt thì nháp NULL · (8) Xác nhận PA Tutor quy chế không `soBuoi` → 200, PA `started` · (9) Sửa lần ghi cũ đổi 3 nút + tutor → 200, có lịch sử · (10) `/tutors/chon` trả GV cùng chi nhánh trước, GV không lộ SĐT · (11) CX có `tutor.view` sau migrate; migrate chạy hai lần không đổi gì · (12) PA Kỳ vọng 10 buổi vẫn đếm "x / 10"; PA quy chế SOS có `so_buoi` cũ không còn báo "vượt".
- **Bản chép:** chạy `prTutor2` (đếm cột thêm, 0 dòng dữ liệu đổi) · ghi thử một kết quả kiểu mới vào 3 PA Tutor thật (một quy chế đang chờ xác nhận, một đang chạy có `so_buoi` cũ, một Kỳ vọng) trên bản tạm · báo số PA chờ xác nhận xác nhận được không cần Số buổi (kỳ vọng: 133 / 133).
- **Thao tác TRƯỚC → SAU (máy chủ):** bắt n dòng → 1…n dòng tổng = n · bắt 3 nút → tuỳ chọn · bắt Số buổi khi xác nhận → không · nháp mức + chữ → thêm phần Tutor · sửa lần cũ chỉ chữ → mọi trường Tutor. Không thao tác nào mất.

### TU2-2 PA-DANG-CHAY-MC
- **Tệp:** `server/src/worklist/mywork.ts` (`cauPaGhiKetQua`, khối "Sắp tới" LG-13) · `server/src/cases/luoiKetQua.ts` · kiểu trả về dùng chung ở `shared/domain/` (nơi `SapToiGv` đang khai) · `server/src/tests/tocDoDuong.ts`.
- **Yêu cầu Turso (đường nặng nhất hệ thống):** không thêm câu — dùng chính câu `cauPaGhiKetQua` đang chạy cho "Sắp tới", nới cửa sổ; đo `/my-work` vai GV trên bản chép TRƯỚC → SAU cho 5 GV nhiều PA nhất: **+ 0 câu, dòng tăng ≤ 3 %** (bản chép: nhiều nhất ~36 PA / GV, TB ~10); JSON các khoá khác của `/my-work` trùng trước / sau. Vượt → dừng, báo PTA Plan (cảnh báo chủ SP).
- **Phép kiểm (thêm vào `prTutor2.tests.ts` hoặc tệp riêng):** GV thấy PA mình giữ chưa tới hạn, có `nhap` khi đã lưu nháp · PA tới hạn (đã là việc) KHÔNG nằm trong `paDangChay` · em Tạm dừng / có KQ thi thật không có · Head / Quản trị "Của GV", "Tất cả" không có khoá · số việc / badge (`demDongViec`) không đổi.

### TU2-3 FORM-KQ-TUTOR (sau Ⓣ1 duyệt)
- **Tệp:** `web/src/modules/cases/CapNhatTuan.tsx`, `BuoiTutorO.tsx` (đổi thành một "dòng tutor" gộp), `CasePanel.tsx` (thẻ PA, lịch sử, bỏ chặn :815), `FormPa.tsx`, `ThaoTacCase.tsx` · `web/src/modules/congViec/XacNhanPaLo.tsx` · `web/src/ui/PeoplePicker.tsx` (nhóm GV trong chế độ tutor) · `shared/huongDan/gv.ts` · `shared/i18n/en/*`.
- **Kiểm (bấm thử seed 1440 + 375, sáng + tối):** mọi trạng thái R1.11 · gõ dở → Lưu nháp → tải lại trang → chữ còn · lỗi máy chủ không mất chữ · bàn phím: Tab qua a → b → Tutor → Nội dung, 3 nút là nhóm nút có `aria-pressed` · dòng quy chế đúng câu bảng ⑤.
- **Bảng thao tác TRƯỚC → SAU bắt buộc có các dòng:** BỎ ô Người dạy kỳ này · BỎ Hình thức · BỎ bắt 3 nút · BỎ Số buổi / 2 tuần + Người dạy ở Xác nhận PA Tutor · ĐỔI n dòng buổi → một dòng gộp + "+ Tutor khác" · MỚI ô b · GIỮ mọi thao tác khác của form (Ngày ghi, Lý do, Minh chứng, Lưu nháp, Sửa kết quả, Cần thêm hỗ trợ, Kết thúc PA + Hoàn thành Case).

### TU2-4 PA-DANG-CHAY (sau Ⓣ1 duyệt)
- **Tệp:** `web/src/modules/congViec/HoTroHocVienTab.tsx` (khối mới — tách thành tệp riêng `PaDangChay.tsx`), `SapToi.tsx` (bỏ cụm PA), `LuoiKetQuaPa.tsx` (dòng Tutor: a / b + ô Tutor) · `shared/huongDan/gv.ts`.
- **Kiểm:** số "n việc", badge tab, badge menu, chuông **không đổi** khi có khối (so ảnh trước / sau cùng seed) · gập / mở nhớ theo người · 0 request thêm khi mở trang (đếm ở tab Network) · mở dòng → Lưu nháp → dòng hiện nhãn nháp không cần tải lại cả trang.
- **Thao tác TRƯỚC → SAU:** MỚI ghi nháp PA chưa tới hạn từ Công việc · MỚI ghi PA Tutor trong lưới · BỎ con số "Kết quả PA" ở Sắp tới (thay bằng khối) · GIỮ mọi thao tác nhóm việc, lưới, khay em.

### TU2-5 TRANG-TUTOR-MC
- **Tệp:** `server/src/tutors/trang.ts`, `taiLen.ts`, `chon.ts` (dùng chung hàm quyền) · `server/src/routes/index.ts` (đường xuất) · `server/src/platform/nav.ts` · `server/src/tests/prTub.tests.ts`, `prCxN52.tests.ts` (đảo khẳng định CX không có `tutor.view`), `tocDoDuong.ts` (thêm vai Head tutor, CX).
- **Phép kiểm:** Head sửa tutor chi nhánh mình 200, chi nhánh khác 403, ghi nhận xét 403 · Head gộp tên gõ tay chỉ buổi lớp chi nhánh mình · CX đọc theo phạm vi, mọi đường ghi 403 · GV vẫn 403 `/tutors` · "Buổi" = tổng `so_buoi` (dòng gộp 2 buổi đếm 2) · tỉ lệ bỏ dòng không trả lời khỏi mẫu số · xuất: đúng số theo tháng, có dòng nhật ký, ngoài phạm vi không lộ · dòng danh bạ của GV không sửa / xoá được.
- **Bản chép:** `/tutors` vai Quản trị + một Head: câu, dòng (danh bạ trống, 59 buổi, 26 tên gõ tay phải hiện ở dải Gộp).

### TU2-6 TRANG-TUTOR (sau Ⓣ2 duyệt)
- **Tệp:** `shared/domain/dieuHuong.ts` (thêm lại mục `tutor`, bỏ ghi chú AN-TUTOR) · `web/src/App.tsx` (route `/tutor`, thanh dưới 375) · `web/src/modules/tutor/TutorPage.tsx`, `PanelTutor.tsx`, `HopTutor.tsx`, `TaiDanhSach.tsx`, `kieu.ts` (dùng `ui/Bang.tsx`; gỡ khỏi danh sách miễn BANG-2 / BANG-3 ở `prBang0.tests.ts`) · `shared/huongDan/headTutor.ts`, `ql.ts`, `cx.ts` · `server/src/tests/prTu.tests.ts` (:293-301 đang khẳng định trang ẩn).
- **Kiểm:** 4 vai (Head tutor · Head · CX · Quản trị) mở đúng nút theo quyền, GV gõ `/tutor` → về trang đầu · danh bạ trống không trắng trang · 375 thanh dưới ≤ 5 nút · `do-khung` + `do-bang` xanh 1440 / 1280 / 375.
- **Thao tác TRƯỚC → SAU:** so với mã `TutorPage` hiện có (đang ẩn): GIỮ Thêm · Sửa · Xoá · Tải danh sách · Gộp + Hoàn tác · Nhận xét (+ sửa / xoá) · lọc · tìm · phân trang; BỎ chip "Thiếu thông tin", cột "Cần chú ý vì" riêng, bộ chọn thời gian trong panel; MỚI nhãn GV / Tutor, Xuất số buổi, Head sửa danh bạ.

## 4. Việc không làm trong đợt này (ghi backlog, không tự thêm)

- Cấu hình Tutor trong Quản trị · Tutor trong Báo cáo PH · tab Phân tích riêng cho Tutor · lịch / phân công / vắng (chủ SP đã bác 19/11).
- Dọn `so_buoi` cũ của PA quy chế SOS (để nguyên, chỉ thôi đếm) · dời hạn 21/11 (tự về thứ Ba sau lần ghi).
- Chống trùng 2 PA Tutor trong một Case (H11) — lỗi nhỏ sẵn có, PR riêng nếu chủ SP muốn.

## 5. Tự rà (PTA Tutor, 19/11)

| Luật | PR |
|---|---|
| TU1 không phân công, bỏ ô Người dạy | TU2-1 (`coNguoiDay`), TU2-3 |
| TU2 a / b, không vắng | TU2-1, TU2-3 |
| TU3 một dòng gộp, + Tutor khác | TU2-1 (`so_buoi` dòng), TU2-3 |
| TU4 ô Tutor có GV | TU2-1 (`/tutors/chon`, `tutors.user_id`), TU2-3 |
| TU5 3 nút sau tên Tutor, tuỳ chọn, đánh giá gập | TU2-1, TU2-3 |
| TU6 bắt một Tutor + một Nội dung khi a ≥ 1 | TU2-1, TU2-3 |
| TU7 nháp giữ phần Tutor | TU2-1, TU2-3 |
| TU8, TU9 khối PA đang chạy, mọi loại PA | TU2-2, TU2-4 |
| TU10 hạn thứ Ba giữ | không PR |
| TU11 (C1) thôi bắt Số buổi khi xác nhận, b nhớ kỳ sau | TU2-1, TU2-3 |
| TU12 (C2) mở lại trang Tutor | TU2-5, TU2-6 |
| TU13 (C3) Head lo danh bạ chi nhánh | TU2-5, TU2-6 |
| TU14 (C4) số buổi theo tháng + xuất | TU2-5, TU2-6 |
| TU15, TU16 danh bạ + Cần chú ý giữ | TU2-5 (mẫu số), TU2-6 |
| TU17 không việc mới | TU2-2 (kiểm số việc không đổi), TU2-4 |
| TU18 sửa mọi lần ghi | TU2-1, TU2-3 |
| TU19 dữ liệu cũ giữ | TU2-1 (`so_buoi` DEFAULT 1, không migrate dữ liệu) |

Điều dễ vấp khi rà (ghi vào prompt rà PR): thân kiểu web cũ phải còn hợp lệ ở TU2-1 · dòng gộp 2 buổi không được đếm 1 ở trang Tutor · `/my-work` không tăng câu · khối "PA đang chạy" không lọt vào số việc · GV được chọn làm tutor không thành hai dòng danh bạ · Head không sửa được tutor chi nhánh khác.
