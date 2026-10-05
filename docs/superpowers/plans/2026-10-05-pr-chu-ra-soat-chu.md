# PR-CHU · Rà soát chữ tiếng Việt chối tai — Kế hoạch (05/10)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Làm ra **một file Markdown** `thiet-ke/CHU_CAN_SUA_2026-10.md` liệt kê mọi chữ tiếng Việt trên web đang gượng, dài, dịch máy hoặc lẫn chữ hệ thống — đủ ngữ cảnh để một AI khác (giỏi tiếng Việt, không đọc mã) đề xuất chữ mới, rồi session sau dùng file đó sửa web. **PR này không sửa một chữ nào trong mã.**

**Architecture:** Hai nguồn ghép lại. (1) **Quét máy**: một script Node dùng `typescript` (đã có trong devDependencies) đọc AST của `web/src`, `shared/domain`, `server/src` → mọi chuỗi có chữ (JSX text, thuộc tính `placeholder/title/aria-label/label`, chuỗi/template trong `toast`, `confirm`, `notify`, `HttpError/notFound/forbidden/conflict`, nhãn ở `shared/domain`) kèm `file:dòng` và "vỏ" (gọi trong hàm nào, thẻ JSX nào). Bộ lọc gắn mã lý do L1–L10. (2) **Bấm thử thật**: chạy bản dev, đăng nhập 4 vai, đi qua danh sách màn, mỗi màn chạy một đoạn JS lấy chữ đang hiện → biết chữ nằm **màn nào › khu vực nào, ai thấy, đang làm gì**. Người làm (model) đọc từng ứng viên, bỏ báo nhầm, viết file đầu ra.

**Tech Stack:** Node ≥ 20.11, `typescript` 5.9.3 (Compiler API, không thêm gói), Browser pane (`mcp__Claude_Browser__*`), bản dev `npm run dev`.

**Spec:** yêu cầu chủ sản phẩm 05/10 (plan.md mục 2c, T13 dòng cuối) + luật chữ plan.md mục 1.1 + `thiet-ke/TU_DIEN_VA_CHU.md` §4 + `thiet-ke/THUAT_NGU_2026-10-01.md`.

**Thứ tự:** Đợt 4 (sau khi DL, K26, SL merge). Chạy song song PR-NV và PR-MTa → quét trên `origin/main` **mới nhất lúc bắt đầu**; chữ mà PR-NV / PR-MTa đang đổi thì **không liệt kê lại**, chỉ ghi một dòng ở mục "Đã giao PR khác" (xem Task CHU-0).

## Chủ sản phẩm chốt 05/10 (sau khi soạn) — ĐÈ lên phần dưới nếu khác
- Q1: **giữ** script quét trong repo `scripts/quet-chu.mjs` (không chạy trong `npm run check`).
- Q2: file chỉ liệt kê **chữ chối** + mục "Cụm khái niệm nhiều tên"; không phụ lục mọi nhãn.

## Global Constraints
- **Không sửa mã.** Diff của PR chỉ gồm: `thiet-ke/CHU_CAN_SUA_2026-10*.md`, một dòng `plan.md` mục 11, một dòng `CODE_MAP.md` (bảng "Tài liệu nào để làm gì"), dấu `[x]` trong file này. Script quét để ngoài repo (scratchpad) — xem Câu hỏi Q1.
- Chuẩn chung để chấm "chối" (chủ sản phẩm 05/10): tiếng Việt tự nhiên như người dùng thật nói · ngắn (nhãn, nút, tab, chip **1–3 từ**; tiêu đề cột ≤ 5 từ) · không dịch máy · **được giữ English / nửa Anh nửa Việt** khi tự nhiên và đúng nghĩa hơn (`Target`, `Mock Test`, `Case`, `Band`, `OVR`) · **không câu giải thích dưới nút/ô**.
- **Không liệt kê:** ghi chú/tên do người dùng nhập (seed: tên HV, lớp, ghi chú GV) · chú thích mã · `console.*` · `server/src/tests`, `server/src/seed`, `server/src/migrate`, `server/src/ops` (chạy dòng lệnh) · thanh `DemoBar`, trang `/dev/thanh-phan`, dòng "Bản demo nội bộ" (không có ở bản chính) · sổ tay PDF.
- File đầu ra viết cho **người đọc không biết mã**: mỗi mục có chữ nguyên văn (giữ `{n}`, `{tên}` thay cho `${…}`), chỗ trên màn trước, `file:dòng` sau.
- Thời gian trên màn dùng mã tuần `W2 OCT` — **không** coi mã tuần là "chữ hệ thống lọt".
- Cổng riêng: `PORT=4631 WEB_PORT=5631` (không 4000/5173). Không chạm DB bản chính, không `netlify deploy`.
- Nhánh `pr-chu-ra-soat-chu` từ `origin/main` mới nhất, worktree `.claude/worktrees/pr-chu-ra-soat-chu` (chạy `npm ci` trong worktree — worktree mới không có `node_modules`).

## Skill bắt buộc
| Lúc | Skill / lệnh |
|---|---|
| Đầu phiên | Nói rõ model đang chạy (phải là **Sonnet 5.5 · High**, phương án B **Opus 5.5 · Medium**); khác thì DỪNG, báo. `superpowers:executing-plans` (một người làm hết — các Task nối tiếp nhau, không đáng chia subagent). Ponytail `full` (không sửa giao diện) |
| CHU-1, CHU-2 | Script có phép tự kiểm (assert) — không cần `test-driven-development` đầy đủ |
| CHU-4 | `/impeccable clarify` **chỉ để đọc tiêu chí** chữ UX (nhãn, lỗi, trạng thái rỗng) khi chấm "vì sao chối"; **không** để nó sửa mã |
| Cuối PR | `superpowers:verification-before-completion` (chạy Task CHU-5 bước kiểm định dạng) · `superpowers:finishing-a-development-branch` (mở PR vào `main`, **không merge**). Không có giao diện, không mã → bỏ `npm run check`, `/impeccable audit`, `/ponytail-review` (ghi rõ trong mô tả PR) |

## Số đo thật (05/10, nhánh `ke-hoach-test-mt-05-10`, grep thô — số thật sẽ lệch ±15 % sau khi quét AST)
| Đo | Số |
|---|---|
| File `.ts/.tsx` có chữ: `web/src` · `shared/domain` · `server/src` (trừ tests/seed) | 179 · 62 · 132 |
| Dòng có dấu tiếng Việt (bỏ dòng chú thích): web · shared · server | 4 038 · 1 286 · 2 472 |
| **Chuỗi khác nhau** có dấu tiếng Việt (ba thư mục, trừ tests/seed/migrate) | **≈ 5 950** |
| Trong đó 1–3 từ (nhãn) · > 12 từ · > 20 từ | 2 170 · 725 · 202 |
| Thuộc tính `placeholder/title/aria-label="…"` ở web | 340 |
| Lời gọi `toast`/`confirm` ở web | ≈ 300 |
| Lỗi máy chủ: `notFound(` · `forbidden(` · `HttpError` · `throw new Error` · `conflict(` | 130 · 65 · 22 · 54 · 7 |
| `notify(` (thông báo chuông) | 30 lời gọi (+ `notifyPlanners`, `notifyTeachers`) |
| Chữ có "dữ liệu" · "không hợp lệ" · "Bạn" · "MT lịch sử" · dấu " — " | 62 · 69 · 77 · 19 · 411 |
| "Hãy" / "Vui lòng" | 0 / 0 (đã dọn 22/09 — vẫn để bộ lọc) |

**Ước lượng:** ≈ 6 000 chuỗi máy đọc → ≈ 1 200–1 500 ứng viên qua bộ lọc → **≈ 350–500 mục** trong file đầu ra (sau khi gộp chuỗi trùng và bỏ báo nhầm). Đọc tay ứng viên là phần tốn nhất (~60 % thời gian).

---

### Task CHU-0: Mục "Thuật ngữ đã chốt" + "Đã giao PR khác"
**Files:** tạo `thiet-ke/CHU_CAN_SUA_2026-10.md` (khung + hai mục đầu). Đọc: `thiet-ke/THUAT_NGU_2026-10-01.md` (bảng "Đã chốt 01/10" và mọi dòng có cột **Sửa thành** khác rỗng), `thiet-ke/TU_DIEN_VA_CHU.md` §1, §4, §6.0, §13, §15, `plan.md` mục 1.1 và 2c (T1, T7, T8, T13b), `thiet-ke/THUAT_NGU_DA_CHOT.md` (bản cũ — chỉ lấy dòng không mâu thuẫn bản 01/10).

- [x] Viết khung file đúng mục "Định dạng file đầu ra" bên dưới.
- [x] Mục 1 **Thuật ngữ đã chốt — không đề xuất ngược**: bảng `Khái niệm | Chữ dùng | Không dùng | Nguồn`. Bắt buộc có: `Target` (không "Mục tiêu", "Mục tiêu band") · `MT cũ` (thay `MT lịch sử`, T1 05/10 — **thắng** TU_DIEN §13 đang ghi ngược) · `Nhắc việc` (thay `Để QL biết`, T8) · `Case` viết hoa · `PA` (chỗ rộng "Phương án") · `QL` (chỗ rộng "Quản lý") · `Đóng` (không "Thôi") · `Báo QL` · `Lịch Test` (không "Lịch kiểm tra") · `Xác nhận chuyển lớp` · `lần xử lý` (Ý thức) · `Dời lịch thi` ≠ `Dời hạn chấm` · `Không có bài` → `Không dự thi` · 12 khái niệm không nhập làm một (TU_DIEN §1) · `SOS 1/2/3` · `Mock Test`/`MT`, `Fast Track`/`FT`, `OVR`/`Overall`, `Band`, `KCK`, `RF` giữ tiếng Anh · "Huỷ" (dấu trên y, không "Hủy") · mã tuần `W2 OCT` · không mở câu bằng "Hãy".
- [x] Mục 2 **Đã giao PR khác (đừng đề xuất lại)**: `Để QL biết` → PR-NV · `MT lịch sử` và chữ "lý do bắt buộc" (T7) → PR-MTa/MTb · tên web `PISA Tracking` và chữ J1–J9 → PR-HK2. Một dòng mỗi việc, ghi nguồn.
- [x] Commit: `docs(chu): khung file chữ cần sửa, thuật ngữ đã chốt`.

### Task CHU-1: Script quét chữ (AST)
**Files:** tạo `<scratchpad>/quet-chu.mjs` (không commit — Q1); ra `<scratchpad>/chu-tho.jsonl`.

**Interfaces:**
- Produces: mỗi dòng JSONL `{ id, file, line, loai, vo, text, nhom }` — `loai` ∈ `jsx-text | attr:<tên> | string | template`; `vo` = tên hàm/thẻ bao gần nhất (`toast.error`, `notify.title`, `notFound`, `forbidden`, `HttpError`, `confirm`, `button`, `th`, `label`, `option`, `p.text-xs`, `Nhan`, khoá thuộc tính `label:`/`title:`…); `text` đã `normalize('NFC')`, gộp khoảng trắng, `${x}` → `{x}`; `nhom` = `web | shared | server`.

- [x] Bước 1: viết script — `ts.createSourceFile(file, src, Latest, true, file.endsWith('x') ? TSX : TS)`; duyệt `StringLiteral`, `NoSubstitutionTemplateLiteral`, `TemplateExpression`, `JsxText`, `JsxAttribute` có giá trị chuỗi. Giữ chuỗi có ít nhất một chữ cái tiếng Việt có dấu **hoặc** (ở JSX text/thuộc tính hiển thị) ≥ 2 chữ cái Latin. Bỏ: đường import, chuỗi SQL (`/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|JOIN)\b/`), đối số `console.*`, `className`, `key`, `to=`/`href=`, khoá `kind`/`dedupKey`, chuỗi khớp `^[a-z0-9_.:/-]+$` (mã nội bộ — nhưng **giữ lại riêng** nếu nằm trong JSX text hoặc `title/body` của `notify`: đó là chữ hệ thống lọt, L7). Thư mục bỏ theo Global Constraints. Dòng = `getLineAndCharacterOfPosition(node.getStart()).line + 1`.
- [x] Bước 2: phép tự kiểm cuối script (`node:assert`), chạy mỗi lần: (a) có ≥ 1 bản ghi `nhom:'server'` với `vo` = `notify.title`; (b) có ≥ 1 bản ghi `vo` bắt đầu bằng `toast`; (c) có ≥ 1 bản ghi `loai:'attr:placeholder'`; (d) **không** có bản ghi nào từ `/tests/` hay `/seed/`; (e) chuỗi `CHUA_CO_PHUONG_AN` ở `web/src/ui/chu.ts` (`'Chưa có PA'`) có mặt với đúng `file:dòng`; (f) tổng bản ghi nằm trong 4 000–9 000 (lệch thì in số và dừng — xem lại bộ bỏ).
- [x] Bước 3: chạy `node <scratchpad>/quet-chu.mjs > <scratchpad>/chu-tho.jsonl`; ghi số bản ghi theo `nhom` và `loai` vào ghi chú làm việc (đưa vào mục "Cách làm" của file đầu ra ở CHU-4).

### Task CHU-2: Bộ lọc ứng viên (L1–L10)
**Files:** tạo `<scratchpad>/loc-chu.mjs`; ra `<scratchpad>/chu-ung-vien.jsonl` (bản ghi CHU-1 + `lyDo: string[]`) và `<scratchpad>/cum-khai-niem.md`.

Mã lý do (dùng nguyên văn trong file đầu ra):
| Mã | Nghĩa | Luật máy (gắn cờ; người đọc quyết) |
|---|---|---|
| L1 | Dài | nhãn (`vo` ∈ button, th, label, option, tab, chip/`Nhan`, khoá `label:`/`nhan:`/`ten:`) > 3 từ; tiêu đề cột > 5 từ; câu khác > 15 từ; lỗi/toast > 20 từ |
| L2 | "Hãy", "Vui lòng", "Xin", "Lưu ý:", "Chú ý:", "Bạn có chắc" | regex không phân biệt hoa thường |
| L3 | Câu giải thích dưới nút/ô | JSX text trong `p/span/div` có lớp `text-xs`, `text-[11px]`, `text-[12px]` hoặc `text-muted`, ≥ 6 từ, là anh em ngay sau `input/select/textarea/button` hoặc component ô/nút |
| L4 | Hán Việt / giọng công văn | có một trong: thực hiện, tiến hành, khởi tạo, thao tác, hệ thống (trừ "Quản trị hệ thống"), dữ liệu, đối tượng, hợp lệ, tồn tại, xác thực, truy cập, tương ứng, hiện hành, nhằm, tại thời điểm, liên quan, đính kèm, phạm vi, ghi nhận |
| L5 | Dịch máy | "đã được" / "được" bị động đầu câu, "của bạn", "bởi", "trong trường hợp", "với tư cách", "thành công" cuối câu, "Không thể …" |
| L6 | Hai chữ một khái niệm | đếm biến thể theo cụm: Target/Mục tiêu/band mục tiêu · lượt/đợt · Test/Bài kiểm tra/Bài đánh giá · PA/Phương án · QL/Quản lý · Đóng/Thôi · Huỷ/Hủy · Case/case · Normal/Lớp thường · Progress Test/Giữa khoá · Final Test/Cuối khoá · Giáo viên/GV · Học viên/HV/em · Nhập điểm/Chấm · Lộ trình/LT → ghi `cum-khai-niem.md` (cụm → biến thể → số chỗ → 3 `file:dòng` mẫu) |
| L7 | Chữ hệ thống lọt | snake_case, camelCase, `undefined`, `null`, `NaN`, `[object`, mã enum tiếng Anh (`active`, `pending`, `done`) trong chữ hiển thị; mã HTTP/tên bảng trong câu lỗi |
| L8 | Trái thuật ngữ đã chốt | chứa chữ ở cột "Không dùng" của mục 1 (CHU-0) |
| L9 | Trùng nghĩa trong một câu / thừa | từ lặp ≥ 2 lần trong ≤ 8 từ; "đang … hiện tại"; hai câu cùng ý nối bằng " — " |
| L10 | Mơ hồ / đại từ trôi | "em này", "lượt đó", "máy", "đường này", "chốt chung", "Khác" đứng một mình (TU_DIEN §4) |

- [x] Bước 1: viết bộ lọc theo bảng; mỗi bản ghi có ≥ 1 mã → ứng viên. Chuỗi giống hệt nhau (sau NFC) gộp thành một ứng viên với danh sách `file:dòng`.
- [x] Bước 2: tự kiểm (`assert`): `'Hãy chọn học viên.'` → có L2; `'Chưa có PA'` → không cờ; `'sos_ft'` trong JSX text → L7; `'Mục tiêu band'` → L8; `'W2 OCT'` → không cờ.
- [x] Bước 3: chạy, in bảng đếm theo mã lý do × `nhom`. Kỳ vọng ứng viên 1 200–1 500; > 2 000 thì siết L4/L5 (chỉ gắn khi chuỗi > 6 từ) và ghi lại đã siết gì.

### Task CHU-3: Bấm thử — lấy chữ theo màn
**Files:** ra `<scratchpad>/man/<vai>-<ma-man>.json` (không commit).

- [x] Bước 1: `npm ci` (nếu chưa) → `npm run seed` → chạy nền `PORT=4631 WEB_PORT=5631 npm run dev` → `preview_start` với `url: http://localhost:5631`.
- [x] Bước 2: đổi vai bằng `javascript_tool`: `await fetch('/api/demo/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:N}),credentials:'include'}); location.reload()` — Quản trị **1**, QL **2** (chi nhánh MB), GVCN **7**, GVBM **9**. Thêm QL **3** chỉ cho Tổng quan (đủ trạng thái quá hạn nhất).
- [x] Bước 3: mỗi màn chạy một đoạn JS thu: mọi text node đang hiện (bỏ `[data-demo]`/DemoBar), cộng `placeholder`, `title`, `aria-label` của phần tử; mỗi chữ kèm `khu` = tiêu đề `h1/h2/h3` hoặc `[role=dialog] h2` gần nhất phía trên. Lưu `{vai, man, url, khu, text}`. Màn có trạng thái ẩn (menu ⋮, hộp xác nhận, panel, toast sau khi lưu, chuông) → mở ra rồi thu lần nữa, `man` thêm hậu tố (`G5-menu`, `G9-loi-diem`).
- [x] Bước 4: danh sách màn phải đi qua — mã theo `docs/so-tay/BAN_DO_MAN_HINH_2026-10-02.md` (kiểm lại tên màn trên bản mới; màn mới sau 02/10 ghi thêm):
  - **GVCN 7:** G1 Tổng quan · G2 Học viên & Lớp (chip lọc, trạng thái rỗng khi lọc không ra) · G3 Lưu trữ · G4 Hồ sơ lớp (3 tab, menu ⋮, menu "+n") · G5 Hồ sơ HV (Học thuật, Ý thức & Phối hợp, Hành trình, bảng Mock Test) · G6 Ngăn Case đủ 5 view (case, ghi kết quả, thêm PA, hoàn thành, trả lời) · G7 + Case · G8 Lịch Test (dải số, Nợ tuần trước, mở một lớp) · G9 lưới nhập điểm (gõ điểm sai → câu lỗi; gõ `-`; sửa ô đã có điểm → hỏi lý do) · G10 Hồ sơ Mock (menu thao tác: dời lịch, dời hạn, bỏ kỹ năng, huỷ) · G11 Ý thức (+ Ghi nhận vi phạm, toast Hoàn tác) · G12 Công việc · G13 Chuyển lớp/Đề xuất · G14 Lộ trình tiếp theo (một em + cả lớp, PR-K26) · G15 Bàn giao · G16 Kết luận khoá · G17 Thêm học viên · G18 Hồ sơ GV · G19 Hồ sơ cá nhân · Điểm theo lớp (PR-DL) · chuông thông báo (mở từng nhóm Cần làm / Để biết).
  - **GVBM 9:** G1, G8, G9 (Speaking), G12; mở `/giao-vien/7` → câu 403; một màn không có quyền (Kế hoạch Test qua URL).
  - **QL 2 (+3):** Q1 Việc hôm nay · Q2 Phân tích (5 góc) · Q4 Tạo lớp · Q5–Q7 · Q8 Kế hoạch Test (xếp lịch MT, hàng loạt, popup cảnh báo) · Q9 Chờ duyệt (duyệt, từ chối → hỏi lý do) · Q10–Q12 Công việc · Q13 Hồ sơ GV người khác · Xuất Excel MT.
  - **Quản trị 1:** A1 Quản trị (mọi tab) · A2 hộp Xoá lớp / Kết thúc lớp / Xoá HV (chỉ mở hộp, **bấm Đóng**, không xác nhận) · A3 · màn đăng nhập sau khi đăng xuất (`DELETE /api/demo/session`).
  - **Điện thoại 375:** chỉ G1, G2, G5, G8, G9, Q1 — thu chữ chỉ có trên điện thoại (thanh dưới, thẻ `TheDong`, menu ⋯).
- [x] Bước 5: trên mỗi màn chạy thêm regex L7 trên toàn văn bản trang (`/[a-z]+_[a-z_]+|undefined|null|NaN|\[object/`) — chữ hệ thống lọt **chỉ lộ lúc chạy** (ghép từ dữ liệu). Ghi vào ứng viên với `file:dòng` = "(lúc chạy)" + `url`.
- [x] Bước 6: tắt `npm run dev`, kiểm không còn tiến trình node của cổng 4631/5631, `preview_stop`.

### Task CHU-4: Ghép, đọc tay, viết file đầu ra
**Files:** sửa `thiet-ke/CHU_CAN_SUA_2026-10.md`.

- [x] Bước 1: ghép — mỗi ứng viên (CHU-2) tìm trong dữ liệu màn (CHU-3) bằng so khớp chuỗi đã NFC (template: so phần chữ cố định giữa các `{x}`). Có → lấy `vai`, `man`, `khu`. Không thấy lúc chạy → suy màn từ `file` theo bảng "Tra theo MÀN HÌNH" ở `CODE_MAP.md`; câu lỗi máy chủ → suy từ đường API (tìm hàm chứa trong `server/src/routes/index.ts`) và ghi "Ai thấy: (suy từ mã) …".
- [x] Bước 2: đọc tay **từng** ứng viên theo thứ tự màn. Giữ khi người dùng thật thấy chối; bỏ khi chữ đã tự nhiên dù máy gắn cờ (ví dụ "Quản trị hệ thống", tên riêng). Mỗi mục giữ lại: viết "Vì sao chối" = mã L + nửa câu cụ thể (ví dụ `L4 · "thực hiện" thừa, nói "làm" là đủ`). Gợi ý **chỉ khi chắc** và không trái mục 1; không chắc thì để trống — đừng đoán.
- [x] Bước 3: chuỗi lặp ở nhiều màn → **một mục** ở màn gặp đầu tiên, cột "Ở đâu" ghi 3 chỗ đầu + "và n chỗ khác"; các màn sau chỉ ghi "xem `TQ-07`".
- [x] Bước 4: viết mục "Cụm khái niệm nhiều tên" từ `cum-khai-niem.md` (chỉ cụm có ≥ 2 biến thể **đang hiện trên màn**, bỏ cụm đã chốt ở mục 1 nếu web đã dùng đúng).
- [x] Bước 5: mục "Cách làm": lệnh đã chạy, số bản ghi/ứng viên/mục, những gì đã bỏ và vì sao, màn không vào được (nếu có).
- [x] Bước 6: nếu file > **1 800 dòng** hoặc > **450 mục** → chia (xem "Chia file"). Commit: `docs(chu): danh sách chữ cần sửa theo màn`.

### Task CHU-5: Kiểm định dạng, mở PR
**Files:** sửa `plan.md` (mục 11 một dòng; mục 2c ghi PR-CHU đã có file), `CODE_MAP.md` (bảng "Tài liệu nào để làm gì": một dòng cho `thiet-ke/CHU_CAN_SUA_2026-10.md`), file kế hoạch này (`[x]`).

- [x] Bước 1: kiểm bằng một lệnh node một lần (không lưu): mọi hàng bảng mục có đủ 8 cột, mã mục không trùng, mọi `file:dòng` trỏ tới file có thật và dòng ≤ số dòng file, không mục nào có chữ ở cột "Không dùng" của mục 1 trong cột **Gợi ý**. In `OK n mục`.
- [x] Bước 2: đọc lại 20 mục ngẫu nhiên đối chiếu màn thật/mã: chữ nguyên văn đúng, vị trí đúng.
- [x] Bước 3: `git diff --stat origin/main` chỉ có các file ở Global Constraints. Commit, đẩy, mở PR vào `main` (không merge). Mô tả PR: số mục theo màn và theo mã lý do, những gì bỏ ngoài phạm vi, Q1/Q2 nếu chưa trả lời, câu "PR không đổi mã — không chạy `npm run check`".

---

## Định dạng file đầu ra `thiet-ke/CHU_CAN_SUA_2026-10.md`
```markdown
# Chữ cần sửa trên web PISA Tracking — 10/2026
Dành cho: người/AI đề xuất chữ mới. Đọc mục 0–2 trước. Chỉ điền cột "Đề xuất" (cột cuối). Giữ nguyên {n}, {tên}, {tuần}.

## 0. Chuẩn chung              (5 dòng: tự nhiên · nhãn 1–3 từ · không dịch máy · được dùng English · không câu dưới nút/ô)
## 1. Thuật ngữ đã chốt — không đề xuất ngược      (bảng CHU-0)
## 2. Đã giao PR khác — đừng đề xuất lại            (CHU-0)
## 3. Mã lý do                   (bảng L1–L10, một dòng mỗi mã)
## 4. Cụm khái niệm nhiều tên    (CHU-4 bước 4)
## 5. Theo màn
### 5.1 Tổng quan (TQ)
#### Việc hôm nay › Cần xử lý
| Mã | Chữ hiện tại | Ở đâu | Ai thấy | Đang làm gì | Vì sao chối | Gợi ý | Đề xuất |
|---|---|---|---|---|---|---|---|
| TQ-01 | `(ví dụ minh hoạ, không phải chữ thật)` | Tổng quan › Cần xử lý › cột Việc · `web/src/modules/worklist/KhoiCanXuLy.tsx:120` | QL | xem việc trong ngày | L1 · 8 từ cho một ô việc | | |
## 6. Câu báo lỗi, thông báo chuông, nhật ký (không gắn một màn)
## 7. Cách làm                   (CHU-4 bước 5)
```
- Mã mục: tiền tố màn — `TQ` Tổng quan · `PT` Phân tích · `HVL` Học viên & Lớp · `LOP` Hồ sơ lớp · `HV` Hồ sơ HV · `CASE` Ngăn Case · `YT` Ý thức · `LT` Lịch Test · `ND` Nhập điểm / Điểm theo lớp · `KH` Kế hoạch Test · `MOCK` Hồ sơ Mock · `CV` Công việc · `CD` Chờ duyệt · `CL` Chuyển lớp / Lộ trình tiếp theo / Bàn giao · `GV` Hồ sơ GV · `QT` Quản trị · `CHUNG` thanh trên, chuông, đăng nhập · `LOI` câu lỗi máy chủ · `TB` thông báo chuông · `NK` nhật ký. Số hai chữ số, tăng dần trong màn.
- "Ai thấy": `QTHT` / `QL` / `GVCN` / `GVBM` / `mọi vai` — dấu `*` khi suy từ mã chưa thấy tận mắt.
- Cột "Đề xuất" để trống cho AI kia điền. Trong ô không dùng `|` (dùng `·`).

**Chia file:** > 1 800 dòng hoặc > 450 mục → giữ `CHU_CAN_SUA_2026-10.md` gồm mục 0–4, 7 và mục lục; tách mục 5–6 thành `CHU_CAN_SUA_2026-10-a-tong-quan-cong-viec.md` (TQ PT CV CD) · `-b-hoc-vien-lop.md` (HVL LOP HV CASE YT CL GV) · `-c-test.md` (LT ND KH MOCK) · `-d-chung-may-chu.md` (QT CHUNG LOI TB NK). Mỗi file con chép lại mục 1 dạng rút gọn (chỉ cột Chữ dùng / Không dùng) để AI đọc riêng một file vẫn không đề xuất ngược.

## Review Focus
1. **Chữ ghép lúc chạy** (template `${…}`, chuỗi nối từ `shared/domain` + dữ liệu) — quét tĩnh thấy mảnh, màn thấy câu hoàn chỉnh: mục phải ghi câu như màn hiện (thay biến bằng `{…}`), không ghi mảnh rời.
2. **Chuỗi trùng ở web và máy chủ** (cùng câu lỗi viết hai nơi) — một mục, ghi đủ hai `file:dòng`, để session sửa không sửa một bỏ một.
3. **Chữ phép kiểm đang khớp** (`server/src/tests` so chuỗi lỗi/nhãn) — không liệt kê file kiểm, nhưng cột "Ở đâu" thêm `(test khớp)` khi `grep` thấy chuỗi trong `server/src/tests`, để session sau biết phải sửa cả phép kiểm.
4. **Báo nhầm của bộ lọc** — tên riêng, chữ đã chốt, mã tuần, tên kỹ năng tiếng Anh (Listening, Speaking): đọc tay bỏ, không đẩy vào file.
5. **Màn chỉ hiện ở trạng thái hiếm** (lỗi mạng "Mất kết nối", 403, trạng thái rỗng, quá hạn) — nếu không dựng được, vẫn lấy từ quét tĩnh, gắn `*` ở "Ai thấy" và ghi "chưa thấy tận mắt" ở "Đang làm gì".

## Câu hỏi cho chủ sản phẩm (session code dùng khuyến nghị nếu chưa có trả lời)
- **Q1.** Script quét có giữ trong repo (`scripts/quet-chu.mjs`, ~150 dòng, không nằm trong `npm run check`) để session sửa chữ chạy lại kiểm còn sót không? **Khuyến nghị: có** — khi đó Task CHU-1 đặt script ở `scripts/` và commit; còn không thì để ở scratchpad.
- **Q2.** File đầu ra chỉ liệt kê chữ **chối**, hay kèm phụ lục **mọi nhãn 1–3 từ** (≈ 2 000 dòng) để AI kia soát tính nhất quán? **Khuyến nghị: chỉ chữ chối** + mục 4 "Cụm khái niệm nhiều tên" (đã bắt được chuyện nhất quán).

## Nghiệm thu
- File có đủ mục 0–7; mục 1 có Target, MT cũ, Nhắc việc và các chữ ở CHU-0; mọi mục có 8 cột; mã mục không trùng; `file:dòng` đúng (CHU-5 bước 1 in `OK`).
- Mỗi màn trong danh sách CHU-3 bước 4 có ít nhất một dòng trong mục "Cách làm" (đã đi qua / không vào được vì …).
- Diff PR không có file mã nào.
