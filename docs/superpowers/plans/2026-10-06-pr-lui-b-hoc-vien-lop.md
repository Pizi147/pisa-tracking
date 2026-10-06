# PR-LUI-b · Đường lui Học viên & Lớp — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Model: Opus 5.5 hoặc Sonnet 5.5 — không Fable** (CLAUDE.md, 06/10).

**Goal:** Cho Quản lý / Quản trị đường lui cho ba việc đang "không lùi được": (1) **Học lại** cho em đã kết thúc học; (2) **Mở lại lớp** đã kết thúc; (3) **Kết thúc học · Lưu trữ · Huỷ quyết định chuyển lớp** cho nhiều em một lần — mỗi việc có nhật ký, lùi lại được, và có màn xem trước trước khi làm hàng loạt.

**Architecture:** Không viết luật mới cho trạng thái em — mọi đường đi qua hàm đã có (`setStudentStatus`, `archiveStudent`, `unarchiveStudent`, `huyLenh`). Thêm đúng hai hàm đảo: `hocLai` (đảo `setStudentStatus(…,'finished')`) và `moLaiLop` (đảo `ketThucLop`). Làm nhiều em = vòng lặp qua hàm sẵn có, MỖI EM MỘT GIAO DỊCH, web gửi từng lô 8 em (cùng mẫu Sửa cả lớp, PR-SL) nên lỗi giữa chừng giữ nguyên phần đã lưu và nói rõ em nào chưa lưu. Nút **Hoàn tác** (toast 5 giây, `HOAN_TAC_MS`) gọi việc ngược lại cho đúng các em đã làm được.

**Tech Stack:** TypeScript (`tsc`, import có đuôi `.ts`/`.tsx`), Express + SQLite/Turso (`db()`, `tx()`, `theoLo()`), React + Tailwind (`KhungPanel`, `useApi`, `useToast`), phép kiểm `server/src/tests/prLuiB.tests.ts` gọi ở cuối `run.ts`.

**Spec:** `docs/superpowers/specs/2026-10-06-ra-soat-duong-lui.md` (B1 dòng Học viên / Lớp / Chuyển lớp; C đề xuất 9, 10) + `plan.md` mục 4 "PR-LUI" phần **b** (chủ sản phẩm 06/10). Mockup: `thiet-ke/mockup-duong-lui-hoc-vien-lop-2026-10-06.html` (**phải được duyệt trước khi code**).

## Global Constraints

- **Chỉ QL / Quản trị.** Quyền kiểm ở MÁY CHỦ, không chỉ ẩn nút: em → `PLAN_WEEK {studentId}` (cùng `archiveStudent`); lớp → `CLASS_EDIT {classId}` (cùng `raLenh`/`huyLenh`); lệnh chuyển → `CLASS_EDIT {classId: lop_nguon_id}`. GVCN / GVBM không thấy mục nào mới, API trả 403. **Không nới quyền GV**: `setStudentStatus` (Tạm dừng / Quay lại / Kết thúc học từng em của GVCN) giữ nguyên.
- **Chữ trên web ngắn** (05/10): nhãn 1–3 từ, không câu giải thích dưới nút/ô; mockup = đúng chữ sẽ hiện. Thời gian trên màn: mã tuần `W2 OCT`; ngày chỉ cho ngày hiệu lực, ngày kết thúc, nhật ký.
- **Mỗi thao tác có nhật ký** (`writeAudit`, một dòng cho từng em / lớp / lệnh) và, với em, một dòng Hành trình (`addJourney`).
- **Làm nhiều em:** ≤ `TOI_DA_HANG_LOAT_EM = 200` em xem trước; một request ghi ≤ `LO_HANG_LOAT_EM = 8` em; mỗi em một giao dịch; lỗi một em không cuộn lại em khác; kiểm dữ liệu nhập, phân quyền, lỗi chống mất dữ liệu **không bao giờ bớt**.
- **Không đụng** (PR-MTa chạy song song): `fasttrack/attempts.ts`, `fasttrack/skillSchedule.ts`, `normal/regular.ts`, `keHoach/keHoachTest.ts`, `duyet/*`. Cần sửa một trong các file này → DỪNG hỏi planning.
- Turso: không tham số đặt tên; `IN (…)` qua `theoLo`; ≤ 900 tham số; `BEGIN IMMEDIATE` đã nằm trong `tx()`.
- Tên skill: `superpowers:<tên>`; giao diện: `impeccable` (`layout`, `clarify`, `harden`, `adapt` 375, cuối `audit`); `/ponytail lite` đầu phiên; cuối `/ponytail-review`.
- Cổng: `PORT=4390`, `WEB_PORT=5390`. Máy yếu RAM: `npm run check` một lần một lúc, OOM thì chạy từng bước (`npm run build:server`, rồi chạy riêng phép kiểm).

---

## Chủ sản phẩm đã quyết (06/10, qua session planning) — bản kế hoạch 2

1. **"Học lại" CHỌN đích:** (a) **về lớp cũ** — lộ trình cũ chạy tiếp, lớp đã kết thúc thì **mở lại cùng lúc**, Case đã đóng giữ đóng; (b) **sang lớp mới** — chọn lớp đang học, **mở lộ trình mới**, lộ trình cũ giữ ở Hành trình. → mockup bản 2 mục 2–6. **Chờ duyệt lại.**
2. **Quản lý được "Kết thúc lớp"** khi lớp không còn học viên đang học. **Xoá lớp vẫn chỉ Quản trị.** → làm luôn (Task 5, 7).
3. **"Chọn nhiều học viên"** (thay "Nhiều em…"; chủ sản phẩm viết "học sinh", planning dùng "học viên" cho khớp thuật ngữ cả web — **ghi rõ trong mô tả PR**): ở tab Học viên của hồ sơ lớp bấm nút **Chọn nhiều học viên** → ô chọn hiện ngay trên danh sách đang thấy → chọn xong hiện **thanh thao tác dính đáy** (n đã chọn · Lưu trữ · Kết thúc học · Huỷ chuyển lớp · Bỏ chọn) → bấm thao tác thì ra **hộp xem trước** rồi xác nhận. Trang Lưu trữ dùng cùng mẫu. **Không** thêm ô chọn thường trực vào bảng Học viên & Lớp. → mockup bản 2 mục 10–14. **Chờ duyệt lại.**
4. Nút tên **"Học lại"** — duyệt. Mockup các mục còn lại (Mở lại lớp 7–9, Chuyển tiếp lớp huỷ nhiều 15, GVCN 16) — duyệt.

**Việc code ngay (không dính mục 1, 3):** Task 2 phần `moLaiLop`, Task 4, Task 5, Task 7 (máy chủ + web Mở lại lớp / Kết thúc lớp cho Quản lý). **Chờ duyệt lại mới code:** `hocLai` có chọn đích (Task 2 phần `hocLai`, Task 6), toàn bộ web "Chọn nhiều học viên" (Task 8, 9, 10). Phần máy chủ làm nhiều học viên (Task 3) làm được ngay vì không đổi theo mockup — riêng nhánh "sang lớp mới" của Học lại hàng loạt đợi Task 2.

**Tôi đã tự quyết (nói rõ để duyệt cùng mockup bản 2):**
- Lý do **tuỳ chọn** cho Học lại, Mở lại lớp, Lưu trữ / Bỏ lưu trữ (đảo ngược việc đã làm, nhật ký vẫn ghi ai/lúc nào). **Bắt buộc** như cũ: Kết thúc học (1 ký tự trở lên), Huỷ chuyển lớp (≥ 3 ký tự, `huyLenh`).
- Làm nhiều học viên: **một lý do chung** + một ngày hiệu lực chung; gửi từng lô 8; lỗi giữa chừng giữ phần đã lưu, nút đổi thành `Thử lại n học viên`.
- **Học lại sang lớp mới:** lộ trình cũ ở lại `abandoned` (Hành trình), lộ trình mới theo đúng luật lộ trình đã có (Target + Dự kiến thi lớp thường giữ như PR-NT; sang Fast Track từ lớp thường **bắt buộc Target**, như `transferStudent`); không đòi quyền ở lớp chuyển đến (Q3, 23/09). **Học lại hàng loạt:** "sang lớp mới" chỉ nhận lớp **thường**; lớp Fast Track cần Target từng em → học lại từng em.
- **Chọn nhiều học viên** chỉ có ở cách xem **Điểm** (bảng FT `ClassRoster`, bảng lớp thường `BangDiemLopThuong`; điện thoại là thẻ) — không ở "Cần hỗ trợ" (danh sách con theo Case). Hộp xem trước = panel bên phải (`KhungPanel`) như mọi việc khác của web, không hộp thoại riêng.
- **Huỷ chuyển lớp** là một việc của cùng đường làm nhiều học viên (`huy-lenh`; máy chủ tìm quyết định chờ của từng em) — panel Chuyển tiếp lớp (mockup mục 15) dùng đúng đường này. Hoàn tác = **Khôi phục** (`khoi-phuc-lenh`): máy chủ chỉ cho trong 24 giờ, lệnh do **người** huỷ, em còn ở lớp nguồn, tuần bắt đầu còn ở tương lai, em chưa có quyết định khác. Chuông: **một** cho mỗi người nhận.
- Hoàn tác = toast 5 giây (`HOAN_TAC_MS`). Không chuông cho Học lại / Mở lại lớp. GVCN / GVBM không có mục nào mới (API 403).

---

## Chữ trên màn (một nguồn — mockup bản 2 dùng đúng các chữ này)

| Chỗ | Chữ |
|---|---|
| Menu ⋮ hồ sơ em đã kết thúc | `Học lại` (dòng phụ: `về lớp cũ · lộ trình chạy tiếp`) |
| Panel Học lại | tiêu đề `Học lại` · hai nút chọn `Về lớp cũ` / `Sang lớp mới` · dòng việc: `Về lớp MB FT 101` · `Lộ trình LT1 chạy tiếp` · `Ra khỏi Lưu trữ` · `Mở lại lớp MB FOU 12` (chỉ khi lớp đã kết thúc) · sang lớp mới: ô `Lớp` (bắt buộc) · `Target` (bắt buộc khi sang Fast Track, lỗi `Lên FT cần Target`) · `Dự kiến thi` (tuỳ chọn) · dòng `Vào lớp MB FOU 14` · `Lộ trình FOU mới` · `Lộ trình cũ giữ ở Hành trình` · `Ra khỏi Lưu trữ` · ô `Có hiệu lực từ` · ô `Lý do` (tuỳ chọn) · nút `Học lại` · không làm được: `Chưa có lớp để học lại` |
| Toast | `Đã cho Nguyễn Minh Anh học lại` / `… học lại · MB FOU 14` + `Hoàn tác (5)` |
| ⋮ hồ sơ lớp đã kết thúc | `Mở lại lớp` |
| ⋮ hồ sơ lớp (Quản lý) | `Kết thúc lớp` (khi không còn học viên đang học) |
| Panel Mở lại lớp | tiêu đề `Mở lại lớp` · `Lớp` · `Chi nhánh` · `Kết thúc` (ngày) · ô `Lý do` (tuỳ chọn) · nút `Mở lại lớp` · toast `Đã mở lại lớp MB FOU 12` |
| Lưu trữ › Lớp đã kết thúc | nút `Mở lại` ở cuối dòng (chỉ QL/QT) |
| Tab Học viên của hồ sơ lớp | nút `Chọn nhiều học viên` cạnh `Sửa thông tin` (bật = nền nhạt); ô chọn đầu mỗi dòng + ô chọn cả cột |
| Thanh dính đáy | `3 đã chọn` · `Lưu trữ` · `Kết thúc học` · `Huỷ chuyển lớp` · `Bỏ chọn` |
| Panel xem trước | tiêu đề `Kết thúc học · 14 học viên` · số `12 học viên` · `Case đóng 4` · `PA huỷ 2` · `Quyết định chuyển lớp huỷ 1` · mục `Bỏ qua 2 học viên` (mỗi học viên một lý do ngắn) · ô `Lý do` (bắt buộc với Kết thúc học, Huỷ chuyển lớp) · `Có hiệu lực từ` · nút `Kết thúc học 12 học viên` · nút trái `Huỷ thay đổi` · Lưu trữ: `Lưu trữ 5 học viên` · Huỷ chuyển lớp: `Lên FT 2` · `Học lại 3` · nút `Huỷ chuyển lớp 5 học viên` · không còn ai làm được: nút `Kết thúc học 0 học viên` khoá |
| Đang lưu / dở | nút `Đang lưu 8/12…` · dòng chân `Đã lưu 8 học viên · 4 học viên chưa lưu` · mục `Chưa lưu · 4` (lỗi dưới từng tên) · nút `Thử lại 4 học viên` |
| Lưu trữ › Học viên | nút `Chọn nhiều học viên`; thanh dính đáy `3 đã chọn` · `Bỏ lưu trữ` · `Học lại` · `Bỏ chọn`; nút `Học lại` và `Bỏ lưu trữ` cuối mỗi dòng khi không ở chế độ chọn |
| Panel Chuyển tiếp (đã có) | thêm nút `Huỷ quyết định` trong ô "n em đang chọn"; khối `Huỷ quyết định 5 em` · `Lên FT 2 · Học lại 3` · `Bỏ qua 2 em chưa có quyết định` · ô `Lý do` · nút `Huỷ quyết định 5 em` |

---

## Cấu trúc file

| File | Việc |
|---|---|
| `shared/domain/hangLoatEm.ts` (**mới**) | hằng + kiểu: `VIEC_HANG_LOAT` (`ket-thuc`, `luu-tru`, `bo-luu-tru`, `hoc-lai`, `huy-lenh`, `khoi-phuc-lenh`), `NHAN_VIEC_HANG_LOAT`, `VIEC_NGUOC`, `LO_HANG_LOAT_EM`, `TOI_DA_HANG_LOAT_EM`, `KHOI_PHUC_LENH_GIO`, `DongXemTruoc`, `XemTruocHangLoat`, `KetQuaHangLoat` |
| `shared/domain/index.ts` | `export * from './hangLoatEm.ts'` |
| `shared/domain/quanLyHocVien.ts:5-91` | thêm việc `hoc-lai` vào menu ⋮ hồ sơ em |
| `server/src/students/students.ts:316` (sau `setStudentStatus`) | `hocLai()` (về lớp cũ / sang lớp mới), `lopChoHocLai()` |
| `server/src/classes/luatLoTrinh.ts:255-278` | tách `moLoTrinhMoi()` khỏi `apDungMotDong` (không đổi hành vi) — Học lại sang lớp mới dùng lại |
| `server/src/classes/xoaKetThucLop.ts:18-124` | `moLaiLop()`; `ketThucLop` + `xemXoaKetThuc` đổi cổng sang `CLASS_EDIT`, `xoaLop` giữ Quản trị |
| `server/src/classes/loTrinhTiep.ts:286-336` | `lopHocCua().quyen.hocLai` |
| `server/src/classes/classes.ts:790-808` | `viewer.coTheMoLaiLop`, `viewer.coTheKetThucLop`, `viewer.coTheChonNhieu` |
| `server/src/classes/luuTru.ts:11-20,78-88` | cờ `coTheMoLai` mỗi lớp, `coTheHocLai` mỗi em |
| `server/src/students/hangLoat.ts` (**mới**) | `xemTruoc()`, `chay()` — sáu việc ở trên |
| `server/src/classes/lenhChuyen.ts:230-256` | tách `huyMotLenh`; thêm `huyNhieuLenh()`, `khoiPhucLenh()` (hàm, không route — `hangLoat.ts` gọi) |
| `server/src/routes/index.ts` (gần `:1149`, `:1853`) | 4 route mới: `/students/:id/hoc-lai`, `/students/:id/hoc-lai/lop-dich`, `/classes/:id/mo-lai`, `/hang-loat-hoc-vien(/xem-truoc)` |
| `web/src/modules/students/hangLoatEm.ts` (**mới**) | `chayHangLoat()` (chia lô, gom kết quả) + `hoanTacHangLoat()` |
| `web/src/modules/students/chonNhieuHocVien.tsx` (**mới**) | `useChonNhieu()` (trạng thái chọn), `OChon`, `ThanhChonNhieu` (thanh dính đáy) |
| `web/src/modules/students/XemTruocHangLoatPanel.tsx` (**mới**) | panel xem trước + xác nhận (chạy lô, lỗi giữa chừng, Hoàn tác) |
| `web/src/modules/students/ClassRoster.tsx:18-217`, `web/src/modules/classes/BangDiemLopThuong.tsx:44-215` | cột / thẻ có ô chọn khi `chon` bật |
| `web/src/modules/classes/TabHocVienLop.tsx` | nút `Chọn nhiều học viên`, giữ `useChonNhieu`, vẽ thanh dính đáy |
| `web/src/modules/students/StudentManagePanel.tsx:53-70` | `HocLaiPanel` (chọn đích) |
| `web/src/modules/classes/XoaKetThucLopPanel.tsx` | `MoLaiLopPanel` |
| `web/src/modules/classes/DauTrangLop.tsx:54,100,131-133` | mục `Mở lại lớp`, cổng `Kết thúc lớp` cho Quản lý |
| `web/src/modules/classes/ClassOverviewPage.tsx:136-137` | vẽ panel mới |
| `web/src/modules/students/LuuTruPage.tsx:29-148` | `Mở lại` ở tab Lớp; nút `Chọn nhiều học viên` + thanh dính đáy + `Học lại` ở tab Học viên |
| `web/src/modules/classes/TransitionPanel.tsx:~210-260` | `Huỷ quyết định` nhiều em (qua `chayHangLoat('huy-lenh')`) + Hoàn tác |
| `server/src/tests/prLuiB.tests.ts` (**mới**) + `server/src/tests/run.ts` (cuối) | phép kiểm |
| `CODE_MAP.md`, `plan.md` mục 11 | cập nhật |

**Đã đọc mã thật (file:dòng) và điều rút ra:**
- `students.ts:245-316` — Kết thúc học đặt `status='finished'`, `finished_at=ngày`, `archived_at=ngày`; ghi danh `active|paused → completed` (**không** đặt `ended_at`, `end_kind` = `ket_thuc`/`dung_hoc`); lộ trình `active → abandoned` với `ended_at = ngày` (đây là **nơi duy nhất** đặt `abandoned`, grep `'abandoned'` toàn repo); đóng Case `course_ended` (huỷ PA `planned|started`, thu hồi tín hiệu — `systemClose.ts:52-100`); Hành trình `finish`. Đường duy nhất tới `finished`: `setStudentStatus` (`transition.ts:326` gọi nó cho hướng "Dừng học hẳn"). → đảo được một cách xác định: ghi danh `completed` mới nhất, lộ trình `abandoned` mới nhất có `ended_at = finished_at`.
- `students.ts:339-349` — `unarchiveStudent` chỉ xoá `archived_at`, **em vẫn `finished`** → "Bỏ lưu trữ" **không** là đường học lại (khớp báo cáo B1).
- `xoaKetThucLop.ts:105-124` — `ketThucLop` chỉ `UPDATE classes SET status='finished', finished_at`; chặn khi `soDangHoc > 0`; cổng `ADMIN_CONFIG`. `luatLoTrinh.ts:163-185` `dongLopNeuHet` cũng tự kết thúc lớp thường hết khoá khi không còn ghi danh `active` — chạy sau mỗi lần đổi trạng thái / chuyển lớp của em.
- `lenhChuyen.ts:230-256` — `huyLenh` chỉ một lệnh `cho`, lý do ≥ 3, một chuông mỗi người nhận mỗi lệnh; `ux_lenh_cho_hv` (`schema.sql:1853`) = mỗi em tối đa một lệnh `cho`. `TransitionPanel.tsx:210-240` đã có cột chọn + ô "Chọn nhiều em" + `huyLenh` từng em (`:150-160`).
- `LuuTruPage.tsx:62-77` — mẫu `toast.hoanTac` cho Bỏ lưu trữ. `SuaCaLopPanel.tsx:120-150` + `shared/domain/nhapHocVien.ts:88-90` (`chiaLo`, `LO_LUU_SUA_CA_LOP = 8`) — mẫu gửi theo lô, "Đã lưu n em · m em chưa lưu".
- `classes.ts:790-806` — lớp đã kết thúc ⇒ **mọi cờ `viewer` = false kể cả Quản trị**, trừ `coTheXoaKetThuc` / `coTheXemDiem` nằm ngoài nhánh `finished`. → `coTheMoLaiLop` phải đặt ngoài nhánh đó.

---

### Task 0: Mockup + duyệt (BƯỚC 1 — đã làm; bản 2 chờ duyệt lại hai phần)

**Files:** Create `thiet-ke/mockup-duong-lui-hoc-vien-lop-2026-10-06.html`

- [x] Soạn mockup đủ trạng thái, 375 và 1440, sáng và tối, đúng chữ thật (bảng "Chữ trên màn").
- [x] Bản 1 (06/10): chủ sản phẩm duyệt trừ mục 1 (Học lại chọn đích) và mục 3 (Chọn nhiều học viên) — xem "Chủ sản phẩm đã quyết".
- [x] Bản 2: mockup sửa hai phần đó (mục 2–6 và 10–14).
- [x] Chủ sản phẩm duyệt lại hai phần (06/10, qua session planning).

---

### Task 1: Hằng chung + menu ⋮ hồ sơ em

**Files:**
- Create: `shared/domain/hangLoatEm.ts`
- Modify: `shared/domain/index.ts` (thêm một dòng `export * from './hangLoatEm.ts';` sau dòng `export * from './quanLyHocVien.ts'` hoặc cuối nhóm `export * from`)
- Modify: `shared/domain/quanLyHocVien.ts:5-6, 8-22, 24-27, 47-60, 75-80, 82-91`
- Test: `server/src/tests/prLuiB.tests.ts` (tạo ở bước 1)

**Interfaces:**
- Produces: `VIEC_HANG_LOAT`, `ViecHangLoat`, `NHAN_VIEC_HANG_LOAT`, `VIEC_NGUOC`, `LO_HANG_LOAT_EM`, `TOI_DA_HANG_LOAT_EM`, `KHOI_PHUC_LENH_GIO`, `DongXemTruoc`, `XemTruocHangLoat`, `KetQuaHangLoat`; `ViecQuanLy` thêm `'hoc-lai'`; `LopHocQuyen.hocLai?: boolean`.

- [x] **Step 1: Tạo `prLuiB.tests.ts` với phép kiểm miền (đỏ)**

```ts
/** PHÉP KIỂM PR-LUI-b — đường lui Học viên & Lớp: Học lại · Mở lại lớp · làm nhiều em · huỷ nhiều quyết định chuyển lớp. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrLuiBTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, TODAY, P, addDays, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const svc: any = await import('../students/students.ts');
  console.log('\nPR-LUI-b · Đường lui Học viên & Lớp');

  check('LUIb-1 · menu ⋮: "Học lại" hiện đúng khi có quyền hocLai và em đã kết thúc; GVCN không có', () => {
    const quyen = (o: Record<string, boolean>) => ({ lopHoc: { quyen: { ghiLoTrinhTiep: false, chuyenLop: false, tamDung: false, quayLai: false, ketThuc: false, luuTru: false, boLuuTru: false, ...o } } });
    const keys = (o: Record<string, boolean>, status: string) => d.mucQuanLyHocVien({ canEdit: false, cycle: null, status, ...quyen(o) }).map((m: any) => m.key);
    assert(keys({ hocLai: true, boLuuTru: true }, 'finished').join() === 'hoc-lai,bo-luu-tru', keys({ hocLai: true, boLuuTru: true }, 'finished').join());
    assert(!keys({}, 'finished').includes('hoc-lai'), 'không quyền thì không có Học lại');
    const m = d.mucQuanLyHocVien({ canEdit: false, cycle: null, status: 'finished', ...quyen({ hocLai: true }) })[0];
    assert(m.nhan === 'Học lại' && m.nhom === 'lop' && m.phu === 'về lớp cũ · lộ trình chạy tiếp', JSON.stringify(m));
  });

  check('LUIb-2 · hằng làm nhiều em: việc ngược đối xứng, nhãn đủ, lô 8, trần xem trước 200', () => {
    for (const v of d.VIEC_HANG_LOAT) {
      assert(d.VIEC_NGUOC[d.VIEC_NGUOC[v]] === v, `${v} ngược hai lần phải về ${v}`);
      assert(typeof d.NHAN_VIEC_HANG_LOAT[v] === 'string' && d.NHAN_VIEC_HANG_LOAT[v].length > 0, `thiếu nhãn ${v}`);
    }
    assert(d.NHAN_VIEC_HANG_LOAT['ket-thuc'] === 'Kết thúc học' && d.NHAN_VIEC_HANG_LOAT['hoc-lai'] === 'Học lại' && d.NHAN_VIEC_HANG_LOAT['huy-lenh'] === 'Huỷ chuyển lớp', 'nhãn');
    assert(d.LO_HANG_LOAT_EM === 8 && d.TOI_DA_HANG_LOAT_EM === 200 && d.KHOI_PHUC_LENH_GIO === 24, 'hằng');
  });
}
```

- [x] **Step 2: Gọi ở cuối `run.ts` rồi chạy, thấy đỏ**

Thêm vào `server/src/tests/run.ts` ngay TRƯỚC khối `console.log(\`\n${'='.repeat(60)}\`)` (sau khối PR-DL, `run.ts` cuối file):

```ts
// ==================================================================== PR-LUI-b (đường lui Học viên & Lớp)
const { runPrLuiBTests } = await import('./prLuiB.tests.ts');
await runPrLuiBTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
```

Run: `npm run build:server` rồi chạy phép kiểm như các PR trước (xem `package.json` script `test` / `check`).
Expected: FAIL — `d.VIEC_HANG_LOAT` undefined / `hoc-lai` không có.

- [x] **Step 3: `shared/domain/hangLoatEm.ts`**

```ts
/**
 * LÀM NHIỀU EM MỘT LẦN (PR-LUI-b, chủ sản phẩm 06/10) — Kết thúc học · Lưu trữ · Bỏ lưu trữ · Học lại. Chỉ Quản lý / Quản trị.
 * MỘT nguồn cho máy chủ (`students/hangLoat.ts`) và web (`XemTruocHangLoatPanel.tsx`): tên việc, nhãn, việc ngược của nút Hoàn tác, trần.
 */
export const VIEC_HANG_LOAT = ['ket-thuc', 'luu-tru', 'bo-luu-tru', 'hoc-lai', 'huy-lenh', 'khoi-phuc-lenh'] as const;
export type ViecHangLoat = (typeof VIEC_HANG_LOAT)[number];

export const NHAN_VIEC_HANG_LOAT: Record<ViecHangLoat, string> = {
  'ket-thuc': 'Kết thúc học', 'luu-tru': 'Lưu trữ', 'bo-luu-tru': 'Bỏ lưu trữ', 'hoc-lai': 'Học lại',
  'huy-lenh': 'Huỷ chuyển lớp', 'khoi-phuc-lenh': 'Khôi phục chuyển lớp',
};

/** Nút Hoàn tác gọi đúng việc ngược này với những em đã làm được. */
export const VIEC_NGUOC: Record<ViecHangLoat, ViecHangLoat> = {
  'ket-thuc': 'hoc-lai', 'hoc-lai': 'ket-thuc', 'luu-tru': 'bo-luu-tru', 'bo-luu-tru': 'luu-tru', 'huy-lenh': 'khoi-phuc-lenh', 'khoi-phuc-lenh': 'huy-lenh',
};

/** Một request GHI tối đa số học viên này (10 s của Netlify; cùng mẫu `LO_LUU_SUA_CA_LOP`). Web chia lô bằng `chiaLo`. */
export const LO_HANG_LOAT_EM = 8;
/** Xem trước một lần tối đa số em này. */
export const TOI_DA_HANG_LOAT_EM = 200;
/** Máy chủ chỉ cho Khôi phục quyết định chuyển lớp đã huỷ trong số giờ này. */
export const KHOI_PHUC_LENH_GIO = 24;

export type DongXemTruoc = {
  studentId: number; ten: string; ma: string; lop: string | null;
  trangThai: 'dang-hoc' | 'tam-dung' | 'da-ket-thuc' | 'luu-tru';
  /** Có chữ = em này KHÔNG được làm (bỏ qua / ngoài quyền / thiếu điều kiện); `null` = làm được. */
  lyDoBo: string | null;
};
export type XemTruocHangLoat = {
  viec: ViecHangLoat; rows: DongXemTruoc[];
  tong: { duoc: number; boQua: number; caseDong: number; paHuy: number; lenhHuy: number; lopMoLai: string[]; theoHuong: Record<string, number> };
};
export type KetQuaHangLoat = { ok: number[]; failed: { studentId: number; message: string }[] };
```

- [x] **Step 4: `index.ts` + `quanLyHocVien.ts`**

`shared/domain/index.ts` — thêm `export * from './hangLoatEm.ts';` cạnh `export * from './quanLyHocVien.ts';` (tìm dòng này bằng `grep -n quanLyHocVien shared/domain/index.ts`).

`shared/domain/quanLyHocVien.ts`:
- dòng 5-6: thêm `'hoc-lai'` vào `ViecQuanLy` (sau `'ket-thuc'`).
- `NHAN_VIEC_QUAN_LY`: thêm `'hoc-lai': 'Học lại',`.
- `LopHocQuyen`: thêm `hocLai?: boolean;` (tuỳ chọn để mọi chỗ dựng sẵn không vỡ kiểu).
- trong `mucQuanLyHocVien`, sau dòng `if (quyen?.luuTru) ds.push('luu-tru');` thêm: `if (quyen?.hocLai) ds.push('hoc-lai');` — đặt **trước** `boLuuTru`: sửa thành
  ```ts
  if (quyen?.luuTru) ds.push('luu-tru');
  if (quyen?.hocLai) ds.push('hoc-lai');
  if (quyen?.boLuuTru) ds.push('bo-luu-tru');
  ```
- `NHOM_VIEC`: thêm `'hoc-lai': 'lop',`.
- `PHU_VIEC`: thêm `'hoc-lai': 'về lớp cũ · lộ trình chạy tiếp',`.

- [x] **Step 5: Chạy lại — xanh**

Run: `npm run build:server` + phép kiểm. Expected: LUIb-1, LUIb-2 PASS; `npm run typecheck` không lỗi (kiểm `web` còn `Record<ViecQuanLy, …>` ở chỗ khác: `grep -rn "Record<ViecQuanLy" web shared server` — chỗ nào bắt buộc đủ khoá thì thêm `'hoc-lai'`).

- [x] **Step 6: Commit**

```bash
git add shared/domain/hangLoatEm.ts shared/domain/index.ts shared/domain/quanLyHocVien.ts server/src/tests/prLuiB.tests.ts server/src/tests/run.ts
git commit -m "PR-LUI-b: hằng làm nhiều em + mục Học lại ở menu hồ sơ em"
```

---

### Task 2: Máy chủ — `hocLai`, `moLaiLop`, cờ quyền

**Files:**
- Modify: `server/src/students/students.ts` (sau `setStudentStatus`, hết dòng 316; thêm import)
- Modify: `server/src/classes/xoaKetThucLop.ts:11-18, 105-124` (thêm `moLaiLop`)
- Modify: `server/src/classes/loTrinhTiep.ts:286-336` (`quyen.hocLai`)
- Modify: `server/src/classes/classes.ts:790-806` (`coTheMoLaiLop`)
- Modify: `server/src/routes/index.ts` (route mới)
- Test: `server/src/tests/prLuiB.tests.ts`

**Interfaces:**
- Consumes: `setStudentStatus(p, studentId, status, date, reason?, endKind?)`, `require_`, `PERMISSIONS.PLAN_WEEK/CLASS_EDIT`, `datLaiHanCase`, `chotHanXuLy`, `addJourney`, `writeAudit`.
- Produces: `hocLai(p, studentId, o?: { date?: string; lyDo?: unknown; moLaiLop?: boolean; lopMoiId?: number | null; mucTieu?: number | string | null; thangThi?: string | null }): student row`; `lopChoHocLai(p, studentId): { lopCu; chiNhanh; lop }`; `moLoTrinhMoi(p, o): { moiId; route }` (`luatLoTrinh.ts`); `moLaiLop(p, classId, o?: { lyDo?: unknown }): { ok: true; ma: string }`; `lopHocCua(...).quyen.hocLai: boolean`; `classOverview().viewer.coTheMoLaiLop: boolean`.

- [x] **Step 1: Viết phép kiểm đỏ**

Thêm vào `runPrLuiBTests` (sau LUIb-2):

```ts
  const emDangHoc = (lop: string): number => (conn.prepare(
    `SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
      WHERE e.class_id = ? AND s.status = 'active' AND s.archived_at IS NULL ORDER BY s.id LIMIT 1`).get(classId(lop)) as any).id;
  const anh = (sid: number) => JSON.stringify({
    s: conn.prepare('SELECT status, finished_at, archived_at FROM students WHERE id = ?').get(sid),
    e: conn.prepare('SELECT id, status, end_kind, class_id, ended_at FROM enrollments WHERE student_id = ? ORDER BY id').all(sid),
    c: conn.prepare('SELECT id, status, ended_at FROM learning_cycles WHERE student_id = ? ORDER BY id').all(sid),
  });
  const maLoi = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e.status ?? 500; } };

  check('LUIb-3 · hocLai đảo ĐÚNG Kết thúc học: học viên, ghi danh, lộ trình về nguyên trạng; có Hành trình + nhật ký', () => {
    const sid = emDangHoc('MB FT 101');
    const truoc = anh(sid);
    svc.setStudentStatus(P.mbManager, sid, 'finished', TODAY, 'Nghỉ học');
    assert(anh(sid) !== truoc, 'Kết thúc học phải đổi dữ liệu');
    svc.hocLai(P.mbManager, sid, { lyDo: 'Bấm nhầm' });
    assert(anh(sid) === truoc, `không về nguyên trạng:\n${truoc}\n${anh(sid)}`);
    const hanhTrinh = conn.prepare(`SELECT event_type, title, detail, created_by FROM journey_events WHERE student_id = ? ORDER BY id DESC LIMIT 1`).get(sid) as any;
    assert(hanhTrinh.event_type === 'resume' && hanhTrinh.title === 'Học lại' && hanhTrinh.detail === 'Bấm nhầm' && hanhTrinh.created_by === P.mbManager.userId, JSON.stringify(hanhTrinh));
    const nk = conn.prepare(`SELECT action, before_json, after_json FROM audit_logs WHERE entity_type = 'student' AND entity_id = ? AND action = 'student.rejoin'`).get(sid) as any;
    assert(nk && JSON.parse(nk.before_json).status === 'finished' && JSON.parse(nk.after_json).status === 'active', JSON.stringify(nk));
  });

  check('LUIb-4 · hocLai: chỉ QL / QT; GVCN 403, QL chi nhánh khác 403; em đang học 400; ngày trước ngày kết thúc 400', () => {
    const sid = emDangHoc('MB FT 101');
    assert(maLoi(() => svc.hocLai(P.mbManager, sid)) === 400, 'em đang học → 400');
    svc.setStudentStatus(P.mbManager, sid, 'finished', TODAY, 'Nghỉ học');
    try {
      assert(maLoi(() => svc.hocLai(P.coreTeacher, sid)) === 403, 'GVCN 403');
      assert(maLoi(() => svc.hocLai(P.cpManager, sid)) === 403, 'QL chi nhánh khác 403');
      assert(maLoi(() => svc.hocLai(P.mbManager, sid, { date: addDays(TODAY, -3) })) === 400, 'ngày trước ngày kết thúc');
      assert(maLoi(() => svc.hocLai(P.mbManager, sid, { date: addDays(TODAY, 3) })) === 400, 'ngày tương lai');
      svc.hocLai(P.admin, sid);   // Quản trị làm được
      assert((conn.prepare('SELECT status FROM students WHERE id = ?').get(sid) as any).status === 'active', 'QT học lại được');
    } finally {
      if ((conn.prepare('SELECT status FROM students WHERE id = ?').get(sid) as any).status === 'finished') svc.hocLai(P.mbManager, sid);
    }
  });

  check('LUIb-5 · Case đã đóng "Học viên kết thúc khoá" GIỮ đóng; Hạn xử lý chốt lại từ ngày học lại', () => {
    const sid = (conn.prepare(`SELECT s.id FROM students s JOIN sos_cases c ON c.student_id = s.id AND c.status != 'done'
        JOIN enrollments e ON e.student_id = s.id AND e.status = 'active' WHERE s.status = 'active' AND e.class_id = ? ORDER BY s.id LIMIT 1`).get(classId('MB FT 101')) as any)?.id as number | undefined;
    assert(sid, 'cần một em có Case mở ở MB FT 101');
    svc.setStudentStatus(P.mbManager, sid, 'finished', TODAY, 'Nghỉ học');
    const dong = (conn.prepare(`SELECT COUNT(*) n FROM sos_cases WHERE student_id = ? AND system_close_reason = 'course_ended'`).get(sid) as any).n;
    assert(dong > 0, 'Kết thúc học phải đóng Case');
    svc.hocLai(P.mbManager, sid);
    assert((conn.prepare(`SELECT COUNT(*) n FROM sos_cases WHERE student_id = ? AND system_close_reason = 'course_ended' AND status = 'done'`).get(sid) as any).n === dong, 'Case đã đóng phải giữ đóng');
  });

  await checkAsync('LUIb-6 · moLaiLop: lớp kết thúc → đang hoạt động, ghi nhật ký; QL đúng chi nhánh / QT được; GVCN, QL khác chi nhánh 403; lớp chưa kết thúc 400', async () => {
    const xk: any = await import('../classes/xoaKetThucLop.ts');
    const lop = classId('MB FOU 12');
    conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`).run(TODAY, lop);
    try {
      assert(maLoi(() => xk.moLaiLop(P.normalCoreTeacher, lop)) === 403, 'GVCN 403');
      assert(maLoi(() => xk.moLaiLop(P.cpManager, lop)) === 403, 'QL chi nhánh khác 403');
      xk.moLaiLop(P.mbManager, lop, { lyDo: 'Mở nhầm lớp' });
      const c = conn.prepare('SELECT status, finished_at FROM classes WHERE id = ?').get(lop) as any;
      assert(c.status === 'active' && c.finished_at === null, JSON.stringify(c));
      const nk = conn.prepare(`SELECT before_json, after_json FROM audit_logs WHERE entity_type = 'class' AND entity_id = ? AND action = 'class.reopened' ORDER BY id DESC LIMIT 1`).get(lop) as any;
      assert(nk && JSON.parse(nk.before_json).status === 'finished' && JSON.parse(nk.after_json).lyDo === 'Mở nhầm lớp', JSON.stringify(nk));
      assert(maLoi(() => xk.moLaiLop(P.mbManager, lop)) === 400, 'lớp đang hoạt động → 400');
    } finally { conn.prepare(`UPDATE classes SET status = 'active', finished_at = NULL WHERE id = ?`).run(lop); }
  });

  check('LUIb-7 · hocLai khi lớp cũ đã kết thúc: không moLaiLop → 400; có moLaiLop → lớp mở lại cùng lúc, một giao dịch', () => {
    const sid = emDangHoc('MB FOU 12');
    const lop = classId('MB FOU 12');
    svc.setStudentStatus(P.mbManager, sid, 'finished', TODAY, 'Nghỉ học');
    conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`).run(TODAY, lop);
    try {
      assert(maLoi(() => svc.hocLai(P.mbManager, sid)) === 400, 'lớp đã kết thúc, không chọn mở lại → 400');
      assert((conn.prepare('SELECT status FROM students WHERE id = ?').get(sid) as any).status === 'finished', '400 không được đổi gì');
      assert(maLoi(() => svc.hocLai(P.mbManager, sid, { moLaiLop: true })) === null, 'có moLaiLop phải xong');
      assert((conn.prepare('SELECT status FROM classes WHERE id = ?').get(lop) as any).status === 'active', 'lớp phải mở lại');
      assert((conn.prepare('SELECT status FROM students WHERE id = ?').get(sid) as any).status === 'active', 'em phải đang học');
    } finally { conn.prepare(`UPDATE classes SET status = 'active', finished_at = NULL WHERE id = ?`).run(lop); }
  });
```


- [x] **Step 2: Chạy — đỏ** (`svc.hocLai is not a function`, `xk.moLaiLop is not a function`).

- [x] **Step 3: `moLaiLop` trong `xoaKetThucLop.ts`**

Thêm import `chuTuDo` vào dòng `import { badRequest, notFound } from '../util.ts';` → `import { badRequest, chuTuDo, notFound } from '../util.ts';`. Sau hàm `ketThucLop` (hết dòng 124) thêm:

```ts
const CHI_QL_LOP = 'Chỉ Quản lý của lớp này hoặc Quản trị hệ thống mới mở lại được lớp.';

/**
 * MỞ LẠI LỚP ĐÃ KẾT THÚC (PR-LUI-b, chủ sản phẩm 06/10) — ngược của `ketThucLop`. Quản lý của lớp (`class.edit`) hoặc Quản trị. Học viên đã
 * kết thúc học KHÔNG tự quay lại (mỗi em Học lại riêng). Gọi được từ giao dịch khác (`hocLai` mở lớp cùng lúc — `tx` lồng = savepoint).
 * ponytail: lớp thường đã hết khoá mà mở lại khi chưa có em đang học thì `dongLopNeuHet` (luatLoTrinh.ts) có thể kết thúc lại ở lần đổi
 * trạng thái / chuyển lớp kế tiếp của một em trong lớp; Học lại một em vào lớp (ghi danh `active`) thì lớp ở lại.
 */
export function moLaiLop(p: Principal, classId: number, o: { lyDo?: unknown } = {}) {
  require_(p, PERMISSIONS.CLASS_EDIT, { classId }, CHI_QL_LOP);
  const c = docLop(classId);
  if (c.status !== 'finished') throw badRequest('Lớp chưa kết thúc.');
  const lyDo = chuTuDo(o.lyDo, 'Lý do', 2000);
  const conn = db();
  tx(() => {
    conn.prepare(`UPDATE classes SET status = 'active', finished_at = NULL WHERE id = ? AND status = 'finished'`).run(classId);
    writeAudit({
      actorUserId: p.userId, action: 'class.reopened', entityType: 'class', entityId: classId, entityLabel: c.code,
      before: { status: 'finished', finishedAt: c.finished_at }, after: { status: 'active', lyDo },
    });
  });
  return { ok: true, ma: c.code };
}
```

Cập nhật chú thích đầu file: thêm dòng `Mở lại lớp (PR-LUI-b): Quản lý của lớp hoặc Quản trị — xem moLaiLop.`

- [x] **Step 4a: Tách `moLoTrinhMoi` khỏi `apDungMotDong`** (`luatLoTrinh.ts:255-278`, không đổi hành vi — phép kiểm chuyển lớp cũ giữ nguyên xanh). Khối `if (luat.khoa === 'dong-mo') { … }` hiện đóng lộ trình cũ rồi mở lộ trình mới + lịch mặc định; phần "mở lộ trình mới + lịch mặc định" thành hàm export dùng chung với Học lại sang lớp mới:

```ts
/**
 * MỞ LỘ TRÌNH MỚI cho em ở lớp `toClass` (PR-LUI-b tách từ `apDungMotDong`): số thứ tự kế tiếp, Target / Dự kiến thi giữ theo luật PR-NT (FT → FT hoặc
 * thường → thường giữ Target; thường → thường giữ cả Dự kiến thi), lịch MT mặc định (FT) hoặc bài Giữa khoá / Cuối khoá (thường). KHÔNG đóng lộ trình cũ — nơi gọi lo.
 * `target` / `kck`: Target do người dùng nhập (sang FT từ lớp thường là bắt buộc — nơi gọi kiểm); trống thì giữ của `cuCycle` khi luật cho giữ.
 */
export function moLoTrinhMoi(p: Principal, o: {
  sid: number; ngay: string; toClass: any; tuLop: LoaiLop; denLop: LoaiLop; cuCycle: any | null;
  target?: number | null; kck?: boolean; thangThi?: string | null;
}): { moiId: number; route: string | null } {
  const conn = db();
  const seq = ((conn.prepare('SELECT MAX(seq) n FROM learning_cycles WHERE student_id = ?').get(o.sid) as any)?.n ?? 0) + 1;
  const route = o.denLop.ft ? (o.toClass.route ?? o.cuCycle?.route ?? 'LT1') : null;   // lộ trình mới = lộ trình lớp chuyển đến (M-20)
  const startPeriodId = o.denLop.ft ? ensurePeriod(mondayOf(o.ngay)).id : (o.toClass.start_period_id ?? null);
  /* Q7: FT → FT giữ target cũ. Chủ sản phẩm 04/10 (PR-NT): lớp thường → lớp thường giữ cả Target lẫn Dự kiến thi. */
  const giuTarget = (o.tuLop.ft && o.denLop.ft) || (!o.tuLop.ft && !o.denLop.ft);
  const giuThi = !o.tuLop.ft && !o.denLop.ft && !o.thangThi;
  const cu = o.cuCycle;
  const moiId = Number(conn.prepare(
    `INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, khong_cam_ket, exam_month, exam_date, exam_period_id,
                                  start_period_id, started_at, status, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?, 'active', ?)`,
  ).run(o.sid, seq, route, o.denLop.ma, o.target ?? (giuTarget ? cu?.target_score ?? null : null),
    o.kck || (o.target == null && giuTarget && cu?.khong_cam_ket) ? 1 : 0,   // … kể cả KCK (Q29-1)
    giuThi ? cu?.exam_month ?? null : o.thangThi ?? null,
    giuThi ? cu?.exam_date ?? null : null, giuThi ? cu?.exam_period_id ?? null : null,
    startPeriodId, o.ngay, nowIso()).lastInsertRowid);
  if (o.denLop.ft) taoMtMacDinh(moiId, { actorUserId: p.userId });   // M1: vào lớp FT / đổi LT ↔ RF = lộ trình mới có lịch MT mặc định
  else taoBaiThuongMacDinh([moiId], p.userId, o.ngay);               // PR-LT2a M1b: sang lớp thường = tự có bài Giữa khoá / Cuối khoá
  return { moiId, route };
}
```
và trong `apDungMotDong` khối `dong-mo` còn:
```ts
  if (luat.khoa === 'dong-mo') {
    if (curCycle) conn.prepare(`UPDATE learning_cycles SET status = 'completed', ended_at = ? WHERE id = ?`).run(d.ngay, curCycle.id);
    const { moiId, route } = moLoTrinhMoi(p, { sid: d.sid, ngay: d.ngay, toClass, tuLop, denLop, cuCycle: curCycle, target: mucTieu ?? null, thangThi: d.thangThi });
    if (denLop.ft && tuLop.ft && curCycle) chuyenCaseSangLoTrinh(p.userId, d.sid, curCycle.id, moiId, route, d.ngay);   // K5-60
  }
```
(giữ nguyên thứ tự: `taoMtMacDinh` chạy TRƯỚC `chuyenCaseSangLoTrinh` như hiện nay — trong helper `taoMtMacDinh` đã chạy xong khi trả về). Chạy lại các phép kiểm chuyển lớp (`lenLop.tests.ts`, `prCt.tests.ts`, `prLt2a/b.tests.ts`) — phải xanh nguyên.

- [x] **Step 4b: `hocLai` + `lopChoHocLai` trong `students.ts`**

Thêm import: `import { moLaiLop } from '../classes/xoaKetThucLop.ts';`, `moLoTrinhMoi`, `thongBaoChuyenVao` từ `'../classes/luatLoTrinh.ts'` (dòng import hiện có `apDungMotDong, dongLopNeuHet, lopDichHopLe, lopHienTaiCua` — thêm vào), `docTarget` từ `'../fasttrack/cycles.ts'` (cạnh `currentCycle, cyclesOf, examPlanOf`), `type LoaiLop` từ `shared/domain`; đổi dòng util thành `import { badRequest, chuTuDo, isIsoDate, kiemKieuO, normalizeName, notFound, nowIso, padCode } from '../util.ts';`. Sau `setStudentStatus` (sau dòng 316) thêm:

```ts
/**
 * HỌC LẠI (PR-LUI-b, chủ sản phẩm 06/10) — đường lui của "Kết thúc học", CHỈ Quản lý / Quản trị (`plan.week` của em). CHỌN ĐÍCH:
 *  (a) VỀ LỚP CŨ (`lopMoiId` trống): làm ngược đúng những gì `setStudentStatus(…, 'finished')` đã làm — em về ghi danh `completed` mới nhất, lộ trình bị đóng LÚC
 *      ĐÓ (`abandoned`, `ended_at` = ngày kết thúc — chỗ duy nhất đặt `abandoned`) chạy tiếp, ra khỏi Lưu trữ. Lớp cũ đã kết thúc: `moLaiLop` = true thì mở lại
 *      lớp CÙNG giao dịch, không thì 400.
 *  (b) SANG LỚP MỚI (`lopMoiId`): lớp đang hoạt động ≠ lớp cũ; ghi danh mới, lộ trình MỚI theo luật lộ trình (`moLoTrinhMoi`), lộ trình cũ ở nguyên `abandoned`
 *      (giữ ở Hành trình), ghi danh cũ ở nguyên `completed`. Sang Fast Track từ lớp thường bắt buộc Target (như `transferStudent`). Không đòi quyền ở lớp mới (Q3).
 * Case đã đóng "Học viên kết thúc khoá" GIỮ đóng. Ghi `resume` ("Học lại") để hạn Ý thức / Case tính lại từ ngày học lại như Quay lại học. Lùi lại bằng chính Kết thúc học.
 */
export function hocLai(p: Principal, studentId: number, o: {
  date?: string; lyDo?: unknown; moLaiLop?: boolean; lopMoiId?: number | null; mucTieu?: number | string | null; thangThi?: string | null;
} = {}) {
  require_(p, PERMISSIONS.PLAN_WEEK, { studentId }, 'Chỉ Quản lý mới cho học viên học lại được.');
  const conn = db();
  const s = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  if (s.status !== 'finished') throw badRequest('Chỉ cho học lại được em đã kết thúc học.');
  const date = o.date ?? demoToday();
  if (!isIsoDate(date)) throw badRequest('Ngày không hợp lệ.');
  if (date > demoToday()) throw badRequest('Ngày hiệu lực không được sau hôm nay.');
  if (s.finished_at && date < s.finished_at) throw badRequest(`Ngày học lại không được trước ngày kết thúc học (${String(s.finished_at).split('-').reverse().join('/')}).`);
  const lyDo = chuTuDo(o.lyDo, 'Lý do', 2000);
  const enr = conn.prepare(
    `SELECT e.id, e.class_id, c.code, c.status AS class_status, c.programme_code, c.is_fast_track, c.route
       FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE e.student_id = ? AND e.status = 'completed' ORDER BY e.id DESC LIMIT 1`,
  ).get(studentId) as any;
  if (!enr) throw badRequest('Em chưa có lớp nào để học lại — dùng Chuyển lớp để xếp lớp.');
  const lopDaDong = enr.class_status === 'finished';

  /* (b) sang lớp mới */
  const lopMoi = o.lopMoiId ? lopDichHopLe(Number(o.lopMoiId), enr.class_id) : null;
  if (o.lopMoiId && !lopMoi) throw badRequest('Lớp chuyển đến không hợp lệ.');
  const tuLop: LoaiLop = { ma: (enr.programme_code ?? null) as ProgrammeCode | null, ft: !!enr.is_fast_track, lt: enr.route };
  const denLop: LoaiLop | null = lopMoi ? { ma: (lopMoi.programme_code ?? null) as ProgrammeCode | null, ft: !!lopMoi.is_fast_track, lt: lopMoi.route } : null;
  const tg = o.mucTieu === undefined || o.mucTieu === null || o.mucTieu === '' ? null : docTarget(o.mucTieu);
  if (denLop?.ft && !tuLop.ft && !tg) throw badRequest('Lên FT cần Target.');
  if (!lopMoi && lopDaDong && !o.moLaiLop) throw badRequest(`Lớp ${enr.code} đã kết thúc — mở lại lớp để em học lại.`);

  return tx(() => {
    conn.prepare(`UPDATE students SET status = 'active', finished_at = NULL, archived_at = NULL WHERE id = ?`).run(studentId);
    const dangChay = conn.prepare(`SELECT 1 FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(studentId);
    const cu = dangChay ? null : conn.prepare(
      `SELECT * FROM learning_cycles WHERE student_id = ? AND status = 'abandoned' AND ended_at IS ? ORDER BY seq DESC LIMIT 1`,
    ).get(studentId, s.finished_at ?? null) as any;
    let cycleId: number | null = cu?.id ?? null;
    if (lopMoi && denLop) {
      /* ghi danh cũ + lộ trình cũ ở nguyên; ghi danh mới + lộ trình mới */
      const ins = conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`)
        .run(studentId, lopMoi.id, date, nowIso());
      conn.prepare('UPDATE students SET branch_id = ? WHERE id = ?').run(lopMoi.branch_id, studentId);
      cycleId = moLoTrinhMoi(p, { sid: studentId, ngay: date, toClass: lopMoi, tuLop, denLop, cuCycle: cu, target: tg?.target ?? null, kck: !!tg?.kck, thangThi: o.thangThi ?? null }).moiId;
      thongBaoChuyenVao({
        sid: studentId, tenHocVien: s.full_name, enrollmentMoiId: Number(ins.lastInsertRowid), actorUserId: p.userId,
        tuMa: enr.code, tuChiNhanh: '—', doiChiNhanh: true, lyDo, denLop: { id: lopMoi.id, code: lopMoi.code, branchId: lopMoi.branch_id },
      });
    } else {
      if (lopDaDong) moLaiLop(p, enr.class_id, { lyDo: `Học lại: ${s.full_name}` });
      conn.prepare(`UPDATE enrollments SET status = 'active', end_kind = NULL WHERE id = ?`).run(enr.id);
      if (cu) conn.prepare(`UPDATE learning_cycles SET status = 'active', ended_at = NULL WHERE id = ?`).run(cu.id);
    }
    datLaiHanCase(studentId, date);
    addJourney({ studentId, cycleId, eventType: 'resume', eventDate: date, title: 'Học lại', detail: [lyDo, lopMoi ? `sang lớp ${lopMoi.code}` : null].filter(Boolean).join(' — ') || null, createdBy: p.userId });
    chotHanXuLy([studentId], { ghiDe: true });   // sau `addJourney`: mốc đọc sự kiện `resume`
    writeAudit({
      actorUserId: p.userId, action: 'student.rejoin', entityType: 'student', entityId: studentId, entityLabel: s.student_code,
      before: { status: 'finished', finishedAt: s.finished_at, archivedAt: s.archived_at },
      after: { status: 'active', date, lyDo, classId: lopMoi?.id ?? enr.class_id, lopMoi: !!lopMoi, moLaiLop: !lopMoi && lopDaDong },
    });
    return conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  });
}

/** GET /students/:id/hoc-lai/lop-dich — lớp ĐANG hoạt động để chọn ở "Sang lớp mới" (cùng dạng `lopDichChoChuyen`, em không còn ghi danh `active`). Chỉ Quản lý / Quản trị của em. */
export function lopChoHocLai(p: Principal, studentId: number) {
  require_(p, PERMISSIONS.PLAN_WEEK, { studentId }, 'Chỉ Quản lý mới cho học viên học lại được.');
  const enr = db().prepare(
    `SELECT e.class_id, c.code, c.status AS class_status FROM enrollments e JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = ? AND e.status = 'completed' ORDER BY e.id DESC LIMIT 1`,
  ).get(studentId) as any;
  return { lopCu: enr ? { id: enr.class_id as number, code: enr.code as string, daKetThuc: enr.class_status === 'finished' } : null, ...danhSachLopDich(enr?.class_id ?? -1) };
}
```
`danhSachLopDich(boQuaLopId)`: tách phần dựng danh sách khỏi `lopDichChoChuyen` (`luatLoTrinh.ts:57-86`) — `lopDichChoChuyen` giữ kiểm quyền + gọi hàm mới; trả `{ chiNhanh, lop }` như cũ.

Phép kiểm thêm (sau LUIb-7):

```ts
  check('LUIb-7b · hocLai SANG LỚP MỚI: ghi danh cũ ở nguyên completed, lộ trình cũ ở nguyên abandoned, lộ trình mới active ở lớp mới, em ra khỏi Lưu trữ; sang FT từ lớp thường cần Target; lớp mới không hợp lệ 400', () => {
    const sid = emDangHoc('MB FOU 12');
    const lopMoiThuong = (conn.prepare(`SELECT id FROM classes WHERE status = 'active' AND is_fast_track = 0 AND id != ? ORDER BY id LIMIT 1`).get(classId('MB FOU 12')) as any).id as number;
    const lopFt = classId('MB FT 101');
    conn.exec('BEGIN IMMEDIATE');   // cả phép kiểm nằm trong một giao dịch rồi ROLLBACK — không để em nằm lại ở lớp mới (`tx` lồng = savepoint)
    svc.setStudentStatus(P.mbManager, sid, 'finished', TODAY, 'Nghỉ học');
    const cuCycles = JSON.stringify(conn.prepare('SELECT id, status, ended_at FROM learning_cycles WHERE student_id = ? ORDER BY id').all(sid));
    try {
      assert(maLoi(() => svc.hocLai(P.mbManager, sid, { lopMoiId: classId('MB FOU 12') })) === 400, 'lớp mới = lớp cũ → 400');
      assert(maLoi(() => svc.hocLai(P.mbManager, sid, { lopMoiId: lopFt })) === 400, 'sang FT không Target → 400');
      svc.hocLai(P.mbManager, sid, { lopMoiId: lopMoiThuong, lyDo: 'Học lại ở lớp khác' });
      const s = conn.prepare('SELECT status, archived_at, finished_at, branch_id FROM students WHERE id = ?').get(sid) as any;
      assert(s.status === 'active' && s.archived_at === null && s.finished_at === null, JSON.stringify(s));
      const e = conn.prepare('SELECT class_id, status FROM enrollments WHERE student_id = ? ORDER BY id').all(sid) as any[];
      assert(e.at(-1).class_id === lopMoiThuong && e.at(-1).status === 'active' && e.at(-2).status === 'completed', JSON.stringify(e));
      const c = conn.prepare('SELECT id, status FROM learning_cycles WHERE student_id = ? ORDER BY id').all(sid) as any[];
      assert(c.at(-1).status === 'active' && JSON.stringify(c.slice(0, -1).map((x: any) => x.id)) === JSON.stringify(JSON.parse(cuCycles).map((x: any) => x.id)), 'lộ trình mới active, lộ trình cũ còn đó');
      assert(c.slice(0, -1).every((x: any) => x.status !== 'active'), 'lộ trình cũ không được active');
      const hanhTrinh = conn.prepare(`SELECT title, detail FROM journey_events WHERE student_id = ? AND event_type = 'resume' ORDER BY id DESC LIMIT 1`).get(sid) as any;
      assert(hanhTrinh.title === 'Học lại' && hanhTrinh.detail.includes('sang lớp'), JSON.stringify(hanhTrinh));
    } finally { conn.exec('ROLLBACK'); }
  });
```

- [x] **Step 5: Cờ quyền**

`loTrinhTiep.ts:286-336` — thêm `hocLai: boolean` vào kiểu `quyen` (dòng 286 `ketThuc: boolean; luuTru: boolean; boLuuTru: boolean;` → thêm `hocLai: boolean;`); nhánh `chiXem` (đã lưu trữ): `hocLai: can(p, PERMISSIONS.PLAN_WEEK, { studentId }),`; nhánh thường: `hocLai: can(p, PERMISSIONS.PLAN_WEEK, { studentId }) && s?.status === 'finished',`; trong nhánh `chiXem` thêm cả `hocLai` bên cạnh `boLuuTru` (đã lưu trữ ⇒ chắc chắn `finished`).

`classes.ts` — trong object `viewer`, **ngoài** nhánh `finished` (cạnh `coTheXoaKetThuc`, dòng ~806): 
```ts
      /** PR-LUI-b: ⋮ "Mở lại lớp" — lớp ĐÃ kết thúc + Quản lý của lớp / Quản trị (nằm ngoài nhánh `finished`: mọi cờ khác của lớp đã đóng đều false). */
      coTheMoLaiLop: finished && can(p, PERMISSIONS.CLASS_EDIT, { classId }),
```
Cập nhật kiểu `HoSoLop['viewer']` ở `web/src/modules/classes/DauTrangLop.tsx:49` (thêm `coTheMoLaiLop?: boolean;`).

- [x] **Step 6: Route**

`server/src/routes/index.ts` — ngay sau route `/students/:id/unarchive` (`:1853-1856`):

```ts
/** PR-LUI-b: Học lại — đường lui của Kết thúc học (về lớp cũ, hoặc sang lớp mới + lộ trình mới). Chỉ Quản lý / Quản trị (máy chủ kiểm `plan.week` của em). */
api.post('/students/:id/hoc-lai', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = req.body ?? {};
  return studentSvc.hocLai(principalOf(req), pInt(req, 'id'), {
    date: b.date ?? undefined, lyDo: b.lyDo, moLaiLop: b.moLaiLop === true,
    lopMoiId: b.lopMoiId ? Number(b.lopMoiId) : null, mucTieu: b.mucTieu ?? null, thangThi: b.thangThi ?? null,
  });
}));
/** PR-LUI-b: lớp đang hoạt động để chọn "Sang lớp mới" + lớp cũ của em (panel Học lại). */
api.get('/students/:id/hoc-lai/lop-dich', requireAuth, wrap((req) => studentSvc.lopChoHocLai(principalOf(req), pInt(req, 'id'))));
```
và sau route `/classes/:id/ket-thuc` (`:1149-1152`):
```ts
/** PR-LUI-b: ⋮ Hồ sơ lớp › Mở lại lớp — Quản lý của lớp hoặc Quản trị. */
api.post('/classes/:id/mo-lai', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return xoaKetThucLopSvc.moLaiLop(principalOf(req), pInt(req, 'id'), { lyDo: req.body?.lyDo });
}));
```

- [x] **Step 7: Chạy — xanh**

Run: `npm run build:server` + phép kiểm. Expected: LUIb-3…7 PASS. Nếu LUIb-3 lệch (ví dụ `learning_cycles` của em seed không phải `active` trước đó) → đọc `anh()` hai bên, đừng sửa phép kiểm cho khớp: tìm em seed khác (`emDangHoc` lấy em đầu tiên có ghi danh `active`; nếu em đó chưa có lộ trình thì so sánh vẫn đúng).

- [x] **Step 8: Commit**

```bash
git add server/src/students/students.ts server/src/classes/xoaKetThucLop.ts server/src/classes/loTrinhTiep.ts server/src/classes/classes.ts server/src/routes/index.ts server/src/tests/prLuiB.tests.ts web/src/modules/classes/DauTrangLop.tsx
git commit -m "PR-LUI-b: máy chủ Học lại + Mở lại lớp (đảo Kết thúc học / Kết thúc lớp), cờ quyền"
```

---

### Task 3: Máy chủ — làm nhiều học viên (xem trước + chạy theo lô) — **làm sau Task 4**

**Files:**
- Create: `server/src/students/hangLoat.ts`
- Modify: `server/src/routes/index.ts` (hai route)
- Test: `server/src/tests/prLuiB.tests.ts`

**Interfaces:**
- Consumes: `setStudentStatus`, `archiveStudent`, `unarchiveStudent`, `hocLai` (`students.ts`), `huyNhieuLenh`, `khoiPhucLenh` (Task 4); `VIEC_HANG_LOAT`, `LO_HANG_LOAT_EM`, `TOI_DA_HANG_LOAT_EM`, kiểu `XemTruocHangLoat`, `KetQuaHangLoat`, `DongXemTruoc`.
- Produces: `xemTruoc(p, { viec, studentIds }): XemTruocHangLoat`; `chay(p, { viec, studentIds, lyDo?, date?, moLaiLop? }): KetQuaHangLoat`. Route `POST /hang-loat-hoc-vien/xem-truoc`, `POST /hang-loat-hoc-vien`.

- [x] **Step 1: Phép kiểm đỏ**

```ts
  await checkAsync('LUIb-8 · làm nhiều em: xem trước đếm đúng Case / PA / lệnh và bỏ qua em không làm được; chạy Kết thúc học rồi Hoàn tác (Học lại) về nguyên trạng', async () => {
    const hl: any = await import('../students/hangLoat.ts');
    const ids = (conn.prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
        WHERE e.class_id = ? AND s.status = 'active' AND s.archived_at IS NULL ORDER BY s.id LIMIT 3`).all(classId('MB FT 101')) as any[]).map((r) => r.id as number);
    assert(ids.length === 3, 'cần 3 em đang học');
    svc.setStudentStatus(P.mbManager, ids[2], 'finished', TODAY, 'Nghỉ học');   // em này "đã kết thúc rồi"
    const truoc = ids.map(anh).join('|');
    try {
      const xt = hl.xemTruoc(P.mbManager, { viec: 'ket-thuc', studentIds: ids });
      assert(xt.rows.length === 3 && xt.tong.duoc === 2 && xt.tong.boQua === 1, JSON.stringify(xt.tong));
      assert(xt.rows.find((r: any) => r.studentId === ids[2]).lyDoBo === 'Đã kết thúc học', 'em đã kết thúc phải bị bỏ qua có lý do');
      const caseMo = (conn.prepare(
        `SELECT COUNT(*) n FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
          WHERE COALESCE(sc.student_id, a.student_id) IN (?, ?) AND sc.status != 'done'`).get(ids[0], ids[1]) as any).n;
      assert(xt.tong.caseDong === caseMo, `Case đóng ${xt.tong.caseDong} ≠ ${caseMo}`);
      const kq = hl.chay(P.mbManager, { viec: 'ket-thuc', studentIds: ids.slice(0, 2), lyDo: 'Cuối khoá' });
      assert(kq.ok.length === 2 && kq.failed.length === 0, JSON.stringify(kq));
      assert(ids.slice(0, 2).every((id) => (conn.prepare('SELECT status FROM students WHERE id = ?').get(id) as any).status === 'finished'), 'cả hai phải kết thúc');
      const nguoc = hl.chay(P.mbManager, { viec: 'hoc-lai', studentIds: kq.ok, moLaiLop: true });
      assert(nguoc.ok.length === 2, JSON.stringify(nguoc));
      assert(ids.slice(0, 2).map(anh).join('|') === truoc.split('|').slice(0, 2).join('|'), 'Hoàn tác phải về nguyên trạng');
    } finally { if ((conn.prepare('SELECT status FROM students WHERE id = ?').get(ids[2]) as any).status === 'finished') svc.hocLai(P.mbManager, ids[2]); }
  });

  await checkAsync('LUIb-9 · làm nhiều em: lỗi MỘT em không cuộn lại em khác; ngoài quyền / thiếu điều kiện ghi "message"; GVCN 403 cả lô; > 8 em một lần ghi 400; > 200 em xem trước 400', async () => {
    const hl: any = await import('../students/hangLoat.ts');
    const trongMb = (conn.prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
        WHERE e.class_id = ? AND s.status = 'active' AND s.archived_at IS NULL ORDER BY s.id LIMIT 2`).all(classId('MB FT 101')) as any[]).map((r) => r.id as number);
    const ngoai = (conn.prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
        JOIN classes c ON c.id = e.class_id JOIN branches b ON b.id = c.branch_id WHERE b.code != 'MB' AND s.status = 'active' ORDER BY s.id LIMIT 1`).get() as any).id as number;
    const lop = [trongMb[0], ngoai, trongMb[1]];
    try {
      const kq = hl.chay(P.mbManager, { viec: 'ket-thuc', studentIds: lop, lyDo: 'Cuối khoá' });
      assert(kq.ok.join() === [trongMb[0], trongMb[1]].join() && kq.failed.length === 1 && kq.failed[0].studentId === ngoai && kq.failed[0].message === 'Ngoài phạm vi của bạn.', JSON.stringify(kq));
      assert((conn.prepare('SELECT status FROM students WHERE id = ?').get(ngoai) as any).status === 'active', 'em ngoài quyền không được đổi');
      assert(maLoi(() => hl.chay(P.coreTeacher, { viec: 'ket-thuc', studentIds: trongMb, lyDo: 'x' })) === 403, 'GVCN 403 cả lô');
      assert(maLoi(() => hl.chay(P.mbManager, { viec: 'ket-thuc', studentIds: Array.from({ length: 9 }, (_, i) => i + 1), lyDo: 'x' })) === 400, '9 em một lần ghi');
      assert(maLoi(() => hl.xemTruoc(P.mbManager, { viec: 'ket-thuc', studentIds: Array.from({ length: 201 }, (_, i) => i + 1) })) === 400, '201 em xem trước');
      assert(maLoi(() => hl.chay(P.mbManager, { viec: 'ket-thuc', studentIds: [] })) === 400 && maLoi(() => hl.chay(P.mbManager, { viec: 'xoa', studentIds: [1] })) === 400, 'rỗng / việc lạ');
      assert(maLoi(() => hl.chay(P.mbManager, { viec: 'ket-thuc', studentIds: [trongMb[0]] })) === 400, 'Kết thúc học không lý do → 400');
    } finally { for (const id of trongMb) if ((conn.prepare('SELECT status FROM students WHERE id = ?').get(id) as any).status === 'finished') svc.hocLai(P.mbManager, id); }
  });

  await checkAsync('LUIb-10 · Lưu trữ / Bỏ lưu trữ nhiều em: chỉ em đã kết thúc; Bỏ lưu trữ không làm em học lại', async () => {
    const hl: any = await import('../students/hangLoat.ts');
    const sid = emDangHoc('MB FT 101');
    try {
      assert(hl.xemTruoc(P.mbManager, { viec: 'luu-tru', studentIds: [sid] }).rows[0].lyDoBo === 'Chưa kết thúc học', 'em đang học không lưu trữ được');
      hl.chay(P.mbManager, { viec: 'ket-thuc', studentIds: [sid], lyDo: 'Cuối khoá' });
      assert(hl.chay(P.mbManager, { viec: 'bo-luu-tru', studentIds: [sid] }).ok.length === 1, 'bỏ lưu trữ');
      const s = conn.prepare('SELECT status, archived_at FROM students WHERE id = ?').get(sid) as any;
      assert(s.status === 'finished' && s.archived_at === null, `bỏ lưu trữ không phải học lại: ${JSON.stringify(s)}`);
      assert(hl.chay(P.mbManager, { viec: 'luu-tru', studentIds: [sid] }).ok.length === 1, 'lưu trữ lại');
      assert((conn.prepare('SELECT archived_at FROM students WHERE id = ?').get(sid) as any).archived_at !== null, 'đã lưu trữ');
    } finally { if ((conn.prepare('SELECT status FROM students WHERE id = ?').get(sid) as any).status === 'finished') svc.hocLai(P.mbManager, sid); }
  });
```

- [x] **Step 2: Chạy — đỏ** (không tìm thấy `../students/hangLoat.ts`).

- [x] **Step 3: `server/src/students/hangLoat.ts`** (làm **sau Task 4** — gọi `huyNhieuLenh` / `khoiPhucLenh`)

```ts
import { db, theoLo, tx } from '../db.ts';
import {
  LO_HANG_LOAT_EM, PERMISSIONS, TOI_DA_HANG_LOAT_EM, VIEC_HANG_LOAT,
  type DongXemTruoc, type KetQuaHangLoat, type ViecHangLoat, type XemTruocHangLoat,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { HttpError, badRequest, chuTuDo, forbidden } from '../util.ts';
import { can, napTruocPhamVi, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { chanGiaoDichNeuSapHetGio } from '../platform/hanGio.ts';
import { huyNhieuLenh, khoiPhucLenh } from '../classes/lenhChuyen.ts';
import { archiveStudent, hocLai, setStudentStatus, unarchiveStudent } from './students.ts';

/**
 * LÀM NHIỀU HỌC VIÊN MỘT LẦN (PR-LUI-b, chủ sản phẩm 06/10) — Kết thúc học · Lưu trữ · Bỏ lưu trữ · Học lại · Huỷ chuyển lớp · Khôi phục chuyển lớp. CHỈ Quản lý /
 * Quản trị (`plan.week` của TỪNG học viên). Không có luật riêng: mỗi học viên đi qua đúng hàm một em (`setStudentStatus`, `archiveStudent`, `unarchiveStudent`,
 * `hocLai`, `huyNhieuLenh`, `khoiPhucLenh`). MỖI HỌC VIÊN MỘT GIAO DỊCH — lỗi một em (ngoài quyền, sai trạng thái, máy chủ sắp hết giờ) không cuộn lại các em đã xong; kết quả
 * trả `ok` + `failed` để web nói "Đã lưu n học viên · m học viên chưa lưu".
 * ponytail: không có "một giao dịch cho cả lô" — cố ý (lỗi giữa chừng phải giữ phần đã lưu); thêm khoá chống gửi trùng nếu cần: các việc đều lặp lại an toàn.
 */
const CHI_QL = 'Chỉ Quản lý mới làm được việc này cho nhiều học viên.';

function docViec(v: unknown): ViecHangLoat {
  if (!(VIEC_HANG_LOAT as readonly unknown[]).includes(v)) throw badRequest('Việc không hợp lệ.');
  return v as ViecHangLoat;
}
function docIds(v: unknown, toiDa: number): number[] {
  if (!Array.isArray(v) || !v.length) throw badRequest('Chưa chọn học viên nào.');
  const ids = [...new Set(v.map(Number))];
  if (ids.some((x) => !Number.isInteger(x) || x <= 0)) throw badRequest('Mã học viên không hợp lệ.');
  if (ids.length > toiDa) throw badRequest(`Tối đa ${toiDa} học viên một lần.`);
  return ids;
}

type Em = { s: any; lopCuoi: any | null; lenhCho: any | null; lenhHuy: any | null };

/** Em này có làm được `viec` không? Chữ = KHÔNG (lý do ngắn hiện ở màn xem trước và ở "chưa lưu"); `null` = làm được. */
function lyDoBo(p: Principal, viec: ViecHangLoat, e: Em): string | null {
  const { s, lopCuoi } = e;
  if (!can(p, PERMISSIONS.PLAN_WEEK, { studentId: s.id })) return 'Ngoài phạm vi của bạn.';
  switch (viec) {
    case 'ket-thuc': return s.status === 'finished' ? 'Đã kết thúc học' : null;
    case 'luu-tru': return s.status !== 'finished' ? 'Chưa kết thúc học' : s.archived_at ? 'Đã lưu trữ' : null;
    case 'bo-luu-tru': return s.archived_at ? null : 'Chưa lưu trữ';
    case 'hoc-lai': return s.status !== 'finished' ? 'Đang học' : lopCuoi?.status !== 'completed' ? 'Chưa có lớp để học lại' : null;
    case 'huy-lenh': return e.lenhCho ? null : 'Chưa có quyết định chuyển lớp';
    case 'khoi-phuc-lenh': return e.lenhHuy ? null : 'Không có quyết định vừa huỷ để khôi phục';
  }
}

function docEm(ids: number[]): Map<number, Em> {
  const conn = db();
  const kq = new Map<number, Em>();
  theoLo(ids, (lo, ph) => {
    for (const s of conn.prepare(`SELECT id, student_code, full_name, status, archived_at FROM students WHERE id IN (${ph})`).all(...lo) as any[]) {
      kq.set(s.id, { s, lopCuoi: null, lenhCho: null, lenhHuy: null });
    }
    /* Ghi danh MỚI NHẤT mỗi em (id lớn nhất đè) — cùng cách `hocLai` chọn dòng `completed` cuối. */
    for (const r of conn.prepare(
      `SELECT e.student_id, e.status, e.class_id, c.code, c.status AS class_status FROM enrollments e JOIN classes c ON c.id = e.class_id
        WHERE e.student_id IN (${ph}) ORDER BY e.id`,
    ).all(...lo) as any[]) { const e = kq.get(r.student_id); if (e) e.lopCuoi = r; }
    for (const l of conn.prepare(`SELECT id, student_id, huong, lop_nguon_id FROM lenh_chuyen_lop WHERE trang_thai = 'cho' AND student_id IN (${ph})`).all(...lo) as any[]) {
      const e = kq.get(l.student_id); if (e) e.lenhCho = l;
    }
    /* Quyết định huỷ GẦN NHẤT của em (lệnh nào cũng được — `khoiPhucLenh` kiểm người huỷ, giờ, tuần, em còn ở lớp nguồn). */
    for (const l of conn.prepare(`SELECT id, student_id, huong, lop_nguon_id FROM lenh_chuyen_lop WHERE trang_thai = 'huy' AND student_id IN (${ph}) ORDER BY id`).all(...lo) as any[]) {
      const e = kq.get(l.student_id); if (e) e.lenhHuy = l;
    }
  });
  return kq;
}

/** POST /hang-loat-hoc-vien/xem-truoc — KHÔNG ghi gì. Mỗi học viên một dòng (`lyDoBo`) + số hệ quả của cả lô. */
export function xemTruoc(p: Principal, input: { viec?: unknown; studentIds?: unknown }): XemTruocHangLoat {
  const viec = docViec(input?.viec);
  const ids = docIds(input?.studentIds, TOI_DA_HANG_LOAT_EM);
  napTruocPhamVi(ids);
  const em = docEm(ids);
  const rows: DongXemTruoc[] = ids.map((id) => {
    const e = em.get(id);
    if (!e) return { studentId: id, ten: `#${id}`, ma: '', lop: null, trangThai: 'dang-hoc', lyDoBo: 'Không tìm thấy học viên.' };
    const s = e.s;
    return {
      studentId: id, ten: s.full_name, ma: s.student_code, lop: e.lopCuoi?.code ?? null,
      trangThai: s.archived_at ? 'luu-tru' : s.status === 'finished' ? 'da-ket-thuc' : s.status === 'inactive' ? 'tam-dung' : 'dang-hoc',
      lyDoBo: lyDoBo(p, viec, e),
    };
  });
  const duoc = rows.filter((r) => !r.lyDoBo);
  const tong = { duoc: duoc.length, boQua: rows.length - duoc.length, caseDong: 0, paHuy: 0, lenhHuy: 0, lopMoLai: [] as string[], theoHuong: {} as Record<string, number> };
  if (viec === 'ket-thuc' && duoc.length) {
    const conn = db();
    theoLo(duoc.map((r) => r.studentId), (lo, ph) => {
      /* Cùng cách chọn Case của `closeCasesBySystem` (`systemClose.ts:67-73`): em của Case = `student_id` hoặc em của lượt Test gắn Case. */
      tong.caseDong += (conn.prepare(
        `SELECT COUNT(*) n FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
          WHERE COALESCE(sc.student_id, a.student_id) IN (${ph}) AND sc.status != 'done'`,
      ).get(...lo) as any).n;
      tong.paHuy += (conn.prepare(
        `SELECT COUNT(*) n FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
          WHERE COALESCE(sc.student_id, a.student_id) IN (${ph}) AND sc.status != 'done' AND iv.status IN ('planned', 'started')`,
      ).get(...lo) as any).n;
      /* Lệnh còn chờ của em đã rời lớp nguồn sẽ bị máy tự huỷ lúc thi hành (`lenhChuyen.ts` — "Em không còn học lớp nguồn"). */
      tong.lenhHuy += (conn.prepare(`SELECT COUNT(*) n FROM lenh_chuyen_lop WHERE trang_thai = 'cho' AND student_id IN (${ph})`).get(...lo) as any).n;
    });
  }
  if (viec === 'hoc-lai') {
    tong.lopMoLai = [...new Set(duoc.map((r) => em.get(r.studentId)!.lopCuoi).filter((l) => l?.class_status === 'finished').map((l) => l.code as string))];
  }
  if (viec === 'huy-lenh') {
    for (const r of duoc) { const h = em.get(r.studentId)!.lenhCho.huong as string; tong.theoHuong[h] = (tong.theoHuong[h] ?? 0) + 1; }
  }
  return { viec, rows, tong };
}

/** POST /hang-loat-hoc-vien — làm ≤ `LO_HANG_LOAT_EM` học viên. Trả `ok` (đã làm) và `failed` (em nào, vì sao chưa). */
export function chay(p: Principal, input: {
  viec?: unknown; studentIds?: unknown; lyDo?: unknown; date?: unknown; moLaiLop?: unknown; lopMoiId?: unknown;
}): KetQuaHangLoat {
  const viec = docViec(input?.viec);
  const ids = docIds(input?.studentIds, LO_HANG_LOAT_EM);
  const lyDo = chuTuDo(input.lyDo, 'Lý do', 2000);
  const date = typeof input.date === 'string' && input.date ? input.date : undefined;
  if (viec === 'ket-thuc' && !lyDo) throw badRequest('Ghi lý do kết thúc học.');
  if (viec === 'huy-lenh' && (lyDo?.length ?? 0) < 3) throw badRequest('Ghi lý do huỷ quyết định.');
  const lopMoiId = input.lopMoiId === undefined || input.lopMoiId === null ? null : Number(input.lopMoiId);
  if (lopMoiId !== null && (!Number.isInteger(lopMoiId) || lopMoiId <= 0)) throw badRequest('Lớp chuyển đến không hợp lệ.');
  napTruocPhamVi(ids);
  const em = docEm(ids);
  /* Không học viên nào trong phạm vi người gọi → 403 cả lô (GVCN gọi thẳng API). */
  if (!ids.some((id) => em.has(id) && can(p, PERMISSIONS.PLAN_WEEK, { studentId: id }))) throw forbidden(CHI_QL);

  const kq: KetQuaHangLoat = { ok: [], failed: [] };
  const lyDoCua = (id: number): string | null => { const e = em.get(id); return e ? lyDoBo(p, viec, e) : 'Không tìm thấy học viên.'; };
  const lamDuoc: number[] = [];
  for (const id of ids) { const bo = lyDoCua(id); if (bo) kq.failed.push({ studentId: id, message: bo }); else lamDuoc.push(id); }

  if (viec === 'huy-lenh') {
    /* MỘT lần gọi cho cả lô: mỗi lệnh một giao dịch bên trong, nhưng chuông gom MỘT cái cho mỗi người nhận. */
    const theoLenh = new Map(lamDuoc.map((id) => [em.get(id)!.lenhCho.id as number, id]));
    const r = huyNhieuLenh(p, [...theoLenh.keys()], lyDo);
    kq.ok.push(...r.ok.map((lid) => theoLenh.get(lid)!));
    kq.failed.push(...r.failed.map((f) => ({ studentId: theoLenh.get(f.id) ?? f.studentId, message: f.message })));
  } else {
    for (const id of lamDuoc) {
      const e = em.get(id)!;
      try {
        tx(() => {
          chanGiaoDichNeuSapHetGio();   // sắp hết giờ → 503 "chưa lưu" cho em này (và các em sau)
          if (viec === 'ket-thuc') setStudentStatus(p, id, 'finished', date ?? demoToday(), lyDo ?? undefined);
          else if (viec === 'luu-tru') archiveStudent(p, id);
          else if (viec === 'bo-luu-tru') unarchiveStudent(p, id);
          else if (viec === 'hoc-lai') hocLai(p, id, { date, lyDo, moLaiLop: input.moLaiLop === true, lopMoiId });
          else { const r = khoiPhucLenh(p, [e.lenhHuy.id]); if (r.failed.length) throw new HttpError(409, r.failed[0].message); }
        });
        kq.ok.push(id);
      } catch (err) {
        if (!(err instanceof HttpError)) throw err;
        kq.failed.push({ studentId: id, message: err.message });
      }
    }
  }
  if (kq.ok.length) {
    writeAudit({ actorUserId: p.userId, action: 'student.hang_loat', entityType: 'student', entityId: null,
      after: { viec, soEm: kq.ok.length, soLoi: kq.failed.length, studentIds: kq.ok, lyDo, date: date ?? null, lopMoiId } });
  }
  return kq;
}
```

Phép kiểm (thêm vào Step 1): sau LUIb-10 —

```ts
  await checkAsync('LUIb-10b · Huỷ chuyển lớp qua làm nhiều học viên: huỷ rồi Khôi phục về đúng quyết định; một chuông mỗi người nhận; em không có quyết định → bỏ qua có lý do', async () => {
    const hl: any = await import('../students/hangLoat.ts');
    const lenh: any = await import('../classes/lenhChuyen.ts');
    const nguon = classId('MB FT 101');
    const em = (conn.prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
        WHERE e.class_id = ? AND s.status = 'active' AND s.archived_at IS NULL AND NOT EXISTS (SELECT 1 FROM lenh_chuyen_lop l WHERE l.student_id = s.id AND l.trang_thai = 'cho')
        ORDER BY s.id LIMIT 3`).all(nguon) as any[]).map((r) => r.id as number);
    assert(em.length === 3, 'cần 3 em chưa có quyết định');
    const tuan = d.tuanChonDuoc(TODAY)[0];
    lenh.raLenh(P.mbManager, { lopNguonId: nguon, boiCanh: 'giua-khoa', tuanChung: null, dongs: em.slice(0, 2).map((studentId: number) => ({ studentId, huong: 'bao_luu', tuan, lyDo: 'Đi xa', ngayXemLai: addDays(TODAY, 60) })) });
    try {
      const xt = hl.xemTruoc(P.mbManager, { viec: 'huy-lenh', studentIds: em });
      assert(xt.tong.duoc === 2 && xt.tong.boQua === 1 && xt.tong.theoHuong.bao_luu === 2, JSON.stringify(xt.tong));
      assert(xt.rows.find((r: any) => r.studentId === em[2]).lyDoBo === 'Chưa có quyết định chuyển lớp', 'em không có quyết định phải bị bỏ qua');
      assert(maLoi(() => hl.chay(P.mbManager, { viec: 'huy-lenh', studentIds: em, lyDo: 'ab' })) === 400, 'lý do < 3 ký tự');
      const kq = hl.chay(P.mbManager, { viec: 'huy-lenh', studentIds: em, lyDo: 'Đã đổi ý' });
      assert(kq.ok.length === 2 && kq.failed.length === 1 && kq.failed[0].studentId === em[2], JSON.stringify(kq));
      assert((conn.prepare(`SELECT COUNT(*) n FROM lenh_chuyen_lop WHERE student_id IN (${em[0]}, ${em[1]}) AND trang_thai = 'cho'`).get() as any).n === 0, 'cả hai phải huỷ');
      const kp = hl.chay(P.mbManager, { viec: 'khoi-phuc-lenh', studentIds: kq.ok });
      assert(kp.ok.length === 2 && kp.failed.length === 0, JSON.stringify(kp));
      assert((conn.prepare(`SELECT COUNT(*) n FROM lenh_chuyen_lop WHERE student_id IN (${em[0]}, ${em[1]}) AND trang_thai = 'cho'`).get() as any).n === 2, 'cả hai phải về chờ');
    } finally { conn.prepare(`UPDATE lenh_chuyen_lop SET trang_thai = 'huy' WHERE student_id IN (${em.join(',')}) AND trang_thai = 'cho'`).run(); }
  });
```

- [x] **Step 4: Route** (cạnh các route học viên, trước `// === Họp tuần` ~dòng 1858)

```ts
/** PR-LUI-b: làm nhiều em một lần — Kết thúc học · Lưu trữ · Bỏ lưu trữ · Học lại. Chỉ Quản lý / Quản trị (kiểm từng em ở máy chủ). */
api.post('/hang-loat-hoc-vien/xem-truoc', requireAuth, wrap((req) => hangLoatSvc.xemTruoc(principalOf(req), req.body ?? {})));
api.post('/hang-loat-hoc-vien', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return hangLoatSvc.chay(principalOf(req), req.body ?? {});
}));
```
và import đầu file cạnh `studentSvc`: `import * as hangLoatSvc from '../students/hangLoat.ts';` (xem cách `studentSvc` được import: `grep -n "studentSvc" server/src/routes/index.ts | head -2`).

- [x] **Step 5: Chạy — xanh.** Expected: LUIb-8, 9, 10 PASS. Nếu LUIb-9 báo `ngoai` không tìm được (seed không có em ở chi nhánh khác `MB`): đọc `branches.code` thật bằng `SELECT code FROM branches` rồi sửa điều kiện — **không** bỏ phép kiểm ngoài phạm vi.

- [x] **Step 6: Commit**

```bash
git add server/src/students/hangLoat.ts server/src/routes/index.ts server/src/tests/prLuiB.tests.ts
git commit -m "PR-LUI-b: máy chủ làm nhiều em (xem trước + chạy theo lô, mỗi em một giao dịch)"
```

---

### Task 4: Máy chủ — huỷ nhiều quyết định chuyển lớp + Khôi phục

**Files:**
- Modify: `server/src/classes/lenhChuyen.ts:230-256` (tách `huyMotLenh`; thêm `huyNhieuLenh`, `khoiPhucLenh`)
- Modify: `server/src/routes/index.ts` (hai route, cạnh `:1344`)
- Test: `server/src/tests/prLuiB.tests.ts`

**Interfaces:**
- Consumes: `docLenh`, `kiemConSuaDuoc`, `nguoiNhanCuaLop`, `thongBaoSapNhan`, `KHOI_PHUC_LENH_GIO`.
- Produces: `huyNhieuLenh(p, ids: number[], lyDo: unknown): { ok: number[]; failed: { id: number; studentId: number; message: string }[] }`; `khoiPhucLenh(p, ids: number[]): same` (hàm, không route).

- [x] **Step 1: Phép kiểm đỏ**

```ts
  await checkAsync('LUIb-11 · huỷ nhiều quyết định chuyển lớp: một chuông mỗi người nhận; em lỗi không cuộn lại em khác; Khôi phục chỉ lệnh do NGƯỜI huỷ, còn tương lai, em chưa có lệnh khác', async () => {
    const lenh: any = await import('../classes/lenhChuyen.ts');
    const nguon = classId('MB FT 101');
    const em = (conn.prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
        WHERE e.class_id = ? AND s.status = 'active' AND s.archived_at IS NULL AND NOT EXISTS (SELECT 1 FROM lenh_chuyen_lop l WHERE l.student_id = s.id AND l.trang_thai = 'cho')
        ORDER BY s.id LIMIT 3`).all(nguon) as any[]).map((r) => r.id as number);
    assert(em.length === 3, 'cần 3 em chưa có quyết định');
    const tuan = d.tuanChonDuoc(TODAY)[0];
    const r = lenh.raLenh(P.mbManager, { lopNguonId: nguon, boiCanh: 'giua-khoa', tuanChung: null, dongs: em.map((studentId) => ({
      studentId, huong: 'bao_luu', tuan, lyDo: 'Đi xa', ngayXemLai: addDays(TODAY, 60) })) });
    assert(r.ok.length === 3 && r.failed.length === 0, JSON.stringify(r));
    const idLenh = (sid: number) => (conn.prepare(`SELECT id FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`).get(sid) as any).id as number;
    const ids = em.map(idLenh);
    try {
      assert(maLoi(() => lenh.huyNhieuLenh(P.mbManager, ids, 'ab')) === 400, 'lý do < 3 ký tự');
      assert(maLoi(() => lenh.huyNhieuLenh(P.cpManager, ids, 'Đã đổi ý')) === 403, 'QL chi nhánh khác 403 cả lô');
      conn.prepare(`DELETE FROM notifications WHERE kind = 'huy_lenh'`).run();
      const kq = lenh.huyNhieuLenh(P.mbManager, [...ids, 999999], 'Đã đổi ý');
      assert(kq.ok.length === 3 && kq.failed.length === 1 && kq.failed[0].id === 999999, JSON.stringify(kq));
      assert(ids.every((id) => (conn.prepare('SELECT trang_thai FROM lenh_chuyen_lop WHERE id = ?').get(id) as any).trang_thai === 'huy'), 'cả ba phải huỷ');
      const chuong = conn.prepare(`SELECT user_id, COUNT(*) n FROM notifications WHERE kind = 'huy_lenh' GROUP BY user_id`).all() as any[];
      assert(chuong.every((c) => c.n === 1), `một chuông mỗi người nhận, không một chuông mỗi em: ${JSON.stringify(chuong)}`);
      /* Khôi phục */
      assert(maLoi(() => lenh.khoiPhucLenh(P.cpManager, ids)) === 403, 'QL chi nhánh khác 403');
      const kp = lenh.khoiPhucLenh(P.mbManager, ids);
      assert(kp.ok.length === 3 && kp.failed.length === 0, JSON.stringify(kp));
      assert(ids.every((id) => { const l = conn.prepare('SELECT trang_thai, huy_boi, huy_luc, ly_do_huy FROM lenh_chuyen_lop WHERE id = ?').get(id) as any; return l.trang_thai === 'cho' && l.huy_boi === null && l.huy_luc === null && l.ly_do_huy === null; }), 'phải về chờ, xoá dấu huỷ');
      /* Huỷ lại, rồi cho em đã có quyết định khác → khôi phục lệnh cũ phải bị chặn; lệnh máy huỷ (huy_boi NULL) không khôi phục */
      lenh.huyNhieuLenh(P.mbManager, ids, 'Đã đổi ý');
      conn.prepare(`UPDATE lenh_chuyen_lop SET huy_boi = NULL WHERE id = ?`).run(ids[0]);
      const ra2 = lenh.raLenh(P.mbManager, { lopNguonId: nguon, boiCanh: 'giua-khoa', tuanChung: null, dongs: [{ studentId: em[1], huong: 'bao_luu', tuan, lyDo: 'Mới', ngayXemLai: addDays(TODAY, 60) }] });
      assert(ra2.ok.length === 1, JSON.stringify(ra2));
      const kp2 = lenh.khoiPhucLenh(P.mbManager, ids);
      const lyDoLoi = Object.fromEntries(kp2.failed.map((f: any) => [f.id, f.message]));
      assert(kp2.ok.join() === String(ids[2]) && lyDoLoi[ids[0]] === 'Quyết định do hệ thống huỷ — không khôi phục được.' && lyDoLoi[ids[1]] === 'Em đã có quyết định chuyển lớp khác.', JSON.stringify(kp2));
      /* quá 24 giờ */
      conn.prepare(`UPDATE lenh_chuyen_lop SET trang_thai = 'huy', huy_boi = ?, huy_luc = ? WHERE id = ?`).run(P.mbManager.userId, new Date(Date.now() - 25 * 3600_000).toISOString(), ids[2]);
      assert(lenh.khoiPhucLenh(P.mbManager, [ids[2]]).failed[0].message === 'Đã quá 24 giờ — ra quyết định mới.', 'quá 24 giờ');
    } finally { conn.prepare(`UPDATE lenh_chuyen_lop SET trang_thai = 'huy' WHERE student_id IN (${em.join(',')}) AND trang_thai = 'cho'`).run(); }
  });
```

- [x] **Step 2: Chạy — đỏ.**

- [x] **Step 3: `lenhChuyen.ts`** — thay thân `huyLenh` (dòng 230-256) bằng ba hàm; `huyLenh` giữ chữ ký & hành vi (phép kiểm cũ vẫn xanh):

```ts
/** Huỷ MỘT lệnh còn `cho` trong giao dịch đang mở — không kiểm quyền, không gửi chuông (nơi gọi lo). */
function huyMotLenh(p: Principal, l: any, why: string): void {
  const conn = db();
  const r = conn.prepare(
    `UPDATE lenh_chuyen_lop SET trang_thai = 'huy', huy_boi = ?, huy_luc = ?, ly_do_huy = ?, sua_luc = ? WHERE id = ? AND trang_thai = 'cho'`,
  ).run(p.userId, nowIso(), why, nowIso(), l.id);
  if (!r.changes) throw conflict('Quyết định chuyển lớp vừa được thi hành hoặc đã huỷ.');
  const hv = conn.prepare('SELECT full_name FROM students WHERE id = ?').get(l.student_id) as any;
  writeAudit({ actorUserId: p.userId, action: 'lenh_chuyen.huy', entityType: 'student', entityId: l.student_id, entityLabel: hv?.full_name ?? null, before: { huong: l.huong, tuan: l.tuan_bat_dau }, after: { lyDo: why } });
}

export function huyLenh(p: Principal, id: number, lyDo: string): void {
  const l = docLenh(id);
  require_(p, PERMISSIONS.CLASS_EDIT, { classId: l.lop_nguon_id }, CUNG_LOP_CHI_NHANH);
  const why = String(lyDo ?? '').trim();
  if (why.length < 3) throw badRequest('Ghi lý do huỷ quyết định.');
  kiemConSuaDuoc(l);
  tx(() => {
    const conn = db();
    huyMotLenh(p, l, why);
    const hv = conn.prepare('SELECT full_name FROM students WHERE id = ?').get(l.student_id) as any;
    const ma = new Map((conn.prepare('SELECT id, code FROM classes WHERE id IN (?, ?)').all(l.lop_nguon_id, l.lop_dich_id ?? l.lop_nguon_id) as any[]).map((r) => [r.id as number, r.code as string]));
    const nhan = nguoiNhanCuaLop([l.lop_nguon_id, ...(l.lop_dich_id ? [l.lop_dich_id] : [])]);
    const tatCa = new Set([...(nhan.get(l.lop_nguon_id) ?? []), ...(l.lop_dich_id ? nhan.get(l.lop_dich_id) ?? [] : [])]);
    for (const userId of tatCa) {
      if (userId === p.userId) continue;
      notify({
        userId, kind: 'huy_lenh', title: `Đã huỷ quyết định chuyển lớp · ${hv?.full_name ?? 'học viên'}`,
        body: `${ma.get(l.lop_nguon_id)}${l.lop_dich_id ? ` → ${ma.get(l.lop_dich_id)}` : ''} · ${why}`,
        entityType: 'student', entityId: l.student_id, dedupKey: `huy_lenh:${id}`,
      });
    }
  });
}

export type KetQuaLenhNhieu = { ok: number[]; failed: { id: number; studentId: number; message: string }[] };

/**
 * HUỶ NHIỀU QUYẾT ĐỊNH CHUYỂN LỚP MỘT LẦN (PR-LUI-b) — một lý do chung (≥ 3 ký tự như `huyLenh`), mỗi lệnh một giao dịch, lệnh lỗi vào `failed`.
 * Chuông: MỘT cho mỗi người nhận và mỗi lớp nguồn ("Đã huỷ n quyết định chuyển lớp · MB FT 101"), không một chuông mỗi em. ≤ `LO_HANG_LOAT_EM` lệnh một lần ghi.
 */
export function huyNhieuLenh(p: Principal, ids: unknown, lyDo: unknown): KetQuaLenhNhieu {
  const ds = docDanhSachLenh(ids);
  const why = String(lyDo ?? '').trim();
  if (why.length < 3) throw badRequest('Ghi lý do huỷ quyết định.');
  const kq: KetQuaLenhNhieu = { ok: [], failed: [] };
  const daHuy: any[] = [];
  for (const id of ds) {
    let l: any = null;
    try {
      l = docLenh(id);
      require_(p, PERMISSIONS.CLASS_EDIT, { classId: l.lop_nguon_id }, CUNG_LOP_CHI_NHANH);
      kiemConSuaDuoc(l);
      tx(() => huyMotLenh(p, l, why));
      kq.ok.push(id); daHuy.push(l);
    } catch (e) {
      if (!(e instanceof HttpError)) throw e;
      kq.failed.push({ id, studentId: l?.student_id ?? 0, message: e.message });
    }
  }
  /* Không lệnh nào trong phạm vi người gọi → 403 cả lô. */
  if (!kq.ok.length && kq.failed.length && kq.failed.every((f) => f.message === CUNG_LOP_CHI_NHANH)) throw forbidden(CUNG_LOP_CHI_NHANH);
  guiChuongHuyNhieu(p, daHuy, why);
  return kq;
}

/** Một chuông / người nhận / lớp nguồn. `dedupKey` theo lệnh đầu của nhóm: gọi lại cùng lô không nhân chuông. */
function guiChuongHuyNhieu(p: Principal, ds: any[], why: string) {
  if (!ds.length) return;
  const conn = db();
  const theoNguon = new Map<number, any[]>();
  for (const l of ds) { if (!theoNguon.has(l.lop_nguon_id)) theoNguon.set(l.lop_nguon_id, []); theoNguon.get(l.lop_nguon_id)!.push(l); }
  const lopIds = [...new Set(ds.flatMap((l) => [l.lop_nguon_id, ...(l.lop_dich_id ? [l.lop_dich_id] : [])]))];
  const nhan = nguoiNhanCuaLop(lopIds);
  const ma = new Map<number, string>();
  theoLo(lopIds, (lo, ph) => { for (const r of conn.prepare(`SELECT id, code FROM classes WHERE id IN (${ph})`).all(...lo) as any[]) ma.set(r.id, r.code); });
  for (const [nguonId, nhom] of theoNguon) {
    const tatCa = new Set([...(nhan.get(nguonId) ?? []), ...nhom.flatMap((l) => (l.lop_dich_id ? [...(nhan.get(l.lop_dich_id) ?? [])] : []))]);
    for (const userId of tatCa) {
      if (userId === p.userId) continue;
      notify({
        userId, kind: 'huy_lenh', title: `Đã huỷ ${nhom.length} quyết định chuyển lớp · ${ma.get(nguonId)}`, body: why,
        entityType: 'class', entityId: nguonId, dedupKey: `huy_lenh_lo:${nhom[0].id}`, duong: `/hoc-vien/lop/${nguonId}`,
      });
    }
  }
}

/**
 * KHÔI PHỤC QUYẾT ĐỊNH CHUYỂN LỚP VỪA HUỶ (nút Hoàn tác của huỷ nhiều quyết định). Chỉ lệnh do NGƯỜI huỷ (`huy_boi` có), trong `KHOI_PHUC_LENH_GIO` giờ,
 * em còn ghi danh `active` ở lớp nguồn, em chưa có lệnh `cho` khác, tuần bắt đầu còn ở tương lai, lớp chuyển đến còn hoạt động. Đưa về `cho`, xoá dấu huỷ.
 */
export function khoiPhucLenh(p: Principal, ids: unknown): KetQuaLenhNhieu {
  const ds = docDanhSachLenh(ids);
  const conn = db();
  const kq: KetQuaLenhNhieu = { ok: [], failed: [] };
  const homNay = demoToday();
  const khoi: any[] = [];
  for (const id of ds) {
    let l: any = null;
    try {
      l = docLenh(id);
      require_(p, PERMISSIONS.CLASS_EDIT, { classId: l.lop_nguon_id }, CUNG_LOP_CHI_NHANH);
      if (l.trang_thai === 'cho') throw conflict('Quyết định đã ở trạng thái chờ.');
      if (l.trang_thai !== 'huy') throw conflict('Quyết định đã thi hành — không khôi phục được.');
      if (!l.huy_boi) throw conflict('Quyết định do hệ thống huỷ — không khôi phục được.');
      if (Date.now() - Date.parse(String(l.huy_luc)) > KHOI_PHUC_LENH_GIO * 3600_000) throw conflict(`Đã quá ${KHOI_PHUC_LENH_GIO} giờ — ra quyết định mới.`);
      if (l.tuan_bat_dau <= homNay) throw conflict('Tuần bắt đầu đã tới — ra quyết định mới.');
      tx(() => {
        const o = conn.prepare(`SELECT 1 FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`).get(l.student_id);
        if (o) throw conflict('Em đã có quyết định chuyển lớp khác.');
        const con = conn.prepare(`SELECT 1 FROM enrollments WHERE student_id = ? AND class_id = ? AND status = 'active'`).get(l.student_id, l.lop_nguon_id);
        if (!con) throw conflict('Em không còn học lớp nguồn.');
        if (l.lop_dich_id && !conn.prepare(`SELECT 1 FROM classes WHERE id = ? AND status = 'active'`).get(l.lop_dich_id)) throw conflict('Lớp chuyển đến đã kết thúc.');
        conn.prepare(
          `UPDATE lenh_chuyen_lop SET trang_thai = 'cho', huy_boi = NULL, huy_luc = NULL, ly_do_huy = NULL, thu_ngay = NULL, loi = NULL, sua_luc = ?
            WHERE id = ? AND trang_thai = 'huy'`,
        ).run(nowIso(), id);
        writeAudit({ actorUserId: p.userId, action: 'lenh_chuyen.khoi_phuc', entityType: 'student', entityId: l.student_id, before: { trangThai: 'huy' }, after: { huong: l.huong, tuan: l.tuan_bat_dau } });
      });
      kq.ok.push(id); khoi.push(l);
    } catch (e) {
      if (!(e instanceof HttpError)) throw e;
      kq.failed.push({ id, studentId: l?.student_id ?? 0, message: e.message });
    }
  }
  if (!kq.ok.length && kq.failed.length && kq.failed.every((f) => f.message === CUNG_LOP_CHI_NHANH)) throw forbidden(CUNG_LOP_CHI_NHANH);
  /* Số "Sắp nhận" của lớp chuyển đến đếm lại từ bảng (`thongBaoSapNhan`) — cập nhật chuông cùng ngày. */
  for (const [nguonId, nhom] of Map.groupBy(khoi, (l: any) => l.lop_nguon_id as number)) {
    const nguon = conn.prepare('SELECT * FROM classes WHERE id = ?').get(nguonId) as any;
    const dich = new Map<number, any>();
    for (const l of nhom) if (l.lop_dich_id) dich.set(l.lop_dich_id, conn.prepare('SELECT id, code, programme_code, is_fast_track, branch_id FROM classes WHERE id = ?').get(l.lop_dich_id));
    thongBaoSapNhan(p, nguon, [...dich.keys()], dich, homNay);
  }
  return kq;
}

function docDanhSachLenh(v: unknown): number[] {
  if (!Array.isArray(v) || !v.length) throw badRequest('Chưa chọn quyết định nào.');
  const ds = [...new Set(v.map(Number))];
  if (ds.some((x) => !Number.isInteger(x) || x <= 0)) throw badRequest('Mã quyết định không hợp lệ.');
  if (ds.length > LO_HANG_LOAT_EM) throw badRequest(`Tối đa ${LO_HANG_LOAT_EM} quyết định một lần.`);
  return ds;
}
```
Import bổ sung ở đầu `lenhChuyen.ts`: `HttpError`, `forbidden` từ `'../util.ts'` (dòng 7 hiện `badRequest, chuTuDo, conflict, notFound, nowIso`); `KHOI_PHUC_LENH_GIO`, `LO_HANG_LOAT_EM` từ `shared/domain/index.ts` (dòng 3-6). `Map.groupBy` cần Node ≥ 21 — nếu `tsc` target không có thì thay bằng vòng `for` + `Map` như `guiChuongHuyNhieu`.

Lưu ý phép kiểm: nhóm `failed` 999999 cho `docLenh` ném `notFound` (HttpError 404) → vào `failed` với `studentId: 0` — khớp `kq.failed[0].id === 999999`.

- [x] **Step 4: Không thêm route.** `huyNhieuLenh` / `khoiPhucLenh` là hàm — `students/hangLoat.ts` (Task 3) gọi, web đi qua `POST /hang-loat-hoc-vien` (việc `huy-lenh`, `khoi-phuc-lenh`). Một đường cho cả hồ sơ lớp và panel Chuyển tiếp lớp.

- [x] **Step 5: Chạy — xanh** (LUIb-11 + mọi phép kiểm `lenh_chuyen` cũ trong `prCt.tests.ts`, `prS5fA…`).

- [x] **Step 6: Commit**

```bash
git add server/src/classes/lenhChuyen.ts server/src/routes/index.ts server/src/tests/prLuiB.tests.ts
git commit -m "PR-LUI-b: huỷ nhiều quyết định chuyển lớp + Khôi phục, một chuông mỗi người nhận"
```

---

### Task 5: Máy chủ — cờ ở Lưu trữ + Quản lý kết thúc lớp (chủ sản phẩm 06/10: có)

**Files:**
- Modify: `server/src/classes/luuTru.ts:11-20, 53-59, 78-88`
- Modify: `server/src/classes/xoaKetThucLop.ts:18, 69-83, 106-109`
- Modify: `server/src/classes/classes.ts:~806`
- Test: `server/src/tests/prLuiB.tests.ts` + sửa `server/src/tests/panelUx3.tests.ts:445-449` nếu đụng

**Interfaces:**
- Produces: `LopLuuTru.coTheMoLai: boolean` (CLASS_EDIT ở lớp); `HocVienLuuTru.coTheHocLai: boolean` (cùng `coTheBoLuuTru`); (Q2-B) `viewer.coTheKetThucLop: boolean`; `xemXoaKetThuc` mở cho `CLASS_EDIT`, `coTheXoa` vẫn chỉ Quản trị.

- [x] **Step 1: Phép kiểm đỏ**

```ts
  await checkAsync('LUIb-12 · Lưu trữ: cờ coTheMoLai (lớp, QL đúng chi nhánh / QT) và coTheHocLai (em); GVCN false', async () => {
    const lt: any = await import('../classes/luuTru.ts');
    const lop = classId('MB FOU 12');
    conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`).run(TODAY, lop);
    try {
      const dong = (p: any) => lt.danhSachLuuTru(p, {}).lop.find((l: any) => l.id === lop);
      assert(dong(P.mbManager)?.coTheMoLai === true && dong(P.admin)?.coTheMoLai === true, 'QL / QT thấy nút Mở lại');
      assert(dong(P.normalCoreTeacher) === undefined || dong(P.normalCoreTeacher).coTheMoLai === false, 'GVCN không có Mở lại');
    } finally { conn.prepare(`UPDATE classes SET status = 'active', finished_at = NULL WHERE id = ?`).run(lop); }
  });
```
Q2-B thêm:
```ts
  await checkAsync('LUIb-13 · Quản lý kết thúc lớp rỗng được, lớp còn em 400, GVCN 403; Xoá lớp vẫn chỉ Quản trị', async () => {
    const xk: any = await import('../classes/xoaKetThucLop.ts');
    const lop = classId('MB FOU 12');
    assert(maLoi(() => xk.ketThucLop(P.normalCoreTeacher, lop)) === 403, 'GVCN 403');
    assert(maLoi(() => xk.ketThucLop(P.mbManager, lop)) === 400, 'còn em đang học → 400');
    assert(maLoi(() => xk.xoaLop(P.mbManager, lop, { maLop: 'MB FOU 12' })) === 403, 'Xoá lớp vẫn chỉ Quản trị');
    assert(xk.xemXoaKetThuc(P.mbManager, lop).coTheXoa === false, 'QL không thấy Xoá lớp');
  });
```

- [x] **Step 2: Chạy — đỏ.**

- [x] **Step 3: `luuTru.ts`** — kiểu `LopLuuTru` thêm `coTheMoLai: boolean;`; `HocVienLuuTru` thêm `coTheHocLai: boolean;`. Trong truy vấn lớp: sau `.map((r) => ({…}))` thêm `coTheMoLai: can(p, PERMISSIONS.CLASS_EDIT, { classId: r.id })` (đọc `classId` từ `r.id`, **ngoài** `.sort` — thêm vào object trả về ở `.map`). Trong `hocVien` map thêm `coTheHocLai: can(p, PERMISSIONS.PLAN_WEEK, { studentId: s.id }),` (cùng điều kiện `coTheBoLuuTru`). Sửa các chỗ dựng giá trị `LopLuuTru`/`HocVienLuuTru` ở web (`LuuTruPage.tsx:12-19`).

- [x] **Step 4: cổng Kết thúc lớp (Quản lý được; Xoá lớp vẫn chỉ Quản trị)**

`xoaKetThucLop.ts`:
- dòng 18 giữ `CHI_ADMIN` cho `xoaLop`; thêm `const CHI_QL_KET_THUC = 'Chỉ Quản lý của lớp này hoặc Quản trị hệ thống mới kết thúc được lớp.';`
- `xemXoaKetThuc` (dòng 69-83): đổi cổng đầu thành `require_(p, PERMISSIONS.CLASS_EDIT, { classId }, CHI_QL_KET_THUC);`; `coTheXoa: !t.coDuLieu && can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true })` (thêm `can` vào import `'../permissions.ts'`).
- `ketThucLop` (dòng 106-109): `require_(p, PERMISSIONS.CLASS_EDIT, { classId }, CHI_QL_KET_THUC);`.
- `xoaLop` giữ `require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, CHI_ADMIN)` (dòng 87).
- cập nhật chú thích đầu file (dòng 1-10): "Kết thúc lớp: Quản lý của lớp hoặc Quản trị (06/10, Q2-B PR-LUI-b); Xoá lớp: chỉ Quản trị".

`classes.ts` (cạnh `coTheMoLaiLop`): `coTheKetThucLop: !finished && can(p, PERMISSIONS.CLASS_EDIT, { classId }),`; thêm vào kiểu web `DauTrangLop.tsx:49`.

Sửa `panelUx3.tests.ts:445-449` nếu phép kiểm (11) khẳng định QL gọi `xemXoaKetThuc` → 403: đọc phép kiểm, chuyển câu cho đúng luật mới (Xoá lớp vẫn 403 với QL, Kết thúc lớp QL OK) — ghi rõ trong mô tả PR.

- [x] **Step 5: Chạy — xanh. Step 6: Commit**

```bash
git add server/src/classes/luuTru.ts server/src/classes/xoaKetThucLop.ts server/src/classes/classes.ts server/src/tests/prLuiB.tests.ts server/src/tests/panelUx3.tests.ts web/src/modules/students/LuuTruPage.tsx
git commit -m "PR-LUI-b: cờ Mở lại / Học lại ở Lưu trữ; Quản lý kết thúc lớp rỗng được (Q2-B)"
```

---

### Task 6: Web — Học lại ở hồ sơ em, có chọn đích (**chờ duyệt lại mockup mục 2–6**)

**Files:**
- Modify: `web/src/modules/students/StudentManagePanel.tsx:53-70` (thêm `case 'hoc-lai'`) + panel mới ở cuối nhóm panel
- Modify: `web/src/modules/students/StudentDetailPage.tsx:222-228` (không đổi nếu `mucQuanLyHocVien` đã trả `hoc-lai` — kiểm `data.lopHoc.quyen.hocLai` có tới web)
- Test: `server/src/tests/prLuiB.tests.ts` (phép kiểm nguồn web như các PR trước dùng `doc(...)`)

**Interfaces:**
- Consumes: `GET /students/:id/hoc-lai/lop-dich`, `POST /students/:id/hoc-lai`, `POST /students/:id/status` (Hoàn tác = Kết thúc học).
- Produces: `HocLaiPanel` (không export ngoài file).

- [x] **Step 1: Phép kiểm nguồn đỏ**

Dùng helper `doc()` như `prSl.tests.ts:1-10` (đọc file bằng `fs` + `ROOT`) — thêm đầu `prLuiB.tests.ts` (cạnh dòng `import type { YThucTestKit }`):
```ts
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const doc = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
```
rồi thêm phép kiểm:
```ts
  check('LUIb-14 · web Học lại: gọi /hoc-lai, Hoàn tác = Kết thúc học, lý do tuỳ chọn, tự mở lại lớp đã kết thúc', () => {
    const s = doc('web/src/modules/students/StudentManagePanel.tsx');
    assert(s.includes("case 'hoc-lai'") && s.includes('function HocLaiPanel'), 'thiếu panel Học lại');
    assert(s.includes('/hoc-lai`') && s.includes("moLaiLop: true"), 'phải gọi /students/:id/hoc-lai với moLaiLop');
    assert(/toast\.hoanTac\(`Đã cho \$\{studentName\} học lại`/.test(s) && s.includes("status: 'finished'"), 'Hoàn tác phải là Kết thúc học');
    assert(/<Truong nhan="Lý do" tuyChon/.test(s.slice(s.indexOf('function HocLaiPanel'))), 'Lý do phải tuỳ chọn');
  });
```

- [x] **Step 2: Chạy — đỏ.**

- [x] **Step 3: `StudentManagePanel.tsx`**

Thêm `case`:
```tsx
    case 'hoc-lai': return <HocLaiPanel {...chung} />;
```
Thêm sau `LuuTruPanel` (hết dòng 180):

```tsx
type LopDich = { id: number; code: string; ft: boolean; tenChuongTrinh: string | null; tuan: string | null; gvcn: string | null; studentCount?: number };
type DuLieuHocLai = { lopCu: { id: number; code: string; daKetThuc: boolean } | null; chiNhanh: { id: number; name: string }[]; lop: LopDich[] };

/**
 * HỌC LẠI (PR-LUI-b, chủ sản phẩm 06/10) — đường lui của Kết thúc học, chỉ Quản lý / Quản trị. CHỌN ĐÍCH: `Về lớp cũ` (lộ trình cũ chạy tiếp; lớp cũ đã kết thúc thì
 * mở lại cùng lúc) hoặc `Sang lớp mới` (chọn lớp đang học, mở lộ trình mới, lộ trình cũ giữ ở Hành trình; sang Fast Track từ lớp thường phải có Target).
 * Lý do tuỳ chọn. Hoàn tác = Kết thúc học lại (đúng hàm cũ, lý do "Hoàn tác học lại").
 */
function HocLaiPanel({ studentId, studentName, lop, onClose, onDone }: ChungViec) {
  const toast = useToast();
  const lf = useLoiForm();
  const { data, error, reload } = useApi<DuLieuHocLai>(`/students/${studentId}/hoc-lai/lop-dich`, [studentId]);
  const [dich, setDich] = useState<'cu' | 'moi'>('cu');
  const [lopMoiId, setLopMoiId] = useState<number | ''>('');
  const [target, setTarget] = useState('');
  const [thi, setThi] = useState('');
  const [lyDo, setLyDo] = useState('');
  const [ngayHl, setNgayHl] = useState('');
  const [busy, setBusy] = useState(false);
  const lopMoi = data?.lop.find((l) => l.id === lopMoiId) ?? null;
  const canTarget = dich === 'moi' && !!lopMoi?.ft;
  const loi = dsLoi([
    ...(dich === 'moi' ? [{ khoa: 'lop', nhan: 'Lớp', toiThieu: 1 }] : []),
    ...(canTarget ? [{ khoa: 'target', nhan: 'Target', toiThieu: 1 }] : []),
  ], { lop: lopMoiId === '' ? '' : String(lopMoiId), target });
  const chan = !data?.lopCu ? 'Chưa có lớp để học lại' : null;

  const luu = async () => {
    lf.bam();
    if (loi.length) return;
    setBusy(true);
    try {
      await api.post(`/students/${studentId}/hoc-lai`, {
        date: ngayHl || undefined, lyDo: lyDo.trim() || undefined, moLaiLop: true,
        ...(dich === 'moi' ? { lopMoiId, mucTieu: canTarget ? (target.trim().toUpperCase() === KCK ? KCK : Number(target)) : undefined, thangThi: thi || undefined } : {}),
      });
      for (const k of ['/students', '/classes', '/hoc-vien-lop', '/cases']) invalidate(k);
      toast.hoanTac(`Đã cho ${studentName} học lại${lopMoi ? ` · ${lopMoi.code}` : ''}`, async () => {
        try {
          await api.post(`/students/${studentId}/status`, { status: 'finished', reason: 'Hoàn tác học lại' });
          for (const k of ['/students', '/classes', '/hoc-vien-lop', '/cases']) invalidate(k);
          toast.push('ok', 'Đã hoàn tác');
          onDone();
        } catch (e: any) { toast.push('error', e.message); }
      }, { key: `hoc-lai:${studentId}` });
      onDone();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe={NHAN_VIEC['hoc-lai']} hocVien={studentName} lop={lop} onDong={onClose}
      chan={{
        daSua: !!lyDo.trim() || !!ngayHl || dich === 'moi',
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luu} disabled={busy || !data || !!chan}>Học lại</button>,
      }}>
      {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
        : !data ? <Skeleton rows={4} /> : (
          <Khoi tieuDe="Học lại">
            {chan ? <p className="m-0 text-sm text-late">{chan}</p> : null}
            <span role="group" aria-label="Học lại" className="flex flex-wrap gap-1.5">
              <NutChon chon={dich === 'cu'} onClick={() => setDich('cu')}>Về lớp cũ</NutChon>
              <NutChon chon={dich === 'moi'} onClick={() => setDich('moi')}>Sang lớp mới</NutChon>
            </span>
            {dich === 'cu' ? (
              <ul className="m-0 list-none space-y-1 p-0 text-sm text-slate-200">
                <li>Về lớp {data.lopCu?.code}</li><li>Lộ trình chạy tiếp</li><li>Ra khỏi Lưu trữ</li>
                {data.lopCu?.daKetThuc && <li className="text-soon">Mở lại lớp {data.lopCu.code}</li>}
              </ul>
            ) : (
              <>
                <Truong nhan="Lớp" batBuoc loi={lf.loiCua(loi, 'lop')}>
                  <select className="field w-full" {...lf.o(loi, 'lop')} value={lopMoiId} onChange={(e) => setLopMoiId(e.target.value ? Number(e.target.value) : '')}>
                    <option value="">Chọn lớp</option>
                    {data.lop.filter((l) => l.id !== data.lopCu?.id).map((l) => <option key={l.id} value={l.id}>{[l.code, l.ft ? 'Fast Track' : l.tenChuongTrinh, l.gvcn ? `GVCN ${l.gvcn}` : null].filter(Boolean).join(' · ')}</option>)}
                  </select>
                </Truong>
                {canTarget && (
                  <>
                    <Truong nhan="Target" batBuoc loi={lf.loiCua(loi, 'target')}>
                      <input className="field w-full max-w-[8rem]" inputMode="decimal" placeholder="6.5" {...lf.o(loi, 'target')} value={target} onChange={(e) => setTarget(e.target.value)} />
                    </Truong>
                    <Truong nhan="Dự kiến thi" tuyChon><ONgay kieu="ngay-hoac-thang" value={thi} goiY="dd/mm/yyyy hoặc mm/yyyy" onChange={setThi} /></Truong>
                  </>
                )}
                {lopMoi && (
                  <ul className="m-0 list-none space-y-1 p-0 text-sm text-slate-200">
                    <li>Vào lớp {lopMoi.code}</li><li>Lộ trình mới</li><li>Lộ trình cũ giữ ở Hành trình</li><li>Ra khỏi Lưu trữ</li>
                  </ul>
                )}
              </>
            )}
            <Truong nhan="Có hiệu lực từ"><ChonNgayGan value={ngayHl} onChange={setNgayHl} soNgay={30} chuaChon="Mặc định: hôm nay" /></Truong>
            <Truong nhan="Lý do" tuyChon><input className="field w-full" maxLength={2000} value={lyDo} onChange={(e) => setLyDo(e.target.value)} /></Truong>
          </Khoi>
        )}
    </KhungPanel>
  );
}
```
Import thêm đầu file: `ErrorState, Skeleton` (từ `'../../ui/ui.tsx'`, nơi đã import `NutChon, TargetText`). `KCK`, `dsLoi`, `ONgay`, `ChonNgayGan`, `Khoi`, `KhungPanel`, `Truong`, `useApi` đã import sẵn. Route `GET /students/:id/hoc-lai/lop-dich` (Task 2) trả `{ lopCu, chiNhanh, lop }`; `lop[].studentCount` nếu `danhSachLopDich` chưa có thì bỏ khỏi nhãn (không thêm truy vấn).

- [x] **Step 4: `StudentDetailPage`** — kiểm `data.lopHoc` (từ `lopHocCua`) đã chứa `quyen.hocLai` (Task 2) và `mucQuanLyHocVien` nhận nó. Không sửa gì thêm nếu `typecheck` xanh. Hồ sơ em đã lưu trữ (chế độ chỉ xem, `chiXem`): menu vẫn vẽ `⋮` vì có mục `hoc-lai`/`bo-luu-tru` — kiểm bằng bấm thử (Task 11).

- [x] **Step 5: Chạy `npm run check` — xanh. Step 6: Commit**

```bash
git add web/src/modules/students/StudentManagePanel.tsx server/src/tests/prLuiB.tests.ts
git commit -m "PR-LUI-b: web panel Học lại (hồ sơ em đã kết thúc), Hoàn tác = Kết thúc học"
```

---

### Task 7: Web — Mở lại lớp

**Files:**
- Modify: `web/src/modules/classes/XoaKetThucLopPanel.tsx` (thêm `MoLaiLopPanel`)
- Modify: `web/src/modules/classes/DauTrangLop.tsx:49, 54, 100, 131-133`
- Modify: `web/src/modules/classes/ClassOverviewPage.tsx:14, 136-137`
- Modify: `web/src/modules/students/LuuTruPage.tsx:12-19, 106-125`
- Test: `server/src/tests/prLuiB.tests.ts`

**Interfaces:**
- Consumes: `POST /classes/:id/mo-lai`, `viewer.coTheMoLaiLop`, `LopLuuTru.coTheMoLai`.
- Produces: `MoLaiLopPanel({ classId, classCode, chiNhanh?, ketThuc?, coTheKetThucLai?, onClose, onDone })`; `ViecDauTrang` thêm `'mo-lai-lop'`.

- [x] **Step 1: Phép kiểm nguồn đỏ**

```ts
  check('LUIb-15 · web Mở lại lớp: menu ⋮ hồ sơ lớp đã kết thúc + nút Mở lại ở Lưu trữ; Hoàn tác = Kết thúc lớp', () => {
    const p = doc('web/src/modules/classes/XoaKetThucLopPanel.tsx');
    assert(p.includes('export function MoLaiLopPanel') && p.includes('/mo-lai`') && p.includes('/ket-thuc`'), 'panel + Hoàn tác');
    assert(/<Truong nhan="Lý do" tuyChon/.test(p.slice(p.indexOf('MoLaiLopPanel'))), 'Lý do tuỳ chọn');
    const dt = doc('web/src/modules/classes/DauTrangLop.tsx');
    assert(dt.includes("nhan: 'Mở lại lớp'") && dt.includes('coTheMoLaiLop'), 'mục ⋮ Mở lại lớp');
    const lt = doc('web/src/modules/students/LuuTruPage.tsx');
    assert(lt.includes('coTheMoLai') && lt.includes('>Mở lại</button>'), 'nút Mở lại ở Lưu trữ');
  });
```

- [x] **Step 2: Chạy — đỏ. Step 3: `MoLaiLopPanel`** (thêm cuối `XoaKetThucLopPanel.tsx`)

```tsx
/**
 * ⋮ HỒ SƠ LỚP ĐÃ KẾT THÚC › MỞ LẠI LỚP / LƯU TRỮ › MỞ LẠI (PR-LUI-b, 06/10) — Quản lý của lớp hoặc Quản trị. Lý do tuỳ chọn. Hoàn tác = Kết thúc lớp lại
 * (chỉ khi người bấm có quyền kết thúc — nút Hoàn tác không hiện cho người không có, `coTheKetThucLop`).
 */
export function MoLaiLopPanel({ classId, classCode, chiNhanh, ketThuc, coTheKetThucLai, onClose, onDone }: {
  classId: number; classCode: string; chiNhanh?: string | null; ketThuc?: string | null; coTheKetThucLai?: boolean;
  onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const [lyDo, setLyDo] = useState('');
  const [busy, setBusy] = useState(false);
  const moLai = async () => {
    setBusy(true);
    try {
      await api.post(`/classes/${classId}/mo-lai`, { lyDo: lyDo.trim() || undefined });
      invalidate('/classes'); invalidate('/hoc-vien-lop'); invalidate('/tong-quan');
      const loi = `Đã mở lại lớp ${classCode}`;
      if (coTheKetThucLai) {
        toast.hoanTac(loi, async () => {
          try {
            await api.post(`/classes/${classId}/ket-thuc`, {});
            invalidate('/classes'); invalidate('/hoc-vien-lop'); invalidate('/tong-quan');
            toast.push('ok', 'Đã hoàn tác'); onDone();
          } catch (e: any) { toast.push('error', e.message); }
        }, { key: `mo-lai-lop:${classId}` });
      } else toast.push('ok', loi);
      onDone(); onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };
  return (
    <KhungPanel tieuDe="Mở lại lớp" lop={classCode} onDong={onClose}
      chan={{ daSua: !!lyDo.trim(), chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={moLai}>Mở lại lớp</button> }}>
      <Khoi tieuDe="Mở lại lớp">
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-slate-400">Lớp</dt><dd className="m-0 font-semibold text-slate-100">{classCode}</dd>
          {chiNhanh && (<><dt className="text-slate-400">Chi nhánh</dt><dd className="m-0 text-slate-200">{chiNhanh}</dd></>)}
          {ketThuc && (<><dt className="text-slate-400">Kết thúc</dt><dd className="m-0 text-slate-200">{ketThuc}</dd></>)}
        </dl>
        <Truong nhan="Lý do" tuyChon>
          <input className="field w-full" maxLength={2000} value={lyDo} onChange={(e) => setLyDo(e.target.value)} />
        </Truong>
      </Khoi>
    </KhungPanel>
  );
}
```

- [x] **Step 4: `DauTrangLop.tsx`** — `ViecDauTrang` (dòng 54) thêm `| 'mo-lai-lop'`; kiểu `viewer` (dòng ~49) thêm `coTheMoLaiLop?: boolean; coTheKetThucLop?: boolean;`; trong `menu` (sau `diem-lop`, trước `Xoá lớp`) thêm:
```tsx
    ...(data.viewer.coTheMoLaiLop ? [{ key: 'mo-lai-lop', nhan: 'Mở lại lớp', onChon: () => onViec('mo-lai-lop') }] : []),
```
(Quản lý kết thúc lớp: dòng 100 `xk` đổi điều kiện nạp thành `data.viewer.coTheXoaKetThuc || data.viewer.coTheKetThucLop`; mục `Xoá lớp` đã chỉ hiện khi `xk.data.coTheXoa` — máy chủ trả `false` với QL ở Task 5; mục `Kết thúc lớp` giữ điều kiện `xk.data.coDuLieu && !xk.data.daKetThuc`.)

`ClassOverviewPage.tsx` — import `MoLaiLopPanel` cùng dòng 14; thêm cạnh dòng 137:
```tsx
      {viec === 'mo-lai-lop' && (
        <MoLaiLopPanel classId={data.id} classCode={data.code} chiNhanh={data.branchName} ketThuc={data.finishedAt ? ngay(data.finishedAt) : null}
          coTheKetThucLai={!!data.viewer.coTheKetThucLop || !!data.viewer.coTheXoaKetThuc} onClose={dong} onDone={xong} />
      )}
```
(kiểm `data.finishedAt` có trong `HoSoLop`; không có thì thêm vào `classOverview` — một trường `finished_at` đã đọc ở `luuTru.ts`; `ngay` từ `@shared/domain/index.ts`.)

- [x] **Step 5: `LuuTruPage.tsx`** — kiểu `LopLuuTru` thêm `coTheMoLai: boolean`; trạng thái `moLai: LopLuuTru | null`; trong dòng lớp đã kết thúc (hiện là `<Link className="card …">` cả dòng) đổi thành `div` có `Link` ở phần chữ + nút ở cuối để không lồng nút trong link:

```tsx
{data.lop.map((l) => (
  <div key={l.id} className="card flex flex-wrap items-center gap-x-2 gap-y-1 p-3">
    <Link to={`/hoc-vien/lop/${l.id}`} className="link font-semibold">{l.code}</Link>
    <span className="text-xs text-slate-500">…giữ nguyên các chữ cũ…</span>
    <span className="flex-1" />
    <span className="text-[11px] text-slate-500 whitespace-nowrap">Đã kết thúc {l.finishedAt ? ngay(l.finishedAt) : '—'}</span>
    {l.coTheMoLai && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setMoLai(l)}>Mở lại</button>}
  </div>
))}
```
và cuối trang: `{moLai && <MoLaiLopPanel classId={moLai.id} classCode={moLai.code} chiNhanh={moLai.chiNhanh} ketThuc={moLai.finishedAt ? ngay(moLai.finishedAt) : null} coTheKetThucLai onClose={() => setMoLai(null)} onDone={reload} />}`. (`coTheKetThucLai` luôn `true` ở đây: Quản lý và Quản trị đều kết thúc được lớp không còn học viên đang học.)

- [x] **Step 6: Chạy `npm run check` — xanh. Step 7: Commit**

```bash
git add web/src/modules/classes/XoaKetThucLopPanel.tsx web/src/modules/classes/DauTrangLop.tsx web/src/modules/classes/ClassOverviewPage.tsx web/src/modules/students/LuuTruPage.tsx server/src/tests/prLuiB.tests.ts
git commit -m "PR-LUI-b: web Mở lại lớp (⋮ hồ sơ lớp + Lưu trữ), Hoàn tác = Kết thúc lớp"
```

---

### Task 8: Web — "Chọn nhiều học viên" ở hồ sơ lớp (**chờ duyệt lại mockup mục 10–13**)

**Files:**
- Create: `web/src/modules/students/hangLoatEm.ts`
- Create: `web/src/modules/students/chonNhieuHocVien.tsx`
- Create: `web/src/modules/students/XemTruocHangLoatPanel.tsx`
- Modify: `web/src/modules/students/ClassRoster.tsx:18-217` (FT: bảng + thẻ điện thoại `:60-72,111-209`)
- Modify: `web/src/modules/classes/BangDiemLopThuong.tsx:44-215` (lớp thường: bảng `:119-176`, thẻ `:75-87`)
- Modify: `web/src/modules/classes/TabHocVienLop.tsx:1-39`
- Test: `server/src/tests/prLuiB.tests.ts`

**Interfaces:**
- Consumes: `POST /hang-loat-hoc-vien/xem-truoc`, `POST /hang-loat-hoc-vien`, `chiaLo`, `LO_HANG_LOAT_EM`, `VIEC_NGUOC`, `NHAN_VIEC_HANG_LOAT`, `viewer.canPlanWeek` (đã có ở `DauTrangLop`/`HoSoLop`).
- Produces:
  - `chayHangLoat(viec: ViecHangLoat, ids: number[], o: { lyDo?: string; date?: string; moLaiLop?: boolean; lopMoiId?: number }, onTienDo?: (xong: number, tong: number) => void): Promise<KetQuaHangLoat>`; `hoanTacHangLoat(viec, ids): Promise<KetQuaHangLoat>`.
  - `useChonNhieu(): { bat: boolean; chon: Set<number>; batTat(): void; doi(id: number): void; tatCa(ids: number[], v: boolean): void; bo(): void }`; `type ChonNhieu = ReturnType<typeof useChonNhieu>`.
  - `OChon({ chon, id, ten })` (ô tick có `aria-label`); `ThanhChonNhieu({ chon, viec: { viec: ViecHangLoat; nhan: string }[], onViec(v), onBo })`.
  - `XemTruocHangLoatPanel({ viec, ids, maLop?, onClose, onDone })` — một panel cho cả sáu việc; `HocLaiPanel` dùng riêng cho một em (Task 6).
  - `BangDiemLopThuong` / `ClassRoster` nhận thêm `chon?: ChonNhieu` — có thì vẽ cột ô chọn (bảng) hoặc ô chọn đầu thẻ (điện thoại).

- [x] **Step 1: Phép kiểm nguồn đỏ**

```ts
  check('LUIb-16 · web: chia lô bằng LO_HANG_LOAT_EM, gom ok/failed, dừng khi một lô ném lỗi và ghi "chưa lưu" cho phần còn lại; Hoàn tác gọi việc ngược', () => {
    const h = doc('web/src/modules/students/hangLoatEm.ts');
    assert(h.includes('chiaLo(ids, LO_HANG_LOAT_EM)') && h.includes("'/hang-loat-hoc-vien'") && h.includes('VIEC_NGUOC[viec]'), 'runner');
    assert(/catch \(e: any\) \{[\s\S]*break;/.test(h), 'lỗi giữa chừng phải dừng và ghi phần còn lại là chưa lưu');
  });
  check('LUIb-17 · web: thanh dính đáy, panel xem trước, ô chọn ở cả bảng FT và bảng lớp thường; đủ chữ đã duyệt', () => {
    const t = doc('web/src/modules/classes/TabHocVienLop.tsx');
    assert(t.includes('Chọn nhiều học viên') && t.includes('useChonNhieu') && t.includes('ThanhChonNhieu'), 'nút + thanh ở tab Học viên');
    const b = doc('web/src/modules/students/chonNhieuHocVien.tsx');
    for (const chu of ['đã chọn', 'Bỏ chọn']) assert(b.includes(chu), `thiếu chữ "${chu}"`);
    assert(/sticky|fixed/.test(b) && /bottom-0/.test(b), 'thanh phải dính đáy');
    const p = doc('web/src/modules/students/XemTruocHangLoatPanel.tsx');
    for (const chu of ['Bỏ qua', 'Thử lại', 'Đã lưu ', 'chưa lưu', 'Huỷ thay đổi', 'Quyết định chuyển lớp huỷ', 'PA huỷ', 'Case đóng', 'học viên']) assert(p.includes(chu), `thiếu chữ "${chu}"`);
    assert(doc('web/src/modules/students/ClassRoster.tsx').includes('OChon') && doc('web/src/modules/classes/BangDiemLopThuong.tsx').includes('OChon'), 'ô chọn ở cả hai bảng');
    assert(!doc('web/src/modules/students/BangHocVienLop.tsx').includes('OChon'), 'KHÔNG thêm ô chọn vào bảng Học viên & Lớp');
  });
```

- [x] **Step 2: Chạy — đỏ.**

- [x] **Step 3: `web/src/modules/students/hangLoatEm.ts`**

```ts
import { api } from '../../lib/api.ts';
import { LO_HANG_LOAT_EM, VIEC_NGUOC, chiaLo, type KetQuaHangLoat, type ViecHangLoat } from '@shared/domain/index.ts';

/**
 * GỬI LÀM NHIỀU HỌC VIÊN THEO LÔ (PR-LUI-b) — mỗi lô `LO_HANG_LOAT_EM` một request (10 s của Netlify), gom `ok` / `failed`. Một lô ném lỗi (mất mạng, 503
 * "sắp hết giờ") thì DỪNG: phần còn lại ghi là "chưa lưu" với đúng câu lỗi — phần đã lưu giữ nguyên, người dùng Thử lại đúng các học viên chưa lưu.
 */
export async function chayHangLoat(
  viec: ViecHangLoat, ids: number[], o: { lyDo?: string; date?: string; moLaiLop?: boolean; lopMoiId?: number }, onTienDo?: (xong: number, tong: number) => void,
): Promise<KetQuaHangLoat> {
  const kq: KetQuaHangLoat = { ok: [], failed: [] };
  const lo = chiaLo(ids, LO_HANG_LOAT_EM);
  for (let i = 0; i < lo.length; i++) {
    onTienDo?.(kq.ok.length + kq.failed.length, ids.length);
    try {
      const r = await api.post<KetQuaHangLoat>('/hang-loat-hoc-vien', {
        viec, studentIds: lo[i], lyDo: o.lyDo || undefined, date: o.date || undefined, moLaiLop: o.moLaiLop === true, lopMoiId: o.lopMoiId,
      });
      kq.ok.push(...r.ok); kq.failed.push(...r.failed);
    } catch (e: any) {
      for (const sid of lo.slice(i).flat()) kq.failed.push({ studentId: sid, message: e.message });
      break;
    }
  }
  return kq;
}

/** Hoàn tác = làm việc NGƯỢC cho đúng các học viên đã làm được (kết thúc ↔ học lại, lưu trữ ↔ bỏ lưu trữ, huỷ ↔ khôi phục chuyển lớp). */
export async function hoanTacHangLoat(viec: ViecHangLoat, ids: number[]): Promise<KetQuaHangLoat> {
  return chayHangLoat(VIEC_NGUOC[viec], ids, { lyDo: VIEC_NGUOC[viec] === 'ket-thuc' ? 'Hoàn tác học lại' : undefined, moLaiLop: true });
}
```

- [x] **Step 4: `web/src/modules/students/chonNhieuHocVien.tsx`**

```tsx
import { useState } from 'react';

/** Trạng thái "Chọn nhiều học viên" của MỘT danh sách (hồ sơ lớp, Lưu trữ). `bat` = đang ở chế độ chọn; `chon` = id đã tick. */
export function useChonNhieu() {
  const [bat, setBat] = useState(false);
  const [chon, setChon] = useState<Set<number>>(new Set());
  return {
    bat, chon,
    batTat: () => { setBat((b) => !b); setChon(new Set()); },
    doi: (id: number) => setChon((x) => { const n = new Set(x); if (n.has(id)) n.delete(id); else n.add(id); return n; }),
    tatCa: (ids: number[], v: boolean) => setChon(v ? new Set(ids) : new Set()),
    bo: () => { setChon(new Set()); setBat(false); },
  };
}
export type ChonNhieu = ReturnType<typeof useChonNhieu>;

/** Ô tick một học viên — vùng bấm 44 px trên điện thoại. */
export function OChon({ chon, id, ten }: { chon: ChonNhieu; id: number; ten: string }) {
  return (
    <input type="checkbox" className="h-[18px] w-[18px] shrink-0 cursor-pointer max-sm:m-[13px]" aria-label={`Chọn ${ten}`}
      checked={chon.chon.has(id)} onChange={() => chon.doi(id)} />
  );
}

/** Ô tick cả cột — chọn / bỏ chọn mọi học viên đang hiện. */
export function OChonTatCa({ chon, ids }: { chon: ChonNhieu; ids: number[] }) {
  return (
    <input type="checkbox" className="h-[18px] w-[18px] cursor-pointer" aria-label="Chọn cả danh sách"
      checked={ids.length > 0 && ids.every((i) => chon.chon.has(i))} onChange={(e) => chon.tatCa(ids, e.target.checked)} />
  );
}

/** Thanh thao tác DÍNH ĐÁY: `3 đã chọn` · các việc · `Bỏ chọn`. Chỉ hiện khi đã chọn ít nhất một học viên. */
export function ThanhChonNhieu({ chon, viec, onViec }: {
  chon: ChonNhieu; viec: { key: string; nhan: string }[]; onViec: (key: string) => void;
}) {
  if (!chon.bat || chon.chon.size === 0) return null;
  return (
    <div role="toolbar" aria-label="Việc cho học viên đã chọn"
      className="sticky bottom-0 z-20 -mx-3 flex flex-wrap items-center gap-2 border-t px-3 py-2.5 shadow-[0_-6px_18px_rgb(0_0_0/.25)] sm:mx-0 sm:rounded-lg sm:border"
      style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}>
      <b className="mr-1 text-sm tabular-nums text-slate-100">{chon.chon.size} đã chọn</b>
      {viec.map((v) => (
        <button key={v.key} type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => onViec(v.key)}>{v.nhan}</button>
      ))}
      <span className="flex-1" />
      <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={chon.bo}>Bỏ chọn</button>
    </div>
  );
}
```

- [x] **Step 5: Ô chọn trong hai bảng + thẻ** (cùng một mẫu cho `ClassRoster` và `BangDiemLopThuong`)
  - Thêm prop `chon?: ChonNhieu`; trong `<thead>` thêm `<Th className="w-10 sticky-col">{chon?.bat && <OChonTatCa chon={chon} ids={rows.map((s) => s.id)} />}</Th>` **chỉ khi** `chon?.bat` (bảng không thêm cột khi tắt, nên `min-w-[…]` và `table-fixed` giữ nguyên khi tắt); mỗi `<tr>` thêm `<td className="td w-10">{chon?.bat && <OChon chon={chon} id={s.id} ten={s.fullName} />}</td>` ở **đầu**; hàng đã chọn thêm `className` nền `bg-accent-soft` (token sẵn có) — đọc `ClassRoster.tsx:146`, `BangDiemLopThuong.tsx:147`.
  - Thẻ điện thoại (`TheDong`, `ClassRoster.tsx:60-72`, `BangDiemLopThuong.tsx:75-87`): `dau={<span className="flex items-start gap-2">{chon?.bat && <OChon …/>}{…đầu thẻ cũ…}</span>}`.
  - Bảng dùng `useDienThoai()` ở `ClassRoster` — thẻ hay bảng giữ nguyên, chỉ thêm ô chọn.

- [x] **Step 6: `TabHocVienLop.tsx`** — chỉ khi `lop.viewer.canPlanWeek` (Quản lý / Quản trị) **và** cách xem `Điểm`:

```tsx
const chon = useChonNhieu();
const [viecChon, setViecChon] = useState<{ viec: ViecHangLoat; ids: number[] } | null>(null);
…
{lop.viewer.canPlanWeek && cheDo === 'diem' && (
  <button type="button" aria-pressed={chon.bat} className={`btn btn-ghost btn-sm min-h-[44px] sm:min-h-0 ${chon.bat ? 'btn-pressed' : ''}`} onClick={chon.batTat}>Chọn nhiều học viên</button>
)}
…
<ThanhChonNhieu chon={chon}
  viec={[{ key: 'luu-tru', nhan: 'Lưu trữ' }, { key: 'ket-thuc', nhan: 'Kết thúc học' }, { key: 'huy-lenh', nhan: 'Huỷ chuyển lớp' }]}
  onViec={(k) => setViecChon({ viec: k as ViecHangLoat, ids: [...chon.chon] })} />
{viecChon && <XemTruocHangLoatPanel viec={viecChon.viec} ids={viecChon.ids} maLop={lop.code}
  onClose={() => setViecChon(null)} onDone={() => { chon.bo(); setViecChon(null); onDoi(); }} />}
```
(`btn-pressed`: dùng đúng lớp CSS đang dùng cho nút bật ở `BoLocDoan` — đọc `web/src/ui/ui.tsx`; nếu không có, `aria-pressed` + lớp `bg-accent-soft`.) Chuyển `chon` xuống `ClassRoster` / `BangDiemLopThuong` qua prop; đổi chế độ xem sang "Cần hỗ trợ" thì `chon.bo()`.

- [x] **Step 7: `XemTruocHangLoatPanel.tsx`** — một panel: nạp xem trước một lần, vẽ số hệ quả theo việc, mục `Bỏ qua n học viên`, ô `Lý do` (bắt buộc: `ket-thuc`, `huy-lenh`), `Có hiệu lực từ` (`ket-thuc`, `hoc-lai`), nút chính; chạy lô; lỗi giữa chừng; Hoàn tác.

```tsx
import { useEffect, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { ChonNgayGan } from '../../ui/ChonNgay.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { NHAN_VIEC_HANG_LOAT, dsLoi, type ViecHangLoat, type XemTruocHangLoat } from '@shared/domain/index.ts';
import { chayHangLoat, hoanTacHangLoat } from './hangLoatEm.ts';

const TEN_HUONG: Record<string, string> = { len_lop: 'Lên', fast_track: 'Lên FT', hoc_lai: 'Học lại', bao_luu: 'Tạm dừng học (bảo lưu)', dung_hoc: 'Dừng học hẳn', chuyen_lop: 'Chuyển lớp FT' };
const BAT_BUOC_LY_DO: ViecHangLoat[] = ['ket-thuc', 'huy-lenh'];
const CO_NGAY: ViecHangLoat[] = ['ket-thuc', 'hoc-lai'];

/**
 * PANEL XEM TRƯỚC LÀM NHIỀU HỌC VIÊN (PR-LUI-b, 06/10) — bấm một việc ở thanh dính đáy (hồ sơ lớp, Lưu trữ) thì ra đây: số hệ quả, học viên bị bỏ qua
 * (kèm lý do), lý do chung, rồi xác nhận. Gửi từng lô 8; lỗi giữa chừng giữ phần đã lưu, nút đổi thành "Thử lại n học viên". Xong thì toast Hoàn tác.
 */
export function XemTruocHangLoatPanel({ viec, ids, maLop, lopMoiId, onClose, onDone }: {
  viec: ViecHangLoat; ids: number[]; maLop?: string | null; lopMoiId?: number; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const lf = useLoiForm();
  const [xem, setXem] = useState<XemTruocHangLoat | null>(null);
  const [loiXem, setLoiXem] = useState<string | null>(null);
  const [lyDo, setLyDo] = useState('');
  const [ngayHl, setNgayHl] = useState('');
  const [busy, setBusy] = useState(false);
  const [tienDo, setTienDo] = useState<{ xong: number; tong: number } | null>(null);
  const [chuaLuu, setChuaLuu] = useState<{ studentId: number; message: string }[]>([]);
  const [daLuu, setDaLuu] = useState<number[]>([]);
  const nap = () => {
    setLoiXem(null);
    api.post<XemTruocHangLoat>('/hang-loat-hoc-vien/xem-truoc', { viec, studentIds: ids }).then(setXem).catch((e: any) => setLoiXem(e.message));
  };
  useEffect(nap, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const batBuoc = BAT_BUOC_LY_DO.includes(viec);
  const loi = dsLoi(batBuoc ? [{ khoa: 'ly-do', nhan: 'Lý do', toiThieu: viec === 'huy-lenh' ? 3 : 1 }] : [], { 'ly-do': lyDo });
  const idsLam = (xem?.rows ?? []).filter((r) => !r.lyDoBo).map((r) => r.studentId);
  const ten = (sid: number) => xem?.rows.find((r) => r.studentId === sid)?.ten ?? `#${sid}`;
  const dangThu = chuaLuu.length > 0;

  const chay = async () => {
    lf.bam();
    if (loi.length) return;
    const lam = dangThu ? chuaLuu.map((c) => c.studentId) : idsLam;
    setBusy(true); setChuaLuu([]);
    const kq = await chayHangLoat(viec, lam, { lyDo: lyDo.trim(), date: ngayHl, moLaiLop: viec === 'hoc-lai', lopMoiId }, (xong, tong) => setTienDo({ xong, tong }));
    setBusy(false); setTienDo(null);
    for (const k of ['/students', '/classes', '/hoc-vien-lop', '/cases', '/lenh-chuyen', '/my-work']) invalidate(k);
    const tatCa = [...daLuu, ...kq.ok];
    setDaLuu(tatCa);
    if (kq.failed.length) {
      setChuaLuu(kq.failed);
      toast.push('error', `Đã lưu ${tatCa.length} học viên · ${kq.failed.length} học viên chưa lưu`);
      return;
    }
    toast.hoanTac(`${NHAN_VIEC_HANG_LOAT[viec]} ${tatCa.length} học viên`, async () => {
      const r = await hoanTacHangLoat(viec, tatCa);
      for (const k of ['/students', '/classes', '/hoc-vien-lop', '/cases', '/lenh-chuyen', '/my-work']) invalidate(k);
      toast.push(r.failed.length ? 'error' : 'ok', r.failed.length ? `Hoàn tác ${r.ok.length} học viên · ${r.failed.length} học viên chưa được` : 'Đã hoàn tác');
      onDone();
    }, { key: `hang-loat:${viec}` });
    onDone(); onClose();
  };

  const theoHuong = Object.entries(xem?.tong.theoHuong ?? {}).map(([h, n]) => `${TEN_HUONG[h] ?? h} ${n}`);
  return (
    <KhungPanel tieuDe={`${NHAN_VIEC_HANG_LOAT[viec]} · ${ids.length} học viên`} lop={maLop} onDong={busy ? () => {} : onClose}
      chan={{
        daSua: !!lyDo.trim() || !!ngayHl,
        conThieu: lf.conThieu(loi),
        dongTren: dangThu ? <p role="alert" className="m-0 px-4 pt-2 text-xs text-late tabular-nums">Đã lưu {daLuu.length} học viên · {chuaLuu.length} học viên chưa lưu</p> : undefined,
        chinh: (
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !xem || (!dangThu && !idsLam.length)} onClick={chay}>
            {busy ? (tienDo ? `Đang lưu ${tienDo.xong}/${tienDo.tong}…` : 'Đang lưu…') : dangThu ? `Thử lại ${chuaLuu.length} học viên` : `${NHAN_VIEC_HANG_LOAT[viec]} ${idsLam.length} học viên`}
          </button>
        ),
      }}>
      {loiXem ? <ErrorState message={loiXem} onRetry={nap} /> : !xem ? <Skeleton rows={4} /> : (
        <>
          <Khoi tieuDe={NHAN_VIEC_HANG_LOAT[viec]}>
            <p className="m-0 flex flex-wrap gap-x-4 gap-y-1 text-sm tabular-nums text-slate-300">
              <span><b className="text-slate-100">{idsLam.length}</b> học viên</span>
              {viec === 'ket-thuc' && <><span>Case đóng <b className="text-slate-100">{xem.tong.caseDong}</b></span><span>PA huỷ <b className="text-slate-100">{xem.tong.paHuy}</b></span><span>Quyết định chuyển lớp huỷ <b className="text-slate-100">{xem.tong.lenhHuy}</b></span></>}
              {viec === 'huy-lenh' && theoHuong.map((t) => <span key={t}>{t}</span>)}
              {viec === 'hoc-lai' && xem.tong.lopMoLai.length > 0 && <span className="text-soon">Mở lại lớp {xem.tong.lopMoLai.join(', ')}</span>}
            </p>
            {batBuoc && (
              <Truong nhan="Lý do" batBuoc loi={lf.loiCua(loi, 'ly-do')}>
                <input className="field w-full" maxLength={2000} {...lf.o(loi, 'ly-do')} value={lyDo} onChange={(e) => setLyDo(e.target.value)} />
              </Truong>
            )}
            {!batBuoc && viec !== 'luu-tru' && viec !== 'bo-luu-tru' && (
              <Truong nhan="Lý do" tuyChon><input className="field w-full" maxLength={2000} value={lyDo} onChange={(e) => setLyDo(e.target.value)} /></Truong>
            )}
            {CO_NGAY.includes(viec) && <Truong nhan="Có hiệu lực từ"><ChonNgayGan value={ngayHl} onChange={setNgayHl} soNgay={30} chuaChon="Mặc định: hôm nay" /></Truong>}
          </Khoi>
          {dangThu && (
            <Khoi tieuDe={`Chưa lưu · ${chuaLuu.length}`}>
              <ul className="m-0 list-none space-y-1 p-0">
                {chuaLuu.map((c) => <li key={c.studentId} className="text-sm text-slate-200">{ten(c.studentId)}<span className="block text-xs text-late">{c.message}</span></li>)}
              </ul>
            </Khoi>
          )}
          {xem.tong.boQua > 0 && (
            <Khoi tieuDe={`Bỏ qua ${xem.tong.boQua} học viên`}>
              <ul className="m-0 list-none space-y-1 p-0">
                {xem.rows.filter((r) => r.lyDoBo).map((r) => <li key={r.studentId} className="text-sm text-slate-200">{r.ten}<span className="block text-xs text-slate-500">{r.lyDoBo}</span></li>)}
              </ul>
            </Khoi>
          )}
        </>
      )}
    </KhungPanel>
  );
}
```
`lopMoiId` truyền khi Học lại hàng loạt chọn "Sang lớp mới" (Task 9). Chọn đích Học lại hàng loạt vẽ ở đầu khối `Học lại` (hai nút `Về lớp cũ` / `Sang lớp mới` + ô `Lớp` — dùng chung `ChonDichHocLai` với `HocLaiPanel`, Task 6).

- [x] **Step 8: Chạy `npm run check` — xanh. Bấm thử ở Task 11.**

- [x] **Step 9: Commit**

```bash
git add web/src/modules/students/hangLoatEm.ts web/src/modules/students/chonNhieuHocVien.tsx web/src/modules/students/XemTruocHangLoatPanel.tsx web/src/modules/students/ClassRoster.tsx web/src/modules/classes/BangDiemLopThuong.tsx web/src/modules/classes/TabHocVienLop.tsx server/src/tests/prLuiB.tests.ts
git commit -m "PR-LUI-b: web Chọn nhiều học viên (hồ sơ lớp) — ô chọn, thanh dính đáy, panel xem trước, lô 8, Hoàn tác"
```

---

### Task 9: Web — Lưu trữ: cùng mẫu "Chọn nhiều học viên" + `Học lại` từng em (**chờ duyệt lại mockup mục 14**)

**Files:**
- Modify: `web/src/modules/students/LuuTruPage.tsx:16-19, 126-145`
- Test: `server/src/tests/prLuiB.tests.ts`

**Interfaces:**
- Consumes: `useChonNhieu`, `OChon`, `ThanhChonNhieu`, `XemTruocHangLoatPanel`, `HocLaiPanel` (Task 6), `HocVienLuuTru.coTheBoLuuTru / coTheHocLai`.

- [x] **Step 1: Phép kiểm nguồn đỏ**

```ts
  check('LUIb-18 · web Lưu trữ › Học viên: nút Chọn nhiều học viên, thanh dính đáy (Bỏ lưu trữ · Học lại), nút Học lại mỗi dòng', () => {
    const l = doc('web/src/modules/students/LuuTruPage.tsx');
    for (const chu of ['Chọn nhiều học viên', "nhan: 'Bỏ lưu trữ'", "nhan: 'Học lại'", 'ThanhChonNhieu', 'XemTruocHangLoatPanel', 'coTheHocLai']) assert(l.includes(chu), `thiếu "${chu}"`);
  });
```

- [x] **Step 2: Chạy — đỏ. Step 3: Sửa `LuuTruPage.tsx`**

Kiểu `HocVienLuuTru` thêm `coTheHocLai: boolean`. Thêm `const chon = useChonNhieu(); const [lam, setLam] = useState<{ viec: ViecHangLoat; ids: number[] } | null>(null);`. Trong tab `hv`, trên danh sách (chỉ khi có dòng làm được): 

```tsx
{data.hocVien.some((s) => s.coTheBoLuuTru) && (
  <div className="flex justify-end">
    <button type="button" aria-pressed={chon.bat} className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={chon.batTat}>Chọn nhiều học viên</button>
  </div>
)}
```
Mỗi dòng: khi `chon.bat` thêm `<OChon chon={chon} id={s.id} ten={s.fullName} />` đầu dòng (chỉ tick được khi `s.coTheBoLuuTru`) và ẩn nút lẻ; khi tắt thì giữ `Bỏ lưu trữ` (như cũ, `:139-141`) và thêm `{s.coTheHocLai && <button …onClick={() => setHocLai(s)}>Học lại</button>}` mở `HocLaiPanel` (một học viên, có chọn đích). Cuối danh sách:

```tsx
<ThanhChonNhieu chon={chon} viec={[{ key: 'bo-luu-tru', nhan: 'Bỏ lưu trữ' }, { key: 'hoc-lai', nhan: 'Học lại' }]}
  onViec={(k) => setLam({ viec: k as ViecHangLoat, ids: [...chon.chon] })} />
{lam && <XemTruocHangLoatPanel viec={lam.viec} ids={lam.ids} onClose={() => setLam(null)} onDone={() => { chon.bo(); setLam(null); reload(); }} />}
```
Chọn đích "Sang lớp mới" của Học lại hàng loạt: `XemTruocHangLoatPanel` nhận thêm bước chọn `Về lớp cũ` / `Sang lớp mới` + ô `Lớp` (chỉ lớp thường — lấy từ `GET /students/:id/hoc-lai/lop-dich` của em đầu tiên, lọc `!ft`) khi `viec === 'hoc-lai'`, truyền `lopMoiId` xuống `chayHangLoat`.

- [x] **Step 4: `npm run check` xanh. Step 5: Commit**

```bash
git add web/src/modules/students/LuuTruPage.tsx server/src/tests/prLuiB.tests.ts
git commit -m "PR-LUI-b: web Lưu trữ — Chọn nhiều học viên (Bỏ lưu trữ, Học lại) + Học lại từng em"
```

---

### Task 10: Web — Huỷ nhiều quyết định chuyển lớp ở panel Chuyển tiếp lớp (mockup mục 15 — đã duyệt)

**Files:**
- Modify: `web/src/modules/classes/TransitionPanel.tsx` (state ~`:40-100`, `huyLenh` `:150-160`, ô "Chọn nhiều em" `:211-236`)
- Test: `server/src/tests/prLuiB.tests.ts`

**Interfaces:**
- Consumes: `chayHangLoat('huy-lenh', studentIds, { lyDo })`, `hoanTacHangLoat('huy-lenh', ids)`, `s.lenh` của từng em (đã có ở `/classes/:id/transition`), `chon: Set<number>`.

- [x] **Step 1: Phép kiểm nguồn đỏ**

```ts
  check('LUIb-19 · web Chuyển tiếp lớp: nút "Huỷ quyết định" trong ô chọn nhiều, xem trước theo hướng, lý do ≥ 3, đi qua chayHangLoat("huy-lenh"), Hoàn tác', () => {
    const t = doc('web/src/modules/classes/TransitionPanel.tsx');
    for (const chu of ["chayHangLoat('huy-lenh'", 'hoanTacHangLoat', 'Huỷ quyết định', 'Bỏ qua', 'chưa có quyết định']) assert(t.includes(chu), `thiếu "${chu}"`);
    assert(/length < 3|\.length >= 3/.test(t.slice(t.indexOf('huyNhieu'))), 'lý do ≥ 3 ký tự');
  });
```

- [x] **Step 2: Chạy — đỏ. Step 3: Code** — thêm cạnh state `huy`:

```tsx
  const [huyNhieu, setHuyNhieu] = useState<{ lyDo: string } | null>(null);
  const [dangHuy, setDangHuy] = useState(false);
```
Sau `rows`:
```tsx
  /** Em đang chọn CÓ quyết định chờ — đối tượng của "Huỷ quyết định"; em chưa có quyết định thì bỏ qua. */
  const chonCoLenh = students.filter((s) => chon.has(s.id) && s.lenh);
  const boQuaHuy = chon.size - chonCoLenh.length;
  const nhomHuy = (() => {
    const m = new Map<string, number>();
    for (const s of chonCoLenh) { const t = TEN_HUONG[s.lenh.huong as string] ?? 'Chuyển lớp'; m.set(t, (m.get(t) ?? 0) + 1); }
    return [...m.entries()].map(([k, n]) => `${k} ${n}`).join(' · ');
  })();
  const huyNhieuLenh = async () => {
    const ids = chonCoLenh.map((s) => s.id as number);
    setDangHuy(true);
    const kq = await chayHangLoat('huy-lenh', ids, { lyDo: huyNhieu!.lyDo.trim() });
    setDangHuy(false);
    for (const k of ['/classes', '/my-work', '/lenh-chuyen', '/yeu-cau', '/hoc-vien-lop']) invalidate(k);
    reload();
    if (kq.failed.length) toast.push('error', `Đã huỷ ${kq.ok.length} quyết định · ${kq.failed.length} chưa huỷ — ${kq.failed[0].message}`);
    if (!kq.ok.length) return;
    setChon(new Set()); setHuyNhieu(null);
    toast.hoanTac(`Đã huỷ quyết định ${kq.ok.length} em`, async () => {
      const r = await hoanTacHangLoat('huy-lenh', kq.ok);
      for (const k of ['/classes', '/my-work', '/lenh-chuyen', '/yeu-cau', '/hoc-vien-lop']) invalidate(k);
      reload(); toast.push(r.failed.length ? 'error' : 'ok', r.failed.length ? r.failed[0].message : 'Đã khôi phục quyết định');
    }, { key: 'huy-lenh-nhieu' });
  };
```
(`TEN_HUONG`: tách bản đồ `huong → chữ` khỏi `nhomChan` (`:162-172`) thành hằng dùng lại ở cả hai chỗ: `{ len_lop: 'Lên', fast_track: 'Lên FT', hoc_lai: 'Học lại', bao_luu: 'Tạm dừng học (bảo lưu)', dung_hoc: 'Dừng học hẳn', chuyen_lop: 'Chuyển lớp FT' }`.)

Trong nhóm "Chọn nhiều em" (`:211-236`), sau nút `Áp cho n em`:
```tsx
<button type="button" className="btn btn-sm btn-danger min-h-[44px] sm:min-h-0" disabled={!chonCoLenh.length || dangHuy} onClick={() => setHuyNhieu({ lyDo: '' })}>Huỷ quyết định</button>
```
và ngay dưới nhóm:
```tsx
{huyNhieu && (
  <div role="group" aria-label="Huỷ quyết định" className="surface-2 space-y-2 rounded-lg px-3 py-2">
    <p className="m-0 text-sm font-semibold text-slate-100">Huỷ quyết định {chonCoLenh.length} em</p>
    <p className="m-0 text-xs tabular-nums text-slate-400">{nhomHuy}{boQuaHuy > 0 && ` · Bỏ qua ${boQuaHuy} em chưa có quyết định`}</p>
    <input className="field w-full" aria-label="Lý do" placeholder="Lý do" maxLength={2000} value={huyNhieu.lyDo} onChange={(e) => setHuyNhieu({ lyDo: e.target.value })} />
    <div className="flex flex-wrap gap-2">
      <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={dangHuy} onClick={() => setHuyNhieu(null)}>Đóng</button>
      <button type="button" className="btn btn-sm btn-danger min-h-[44px] sm:min-h-0" disabled={dangHuy || huyNhieu.lyDo.trim().length < 3} onClick={huyNhieuLenh}>
        {dangHuy ? 'Đang huỷ…' : `Huỷ quyết định ${chonCoLenh.length} em`}
      </button>
    </div>
  </div>
)}
```
Import: `chayHangLoat, hoanTacHangLoat` từ `'../students/hangLoatEm.ts'`.

- [x] **Step 4: `npm run check` xanh. Step 5: Commit**

```bash
git add web/src/modules/classes/TransitionPanel.tsx server/src/tests/prLuiB.tests.ts
git commit -m "PR-LUI-b: web huỷ nhiều quyết định chuyển lớp ở panel Chuyển tiếp lớp (qua chayHangLoat huy-lenh, Hoàn tác = Khôi phục)"
```

---

### Task 11: Kiểm cuối, bấm thử, audit, PR

- [ ] **Step 1:** `git fetch origin && git merge origin/main` (PR-MTa có thể đã merge — xung đột `routes/index.ts`, `run.ts`, `CODE_MAP.md`, `plan.md` mục 11: **giữ cả hai**). Chạy `npm run check` MỘT LẦN, foreground. OOM → `npm run build:server`, rồi từng bước.
- [ ] **Step 2: Bấm thử bằng ẢNH THẬT** (`PORT=4390 WEB_PORT=5390`, `POST /api/demo/session {userId}`: admin=1, QL=2, GVCN=7, GVBM=9) — **375 và 1440, sáng và tối, ≥ 3 vai** (QL, Quản trị, GVCN; thêm GVBM): 
  - Hồ sơ em đã kết thúc: ⋮ có `Học lại` (QL, QT), **không** có ở GVCN/GVBM; panel với `Về lớp cũ` (lớp cũ đã kết thúc → dòng `Mở lại lớp …`) và `Sang lớp mới` (chọn lớp thường; chọn lớp Fast Track → ô Target bắt buộc, báo `Lên FT cần Target`); toast Hoàn tác; Hành trình có dòng `Học lại`, lộ trình cũ còn ở Hành trình.
  - Hồ sơ lớp đã kết thúc: ⋮ `Mở lại lớp`; Lưu trữ › Lớp: nút `Mở lại`.
  - Tab Học viên của hồ sơ lớp (QL / QT): nút `Chọn nhiều học viên` → ô chọn trên bảng FT, bảng lớp thường và thẻ điện thoại; thanh dính đáy (`n đã chọn · Lưu trữ · Kết thúc học · Huỷ chuyển lớp · Bỏ chọn`) không che dòng cuối; bấm một việc → panel xem trước (số hệ quả, `Bỏ qua n học viên`); đang lưu `n/m`; lỗi giữa chừng (tạm chặn một học viên bằng cách đổi chi nhánh em đó ở DB test, KHÔNG ở DB thật) → `Đã lưu n học viên · m học viên chưa lưu` + `Thử lại`; Hoàn tác. GVCN/GVBM: không có nút. **Bảng Học viên & Lớp không có ô chọn.**
  - Lưu trữ › Học viên: `Chọn nhiều học viên` → thanh `Bỏ lưu trữ` / `Học lại`; `Học lại` từng em → panel có chọn đích.
  - Chuyển tiếp lớp: chọn nhiều → `Huỷ quyết định`; Hoàn tác (Khôi phục).
  - Điện thoại 375: nút ≥ 44 px, không cuộn ngang, chân panel không đè.
  Ảnh lưu `docs/so-tay/…` chỉ nếu sổ tay lệch (ghi vào mô tả PR, không sửa sổ tay).
- [ ] **Step 3: Impeccable** — theo CLAUDE.md: `layout`, `clarify`, `harden` (hàng loạt, lỗi giữa chừng, em ngoài quyền, mất mạng), `adapt` 375, cuối `audit`. Giữ Be Vietnam Pro, bảng màu, bố cục đã khoá. Skill gợi ý trái mockup đã duyệt → ghi vào báo cáo cho chủ sản phẩm, không tự làm.
- [ ] **Step 4:** `/ponytail-review`; liệt kê chú thích `ponytail:` (hiện có: `moLaiLop` — lớp thường hết khoá rỗng có thể bị tự kết thúc lại; `hangLoat.ts` — mỗi em một giao dịch, không khoá chống gửi trùng). 
- [ ] **Step 5:** `superpowers:verification-before-completion`, `superpowers:requesting-code-review` (người rà **Opus 5.5 khác session**), `superpowers:finishing-a-development-branch`: mở PR **vào `main`**, KHÔNG merge. Mô tả PR báo từng việc: tái hiện (số liệu báo cáo rà 06/10 B1 / C9–C10) · file sửa · phép kiểm bảo vệ (LUIb-1…19) · ảnh · giới hạn còn lại · chú thích `ponytail:` · ảnh sổ tay lệch.
- [ ] **Step 6:** `[x]` các Task ở file này; một dòng mục 11 `plan.md`; `CODE_MAP.md` thêm `students/hangLoat.ts`, `students/XemTruocHangLoatPanel.tsx`, `students/chonNhieuHocVien.tsx`, `students/hangLoatEm.ts`, `shared/domain/hangLoatEm.ts`; tắt mọi tiến trình, xoá file Vite tạm, **không** gỡ worktree trước khi PR xong.

---

## Phép kiểm → yêu cầu (soát chéo)

| Yêu cầu (plan.md mục 4, PR-LUI b) | Task | Phép kiểm |
|---|---|---|
| "Học lại" cho em đã kết thúc học (về lớp cũ / sang lớp mới) | 2, 6, 9 | LUIb-3, 4, 5, 7, 7b, 14, 18 |
| Mở lại lớp đã kết thúc | 2, 7 | LUIb-6, 7, 12, 15 |
| Kết thúc học nhiều học viên một lần | 3, 8 | LUIb-8, 9, 16, 17 |
| Lưu trữ (và Bỏ lưu trữ) nhiều học viên | 3, 8, 9 | LUIb-10, 17, 18 |
| Huỷ quyết định chuyển lớp nhiều học viên | 3, 4, 8, 10 | LUIb-10b, 11, 17, 19 |
| Chỉ QL / Quản trị, không nới quyền GV | 2, 3, 4, 5 | LUIb-4 (GVCN 403), 6, 9, 11, 12, 13 |
| Có nhật ký | 2, 3, 4 | LUIb-3 (`student.rejoin`), 6 (`class.reopened`), 8–9 (`student.hang_loat`), 11 (`lenh_chuyen.huy/khoi_phuc`) |
| Lùi lại được | 6, 7, 8, 10 | Hoàn tác trong LUIb-8 (về nguyên trạng), 11 (Khôi phục), 14–18 |
| Xem trước trước khi làm hàng loạt | 3, 8, 10 | LUIb-8, 9, 16, 18 |
| Lỗi giữa chừng không mất dữ liệu | 3, 8 | LUIb-9, 16 |

## Cái bỏ qua (và khi nào thêm)

- **Khoá chống gửi trùng** cho làm nhiều em: cả bốn việc lặp lại an toàn (em ở sẵn trạng thái đó → `failed` "Đã …", không ghi); thêm khi có việc không lặp lại được.
- **Chuông cho Học lại / Mở lại lớp:** GVCN thấy em trở lại bảng lớp; thêm khi chủ sản phẩm muốn báo.
- **Dòng "Lộ trình chạy tiếp"** luôn hiện ở panel Học lại dù em không có lộ trình bị đóng: thêm `loTrinhSeChay` vào `xemTruoc` và ẩn dòng khi `null` nếu cần sát.
- **Hoàn tác huỷ quyết định > 5 giây ở web:** máy chủ cho 24 giờ (`khoiPhucLenh`), web chỉ nút 5 giây; thêm màn "Quyết định vừa huỷ" nếu cần.
- **Học lại sang lớp khác / lộ trình mới** (Q1-B), **hoàn tác Chuyển lớp đã thi hành**, **khoá / mở khoá tài khoản**, **khôi phục tài khoản / học viên đã xoá**: ngoài phạm vi 06/10 (phần a và mục 8 `plan.md`).
- **Ô chọn thường trực trên bảng Học viên & Lớp:** không làm (chủ sản phẩm 06/10) — chọn nhiều chỉ ở tab Học viên của hồ sơ lớp và Lưu trữ.
- **Học lại hàng loạt sang lớp Fast Track:** chưa làm (cần Target từng em) — học lại từng em ở hồ sơ.
- **Chọn nhiều học viên ở cách xem "Cần hỗ trợ":** chưa làm (danh sách con theo Case).
