# PR-LUI-a · Đường lui Ý thức · Case · Chờ duyệt — Kế hoạch (tách a1 / a2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Model: Opus 5.5 hoặc Sonnet 5.5 — không Fable** (CLAUDE.md, 06/10).

**Goal:** Làm cho ba chỗ GV / QL hay vấp trở nên tự nhiên, ít bước: (A) **Ghi vi phạm** một lần cho nhiều học viên hoặc nhiều vi phạm của một học viên, ô `Vi phạm` ngắn + `Mô tả` tuỳ chọn, bằng chứng ngay trong form, một nút Lưu; (B) **Case**: bằng chứng ngay lúc tạo, `Người phụ trách` khi ghi kết quả PA, nút kết quả không bị cắt, **Mở lại** Case đã hoàn thành; (C) **Chờ duyệt**: **Từ chối nhiều** thẻ một lần, **Huỷ quyết định** bấm nhầm trong ngày.

**Architecture:** Không viết luật mới — mọi đường đi qua hàm đã có. Ghi nhiều vi phạm = vòng lặp qua phần ghi của `recordViolation` (mỗi học viên một giao dịch, web gửi lô 8 như PR-SL / PR-LUI-b). Tệp chờ trong form tải lên **sau khi** bản ghi có id (luật "lỗi tải tệp không mất nội dung" của `attachments.ts` giữ nguyên); nhiều vi phạm dùng **chung một tệp** (nhiều dòng `attachments` cùng khoá kho, xoá kho khi dòng cuối đi). Mở lại Case = đảo `closeCaseOutcome`. Huỷ quyết định = hàm `khiHuy` theo loại thẻ, chỉ loại đảo sạch được (Đề xuất PA).

**Tech Stack:** TypeScript (`tsc`, import có đuôi `.ts`/`.tsx`), Express + SQLite/Turso (`db()`, `tx()`), React + Tailwind (`KhungPanel`, `Khoi`, `Truong`, `ONgay`, `ChonNguoi`, `NutChon`, `useLoiForm`, `useToast`), phép kiểm `server/src/tests/prLuiA1.tests.ts` / `prLuiA2.tests.ts` gọi ở cuối `run.ts`.

**Spec:** `docs/superpowers/specs/2026-10-06-ra-soat-duong-lui.md` (B2 dòng Case · PA · Vi phạm · Chờ duyệt; C đề xuất 6, 7, 8) + `plan.md` mục 4 "PR-LUI" phần **a** + yêu cầu chủ sản phẩm 06/10 (chín mục dưới). Mockup: `thiet-ke/mockup-duong-lui-case-duyet-y-thuc-2026-10-06.html` (**phải được duyệt trước khi code**).

---

## Chủ sản phẩm chốt 06/10 (sau PR #221) — THẮNG mọi chỗ khác trong file khi lệch

- **Mockup DUYỆT** (bản 2 có thêm mục 16–19 dưới đây).
- **Q1 có:** chọn nhiều học viên = **một** vi phạm chung. **Q2 có:** `Vi phạm` tối đa **60** ký tự, nhóm Khác **bỏ** ô "Ghi rõ". **Q3 có:** `Huỷ quyết định` chỉ thẻ **Đề xuất PA**. **Q4:** **giữ** Xoá vi phạm như nay.
- **Sửa 1 · Ô `Mô tả` MỞ SẴN** ngay dưới ô `Vi phạm` (vẫn không bắt buộc) — bỏ nút chữ `+ Mô tả`. Mô tả riêng từng em (chọn nhiều em) vẫn bấm `+ Mô tả riêng`.
- **Thêm a1 · Sửa / Xoá lần xử lý Ý thức đã xác nhận** (Report, WL…): `Sửa vi phạm` (thêm / bỏ vi phạm của lần xử lý) và `Xoá lần xử lý` (hỏi một dòng, nhật ký giữ nội dung, bậc tính lại). → Task **a1-6**, mockup mục 16–17.
- **Thêm a2 · Sửa / Xoá Case:** `Sửa` (tên, mô tả, mức, kỹ năng, nhóm nguyên nhân) — người tạo / GVCN / QL; `Xoá Case` tạo nhầm — chỉ QL / Quản trị, hỏi một dòng, huỷ PA chưa làm, nhật ký giữ nội dung; **đổi hạn theo dõi Case ghi nhật ký** (`cases.ts:258`). → Task **a2-6**, mockup mục 18–19.

- **Q5 = A:** Sửa / Xoá lần xử lý — QL / Quản trị mọi lúc; GVCN lớp đó khi lần xử lý chưa "Đã thực hiện".
- **Q6 (chủ sản phẩm 06/10):** thêm **Xoá PA** (QL / Quản trị, kể cả PA đã ghi kết quả — hỏi một dòng, nhật ký chụp PA + mọi kết quả tuần; Case có thể về "chưa có PA"). Xoá Case: còn PA có kết quả → chặn `Case còn PA có kết quả — xoá các PA trước.`; hết → xoá được. → Task a2-6, mockup mục 20.

**Tôi đã tự quyết cho phần thêm (duyệt cùng mockup bản 2; hai điểm còn hỏi ở Q5, Q6 cuối file):**
- Lần xử lý: **bậc không lưu sẵn** — `bacHienTai` (`trangThai.ts:167`) đọc từ các lần xử lý `done`, nên xoá xong bậc / lần kế tiếp **tự tính lại**. Chỉ xoá được **lần xử lý mới nhất của chuỗi** (lần sau đã dựa trên lần này → `Đã có WL 1 sau lần này — xoá WL 1 trước.`). Sửa: vi phạm thêm vào phải của **cùng em**, chưa nằm trong lần xử lý khác; còn **≥ 1** vi phạm (bỏ hết = Xoá). Thẻ Chờ duyệt `y_thuc` của lần xử lý đó tự đóng (`Lần xử lý đã xoá`). Tệp xoá theo luật tệp dùng chung (a1-3). Ai: QL / Quản trị mọi lần xử lý; GVCN lớp em đang học khi lần xử lý **chưa "Đã thực hiện"** (Q5). Không có cột Báo phụ huynh nào trỏ lần xử lý (`phoiHop.ts` không đọc `discipline_measures`) — Báo PH đã gửi **giữ nguyên**, nhật ký ghi "đã báo PH" nếu có.
- Case: `Sửa` nằm ở đầu Ngăn Case (mọi Case chưa đóng; Case đã đóng thì `Mở lại` trước). Đổi **kỹ năng** chỉ khi Case **chưa có PA** và không có Case khác cùng kỹ năng đang mở (khoá chống trùng đổi theo); có PA → ô kỹ năng khoá. Mỗi ô đổi → `sos_case_history` + nhật ký `case.edit`. **Xoá Case:** chỉ Case **báo tay** (`origin_kind` khác `mock` — Case tự tạo từ Test bị máy tạo lại, dùng `Không cần theo dõi`) và **chưa có PA nào ghi kết quả** (Q6); xoá hẳn dòng ở mọi bảng trỏ Case (12 bảng, `schema.sql` `REFERENCES sos_cases`), PA chưa làm đi theo, thẻ Chờ duyệt tự đóng, nhật ký `case.delete` giữ ảnh chụp Case + PA.

## Tách hai PR (16 Task: a1 8 · a2 8) — thứ tự

| PR | Phạm vi | Nhánh | Chạy |
|---|---|---|---|
| **PR-LUI-a1 · Ý thức** | mục 1–5 (Ghi vi phạm nhiều em / nhiều vi phạm, ô Vi phạm + Mô tả, bằng chứng một bước, Xoá vi phạm giữ nguyên) + **Sửa / Xoá lần xử lý** + `TepCho` dùng chung | `pr-lui-a1-y-thuc` | **trước** |
| **PR-LUI-a2 · Case + Chờ duyệt** | mục 6–9 + **Sửa / Xoá Case**, nhật ký hạn theo dõi | `pr-lui-a2-case-duyet` | song song a1 được; **Task a2-2 (Tạo Case có tệp) làm sau khi a1 merge** (dùng `TepCho` + `/attachments/chep` của a1) — `git merge origin/main` rồi mới làm a2-2 |

Cả hai sau đợt 5 (MTb #219, LT3 #218, MT0) và TK #220 nếu được; không chạm file của chúng ngoài các chỗ "chỉ thêm dòng" (bảng File chồng cuối file).

## Global Constraints

- **Chữ trên web ngắn** (05/10): nhãn 1–3 từ, không câu giải thích dưới nút/ô; **mockup = đúng chữ sẽ hiện** (bảng "Chữ trên màn"). Thời gian: mã tuần `W3 SEP`; ngày chỉ cho ngày vi phạm, ngày ghi, nhật ký.
- **Ô ngày ở mọi nơi = ô gõ + nút lịch** (`ONgay`, chủ sản phẩm 06/10) — panel Ghi vi phạm **bỏ** `ChonNgayGan` (hàng Hôm nay / Hôm qua).
- **Không thêm bước / nút / kho / màn xem trước** khi có cách trực tiếp (chủ sản phẩm 06/10). **Không Hoàn tác sau khi ghi vi phạm** (đã có Sửa / Xoá).
- **Quyền ở MÁY CHỦ**, không chỉ ẩn nút: ghi vi phạm từng em qua `requireRecordViolation`; Mở lại Case và Huỷ quyết định chỉ **QL / Quản trị** (`CASE_APPROVE` / `P_DUYET` theo phạm vi thẻ). GV không có mục mới nào (API 403).
- **Mỗi thao tác có nhật ký** (`writeAudit`); Mở lại Case thêm mốc + Hành trình.
- **Kiểm dữ liệu nhập, xử lý lỗi chống mất dữ liệu, phân quyền: không bao giờ bớt.** Ghi nhiều: một request ≤ 8 học viên, mỗi học viên một giao dịch; lỗi một em không cuộn lại em khác; gửi lại cùng khoá không tạo dòng thứ hai.
- Turso: không tham số đặt tên; `IN (…)` theo lô ≤ 400; `BEGIN IMMEDIATE` nằm trong `tx()`; route mới có trần ở `server/src/tests/tocDoDuong.ts`.
- Migrate: file riêng `server/src/migrate/prLuiA1.ts` / `prLuiA2.ts`, **chỉ thêm cột**, chạy lặp được (lần hai không báo gì); thêm cột vào `schema.sql` cho DB mới.
- Skill: `superpowers:<tên>`; giao diện `/ponytail lite` đầu phiên + `impeccable` (`layout`, `clarify`, `harden`, `adapt` 375, cuối `audit`); cuối `/ponytail-review`.
- Cổng: a1 `PORT=4410 WEB_PORT=5410`; a2 `PORT=4420 WEB_PORT=5420`. Máy yếu RAM: `npm run check` một lần một lúc, foreground; OOM thì `npm run build:server` rồi chạy riêng phép kiểm.

---

## Chủ sản phẩm đã quyết (06/10)

1. Ghi **một** vi phạm cho **nhiều** học viên; mặc định **chung một mô tả**, em nào cần thì bấm `+ Mô tả riêng`.
2. GVCN ghi **nhiều vi phạm ở nhiều môn** cho **một** học viên trong một lần Lưu (`+ Thêm vi phạm`).
3. Mỗi vi phạm hai ô: `Vi phạm` (bắt buộc, ngắn, có giới hạn ký tự) + `Mô tả` (không bắt buộc). Danh sách / hồ sơ chỉ hiện dòng `Vi phạm`; mô tả mở ra khi bấm dòng.
4. **Một bước:** bằng chứng ở cuối panel đầu tiên, Lưu một lần là xong. **Không Hoàn tác.**
5. Xoá vi phạm: bản tối giản (đã có Sửa / Xoá).
6. Tạo Case: bằng chứng ngay trong form, không bắt buộc.
7. Ghi kết quả PA: `Người phụ trách` (bắt buộc, gõ tự do + gợi ý người trong hệ thống) ngay dưới `Tiến triển`; `Vấn đề còn tồn / Ghi chú` thay hai ô cũ; nút kết quả không bị cắt / lệch (chỉ panel này — sửa toàn web là PR-KHUNG).
8. Mở lại Case đã hoàn thành: nút `Mở lại` ngay trên Case; sửa chữ sai `ThaoTacCase.tsx:218`.
9. Huỷ quyết định duyệt / từ chối bấm nhầm trong ngày + từ chối nhiều thẻ một lần — bản tối giản.
10. **PR-HK2 bỏ mục "toast Hoàn tác sau khi ghi vi phạm (Y_THUC §7.2)"** — đã có Sửa / Xoá (đã ghi ở `plan.md` mục 4).

**Tôi đã tự quyết (duyệt cùng mockup):**
- `Vi phạm` **3–60 ký tự** (đếm `n/60`, ô không cho gõ quá). `Mô tả` ≤ 2000, **bỏ** luật cũ "mô tả ≥ 10 ký tự". `Nhóm` (5 nhóm) **giữ, bắt buộc** — luật "3 vi phạm trong 2 tuần" và thống kê đếm theo nhóm. Nhóm `Khác` **bỏ ô `Ghi rõ`**: ô `Vi phạm` đã là chữ ngắn đó (Q2 — đã chốt).
- Chọn ≥ 2 học viên → **một** dòng vi phạm (ẩn `+ Thêm vi phạm`); một học viên → tối đa 10 dòng (Q1 — đã chốt). Mỗi dòng có `Ngày` riêng (dòng mới chép ngày dòng trên).
- **Một khối Bằng chứng chung** cho mọi vi phạm của lần Lưu: mỗi vi phạm nhận một dòng tệp, **chung một tệp trong kho** (không tải lên N lần).
- Chọn nhiều học viên **chỉ khi mở từ hồ sơ lớp** (đã có danh sách lớp); mở từ hồ sơ học viên = một học viên, được nhiều dòng.
- **Dữ liệu cũ không migrate nội dung:** cột `ten` mới để trống ở dòng cũ; khi ĐỌC, `tachTenMoTa` tự tách (mô tả ≤ 60 → thành `Vi phạm`; dài hơn → cắt ở chữ gần 60 + `…`, mô tả giữ nguyên; `Khác` dạng `A — B` → `A` / `B`). Sửa lại vi phạm cũ thì lưu `ten` thật. Migrate chỉ thêm cột.
- Sau khi Lưu: **đóng panel + toast** (`Đã ghi vi phạm cho 3 học viên`). Tệp lỗi → panel **ở lại** đúng chỗ tệp lỗi với `Thử lại` (vi phạm đã lưu, không gửi lại); lưu dở giữa các lô → `Đã lưu 16 học viên · 8 học viên chưa lưu` + `Thử lại 8 học viên`, ô nhập khoá lại.
- **Xoá vi phạm giữ nguyên** (hộp hỏi một dòng, xoá hẳn kèm tệp; nhật ký giữ toàn bộ nội dung). Không xoá mềm / khôi phục (Q4 — đã chốt). Chỉ đổi: tệp dùng chung với vi phạm khác **không** bị xoá khỏi kho.
- Tạo Case: Lưu → đóng panel + toast `Đã lưu Case «…»` có nút `Thêm PA` (khi việc tiếp là Thêm PA) — **bỏ bước "Đã lưu"**, chỉ còn khi có tệp lỗi. Người tạo Case được đính kèm vào Case mình vừa tạo (kể cả GVCN tạo Case môn không dạy).
- `Người phụ trách` điền sẵn **người thực hiện PA**; chọn trong mọi nhân viên (`nhom="nhan_vien"`) hoặc gõ tên ngoài hệ thống; lưu ở lần ghi kết quả (không đổi người thực hiện PA). Ô cũ `3 · Ghi chú` bỏ; chữ gõ ở `Vấn đề còn tồn / Ghi chú` vào cột `remaining_issue` (≤ 300).
- Nút kết quả PA: **2 cột ở mọi cỡ** (panel ≤ 560 px), chữ `text-sm`, cho xuống dòng, **bỏ dấu ✓ ↗ – ↓** trên nút trong panel này (nhãn đủ nghĩa; ✓ của nút đang chọn đã có — tránh `✓ ✓ Tiến bộ rõ`).
- `Mở lại` Case: **một bấm, không lý do**, chỉ QL / Quản trị; Case về `Đang theo dõi` (có PA) hoặc `Mới mở`; kết luận cũ ở lại trong mốc `Hoàn thành` + nhật ký; PA đã khép **không** tự sống lại. Đã có Case mới cùng hạng mục → chặn (`Đã có Case Listening mới — mở Case đó.`).
- `Từ chối n…` ở thanh chọn của Chờ duyệt: **cùng luật Duyệt nhiều** (cùng một loại `hangLoat`, ≤ 50), **một lý do chung**.
- `Huỷ quyết định`: ở tab `Đã xử lý`, **chỉ thẻ Đề xuất PA**, quyết **trong ngày**, PA **chưa ghi kết quả**, Case chưa đóng; thẻ về `Chờ duyệt`, PA về đúng như trước khi quyết; chuông cho người gửi. Thẻ Dời lịch thi bấm nhầm: dùng đường có sẵn ở Kế hoạch Test (`Dời` / `Khôi phục phần đã huỷ`) (Q3 — đã chốt). Thẻ "Không cần theo dõi" bấm nhầm: `Mở lại` Case (mục 8).

---

## Chữ trên màn (một nguồn — mockup dùng đúng các chữ này)

| Chỗ | Chữ |
|---|---|
| Panel ghi vi phạm | tiêu đề `Ghi vi phạm` · ngữ cảnh `Nguyễn Minh Anh · MB FT 101` / `3 học viên · MB FT 101` · dòng `* = bắt buộc` |
| Chọn học viên (từ hồ sơ lớp) | ô `Học viên *` → `Chọn học viên` / `3 học viên`; danh sách: ô tìm `Gõ tên…` · `Cả lớp · 24` · ô chọn từng em; dưới ô: mỗi em một dòng `Tên` · `+ Mô tả riêng` · `✕`; mở ra: ô `Mô tả riêng` (không bắt buộc) + `Bỏ` |
| Một dòng vi phạm | khối `Vi phạm` (nhiều dòng: `Vi phạm 1`, `Vi phạm 2` + nút `Xoá dòng`) · `Ngày *` (ô gõ + lịch) · `Môn` (`Chưa chọn`) · `Nhóm *` (`Chuyên cần` `BTVN` `Thái độ / hành vi` `Kỷ luật lớp học` `Khác`) · `Vi phạm *` (đếm `0/60`, gợi ý `Ví dụ: Không nộp BTVN Reading`) · ô `Mô tả (không bắt buộc)` **mở sẵn** ngay dưới (gợi ý `Chi tiết nếu cần`) |
| Thêm dòng | `+ Thêm vi phạm` (chỉ khi một học viên) |
| Bằng chứng | khối `Bằng chứng · không bắt buộc` · `+ Đính kèm tệp` · `+ Thêm liên kết` · dòng tệp `anh-vo-btvn.jpg · 1,2 MB` + `✕` · lỗi `Tệp quá lớn: tối đa 4 MB.` |
| Chân | trái `Đóng` / `Huỷ thay đổi` · lỗi `2 ô cần sửa ↑` · phải `Lưu` · đang lưu `Đang lưu…` / `Đang lưu 8/24…` |
| Lưu dở | dòng chân `Đã lưu 16 học viên · 8 học viên chưa lưu` · lỗi dưới tên em · nút `Thử lại 8 học viên` |
| Tệp lỗi sau khi lưu | khối `Đã ghi` `✓ Đã ghi vi phạm cho 3 học viên` · dòng tệp lỗi + `Thử lại` · chân `Xong` |
| Lỗi ô | `Chọn ít nhất một học viên` · `Chọn Nhóm` · `Ghi vi phạm` · `Cần ít nhất 3 ký tự (đang có 2)` |
| Toast | `Đã ghi vi phạm cho Nguyễn Minh Anh` · `Đã ghi 3 vi phạm cho Nguyễn Minh Anh` · `Đã ghi vi phạm cho 3 học viên` |
| Danh sách vi phạm (hồ sơ HV › Ý thức & Phối hợp) | dòng chính = `Vi phạm` (vd `Không nộp BTVN Reading`) · dòng phụ `BTVN · Reading · Lê Hà ghi` · mở dòng: `Mô tả` (đoạn chữ, chỉ khi có) · `Bằng chứng (2)` · `Sửa` |
| Sửa vi phạm | tiêu đề `Sửa vi phạm` · cùng ô · chân trái `Xoá vi phạm` (viền đỏ) |
| Tạo Case | khối cuối `Bằng chứng · không bắt buộc` (cùng khối trên) · toast `Đã lưu Case «Listening — nghe sót số liệu»` + nút `Thêm PA` |
| Ghi kết quả PA | khối `1 · Kết quả tuần W3 SEP` · nút `Tiến bộ rõ` `Tiến bộ một phần` / `Không tiến bộ` `Kém hơn` · `Chưa có bài để so?` `Chưa đủ dữ liệu` · `Tiến triển *` (gợi ý `Đã cải thiện ở phần nào, như thế nào, kết quả cụ thể`) · **`Người phụ trách *`** (ô người: `Lê Hà · GVBM · MB` + `Đổi`; gõ: `Gõ tên…`, `Tôi`, tên + dòng phụ, `Dùng tên ngoài hệ thống: «…»`) · **`Vấn đề còn tồn / Ghi chú (không bắt buộc)`** (gợi ý `Ví dụ: còn sai dạng T/F/NG`) · `2 · Quyết định` · `Ngày ghi` · lỗi `Chọn Người phụ trách` |
| Lịch sử kết quả PA | `Phụ trách: Lê Hà` · `Còn tồn / Ghi chú: …` |
| Case đã hoàn thành | nút `Mở lại` (cạnh nhãn `Đã hoàn thành`, chỉ QL / QT) · toast `Đã mở lại Case` · mốc `Mở lại · Trần Thu Hà` · lỗi `Đã có Case Listening mới — mở Case đó.` |
| Hoàn thành Case (ⓘ của khối Kết quả cuối) | `Đóng nhầm thì Quản lý mở lại được. MT sau trượt lại thì có Case mới nối Case này.` |
| Chờ duyệt › thanh chọn | `Đã chọn 5 · Đề xuất PA` · `Chọn hết 7` · `Bỏ chọn` · **`Từ chối 5…`** · `Duyệt 5 yêu cầu`; bấm Từ chối: ô `Lý do từ chối (người gửi sẽ đọc) *` · `Đóng` · `Gửi từ chối 5` · đang gửi `Đang từ chối…` · toast `Đã từ chối 5/5` |
| Lần xử lý Ý thức (hồ sơ HV › Ý thức & Phối hợp › dòng Xử lý › `Xem`) | panel `Report 2` · khối `Vi phạm · 2` + nút `Sửa vi phạm` → danh sách ô chọn (đang gắn: đã chọn; vi phạm chưa xử lý của em: chưa chọn) · chân trái `Xoá lần xử lý` (viền đỏ, chỉ lần mới nhất) · phải `Lưu` · lỗi `Còn ít nhất 1 vi phạm` · hỏi một dòng: tiêu đề `Xoá lần xử lý này?` · dòng `Report 2 · 2 vi phạm · bậc về Report 1` · nút `Xoá lần xử lý` · toast `Đã xoá Report 2` / `Đã lưu lần xử lý` · lỗi `Đã có WL 1 sau lần này — xoá WL 1 trước.` |
| Sửa Case (Ngăn Case › nút `Sửa` ở đầu) | panel `Sửa Case` · `Kỹ năng *` (khoá khi có PA) · `Nhóm nguyên nhân *` · `Mức độ *` (`Bình thường` `Gấp`) · `Tên Case *` · `Mô tả *` · chân trái `Xoá Case` (viền đỏ, chỉ QL/QT) · phải `Lưu` · toast `Đã lưu Case` · hỏi một dòng: `Xoá Case này?` · dòng `Listening — nghe sót số liệu · 1 PA chưa làm sẽ huỷ` · nút `Xoá Case` · toast `Đã xoá Case` · Case đã có PA ghi kết quả: không có nút `Xoá Case` (máy chủ vẫn chặn: `Case đã có PA ghi kết quả — Hoàn thành Case thay vì xoá.`) · lỗi `Đã có Case Reading đang mở.` |
| Chờ duyệt › Đã xử lý | thẻ Đề xuất PA quyết hôm nay: nút **`Huỷ quyết định`** · toast `Đã huỷ quyết định · thẻ về Chờ duyệt` · lỗi `PA đã có kết quả — không huỷ quyết định được.` · chuông người gửi `Quản lý huỷ quyết định · Đề xuất PA · chờ duyệt lại` |

---

## Cấu trúc file

### a1 · Ý thức

| File | Việc |
|---|---|
| `shared/domain/yThuc.ts:51` | thêm `VI_PHAM_TEN_TOI_THIEU = 3`, `VI_PHAM_TEN_TOI_DA = 60`, `VI_PHAM_TOI_DA_DONG = 10`, `LO_GHI_VI_PHAM = 8`, `TOI_DA_EM_GHI_VI_PHAM = 60`, `kiemTenViPham()`, `tachTenMoTa()`; `VIOLATION_DESCRIPTION_MIN` **xoá** (grep nơi dùng) |
| `server/src/migrate/prLuiA1.ts` (**mới**) + `server/src/migrate.ts:29,271` + `server/src/schema.sql:1636-1665` | cột `violations.ten TEXT` |
| `server/src/yThuc/violations.ts:61-77, 130-143, 194-261, 287-331` | `shapeViolation` thêm `ten`, `moTa`; `checkTenMoTa` thay `checkDescription`; tách `ghiMotViPham` (thân `recordViolation`) + **`recordViolations()`**; `editViolation` nhận `ten` |
| `server/src/routes/index.ts:1004-1025` | `POST /violations/nhieu`; `/violations`, `PATCH` nhận `ten` (bỏ `ghiRoKhac`) |
| `server/src/platform/attachments.ts:93-100 (caseOwner), purgeAttachmentsOf, deleteAttachment` | **`chepTep()`**; xoá kho chỉ khi không còn dòng nào cùng khoá |
| `server/src/routes/index.ts:~907` | `POST /attachments/chep` |
| `server/src/tests/tocDoDuong.ts` | trần hai route mới |
| `server/src/yThuc/board.ts:98`, `server/src/worklist/metrics.ts:186-192` | hiện `ten` |
| `web/src/ui/TepCho.tsx` (**mới**) | khối tệp chờ trong form + `taiTepCho()` |
| `web/src/modules/yThuc/RecordViolationPanel.tsx` (viết lại thân, giữ props) | chọn nhiều em, nhiều dòng, `ONgay`, bỏ `OKhac`, `TepCho`, một Lưu, lô 8, bỏ bước "Đã ghi" + Hoàn tác |
| `web/src/modules/yThuc/panelYThuc.tsx:41-60`, `web/src/modules/classes/thaoTacDongHocVien.tsx:74` | truyền danh sách lớp + cho chọn nhiều (chỉ từ hồ sơ lớp) |
| `web/src/modules/yThuc/ChiTietViPham.tsx`, `StudentYThucSection.tsx:99`, `ClassYThucCard.tsx:135,157`, `XacNhanXuLyPanel.tsx:173-176`, `XemXuLyPanel.tsx:56`, `RecordViolationPanel.tsx` (dòng trùng) | dòng chính = `ten`; mô tả trong chi tiết |
| `server/src/yThuc/xuLy.ts` (sau `xoaNhap` `:448`), `routes/index.ts`, `web/src/modules/yThuc/XemXuLyPanel.tsx` | **bản 2:** `suaViPhamXuLy`, `xoaXuLy` + nút `Sửa vi phạm`, `Xoá lần xử lý` |
| `server/src/tests/prLuiA1.tests.ts` (**mới**) + `server/src/tests/run.ts` (cuối) | phép kiểm `LUIa1-*` |

### a2 · Case + Chờ duyệt

| File | Việc |
|---|---|
| `server/src/migrate/prLuiA2.ts` (**mới**) + `migrate.ts` + `schema.sql:1150-1180` | `case_followups.phu_trach_user_id INTEGER REFERENCES users(id)`, `phu_trach_ten TEXT` |
| `server/src/cases/cases.ts:2739-2930` (`updateResult`), `:1499`, `:2558` (đọc) | `phuTrach` (bắt buộc ở route), đọc ra `phuTrach` |
| `server/src/routes/index.ts:1673-1676` | truyền `{ batBuocPhuTrach: true }` |
| `shared/domain/sosV4.ts:20` | `GOI_Y_KET_QUA_PA` bỏ đuôi "; ai đã thực hiện / hỗ trợ / Tutor" |
| `web/src/modules/cases/CapNhatTuan.tsx:94-366` | `Người phụ trách`, gộp ô, bỏ khối `3 · Ghi chú`, nút kết quả 2 cột |
| `web/src/modules/cases/CasePanel.tsx:405` | `Phụ trách:` + `Còn tồn / Ghi chú:` |
| `server/src/platform/attachments.ts` `caseOwner` | người tạo Case (`reported_by`) đính kèm được |
| `web/src/modules/cases/QuickReport.tsx:84-321, 548-553` | `TepCho` trong form, bỏ bước "Đã lưu" (trừ khi tệp lỗi), toast `Thêm PA` |
| `server/src/cases/cases.ts` (sau `closeCaseOutcome` `:249`) | **`moLaiCase()`**; `caseDetail` thêm `viewer.coTheMoLai` |
| `shared/domain/cases.ts:~230` `MILESTONE_KINDS` | thêm `'reopened'` (nếu PR-BV đã thêm thì dùng lại) |
| `server/src/routes/index.ts` | `POST /cases/:id/mo-lai`, `POST /yeu-cau/tu-choi-nhieu`, `POST /yeu-cau/:id/huy-quyet-dinh` |
| `web/src/modules/cases/CasePanel.tsx` (hàng nút / nhãn trạng thái của Case `done`), `web/src/modules/cases/ThaoTacCase.tsx:218` | nút `Mở lại`; sửa chữ ⓘ |
| `server/src/duyet/yeuCau.ts:395-468` | `tuChoiNhieu()` (chung thân với `duyetNhieu`), `huyQuyetDinh()`, cờ `coTheHuy` khi liệt kê `da-xu-ly` |
| `server/src/duyet/loaiYeuCau.ts:71-90, 121-147` | `DinhNghiaLoai.khiHuy`; `de_xuat_pa.khiHuy` |
| `server/src/cases/cases.ts` (cạnh `respondToPlan` `:945`) | **`huyQuyetDinhPa()`** |
| `shared/domain/yeuCauDuyet.ts:124` | `tomTatKetQuaHangLoat` nhận `'tu-choi'` |
| `web/src/modules/duyet/HopChoDuyet.tsx:203-221`, `TheYeuCau.tsx` (`KetQua`, cột phải) | `Từ chối n…` + ô lý do; `Huỷ quyết định` |
| `server/src/cases/cases.ts` (`setFollowUntil` `:257-266` + mới `suaCase`, `xoaCase`), `server/src/cases/sosAuto.ts:197-215` (tách `kiemNoiDungCase`), `web/src/modules/cases/ThaoTacCase.tsx` (`SuaCasePanel`), `NganCase.tsx`/`CasePanel.tsx` (nút `Sửa`) | **bản 2:** Sửa / Xoá Case, nhật ký hạn theo dõi |
| `server/src/tests/prLuiA2.tests.ts` (**mới**) + `run.ts` (cuối) | phép kiểm `LUIa2-*` |

**Đã đọc mã thật (origin/main f17436e3) và điều rút ra:**
- `RecordViolationPanel.tsx:62-65` khoá gửi một lần mở form; `:124-155` Hoàn tác = `DELETE /violations/:id`; `:191-206` bước "Đã ghi" + `BangChung` (tệp chỉ thêm được sau khi có id); `:230` dùng `ChonNgayGan` (hàng nút ngày — trái luật ô ngày 06/10); `:252-253` `OKhac` (Ghi rõ ≥ 3); `:256-259` Mô tả bắt buộc ≥ 10 (`VIOLATION_DESCRIPTION_MIN`, `shared/domain/yThuc.ts:51`).
- `violations.ts:130-143` "Khác" ghép `{ghi rõ} — {mô tả}` vào **một** cột `description` (không có cột riêng, Q9) → cột `ten` mới thay luôn việc ghép này. `:194-261` `recordViolation`: kiểm em có lớp đang học, khoá gửi chỉ phát lại cho đúng người + đúng em, GVCN tự Ghi nhận, `baoKhiGhiViPham` (chuông dedup **mỗi em mỗi ngày**, `xuLy.ts:349-364`), `chotHanXuLy`. `:346-376` Xoá cứng: `purgeAttachmentsOf` + nhật ký đủ nội dung.
- `attachments.ts`: tải tệp là request riêng (luật a), quyền theo bản ghi chủ (`ownerAccess`), khoá kho = cột `url`; `purgeAttachmentsOf`/xoá một tệp **xoá kho theo `url`** → dùng chung tệp phải đếm dòng còn lại trước khi xoá kho. `caseOwner.requireEdit` = `SOS_EDIT` đúng môn → GVCN tạo Case môn không dạy không đính kèm được (`QuickReport.tsx:313-319` có câu riêng cho việc này).
- `QuickReport.tsx:296-321` đã có bước "Đã lưu" + Bằng chứng; `:548-553` khối chữ "Ảnh, tệp, liên kết — thêm được ngay sau khi tạo". Toast có `hanhDong` (`web/src/ui/Toast.tsx:8-14`) → toast `Thêm PA` thay bước "Đã lưu".
- `CapNhatTuan.tsx:273-280` nút kết quả `grid-cols-2 sm:grid-cols-4` + `whitespace-nowrap px-1.5 text-xs` + dấu `OUTCOME_MARK` + ✓ của `NutChon` (`ui.tsx:485-491`, ✓ luôn giữ chỗ) → ở panel 560 px, 4 cột ~130 px: `✓ ↗ Tiến bộ một phần` tràn (ảnh 2.png). `:293-296` `Vấn đề còn tồn` → `remainingIssue` (≤ 300, `cases.ts:2903-2904`); `:356-362` khối `3 · Ghi chú` dùng chung state `reason` → `decisionNote`. Người thực hiện PA đã có `ChonNguoi` (`PeoplePicker.tsx:194-377`, `nhom` `giao_vien`/`nhan_vien`, `choNgoai` gõ tên ngoài) + `chuanHoaNguoiThucHien` (`server/src/cases/nguoiThucHien.ts:27-47`).
- `updateResult` được gọi ở ~73 chỗ phép kiểm + 4 seed → **bắt buộc Người phụ trách ở ROUTE** (tham số `batBuocPhuTrach`), không ở mọi lời gọi.
- `closeCaseOutcome` `cases.ts:143-249`: đặt `status='done'`, `outcome*`, `closed_*`; mốc `closed` (có kết luận) + Hành trình; **không** nhả `dedup_key`. `upsertCategoryCase` `sos.ts:152-215`: Case `done` mà trượt lại → nhả khoá, mở Case mới nối `previous_case_id`. → Mở lại chỉ khi khoá còn của chính Case này (hoặc trống và không ai giữ). `ThaoTacCase.tsx:218` chữ ⓘ nói ngược ("chính Case này mở lại").
- `yeuCau.ts:395-404` `quyetDinh` chỉ nhận thẻ `cho`; `:445-468` `duyetNhieu` (cùng loại `hangLoat`, ≤ `TRAN_HANG_LOAT`, mỗi thẻ một giao dịch, lỗi riêng từng thẻ) → `tuChoiNhieu` dùng chung thân. `chotYeuCau :151-175` ghi `trang_thai, nguoi_duyet, ly_do_tu_choi, tra_loi, ly_do_dong, tu_duyet, xu_ly_luc`. `respondToPlan cases.ts:945-1030`: duyệt → PA `started`, `cycle_started_on`, `started_date`, `action_due`; từ chối → PA `cancelled`. `decideAbsenceMove absence.ts:460-532`: duyệt = dời lịch + bộ đếm; từ chối = huỷ phần thi → **không** đảo sạch trong PR này (đường có sẵn: Dời / Khôi phục phần đã huỷ).
- `HopChoDuyet.tsx:203-221` thanh chọn chỉ có `Duyệt n yêu cầu`; `TheYeuCau.tsx:~255-265` `KetQua` của thẻ đã xử lý.

---

# PHẦN a1 · Ý thức

### Task a1-0: Mockup + duyệt (BƯỚC 1)

**Files:** `thiet-ke/mockup-duong-lui-case-duyet-y-thuc-2026-10-06.html`

- [x] Soạn mockup đủ trạng thái, 375 và 1440, sáng và tối, đúng chữ thật (planning 06/10).
- [x] Chủ sản phẩm duyệt bản 1 (06/10, Q1–Q4 đã trả lời); bản 2 (mục 16–19 + Mô tả mở sẵn) duyệt cùng Q5, Q6. Chưa duyệt bản 2 → không code giao diện của a1-6 / a2-6. Phần máy chủ a1-1 → a1-3 làm được ngay (không đổi theo mockup), trừ trần 60 ký tự (Q2) — đổi một hằng.
- [x] Đối chiếu: `git grep -n "VIOLATION_DESCRIPTION_MIN\|ghiRoKhac\|ChonNgayGan" -- web server shared` → ghi danh sách nơi dùng vào commit đầu.

### Task a1-1: Miền + migrate (cột `ten`)

**Files:** `shared/domain/yThuc.ts`, `server/src/migrate/prLuiA1.ts` (mới), `server/src/migrate.ts`, `server/src/schema.sql`, `server/src/tests/prLuiA1.tests.ts` (mới), `server/src/tests/run.ts`

- [x] **Đỏ** — `prLuiA1.tests.ts`:

```ts
/** PHÉP KIỂM PR-LUI-a1 — Ý thức: ghi nhiều học viên / nhiều vi phạm, ô Vi phạm + Mô tả, tệp dùng chung. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrLuiA1Tests(t: YThucTestKit) {
  const { check, checkAsync, assert, assertThrows, conn, TODAY, P, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-LUI-a1 · Ý thức');

  check('LUIa1-1 · kiemTenViPham: trống / < 3 / > 60 báo lỗi, 3–60 qua', () => {
    assert(d.kiemTenViPham('') === 'Ghi vi phạm', d.kiemTenViPham(''));
    assert(d.kiemTenViPham(' ab ') === 'Cần ít nhất 3 ký tự (đang có 2)', d.kiemTenViPham(' ab '));
    assert(d.kiemTenViPham('x'.repeat(61)) === 'Tối đa 60 ký tự (đang có 61)', 'trần');
    assert(d.kiemTenViPham('Không nộp BTVN Reading') === null && d.VI_PHAM_TEN_TOI_DA === 60, 'qua');
  });

  check('LUIa1-2 · tachTenMoTa: dữ liệu cũ tự tách khi đọc, không đổi DB', () => {
    const ngan = d.tachTenMoTa(null, 'Đi muộn 15 phút', 'attendance');
    assert(ngan.ten === 'Đi muộn 15 phút' && ngan.moTa === '', JSON.stringify(ngan));
    const dai = 'Không nộp bài Reading buổi 12/09, đã nhắc hai lần trên nhóm lớp nhưng em vẫn chưa gửi bài';
    const r = d.tachTenMoTa(null, dai, 'homework');
    assert(r.ten.length <= 61 && r.ten.endsWith('…') && dai.startsWith(r.ten.slice(0, -1).trimEnd()) && r.moTa === dai, JSON.stringify(r));
    const khac = d.tachTenMoTa(null, 'Dùng điện thoại — chơi game trong giờ Speaking', 'other');
    assert(khac.ten === 'Dùng điện thoại' && khac.moTa === 'chơi game trong giờ Speaking', JSON.stringify(khac));
    const moi = d.tachTenMoTa('Quên vở', '', 'homework');
    assert(moi.ten === 'Quên vở' && moi.moTa === '', 'có ten thì giữ');
  });

  const { migratePrLuiA1 } = await import('../migrate/prLuiA1.ts');
  check('LUIa1-3 · migrate prLuiA1 chạy lặp được: DB đã có cột thì không báo gì, cột ten có', () => {
    const lan: string[] = [];
    migratePrLuiA1(conn, lan);
    assert(lan.length === 0, lan.join(' | '));
    assert((conn.prepare("SELECT name FROM pragma_table_info('violations')").all() as any[]).some((c) => c.name === 'ten'), 'thiếu cột ten');
  });
}
```

Gọi ở cuối `run.ts` (sau khối PR-LUI-b / PR-TK, trước dòng `console.log('='.repeat(60))`):
```ts
// ==================================================================== PR-LUI-a1 (Ý thức: ghi nhiều, Vi phạm + Mô tả, tệp dùng chung)
const { runPrLuiA1Tests } = await import('./prLuiA1.tests.ts');
await runPrLuiA1Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
```
Run: `npm run build:server` rồi chạy phép kiểm. Expected: FAIL (`kiemTenViPham` undefined).

- [x] **Xanh** — `shared/domain/yThuc.ts` (thay dòng `VIOLATION_DESCRIPTION_MIN`):

```ts
/** PR-LUI-a (chủ sản phẩm 06/10): ô "Vi phạm" ngắn, bắt buộc — dòng chính ở mọi danh sách. "Mô tả" không bắt buộc (≤ 2000, máy chủ `chuTuDo`). */
export const VI_PHAM_TEN_TOI_THIEU = 3;
export const VI_PHAM_TEN_TOI_DA = 60;
/** Một học viên, một lần Lưu: tối đa số dòng vi phạm này. */
export const VI_PHAM_TOI_DA_DONG = 10;
/** Một request ghi tối đa số học viên này (10 s của Netlify; cùng mẫu `LO_HANG_LOAT_EM`). Web chia lô bằng `chiaLo`. */
export const LO_GHI_VI_PHAM = 8;
/** Một lần Lưu tối đa số học viên này (một lớp). */
export const TOI_DA_EM_GHI_VI_PHAM = 60;

export function kiemTenViPham(text: unknown): string | null {
  const n = String(text ?? '').trim().length;
  if (n === 0) return 'Ghi vi phạm';
  if (n < VI_PHAM_TEN_TOI_THIEU) return `Cần ít nhất ${VI_PHAM_TEN_TOI_THIEU} ký tự (đang có ${n})`;
  if (n > VI_PHAM_TEN_TOI_DA) return `Tối đa ${VI_PHAM_TEN_TOI_DA} ký tự (đang có ${n})`;
  return null;
}

const catNgan = (s: string) => {
  if (s.length <= VI_PHAM_TEN_TOI_DA) return s;
  const cach = s.lastIndexOf(' ', VI_PHAM_TEN_TOI_DA - 1);
  return `${s.slice(0, cach > 30 ? cach : VI_PHAM_TEN_TOI_DA - 1).trimEnd()}…`;
};
/**
 * DỮ LIỆU CŨ chỉ có `description` (cột `ten` NULL): tách KHI ĐỌC, không đổi DB. Ngắn → thành Vi phạm, mô tả rỗng;
 * dài → Vi phạm = cắt ở chữ gần 60 + "…", mô tả giữ nguyên; "Khác" dạng `A — B` (T13) → A / B.
 */
export function tachTenMoTa(ten: string | null | undefined, moTa: string | null | undefined, category: string): { ten: string; moTa: string } {
  const m = (moTa ?? '').trim();
  if (ten && ten.trim()) return { ten: ten.trim(), moTa: m };
  if (category === 'other') {
    const k = tachKhac(m);
    if (k.ghiRo) return k.ghiRo.length <= VI_PHAM_TEN_TOI_DA ? { ten: k.ghiRo, moTa: k.moTa } : { ten: catNgan(k.ghiRo), moTa: m };
  }
  return m.length <= VI_PHAM_TEN_TOI_DA ? { ten: m, moTa: '' } : { ten: catNgan(m), moTa: m };
}
```
(`tachKhac` import từ `./khac.ts`. Grep `VIOLATION_DESCRIPTION_MIN` → mọi nơi dùng chuyển sang luật mới.)

`server/src/migrate/prLuiA1.ts`:
```ts
/** PR-LUI-a1: cột "Vi phạm" ngắn. CHỈ THÊM CỘT — dòng cũ để NULL, đọc thì `tachTenMoTa` tự tách (không đổi dữ liệu). Chạy lặp được. */
const coCot = (conn: any, bang: string, cot: string) =>
  (conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).some((c) => c.name === cot);

export function migratePrLuiA1(conn: any, applied: string[]) {
  if (!coCot(conn, 'violations', 'ten')) {
    conn.exec('ALTER TABLE violations ADD COLUMN ten TEXT');
    applied.push('Vi phạm: thêm ô "Vi phạm" ngắn (dòng cũ tự tách khi đọc)');
  }
}
```
`migrate.ts`: import + gọi sau `migratePrMta` (`:271`) — xung đột với PR khác thì **giữ cả hai dòng**. `schema.sql` bảng `violations`: thêm `ten TEXT, -- PR-LUI-a: "Vi phạm" ngắn 3–60 ký tự; NULL ở dòng cũ (tachTenMoTa)` và sửa chú thích `description` → `-- "Mô tả", không bắt buộc ('' khi không có)`.

- [x] `npm run build:server` + phép kiểm xanh; commit `feat(lui-a1): ô Vi phạm ngắn + tách dữ liệu cũ khi đọc (chỉ thêm cột)`.

### Task a1-2: Máy chủ — ghi nhiều, sửa có `ten`

**Files:** `server/src/yThuc/violations.ts`, `server/src/routes/index.ts:1004-1025`, `server/src/tests/tocDoDuong.ts`, `prLuiA1.tests.ts`

**Interfaces:**
- `recordViolations(p, { studentIds: number[]; lines: DongViPhamVao[]; moTaRieng?: Record<string, string>; idempotencyKey: string }): { ok: { studentId: number; ids: number[] }[]; loi: { studentId: number; loi: string; ma: number }[] }`
- `DongViPhamVao = { category; skill?; occurredOn?; ten; moTa? }`
- `ViolationView` thêm `ten: string; moTa: string` (từ `tachTenMoTa`); `description` giữ (thô) cho nơi gọi cũ.

- [x] **Đỏ** (mỗi phép kiểm chạy trong `BEGIN IMMEDIATE … ROLLBACK` như `thu()` của `prLuiB.tests.ts`):
  - `LUIa1-4` GVBM dạy lớp ghi `studentIds` = 3 em lớp MB FT 101, một dòng `{ category:'homework', skill:'reading', ten:'Không nộp BTVN Reading' }`, `moTaRieng[em2] = 'Nộp nửa bài'` → 3 dòng `violations`, `ten` đúng, mô tả em2 = `Nộp nửa bài`, em khác `''`; mỗi em một dòng nhật ký `violation.record`; GVCN nhận **một** chuông mỗi em (dedup ngày).
  - `LUIa1-5` một em, 3 dòng khác môn / nhóm / ngày → 3 dòng, đúng từng trường; `studentIds.length > 1` **và** `lines.length > 1` → 400 `Chọn nhiều học viên thì ghi một vi phạm.` (Q1-A); `lines.length > 10` → 400; `studentIds.length > 8` → 400 (lô).
  - `LUIa1-6` gửi lại cùng `idempotencyKey` → không thêm dòng, trả lại đúng id; khoá đó gửi bởi người khác → 400 `KEY_TAKEN_MESSAGE`.
  - `LUIa1-7` một em ngoài phạm vi (lớp CP) lẫn trong lô → em đó vào `loi` (403), hai em kia vẫn lưu; dòng nội dung sai (ten 2 ký tự) → 400 **trước khi ghi gì** (không em nào được lưu).
  - `LUIa1-8` gọi cũ `recordViolation({ description: 'Đi muộn 15 phút' })` (không `ten`) vẫn chạy: `ten = 'Đi muộn 15 phút'`, `description = ''` — phép kiểm Ý thức cũ không phải sửa; `description` ngắn hơn 10 nay **được**; sửa (`editViolation`) gửi `ten` mới → một dòng `violation_history` field `ten`.
- [x] **Xanh** — `violations.ts`:
  - `checkTenMoTa(input: { ten?: unknown; description?: unknown })`: `moTa = chuTuDo(input.description, 'Mô tả vi phạm', 2000) ?? ''`; `ten` = `input.ten` (trim) hoặc, khi không gửi, `tachTenMoTa(null, moTa, '').ten`; `kiemTenViPham` lỗi → `badRequest(\`Vi phạm: ${loi}.\`)`; trả `{ ten, moTa: tenKhongGui && moTa === ten ? '' : moTa }`. Xoá `checkDescription` + nhánh ghép "Khác" (`ghepKhac` không còn dùng ở đây).
  - Tách thân `recordViolation` (`:223-259`) thành `ghiMotViPham(p, student, classId, dong, key)` (INSERT thêm cột `ten`, `description = moTa`). `recordViolation` giữ chữ ký cũ, gọi `ghiMotViPham` trong `tx` như cũ.
  - `recordViolations`: kiểm khuôn (`studentIds` nguyên dương, không trùng, 1–`LO_GHI_VI_PHAM`; `lines` 1–`VI_PHAM_TOI_DA_DONG`; nhiều em thì một dòng; `idempotencyKey` 8–80 ký tự) → kiểm **mọi dòng** (`checkCategory`, `checkTenMoTa`, `checkSkill`, `checkOccurredOn`) trước vòng lặp → mỗi em: `try { loadStudent; requireRecordViolation; activeClassOf; khoá phát lại; tx(() => lines.map((dong, i) => ghiMotViPham(..., moTaRieng[sid] ?? dong.moTa, \`${key}:${sid}:${i}\`))) }` → `ok` / `loi` (mã từ `e.status`). Môn tự điền (`skill` không gửi) như cũ, theo lớp của từng em.
  - `editViolation` nhận `ten` (đổi → lịch sử field `ten`), `description` là Mô tả (được rỗng); bỏ `ghiRoKhac`.
  - `shapeViolation`: `const tm = tachTenMoTa(r.ten, r.description, r.category); … ten: tm.ten, moTa: tm.moTa`.
- [x] Route `POST /violations/nhieu` (`maybeSimulateSaveFailure`, body `studentIds`, `lines`, `moTaRieng`, `idempotencyKey`); `/violations` và `PATCH` thêm `ten`, bỏ `ghiRoKhac`. Trần `tocDoDuong.ts` cho `/violations/nhieu` (lô 8 × 10 dòng).
- [x] Xanh; commit `feat(lui-a1): ghi vi phạm nhiều học viên / nhiều dòng một lần (lô 8, mỗi em một giao dịch)`.

### Task a1-3: Máy chủ — tệp dùng chung (`/attachments/chep`)

**Files:** `server/src/platform/attachments.ts`, `server/src/routes/index.ts:~907`, `tocDoDuong.ts`, `prLuiA1.tests.ts`

- [x] **Đỏ:**
  - `LUIa1-9` `addFile` vào vi phạm A → `chepTep(p, { tuId, ownerType:'violation', ownerIds:[B, C] })` → 3 dòng cùng `url`, cùng tên / cỡ; người không có quyền sửa C → 403 và **không** dòng nào thêm; `ownerIds` > 60 → 400; nguồn ngoài quyền xem → 403.
  - `LUIa1-10` xoá vi phạm A (`deleteViolation`) → tệp trong kho **còn** (B, C tải được); xoá B, C → kho xoá (kiểm bằng kho ổ đĩa của DB test: tệp biến mất). Gỡ một dòng tệp (`DELETE /attachments/:id`) cũng theo luật này.
- [x] **Xanh:**
```ts
/** PR-LUI-a1: một tệp cho nhiều bản ghi — thêm DÒNG trỏ cùng khoá kho (không tải lại). Kho chỉ xoá khi dòng cuối đi (`conDongKhac`). */
export function chepTep(p: Principal, input: { tuId: number; ownerType: string; ownerIds: number[] }): AttachmentRow[] {
  const src = db().prepare('SELECT * FROM attachments WHERE id = ?').get(input.tuId) as any;
  if (!src) throw notFound('Không tìm thấy tệp');
  ownerAccess(src.owner_type, src.owner_id).requireView(p);
  const ids = [...new Set(input.ownerIds)].filter((x) => Number.isInteger(x) && x > 0 && !(x === src.owner_id && input.ownerType === src.owner_type));
  if (!ids.length || ids.length > TOI_DA_EM_GHI_VI_PHAM) throw badRequest(`Chọn từ 1 đến ${TOI_DA_EM_GHI_VI_PHAM} bản ghi.`);
  for (const id of ids) ownerAccess(input.ownerType, id).requireEdit(p);
  return tx(() => ids.map((id) => insert(p, input.ownerType, id, {
    kind: src.kind, url: src.url, displayName: src.display_name, mimeType: src.mime_type, sizeBytes: src.size_bytes,
  })));
}
const conDongKhac = (url: string) => !!db().prepare("SELECT 1 FROM attachments WHERE kind = 'file' AND url = ? LIMIT 1").get(url);
```
  Trong `purgeAttachmentsOf` và hàm xoá một tệp: sau `DELETE FROM attachments WHERE id = ?`, chỉ đưa khoá vào danh sách xoá kho / gọi `kho.xoa` khi `!conDongKhac(r.url)`. `insert` đã ghi nhật ký `attachment.add` (kiểm; chưa có thì ghi `attachment.copy` một dòng cho cả lô).
- [x] Route `POST /attachments/chep` (body `tuId`, `ownerType`, `ownerIds`); trần `tocDoDuong.ts`.
- [x] Xanh; commit `feat(lui-a1): một tệp bằng chứng cho nhiều vi phạm (chép dòng, xoá kho khi dòng cuối đi)`.

### Task a1-4: Hiển thị — dòng chính là `Vi phạm`, mô tả khi mở

**Files:** `server/src/yThuc/board.ts:98`, `server/src/worklist/metrics.ts:186-192`, `web/src/modules/yThuc/{StudentYThucSection.tsx:99, ClassYThucCard.tsx:135,157, ChiTietViPham.tsx, XacNhanXuLyPanel.tsx:173-176, XemXuLyPanel.tsx:56, RecordViolationPanel.tsx (dòng trùng)}`, `web/src/modules/yThuc/kieu.ts`, `prLuiA1.tests.ts`

- [x] **Đỏ:** `LUIa1-11` `boardHocVien` (đường dữ liệu tab Ý thức HV) trả dòng vi phạm có `ten` = chữ ngắn, `moTa` riêng; vi phạm cũ (ten NULL, mô tả 90 ký tự) → `ten` ≤ 61 ký tự kết thúc `…`, `moTa` đủ 90; `metrics.ts` dòng phụ dùng `ten`.
- [x] **Xanh:** máy chủ trả `ten` + `moTa` (board: `moTa` cũ đổi tên `ten`, thêm `moTaChiTiet`); web: dòng chính = `ten`; `ChiTietViPham` hiện khối `Mô tả` (đoạn chữ, chỉ khi có) trên `Bằng chứng (n)`; hộp xử lý (`XacNhanXuLyPanel`, `XemXuLyPanel`) liệt kê `ten`. Grep thêm `\.description` ở `web/src/modules/{yThuc,students,classes}` và `server/src/{yThuc,phanTich,worklist}` cho vi phạm → đổi cho đủ; ghi danh sách vào commit.
- [x] Xanh; commit `feat(lui-a1): danh sách vi phạm hiện dòng Vi phạm, mô tả trong chi tiết`.

### Task a1-5: Web — `TepCho` + panel Ghi vi phạm mới (**chờ duyệt mockup mục 1–8**)

**Files:** `web/src/ui/TepCho.tsx` (mới), `web/src/modules/yThuc/RecordViolationPanel.tsx`, `web/src/modules/yThuc/panelYThuc.tsx:41-60`, `web/src/modules/classes/thaoTacDongHocVien.tsx:74`

**Interfaces:**
- `TepCho({ value, onChange, loi })` — `value: TepChoMuc[]` (`{ key, kind:'file', file } | { key, kind:'link', url, ten }`); kiểm đuôi / 4 MB ở máy người dùng (dùng `ATTACHMENT_EXTENSIONS`, `ATTACHMENT_MAX_BYTES` như `BangChung.tsx:61-67`); chọn tệp, kéo thả, dán ảnh (chép cách của `BangChung`); `✕` bỏ khỏi danh sách (chưa tải nên không hỏi).
- `taiTepCho(ds, { ownerType, ownerIds }): Promise<Record<number, string>>` — mỗi mục: tệp → `api.upload('/attachments/file', ownerIds[0])`, liên kết → `/attachments/link`; còn `ownerIds` khác → `POST /attachments/chep`; trả lỗi theo `key` (rỗng = xong).
- `RecordViolationPanel` giữ props cũ, thêm `chonNhieu?: boolean` (chỉ nơi gọi từ hồ sơ lớp truyền `true` kèm `students`).

- [x] **Đỏ** (phép kiểm miền, không DOM): `LUIa1-12` hàm thuần `dsLoiGhiViPham({ hocVien, dong })` (đặt trong `shared/domain/yThuc.ts`, web dùng cho `useLoiForm`) trả đúng `Chọn ít nhất một học viên` / `Chọn Nhóm` / `Ghi vi phạm` theo từng dòng, khoá ô `nhom-1`, `ten-2`…
- [x] **Xanh — panel** (một bước, theo mockup):
  1. Bỏ `daGhi`, `hoanTac`, `hoanTacTrongPanel`, bước "Đã ghi" (`:58-59, 124-155, 191-206`), `OKhac`, `ChonNgayGan` → `ONgay kieu="ngay" toiDa={homNay}`.
  2. State: `hocVien: number[]` (mặc định `[studentId]` khi có), `moTaRieng: Record<number,string>`, `dong: { key, ngay, mon, daChonMon, nhom, ten, moTa, moMoTa }[]` (một dòng mặc định), `tep: TepChoMuc[]`, `luu: { daXong: number[]; loi: Record<number,string>; tien?: [n, m] } | null`.
  3. Khối `Học viên` chỉ khi `chonNhieu`: ô bấm mở danh sách có ô tìm + `Cả lớp · n` + ô chọn; dưới ô, mỗi em một dòng `Tên · + Mô tả riêng · ✕`.
  4. Khối dòng: `Ngày` + `Môn` (`Hang2`, môn tự điền như YT-4 khi một em), `Nhóm` (5 `NutChon`), `Vi phạm` (`input maxLength={VI_PHAM_TEN_TOI_DA}`, `dem={{ co: ten.trim().length, can: VI_PHAM_TEN_TOI_DA }}` → hiện `22/60`), ô `Mô tả` (`textarea`, `tuyChon`) **mở sẵn** ngay dưới (chủ sản phẩm 06/10). Nhiều dòng: tiêu đề `Vi phạm 1`… + `Xoá dòng`. `+ Thêm vi phạm` chỉ khi `hocVien.length === 1` và < 10 dòng (chép `ngay` dòng trên).
  5. Cảnh báo trùng (V06) giữ cho **một** em, mỗi dòng hỏi `/violations/similar` theo nhóm + ngày của dòng đó.
  6. Khối `Bằng chứng · không bắt buộc` = `TepCho` (ghi mới) / `BangChung` (đang sửa — đã có id).
  7. Lưu: `lf.bam()`; lỗi → dừng. Một em + một dòng + không chọn nhiều → `POST /violations` (như cũ, thêm `ten`). Còn lại → `chiaLo(hocVien, LO_GHI_VI_PHAM)` gửi lần lượt `POST /violations/nhieu` (cùng `idempotencyKey` của lần mở form), nút `Đang lưu n/m…`. Có `loi` → ô nhập khoá, chân `Đã lưu n học viên · m học viên chưa lưu`, lỗi dưới tên em, nút `Thử lại m học viên` (chỉ gửi em còn lỗi). Xong hết → `taiTepCho(tep, { ownerType:'violation', ownerIds: mọi id vừa tạo })`; không lỗi → `invalidate(...)`, đóng, toast (`Đã ghi vi phạm cho …` / `Đã ghi 3 vi phạm cho …` / `Đã ghi vi phạm cho 3 học viên`); tệp lỗi → thân panel chỉ còn khối `Đã ghi` + `TepCho` với dòng lỗi + `Thử lại`, chân `Xong`.
  8. Sửa vi phạm: một em, một dòng, ô nạp từ `ten` / `moTa` (đã tách), PATCH gửi `ten` + `description`; chân trái `Xoá vi phạm` như cũ.
- [x] Nơi gọi: `panelYThuc.tsx` / `thaoTacDongHocVien.tsx` — mở từ hồ sơ lớp truyền `students` + `chonNhieu`; hồ sơ HV giữ một em.
- [x] Bấm thử ảnh thật (QL, GVCN, GVBM; 375/1440; sáng/tối): một em; ba em + mô tả riêng; một em ba dòng; lỗi ô; có tệp; lưu dở (giả lỗi: `maybeSimulateSaveFailure` hoặc một em ngoài phạm vi trên DB test); tệp lỗi (tệp > 4 MB đổi tên đuôi `.jpg` qua kiểm máy khách → dùng tệp thật 4,1 MB). Impeccable `layout`, `clarify`, `harden`, `adapt`.
- [x] Commit `feat(lui-a1): panel Ghi vi phạm — nhiều học viên / nhiều vi phạm, bằng chứng trong form, một nút Lưu`.

### Task a1-6: Sửa / Xoá lần xử lý Ý thức đã xác nhận (+ Xoá vi phạm giữ nguyên) (**mockup mục 16–17**)

**Files:** `server/src/yThuc/xuLy.ts` (sau `xoaNhap` `:448-461`; dùng `emCua`, `viPhamChon` `:55-64`, `MANAGE_MESSAGE`), `server/src/routes/index.ts`, `tocDoDuong.ts`, `web/src/modules/yThuc/XemXuLyPanel.tsx`, `web/src/modules/yThuc/panelYThuc.tsx`, `prLuiA1.tests.ts`

**Interfaces:** `suaViPhamXuLy(p, measureId, { violationIds: number[] }): XuLyView` · `xoaXuLy(p, measureId): { ok: true; bac: number }` · `XuLyView` thêm `coTheSua`, `coTheXoa`, `lanSau: string | null` (tên lần xử lý sau, nếu có).

- [x] **Xoá vi phạm (mục 5, Q4):** không đổi. `DeleteViolationConfirm.tsx` giữ chữ; `LUIa1-10` đã bảo vệ tệp dùng chung.
- [x] **Đỏ:**
  - `LUIa1-13` em có 3 vi phạm → `xacNhanXuLy` Report 1 với 2 vi phạm → `suaViPhamXuLy(QL, m, [v1, v3])` → `measure_violations` = {v1, v3}; `violation_history` field `measure` cho v2 (bỏ) và v3 (thêm) (`noteMeasureChange`); v2 về chưa xử lý; nhật ký `discipline.edit` (trước / sau). Vi phạm của em khác / đã nằm trong lần xử lý khác → 400; danh sách rỗng → 400 `Còn ít nhất 1 vi phạm`.
  - `LUIa1-14` Report 1 rồi Report 2 → `xoaXuLy(QL, report2)` → dòng, liên kết vi phạm, tệp (kho theo luật dùng chung) biến mất; `yThucHocVien` bậc = Report 1, `keTiep` = Report 2 (bậc không lưu sẵn — `bacHienTai` `trangThai.ts:167` tự tính); nhật ký `discipline.delete` có `before` đủ (kind, note, ngày, người, vi phạm, tệp, đã báo QL); thẻ `y_thuc` của lần đó (nếu còn) đóng `tu_dong` `Lần xử lý đã xoá`. Xoá Report 1 khi còn Report 2 → 400 `Đã có Report 2 sau lần này — xoá Report 2 trước.`
  - `LUIa1-15` quyền: GVBM → 403; GVCN lớp em: lần `done` → 403 (Q5-A), lần `cho_duyet` / `da_duyet` → được; QL ngoài phạm vi → 403. Lần `nhap` vẫn đi `xoaNhap` như cũ.
- [x] **Xanh — máy chủ:**
  - Quyền `quyenSuaXuLy(p, m)`: `can(p, PERMISSIONS.REQUEST_APPROVE, { studentId })` (QL / QT, cùng cổng `suaKhaiBac` `:199`) **hoặc** (`m.status ∈ {cho_duyet, da_duyet}` và `canManageDiscipline(p, m.student_id)`). Đổi khi Q5 trả lời khác.
  - `suaViPhamXuLy`: trong `tx` — kiểm từng id (của em, chưa nằm trong lần xử lý khác `done` / `cho_duyet` / `da_duyet`), ≥ 1; xoá / thêm `measure_violations` theo chênh lệch + `noteMeasureChange`; `chotHanXuLy([sid])`; nhật ký.
  - `xoaXuLy`: lần mới nhất của chuỗi = không có lần xử lý nào khác của em (cùng chuỗi, `status != 'nhap'`) có `id` lớn hơn; sai → 400 nêu tên lần sau. Trong `tx`: chụp `before`, `purgeAttachmentsOf('discipline_measure', id, p.userId, khoaTep)`, `DELETE measure_violations`, `DELETE discipline_measures`, `chotYeuCau(conn, { loai: 'y_thuc', doiTuongLoai: 'discipline_measure', doiTuongId: id }, 'tu_dong', { lyDo: 'Lần xử lý đã xoá' })`, `chotHanXuLy`; sau `tx` `xoaTepSauGiaoDich(khoaTep)`. Trả bậc mới. Báo PH đã gửi **giữ nguyên** (`phoiHop.ts` không trỏ lần xử lý).
  - Route `PATCH /discipline-measures/:id/vi-pham`, `DELETE /discipline-measures/:id` (cạnh route `xoaNhap` — grep `xoaNhap` trong `routes/index.ts`); trần `tocDoDuong.ts`.
- [x] **Xanh — web** (`XemXuLyPanel.tsx`): khối `Vi phạm · n` có nút `Sửa vi phạm` khi `coTheSua` → danh sách ô chọn (vi phạm đang gắn + vi phạm chưa xử lý của em, dòng chính = `ten`) → chân `Lưu`; chân trái `Xoá lần xử lý` (`btn-danger`) khi `coTheXoa` → hộp hỏi một dòng (mẫu `DeleteViolationConfirm`: `KhungPanel longTrong z-[60]`, tiêu đề `Xoá lần xử lý này?`, dòng `Report 2 · 2 vi phạm · bậc về Report 1`) → toast `Đã xoá Report 2`, đóng panel, làm mới thang.
- [x] Xanh; commit `feat(lui-a1): sửa vi phạm của lần xử lý, xoá lần xử lý mới nhất (bậc tính lại)`.

### Task a1-7: Kiểm cuối, bấm thử, audit, PR

> Ghi chú làm: ghi mới dùng `POST /violations` khi 1 em × 1 dòng, còn lại `/violations/nhieu` (đúng kế hoạch). Route ghi không vào `tocDoDuong.ts` (danh sách đó chỉ đo trang GET). Mô tả riêng chỉ hiện khi 2–8 em.

- [x] `git fetch origin && git merge origin/main`; xung đột `routes/index.ts`, `run.ts`, `migrate.ts`, `schema.sql`, `CODE_MAP.md`, `plan.md` mục 11: **giữ cả hai**. `npm run check` MỘT LẦN, foreground.
- [x] Bấm thử ảnh thật mọi mục mockup 1–9, 16–17 (375/1440, sáng/tối, QL · Quản trị · GVCN · GVBM): GVBM chỉ chọn được em lớp mình dạy (máy chủ 403 em khác); dòng `Vi phạm` dài 60 ký tự không tràn ở 375; vi phạm cũ (seed) hiện dòng cắt `…`, mở ra có mô tả đủ.
- [x] `/impeccable audit`; `/ponytail-review`; liệt kê `ponytail:` (dự kiến: chuông GVCN mỗi em một cái khi ghi nhiều em; tệp chép chung khoá kho).
- [x] `superpowers:verification-before-completion` → `requesting-code-review` (người rà Opus 5.5 session khác) → `finishing-a-development-branch`: PR **vào `main`**, KHÔNG merge. Mô tả PR: mục 1–5 + Sửa / Xoá lần xử lý · file · phép kiểm `LUIa1-*` · ảnh · chú thích `ponytail:` · "PR-HK2 bỏ toast Hoàn tác vi phạm".
- [x] `[x]` a1 ở file này; một dòng mục 11 `plan.md`; `CODE_MAP.md` thêm `ui/TepCho.tsx`, `migrate/prLuiA1.ts`.

---

# PHẦN a2 · Case + Chờ duyệt

### Task a2-0: Mockup + đối chiếu

- [x] Mockup mục 10–15 (bản 1 duyệt 06/10) + 18–19 (bản 2, chờ duyệt cùng Q6).
- [ ] Chủ sản phẩm duyệt. Chưa duyệt → chỉ làm phần máy chủ (a2-1 máy chủ, a2-3, a2-4, a2-5 máy chủ).
- [ ] Đối chiếu (ghi vào commit đầu): (1) giá trị `case_interventions` của PA cần duyệt **lúc tạo** (`status`, `cycle_started_on`, `started_date`, `action_due`) — đọc `recordIntervention` nhánh `needs_approval`; (2) `MILESTONE_KINDS` có `'reopened'` chưa (PR-BV Task 3 có thể đã thêm), bảng `case_milestones.kind` có CHECK không; (3) Case báo tay (`origin_kind='teacher_report'`) có `dedup_key` không (`cases.ts:381`); (4) nơi vẽ hàng nút của Case `done` trong `CasePanel.tsx` / `NganCase.tsx`; (5) `ChonNguoi nhom="nhan_vien"` trả cả QL / nhân viên chi nhánh. Lệch lớn → **dừng, báo planning**.

### Task a2-1: Ghi kết quả PA — Người phụ trách, gộp ô, nút không cắt

**Files:** `server/src/migrate/prLuiA2.ts` (mới), `migrate.ts`, `schema.sql`, `server/src/cases/cases.ts`, `server/src/routes/index.ts:1673-1676`, `shared/domain/sosV4.ts:20`, `web/src/modules/cases/CapNhatTuan.tsx`, `web/src/modules/cases/CasePanel.tsx:405`, `prLuiA2.tests.ts` (mới), `run.ts`

- [ ] **Đỏ** (`prLuiA2.tests.ts`, khung như a1):
  - `LUIa2-1` `updateResult(p, pa, { ..., phuTrach: { performerUserId: gvLeHa } }, { batBuocPhuTrach: true })` → dòng `case_followups` có `phu_trach_user_id`; `phuTrach: { performerName: 'Tutor Minh' }` → `phu_trach_ten`; không gửi + `batBuocPhuTrach` → 400 `Ghi Người phụ trách.`; không gửi, không cờ (seed / phép kiểm cũ) → vẫn lưu, cột NULL. Tài khoản đã nghỉ → 400 (luật `chuanHoaNguoiThucHien`).
  - `LUIa2-2` `caseDetail` / dòng lịch sử kết quả trả `phuTrach: 'Lê Hà'`; `remainingIssue` 301 ký tự → 400 `Vấn đề còn tồn / Ghi chú tối đa 300 ký tự.`
  - `LUIa2-3` migrate `prLuiA2` lần hai không báo gì.
- [ ] **Xanh — máy chủ:** `migratePrLuiA2` thêm hai cột (mẫu a1). `updateResult(p, id, input, opts: { batBuocPhuTrach?: boolean } = {})`: trước `tx`, `const pt = chuanHoaNguoiThucHien(p, input.phuTrach ?? {}, { nhom: 'nhan_vien', batBuoc: false }); if (!pt && opts.batBuocPhuTrach) throw badRequest('Ghi Người phụ trách.');` → INSERT thêm `phu_trach_user_id, phu_trach_ten`. Đọc (`:1499`, `:2558`): `LEFT JOIN users` → `phuTrach: tên tài khoản ?? phu_trach_ten ?? null`. Câu lỗi 300 ký tự đổi chữ. Route truyền `{ batBuocPhuTrach: true }`. `GOI_Y_KET_QUA_PA` = `'Đã cải thiện ở phần nào, như thế nào, kết quả cụ thể'`.
- [ ] **Xanh — web `CapNhatTuan.tsx`:**
  - State `phuTrach: NguoiChon | null` = `nguoiBanDau(pa)`; luật `{ khoa: 'phu-trach', nhan: 'Người phụ trách', chon: true }` (lỗi dưới ô `Chọn Người phụ trách`); `<Truong nhan="Người phụ trách" batBuoc as="div" loi=…><ChonNguoi nhom="nhan_vien" value={phuTrach} onChange={setPhuTrach} /></Truong>` ngay dưới `Tiến triển`; body thêm `phuTrach: nguoiThanhPayload(phuTrach)`.
  - `Vấn đề còn tồn` → nhãn `Vấn đề còn tồn / Ghi chú`, `tuyChon`; xoá khối `3 · Ghi chú` (`:356-362`); `decisionNote` chỉ gửi khi có ô lý do thật (adjust / replace / ask_manager / lần cuối "Chưa đủ dữ liệu").
  - Nút kết quả (`:273-280`): `className="grid grid-cols-2 gap-2"` (bỏ `sm:grid-cols-4`), `NutChon … className="justify-center text-sm"` (bỏ `whitespace-nowrap px-1.5 text-xs`), chữ = `outcomeLabelFor(o)` (bỏ `OUTCOME_MARK`).
  - `CasePanel.tsx:405`: `Còn tồn / Ghi chú: …`; thêm `Phụ trách: …` khi có.
- [ ] Bấm thử: ảnh panel 1440 + 375, sáng/tối — bốn nút không cắt, không lệch, chữ một dòng ở 1440; danh sách gợi ý người mở đúng dưới ô; lỗi khi xoá trắng người.
- [ ] Xanh; commit `feat(lui-a2): Ghi kết quả PA — Người phụ trách, gộp Vấn đề còn tồn / Ghi chú, nút kết quả không cắt`.

### Task a2-2: Tạo Case có bằng chứng (**sau khi a1 merge**)

**Files:** `web/src/modules/cases/QuickReport.tsx`, `server/src/platform/attachments.ts` (`caseOwner`), `prLuiA2.tests.ts`

- [ ] `git merge origin/main` (lấy `TepCho`, `/attachments/chep`).
- [ ] **Đỏ:** `LUIa2-4` GVCN tạo Case môn mình không dạy (`reportIssue`) → `addFile` vào Case đó **được** (người tạo); GV khác không dạy môn, không phải người tạo → 403 như cũ.
- [ ] **Xanh — máy chủ:** `caseOwner(caseId).requireEdit`: `if (c.reported_by === p.userId) return;` trước `a.requireEdit` (đọc `reported_by` qua `loadCase`).
- [ ] **Xanh — web:** thay khối chữ `:548-553` bằng `<Khoi tieuDe="Bằng chứng · không bắt buộc"><TepCho …/></Khoi>` (cả hai tab "Đang gặp vấn đề" / "Đã xong từ trước"). Sau `send` / `sendBackfill` thành công: `const loi = await taiTepCho(tep, { ownerType: 'sos_case', ownerIds: [res.id] })`; không lỗi → `reset(); onClose(); onDone?.(res.id)`, toast `Đã lưu Case «…»` (`hanhDong: { nhan: 'Thêm PA', onBam: () => onMoCase(res.id, 'them-pa') }` khi `viecTiep.chu === CHU_THEM_PA && canEdit`); có lỗi → giữ bước `daLuu` (`:296-321`) nhưng khối Bằng chứng = `TepCho` với dòng lỗi + `Thử lại` rồi `BangChung` hiện tệp đã tải. Gộp vào Case đang có: tệp gắn Case đó; 403 hiện ở dòng tệp.
- [ ] Bấm thử (GVBM, GVCN môn không dạy, QL): tạo Case có 2 tệp + 1 liên kết → mở Case thấy đủ; toast `Thêm PA` mở đúng Ngăn Case.
- [ ] Commit `feat(lui-a2): Tạo Case có bằng chứng ngay trong form, Lưu một lần`.

### Task a2-3: Mở lại Case đã hoàn thành

**Files:** `server/src/cases/cases.ts`, `shared/domain/cases.ts` (`MILESTONE_KINDS`), `server/src/routes/index.ts`, `tocDoDuong.ts`, `web/src/modules/cases/CasePanel.tsx` (+ `NganCase.tsx` nếu nút ở đó), `web/src/modules/cases/ThaoTacCase.tsx:218`, `prLuiA2.tests.ts`

- [ ] **Đỏ:**
  - `LUIa2-5` Case Listening có PA đã khép → `closeCaseOutcome` → `moLaiCase(QL)` → `status` = `in_progress` (có PA) / `open` (không PA), `outcome*`, `closed_*`, `dismiss_reason_*` = NULL, `dedup_key` vẫn của nó; PA giữ `completed`/`cancelled`; `sos_case_history` `done → in_progress`; mốc `reopened`; Hành trình `Mở lại Case`; nhật ký `case.reopen` có `before` = kết luận cũ; `closeBlockers` lại cho Hoàn thành (vòng đóng–mở–đóng chạy).
  - `LUIa2-6` GVCN / GVBM → 403; Case chưa `done` → 400 `Case này chưa hoàn thành.`; Case đã nhả khoá cho Case mới (`upsertCategoryCase` tạo Case nối) → 400 `Đã có Case Listening mới — mở Case đó.`; Case "Không cần theo dõi" (đóng qua `apDungKhongTheoDoi`) mở lại được.
  - `LUIa2-7` `caseDetail(QL).viewer.coTheMoLai === true` khi `done` và mở được; GV `false`.
- [ ] **Xanh:**
```ts
/** MỞ LẠI CASE ĐÃ HOÀN THÀNH (PR-LUI-a, chủ sản phẩm 06/10) — chỉ QL/QT, một bấm. Kết luận cũ ở lại trong mốc `closed` + nhật ký; PA đã khép không sống lại. */
export function moLaiCase(p: Principal, caseId: number) {
  const conn = db();
  const c = loadCase(caseId);
  require_(p, PERMISSIONS.CASE_APPROVE, { classId: c.class_id, studentId: c.eff_student_id }, 'Chỉ Quản lý mở lại được Case.');
  if (c.status !== 'done') throw badRequest('Case này chưa hoàn thành.');
  const key = caseDedupKey({ category: c.category, studentId: c.eff_student_id, cycleId: c.eff_cycle_id });
  const giu = key ? conn.prepare('SELECT id FROM sos_cases WHERE dedup_key = ?').get(key) as any : null;
  if (giu && giu.id !== caseId) throw badRequest(`Đã có Case ${caseTopicLabel(c.topic)} mới — mở Case đó.`);
  const coPa = !!conn.prepare('SELECT 1 FROM case_interventions WHERE case_id = ? LIMIT 1').get(caseId);
  const moi = coPa ? 'in_progress' : 'open';
  return tx(() => {
    conn.prepare(`UPDATE sos_cases SET status = ?, outcome = NULL, outcome_note = NULL, outcome_decision = NULL, outcome_by = NULL, outcome_at = NULL,
                   closed_by = NULL, closed_at = NULL, dismiss_reason_code = NULL, dismiss_reason_text = NULL, dedup_key = COALESCE(dedup_key, ?), updated_at = ?
                  WHERE id = ?`).run(moi, key, nowIso(), caseId);
    // sos_case_history (status done → moi) · case_milestones kind 'reopened' (dedup `reopen:${caseId}:${nowIso()}`) · addJourney 'case_reopened' 'Mở lại Case'
    // writeAudit 'case.reopen' before { outcome, outcomeNote, closedAt, closedBy, dismissReason } after { status: moi }
    return caseDetail(p, caseId);
  });
}
```
  (Tên cột thật theo `schema.sql` — kiểm ở a2-0; `caseDedupKey` trả null cho Case không khoá → chỉ chặn khi có khoá.) `caseDetail.viewer.coTheMoLai = c.status === 'done' && can(p, CASE_APPROVE, ctx) && !(giu && giu.id !== c.id)`. Route `POST /cases/:id/mo-lai`; trần.
- [ ] **Web:** Case `done`: nút `Mở lại` (`btn btn-sm`) cạnh nhãn `Đã hoàn thành` khi `viewer.coTheMoLai`; bấm → `POST`, `invalidate('/cases','/my-work','/students')`, toast `Đã mở lại Case`; lỗi → toast lỗi. `ThaoTacCase.tsx:218` `luat=` → `Đóng nhầm thì Quản lý mở lại được. MT sau trượt lại thì có Case mới nối Case này.`
- [ ] Xanh; commit `feat(lui-a2): Mở lại Case đã hoàn thành (QL/QT) + sửa chữ ⓘ Hoàn thành Case`.

### Task a2-4: Chờ duyệt — Từ chối nhiều

**Files:** `server/src/duyet/yeuCau.ts:445-468`, `server/src/routes/index.ts:~1644`, `tocDoDuong.ts`, `shared/domain/yeuCauDuyet.ts:124`, `web/src/modules/duyet/HopChoDuyet.tsx:100-221`, `prLuiA2.tests.ts`

- [ ] **Đỏ:** `LUIa2-8` 3 thẻ Đề xuất PA chờ → `tuChoiNhieu(QL, ids, 'Chưa đủ căn cứ')` → 3 thẻ `tu_choi` cùng lý do, 3 PA `cancelled` + `approval_state='declined'`; lý do trống → 400 trước khi đụng thẻ nào; trộn hai loại → 400; một thẻ đã xử lý → vào `loi`, hai thẻ kia vẫn xong; GV → 403; > 50 → 400. `tomTatKetQuaHangLoat('tu-choi', 3, [])` = `Đã từ chối 3/3`.
- [ ] **Xanh:** tách thân `duyetNhieu` thành `lamNhieu(p, ids, lam: (id) => void, nhan: 'duyệt' | 'từ chối')` (kiểm quyền, khuôn, cùng loại `hangLoat`, vòng lặp, `ok`/`loi`); `duyetNhieu = lamNhieu(…, (id) => duyetYeuCau(p, id))`; `tuChoiNhieu(p, ids, lyDo)` kiểm `lyDo` (`chuTuDo`, không rỗng) **trước**, rồi `lamNhieu(…, (id) => tuChoiYeuCau(p, id, lyDo))`. Route `POST /yeu-cau/tu-choi-nhieu`. `tomTatKetQuaHangLoat` nhận `'tu-choi'`.
- [ ] **Web** thanh chọn (`:203-221`): thêm nút `Từ chối {n}…` (trước `Duyệt n yêu cầu`); bấm → thanh mở thêm một hàng: ô `Lý do từ chối (người gửi sẽ đọc) *` + `Đóng` + `Gửi từ chối {n}` (lỗi trống `Chưa điền`); gửi → `baoKetQua('tu-choi', …)`, bỏ chọn, làm mới.
- [ ] Xanh; commit `feat(lui-a2): Chờ duyệt — Từ chối nhiều thẻ một lần (một lý do)`.

### Task a2-5: Chờ duyệt — Huỷ quyết định trong ngày

**Files:** `server/src/duyet/yeuCau.ts`, `server/src/duyet/loaiYeuCau.ts:71-90, 121-147`, `server/src/cases/cases.ts` (cạnh `respondToPlan`), `server/src/routes/index.ts`, `tocDoDuong.ts`, `web/src/modules/duyet/TheYeuCau.tsx`, `prLuiA2.tests.ts`

- [ ] **Đỏ:**
  - `LUIa2-9` Đề xuất PA: chụp dòng `case_interventions` (bỏ `updated_at`) trước khi duyệt → `duyetYeuCau` → `huyQuyetDinh(QL, id)` → thẻ `cho` (`nguoi_duyet`, `xu_ly_luc`, `ly_do_tu_choi`, `tra_loi` NULL, `tu_duyet = 0`), dòng PA **bằng đúng** ảnh chụp; Hành trình `Quản lý huỷ quyết định PA`; nhật ký `request.undo`; người gửi nhận chuông `Quản lý huỷ quyết định · Đề xuất PA · chờ duyệt lại`. Cùng phép với **từ chối** rồi huỷ.
  - `LUIa2-10` chặn: PA đã có `case_followups` → 400 `PA đã có kết quả — không huỷ quyết định được.`; quyết hôm qua (đặt `xu_ly_luc` lùi một ngày) → 400 `Chỉ huỷ được quyết định trong ngày.`; thẻ `lich_thi` → 400 `Loại yêu cầu này không huỷ quyết định được.`; Case đã đóng → 400; GV → 403; thẻ `cho` → 400.
  - `LUIa2-11` danh sách `xem=da-xu-ly`: thẻ Đề xuất PA quyết hôm nay có `coTheHuy: true`; thẻ cũ / loại khác `false`.
- [ ] **Xanh:** `DinhNghiaLoai.khiHuy?: (p, yc) => void` (ném nếu không đảo sạch). `de_xuat_pa.khiHuy = (p, yc) => huyQuyetDinhPa(p, yc.doi_tuong_id)`. `huyQuyetDinhPa` (`cases.ts`): đọc PA + Case như `respondToPlan`; kiểm `approval_state ∈ {approved, declined}`, không followup, Case chưa `done`; UPDATE về đúng giá trị lúc tạo (a2-0 mục 1): `approval_state='pending'`, `approval_by/at/note = NULL`, `status`, `cycle_started_on`, `started_date`, `action_due` = giá trị lúc tạo; `addJourney` `plan_approval_undone`. `huyQuyetDinh(p, id)` (`yeuCau.ts`): kiểm quyền theo thẻ (`P_DUYET`, `ctxThe`), trong `tx`: thẻ `duyet|tu_choi`, `xu_ly_luc` cùng ngày nghiệp vụ (`mocNghiepVu`), có `khiHuy` → gọi → UPDATE thẻ về `cho` (`WHERE id = ? AND trang_thai = ?`) → `writeAudit('request.undo', before)` → `notify` người xin (khác người huỷ). Cờ `coTheHuy` trong hàm liệt kê. Route `POST /yeu-cau/:id/huy-quyet-dinh`.
- [ ] **Web** `TheYeuCau.tsx`: thẻ đã xử lý (cột phải, dưới `NhanTrangThai`) có `coTheHuy` → nút `Huỷ quyết định` (`btn btn-sm`); bấm → `POST`, `onXong(id)`, toast `Đã huỷ quyết định · thẻ về Chờ duyệt`; lỗi → `loiMay` dưới thẻ.
- [ ] Xanh; commit `feat(lui-a2): Chờ duyệt — Huỷ quyết định Đề xuất PA bấm nhầm trong ngày`.

### Task a2-6: Sửa / Xoá Case + nhật ký hạn theo dõi (**mockup mục 18–19**)

**Files:** `server/src/cases/cases.ts` (cạnh `setFollowUntil` `:257-266`, `caseDetail` viewer), `server/src/cases/sosAuto.ts:185-215` (`xacNhanCase` — chỉ tách hàm kiểm, không đổi luật), `server/src/routes/index.ts`, `tocDoDuong.ts`, `web/src/modules/students/NganCase.tsx` / `web/src/modules/cases/CasePanel.tsx` (nút `Sửa` đầu Ngăn Case), `web/src/modules/cases/ThaoTacCase.tsx` (thêm `SuaCasePanel` cạnh các panel thao tác Case), `prLuiA2.tests.ts`

**Interfaces:** `suaCase(p, caseId, { title?, summary?, urgency?, topic?, primaryCode?, observation? })` · `xoaCase(p, caseId): { ok: true }` · `caseDetail.viewer` thêm `coTheSua`, `coTheXoa`, `khoaKyNang`.

- [ ] **Đối chiếu trước (ghi vào commit):** 12 bảng `REFERENCES sos_cases` (`schema.sql:869, 984, 1006, 1134, 1198, 1224, 1301, 1318, 1337, 1430, 1463, 1529`) + `attachments` (`sos_case`, `case_intervention`), `journey_events` (`ref_table='sos_cases'`), `yeu_cau_duyet` (đối tượng Case / PA) — bảng nào xoá theo, bảng nào chỉ gỡ khoá (vd `previous_case_id` → NULL).
- [ ] **Đỏ:**
  - `LUIa2-12` `suaCase(GVBM đúng môn, …)` đổi tên / mô tả / mức / nhóm nguyên nhân trên Case **đã xác nhận** → lưu (luật như `xacNhanCase`: tên 3–80, mô tả 15–2000, nhóm thuộc bộ của kỹ năng, Khác cần ghi rõ); mỗi ô đổi một dòng `sos_case_history` + nhật ký `case.edit`; không đổi gì → không ghi. Người tạo (`reported_by`), GVCN lớp em, QL được; GV khác → 403. Case `done` → 400 `Case đã hoàn thành — Mở lại trước khi sửa.`
  - `LUIa2-13` đổi kỹ năng: Case chưa có PA → đổi `topic`/`category`, khoá chống trùng đổi theo; có PA → 400 `Case đã có PA — không đổi kỹ năng.`; đã có Case khác cùng kỹ năng mới đang mở → 400 `Đã có Case Reading đang mở.`
  - `LUIa2-14` `xoaCase(QL)` Case báo tay có 1 PA `planned` → mọi bảng ở bước đối chiếu không còn dòng trỏ Case / PA đó (phép kiểm quét đủ 12 bảng + `attachments` + `yeu_cau_duyet` chờ); thẻ Chờ duyệt của PA đóng `tu_dong`; nhật ký `case.delete` chụp Case + PA. Chặn: GVCN / GVBM → 403; Case `mock` → 400 `Case từ kết quả Test — dùng "Không cần theo dõi".`; còn PA có kết quả → 400 `Case còn PA có kết quả — xoá các PA trước.` (Q6); xoá hết PA đó (`xoaPa`) rồi xoá Case → được
  - `LUIa2-16` **Xoá PA** `xoaPa(QL, ivId)` PA có 2 kết quả tuần → xoá PA, `case_followups`, `case_intervention_revisions`, tệp, thẻ Chờ duyệt của PA (`tu_dong`); nhật ký `intervention.delete` chụp PA + mọi kết quả; Case còn PA khác → giữ trạng thái; hết PA → Case về `open` ("chưa có PA"). Số "PA cần cập nhật" (`mywork`, Việc cần làm) giảm đúng 1; Phân tích GV "PA hiệu quả" / "Ghi kết quả PA đúng hạn" tính lại không còn PA đó (đọc thẳng bảng, không số lưu sẵn — kiểm bằng hàm Phân tích trước / sau). GV → 403; PA đang chờ QL duyệt → xoá được (thẻ đóng).
  - `LUIa2-15` `setFollowUntil` đổi ngày → nhật ký `case.follow_until` (trước / sau); cùng ngày → không ghi.
- [ ] **Xanh:** `suaCase` dùng lại phần kiểm của `xacNhanCase` (tách hàm thuần `kiemNoiDungCase` khỏi `sosAuto.ts:197-215`, **không đổi hành vi**; phép kiểm Xác nhận Case cũ phải xanh nguyên). Quyền: `caseAccess(id).requireEdit` **hoặc** `c.reported_by === p.userId` **hoặc** GVCN lớp em. `xoaCase`: `require_(p, PERMISSIONS.CASE_APPROVE, ctx)`; kiểm `origin_kind`, `case_followups`; một `tx` xoá con → cha theo danh sách đối chiếu, `purgeAttachmentsOf` cho Case + từng PA, `chotYeuCau … 'tu_dong' { lyDo: 'Case đã xoá' }`; `xoaTepSauGiaoDich` sau `tx`. `setFollowUntil`: thêm `writeAudit({ action: 'case.follow_until', before, after })` khi đổi.
- [ ] **Xanh — Xoá PA:** `xoaPa(p, ivId)` trong `cases.ts` (`require_(p, PERMISSIONS.CASE_APPROVE, ctx)`), một `tx` xoá con → cha, `dongBoTrangThaiCase(caseId)`; route `DELETE /interventions/:id`; menu ⋯ của thẻ PA (QL / QT) có `Xoá PA` → hỏi một dòng `Xoá PA này?` · `Học kèm 1-1 với Tutor · 2 kết quả tuần sẽ xoá` · nút `Xoá PA` · toast `Đã xoá PA`.
- [ ] **Web:** đầu Ngăn Case (Case chưa đóng, `viewer.coTheSua`): nút `Sửa` → `SuaCasePanel` (ô như mockup mục 18; kỹ năng khoá khi `khoaKyNang`); chân trái `Xoá Case` khi `viewer.coTheXoa` → hộp hỏi một dòng (mẫu `DeleteViolationConfirm`) → toast `Đã xoá Case`, đóng Ngăn Case, làm mới danh sách.
- [ ] Xanh; commit `feat(lui-a2): Sửa Case, Xoá Case báo tay tạo nhầm (QL/QT), nhật ký hạn theo dõi`.

### Task a2-7: Kiểm cuối, bấm thử, audit, PR

- [ ] Như a1-7 (cổng 4420/5420). Bấm thử mockup mục 10–15, 18–19; vai: QL (Mở lại, Từ chối nhiều, Huỷ quyết định), Quản trị, GVCN (không có Mở lại / Huỷ quyết định), GVBM (Ghi kết quả PA có Người phụ trách).
- [ ] `/impeccable audit`, `/ponytail-review`; mô tả PR: mục 6–9 + Sửa / Xoá Case · phép kiểm `LUIa2-*` · ảnh · chú thích `ponytail:` (dự kiến: Huỷ quyết định chỉ Đề xuất PA; Mở lại không lý do).
- [ ] `[x]` a2; một dòng mục 11 `plan.md`; `CODE_MAP.md` thêm `migrate/prLuiA2.ts`.

---

## Rủi ro và cách chặn (mỗi đề xuất)

| Mục | Rủi ro | Cách chặn |
|---|---|---|
| 1 Ghi nhiều em | Chọn nhầm cả lớp → 24 vi phạm sai | Ngữ cảnh đầu panel `24 học viên · MB FT 101` + toast nói số học viên; Sửa / Xoá từng vi phạm như cũ; GVCN thấy chuông từng em |
| 1 Lưu theo lô | Mạng rớt giữa lô → một nửa lớp có vi phạm | Mỗi em một giao dịch; lô lỗi nói rõ em nào chưa lưu; `Thử lại` cùng khoá → không trùng; ô khoá sau khi lưu một phần |
| 2 Nhiều dòng | Ngày / môn sai ở dòng thêm | Dòng mới chép ngày dòng trên, môn để `Chưa chọn`; cảnh báo trùng mỗi dòng |
| 3 Ô Vi phạm 60 ký tự | GV nhét hết vào ô ngắn, mô tả trống | Đếm `n/60`, ô không cho gõ quá; Mô tả mở bằng một bấm |
| 3 Dữ liệu cũ | Câu cắt `…` đọc dở | Mở dòng thấy mô tả đủ; sửa lại thì lưu `Vi phạm` thật |
| 4 Một bước | Tệp lỗi sau khi đã lưu | Panel ở lại đúng dòng tệp lỗi + `Thử lại`; vi phạm không gửi lại |
| 4 Tệp dùng chung | Xoá một vi phạm làm mất tệp của vi phạm khác | Kho chỉ xoá khi dòng cuối đi (`LUIa1-10`) |
| 5 Xoá cứng | Xoá nhầm mất tệp | Hộp hỏi một dòng (có sẵn); nhật ký giữ nội dung; ghi lại mất một phút |
| 6 Bỏ bước Đã lưu | Mất lối tắt Thêm PA | Toast có nút `Thêm PA`; Ngăn Case luôn có `Thêm PA` |
| 7 Người phụ trách bắt buộc | Thêm một ô phải điền | Điền sẵn người thực hiện PA — thường chỉ cần bấm Lưu |
| 8 Mở lại một bấm | Bấm nhầm → Case hiện lại ở danh sách việc | Chỉ QL/QT; mốc + nhật ký giữ kết luận cũ; đóng lại bằng Hoàn thành Case |
| 9 Từ chối nhiều | Từ chối nhầm cả lô | Cùng một loại, ô lý do bắt buộc; Đề xuất PA huỷ quyết định được trong ngày |
| Sửa lần xử lý | Bỏ nhầm vi phạm → vi phạm về "chưa xử lý", có thể đẩy em vào luật ≥ 3 | Lịch sử từng vi phạm + nhật ký; thêm lại được ngay |
| Xoá lần xử lý | Lần sau đã dựa trên lần này; đã báo PH / QL | Chỉ xoá lần mới nhất; bậc tự tính lại; nhật ký giữ nội dung + cờ đã báo; Báo PH đã gửi giữ nguyên; GVCN không xoá lần đã thực hiện |
| Sửa Case | Đổi kỹ năng làm lệch PA / khoá trùng | Có PA thì khoá ô kỹ năng; trùng Case đang mở thì chặn |
| Xoá PA | Mất kết quả tuần thật; số Phân tích GV đổi | Chỉ QL / QT, hỏi một dòng nêu số kết quả sẽ xoá; nhật ký chụp đủ; số tính lại từ bảng (LUIa2-16) |
| Xoá Case | Mất lịch sử hỗ trợ thật; Case máy tạo lại | Chỉ Case báo tay, chưa PA nào có kết quả, chỉ QL/QT; nhật ký chụp Case + PA; Case từ Test dùng "Không cần theo dõi" |
| 9 Huỷ quyết định | GV đã bắt đầu làm PA sau khi duyệt | Chặn khi PA có kết quả; chuông báo người gửi |

## Phép kiểm → yêu cầu

| Yêu cầu | Task | Phép kiểm |
|---|---|---|
| 1 Một vi phạm nhiều học viên, mô tả riêng | a1-2, a1-5 | LUIa1-4, 6, 7, 12 |
| 2 Nhiều vi phạm nhiều môn một học viên | a1-2, a1-5 | LUIa1-5 |
| 3 Vi phạm + Mô tả, dữ liệu cũ | a1-1, a1-2, a1-4 | LUIa1-1, 2, 3, 8, 11 |
| 4 Bằng chứng trong form, một Lưu | a1-3, a1-5 | LUIa1-9, 10 |
| 5 Xoá vi phạm giữ nguyên | a1-6 | LUIa1-10 |
| Sửa / Xoá lần xử lý (bậc tính lại) | a1-6 | LUIa1-13, 14, 15 |
| Sửa / Xoá Case, Xoá PA, nhật ký hạn theo dõi | a2-6 | LUIa2-12 … 16 |
| 6 Tạo Case có bằng chứng | a2-2 | LUIa2-4 |
| 7 Người phụ trách, gộp ô, nút | a2-1 | LUIa2-1, 2, 3 + ảnh |
| 8 Mở lại Case | a2-3 | LUIa2-5, 6, 7 |
| 9 Từ chối nhiều, Huỷ quyết định | a2-4, a2-5 | LUIa2-8 … 11 |
| Chỉ QL/QT cho đường lui, không nới quyền GV | a1-6, a2-3, a2-5, a2-6 | LUIa1-15, LUIa2-6, 10, 14 |

## File chồng với PR khác

| PR | File chung | Cách làm |
|---|---|---|
| **MTb #219** | `routes/index.ts`, `run.ts`, `shared/domain/index.ts`, `CODE_MAP.md`, `plan.md`; `ui/KhungPanel.tsx` (MTb sửa — LUI-a chỉ **dùng**) | Ai sau merge `origin/main`, giữ cả hai dòng; panel mới dùng `KhungPanel` bản sau MTb |
| **LT3 #218** | `server/src/worklist/metrics.ts` (a1-4 sửa `:186-192` dòng phụ vi phạm; LT3 sửa khối khác), `run.ts`, `classes.ts` (LUI-a không sửa) | Khác hàm; rebase giữ cả hai |
| **TK #220** | `migrate.ts`, `schema.sql`, `routes/index.ts`, `run.ts`, `shared/domain/index.ts`, `tocDoDuong.ts` | Chỉ thêm dòng — giữ cả hai |
| **PR-BV** | `cases/sos.ts` + mở lại Case khi nhập lại điểm (BV Task 3), `duyet/yeuCau.ts` (ghi chú thẻ) | Dùng chung kind mốc `'reopened'` (ai trước thêm); BV mở lại **tự động** khi nhập lại điểm, LUI-a2 mở lại **tay** — khác hàm, cùng cột; ai sau rebase |
| **PR-KHUNG** (sửa nút lựa chọn toàn web, chưa soạn) | `web/src/ui/ui.tsx` `NutChon`; `CapNhatTuan.tsx:273-286` | LUI-a2 chỉ đổi lớp ở `CapNhatTuan.tsx`, **không** sửa `NutChon`; PR-KHUNG sau đó thay bằng sửa chung và gỡ lớp riêng nếu thừa |
| PR-HK2 | — | Bỏ mục toast Hoàn tác vi phạm (đã ghi `plan.md`) |
| **Mới (bản 2)** `yThuc/xuLy.ts` | a1-6 thêm hàm sau `xoaNhap`; MTb / LT3 / TK / BV không chạm | Chỉ thêm hàm |
| **Mới (bản 2)** `cases/sosAuto.ts`, `cases/cases.ts` | a2-6 tách hàm kiểm khỏi `xacNhanCase` (`sosAuto.ts:197-215`) + `suaCase`/`xoaCase`/nhật ký `setFollowUntil`; `cases.ts` cũng bị a2-1, a2-3, a2-5 chạm (cùng PR). PR-BV Task 3 sửa `cases/sos.ts`, `cases/signals.ts` (không `cases.ts`) | Cùng PR a2 → không xung đột ngoài; với BV: khác file / hàm, ai sau rebase |

## Câu cần chủ sản phẩm quyết

Không còn — Q1–Q6 đã trả lời 06/10 (khối "Chủ sản phẩm chốt 06/10" đầu file).

## Prompt cho session code (dán nguyên khối, sau khi chủ sản phẩm duyệt)

**PR-LUI-a1** — Opus 5.5 · High (B: Sonnet 5.5 · High) — cả hai chạy tiếp; Fable hoặc model khác thì dừng
```
/ponytail lite
Làm PR-LUI-a1 theo docs/superpowers/plans/2026-10-06-pr-lui-a-case-duyet-y-thuc.md PHẦN a1 (Task a1-0 → a1-7, gồm a1-6 Sửa / Xoá lần xử lý; prompt chung plan.md mục 9.0).
Model Opus 5.5 · High (B: Sonnet 5.5 · High) — cả hai chạy tiếp; Fable hoặc model khác thì DỪNG báo chủ sản phẩm. Không Fable kể cả subagent. Đầu phiên nói model đang chạy.
Nhánh pr-lui-a1-y-thuc từ origin/main mới nhất, worktree .claude/worktrees/pr-lui-a1-y-thuc. Cổng PORT=4410 WEB_PORT=5410.
Đọc khối "Chủ sản phẩm chốt 06/10" ĐẦU FILE (thắng mọi chỗ khác), rồi "Chủ sản phẩm đã quyết", "Tôi đã tự quyết", câu trả lời Q5 (= A). Mockup đã duyệt: thiet-ke/mockup-duong-lui-case-duyet-y-thuc-2026-10-06.html mục 1–9, 16–17 — chữ ĐÚNG mockup, ngắn, không câu giải thích; ô ngày = ONgay (ô gõ + lịch); ô Mô tả mở sẵn. KHÔNG Hoàn tác sau khi ghi vi phạm.
Phép kiểm đỏ trước (prLuiA1.tests.ts): ghi nhiều em mỗi em một giao dịch + lỗi riêng từng em; khoá gửi không tạo trùng; nội dung sai thì không ghi gì; dữ liệu cũ tự tách khi đọc; tệp dùng chung không mất khi xoá một vi phạm; xoá lần xử lý chỉ lần mới nhất, bậc tính lại; migrate chạy hai lần không đổi gì.
Impeccable: layout, clarify, harden (lưu dở, tệp lỗi, em ngoài phạm vi), adapt 375, cuối /impeccable audit; /ponytail-review. npm run check MỘT lần, foreground (máy yếu RAM).
Bấm thử 375/1440 sáng/tối: Quản trị, QL, GVCN, GVBM. Mở PR vào main, KHÔNG merge. Mô tả PR: mục 1–5, phép kiểm, ảnh, chú thích ponytail:.
```

**PR-LUI-a2** — Opus 5.5 · High (B: Sonnet 5.5 · High) — cả hai chạy tiếp; Fable hoặc model khác thì dừng
```
/ponytail lite
Làm PR-LUI-a2 theo docs/superpowers/plans/2026-10-06-pr-lui-a-case-duyet-y-thuc.md PHẦN a2 (Task a2-0 → a2-7, gồm a2-6 Sửa / Xoá Case; prompt chung plan.md mục 9.0). Đọc khối "Chủ sản phẩm chốt 06/10" đầu file + câu trả lời Q6 (Xoá PA + Xoá Case khi hết PA có kết quả).
Model Opus 5.5 · High (B: Sonnet 5.5 · High) — cả hai chạy tiếp; Fable hoặc model khác thì DỪNG báo chủ sản phẩm. Không Fable kể cả subagent. Đầu phiên nói model đang chạy.
Nhánh pr-lui-a2-case-duyet từ origin/main mới nhất, worktree .claude/worktrees/pr-lui-a2-case-duyet. Cổng PORT=4420 WEB_PORT=5420.
Song song a1 được; Task a2-2 (Tạo Case có bằng chứng) CHỈ làm sau khi PR-LUI-a1 merge (git merge origin/main). Task a2-0 đối chiếu 5 điểm trước, lệch thì dừng báo planning.
Mockup đã duyệt mục 10–15, 18–19 — chữ ĐÚNG mockup, ngắn. Nút kết quả PA: chỉ sửa trong CapNhatTuan.tsx, KHÔNG sửa NutChon (PR-KHUNG).
Phép kiểm đỏ trước (prLuiA2.tests.ts): Người phụ trách bắt buộc ở route, không phá lời gọi cũ; Mở lại Case đảo đúng Hoàn thành, chặn khi đã có Case mới, chỉ QL/QT; Từ chối nhiều cùng luật Duyệt nhiều; Huỷ quyết định Đề xuất PA trả PA về ĐÚNG như trước khi duyệt, chặn khi PA đã có kết quả / quá ngày / loại khác; Xoá Case không để dòng mồ côi ở 12 bảng, chặn Case từ Test / có PA ghi kết quả.
Impeccable: layout, clarify, harden, adapt 375, cuối /impeccable audit; /ponytail-review. npm run check MỘT lần, foreground.
Bấm thử 375/1440 sáng/tối: Quản trị, QL, GVCN, GVBM. Mở PR vào main, KHÔNG merge.
```

## Cái bỏ qua (và khi nào thêm)

- **Xoá mềm + khôi phục vi phạm:** không làm (Q4 — giữ); thêm khi chủ sản phẩm thấy xoá nhầm thật.
- **Xoá lần xử lý không phải mới nhất / Xoá Case từ Test:** chặn — xoá lần sau trước; Case từ Test dùng "Không cần theo dõi".
- **Sửa ngày / người / mô tả của lần xử lý đã xác nhận:** chưa — chỉ thêm / bỏ vi phạm (yêu cầu 06/10).
- **Hoàn tác sau khi ghi vi phạm** (và mục HK2 tương ứng): bỏ — đã có Sửa / Xoá.
- **Huỷ quyết định thẻ Dời lịch thi, Sửa thông tin, Kế hoạch bổ trợ…:** chưa — mỗi loại cần hàm đảo riêng; Dời lịch thi có đường Dời / Khôi phục ở Kế hoạch Test.
- **Huỷ quyết định cả lô:** từng thẻ (trong ngày); thêm nếu QL hay duyệt nhầm cả lô.
- **Một chuông gộp cho GVCN khi ghi nhiều em:** mỗi em một chuông (dedup ngày); gộp nếu GVCN thấy phiền.
- **Bằng chứng riêng từng dòng vi phạm:** một khối chung; ghi riêng hai lần nếu tệp chỉ thuộc một vi phạm.
- **Chọn nhiều học viên từ hồ sơ học viên:** không — mở từ hồ sơ lớp.
- **Lý do khi Mở lại Case:** không bắt — nhật ký ghi ai / lúc nào / kết luận cũ.
