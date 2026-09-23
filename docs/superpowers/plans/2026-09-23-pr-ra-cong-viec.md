# PR-Ra · Công việc (Hỗ trợ học viên · Vận hành · Báo cáo đơn vị) — Kế hoạch

| Mục | Chốt |
|---|---|
| Mã PR · đợt | **PR-Ra** · đợt 3, **trước deploy** (chủ sản phẩm thêm 23/09 chiều vì còn thời gian) |
| Nhánh · worktree | `pr-ra-cong-viec` · `.claude/worktrees/pr-ra-cong-viec` · một PR, không draft, **không tự merge** |
| Cổng thử | API **4317** · Vite **5517** (không 4000/5173, không cổng PR khác) |
| Model khuyến nghị | **Opus 5.5 · High** |
| Phương án B | **Sonnet 5 · High** |
| Người rà | **Fable 5.1** (nếu code bằng Fable thì **Opus 5.5**) — khác model người code |
| Migrate | **CÓ** — `migrateCongViec` (Task 1): 2 cột `tasks`, 1 cột `task_history`, 2 cột `unit_reports`, 1 cột `unit_report_history`, bảng `unit_report_task_links`. Chạy lặp không làm gì. **LT cũng có migrate → merge lần lượt**, PR merge sau rebase + chạy lại migrate lặp |
| Phụ thuộc | Bắt đầu ngay trên `origin/main` (đã có Pa #68, Qa #69, Rc1 #70, Form #72, Pb #73, TD #74). **Task 6 (nút Nhắc → link thông báo) cần Qb #75 đã merge** (hàm `duongThongBao`); chưa merge thì làm Task 7–8 trước. Merge **sau** Qb #75 và Rc2 #76 |
| File KHÔNG được chạm | **YT2:** `yThuc/*` (server + web — chỉ *import* `useNhacYThuc`), `measures.ts`, `violations.ts` · **Qb:** `StudentDetailPage.tsx`, `JourneyTimeline.tsx`, `HanhTrinh.tsx`, `students/hanhTrinh.ts`, `students/profile.ts` · **Rc2:** `MockPlanPanel.tsx`, `skillSchedule.ts`, `planning.ts`, `permissions.ts`, `attempts.ts`, `regular.ts`, `modules/test/*`, `modules/cham/*` · **LT:** `transition.ts`, `students/students.ts`, `TransitionPanel.tsx`, `StudentManagePanel.tsx` · `OverviewPage.tsx`, `KhoiCanXuLy.tsx` (không cần) |

### Chồng file

| File | PR khác | Cách xử lý |
|---|---|---|
| `server/src/worklist/mywork.ts` | **LT** (có thể thêm một loại việc nhắc) | Ra chỉ sửa trong các khối có chú thích `// PR-Ra:` (liệt kê ở Task 3). **Không** đổi `WorkGroupKey`, `GROUP_META`, mảng `order` — LT thêm loại việc ở đó. Gỡ xung đột: giữ cả hai |
| `shared/domain/tongQuan.ts` | LT (map loại việc → nhóm) | Ra **không** sửa file này; luật thuần mới của Ra ở `shared/domain/congViec.ts` |
| `server/src/migrate.ts`, `schema.sql`, `seed/seed.ts` | LT | Hàm migrate riêng `migrateCongViec`, gọi sau `migrateDieuChinhPa` (migrate.ts:446). Gỡ xung đột ở danh sách gọi: giữ cả hai |
| `server/src/routes/index.ts`, `server/src/tests/run.ts`, `shared/domain/index.ts`, `tocDoDuong.ts` | mọi PR | **Chỉ thêm khối**, sửa đúng các route kể ở Task 3–5. Gỡ xung đột giữ cả hai |
| `shared/domain/duongHoSo.ts`, `Header.tsx` | **Qb** (#75 tạo) | Task 6 sau khi Qb merge: thêm **một** nhánh `nhac_viec` trong `duongThongBao` |
| `shared/domain/display.ts` | Qb (dòng 125-210) | Ra chỉ thêm một loại hạn `viec-van-hanh` vào `DEADLINE_KINDS`/`DEADLINE_LABEL` (display.ts:202-216) |
| `web/src/modules/cases/CasePanel.tsx` | Form (đã merge), YT2 chỉ dùng | Ra chỉ thêm chữ `export` trước `function ApprovalDialog` (CasePanel.tsx:940) |
| `server/src/platform/timNguoi.ts`, `platform/attachments.ts`, `web/src/ui/BangChung.tsx` | Form (đã merge), YT2 chỉ dùng | Thêm tham số / một loại bản ghi, không đổi hành vi cũ |

## QUY TRÌNH NHANH (chủ sản phẩm chốt 23/09 — bắt buộc)

- **KHÔNG** dùng `superpowers:subagent-driven-development`; **không** rà từng Task bằng subagent. Tự code từng Task, chạy
  `npm run check` sau mỗi Task (phải xanh, **số phép kiểm không giảm**), rồi commit. Nếu buộc dùng subagent: **cùng model,
  không Haiku**. Trước khi kết thúc: tắt mọi tiến trình `npm run check`/`run.js` còn treo (ghi nhớ "npm check treo").
- Không chụp ảnh từng Task. Bấm thử theo vai + 375px **một lần** ở Task 9 (ảnh `thiet-ke/anh/pr-ra/`).
- Không tự rà code cuối PR (planning rà bằng Fable 5.1). Cuối PR: push, mở PR, báo planning.
- Task 0: worktree + nhánh từ `origin/main` mới nhất, chép file kế hoạch này vào nhánh, commit.
- Commit ghi **đúng** dòng `Co-Authored-By` của model thật đang chạy.
- Gặp mã lệch hẳn kế hoạch (không chỉ lệch số dòng) → dừng, hỏi planning. **Không chạy lệnh vào Turso, không deploy.**

## Mục tiêu

1. **Hỗ trợ học viên** (§3.4, R2, Q6): gom 4 nhóm như Tổng quan GV; lọc nhanh **Tất cả · Quá hạn · Hôm nay · Tuần này**;
   dropdown **Người phụ trách** (Tôi · Tất cả trong phạm vi · Chọn giáo viên… có tìm — **lọc ở máy chủ**) và **Loại việc**;
   QL có nút **Nhắc** (gửi thông báo cho người phụ trách) và **Duyệt** ngay trên dòng. GV chỉ thấy việc của mình (không có
   dropdown Người phụ trách).
2. **Vận hành** (R3, R3b): hàng số **quá hạn · chờ người khác · cần quyết định · vừa hoàn thành (7 ngày)**, bấm được, số
   facet tính trước khi áp chính facet đó; bảng 5 cột **Việc · Người phụ trách · Hạn · Trạng thái · Việc con**; dời hạn giữ
   hạn cũ + lý do (`task_history`); **Tạm ngưng** bắt buộc lý do + người cần hỗ trợ + ngày xem lại; việc con quá hạn hiện
   tên; điều kiện hoàn tất (và dừng hẳn) việc cha khi còn việc con; mọi ô chọn người dùng `ChonNguoi` (lưu ID).
3. **Báo cáo đơn vị** phương án A (R4, R5, R6): ma trận **đơn vị × hạng mục** ở trên cùng; trạng thái **Đã nộp · Nháp · chưa
   nộp · Chưa báo cáo**; bấm ô mở panel phải (mức, nội dung, **Nối với việc** Vận hành thật, **Bằng chứng** G-9, lịch sử);
   **Lưu nháp lúc nào cũng được**, ngoài cửa sổ chỉ khoá nút **Nộp**.
4. **Nợ sau rà PR-O (#58):** GV mở được việc Vận hành giao cho mình (mất `open` ở `CongViecPage.tsx:24`); Báo cáo đơn vị đọc
   `periodId` từ link (`MeetingPage.tsx:38`, link sinh ở `worklist/signals.ts:140`).

## Nguồn

- Đặc tả `docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md`: §1 (G-1…G-11), §2, **§3.4**, §3.13, §4 dòng
  "Báo cáo đơn vị", §7 dòng **Ra** (gồm nợ PR-O).
- Kiểm kê `…/2026-09-22-kiem-ke-truoc-deploy.md`: **R2–R6, R3b, Q6**, §2 #15, §3 #15 (D04 thắng `editWindow`).
- Mockup `thiet-ke/mockup/04-cong-viec.html` — Tab 1, Tab 2, Tab 3 **phương án A** (B bỏ).
- Thiết kế `thiet-ke/PISA-Design-Plan-after-PR28.md` **§7.2, §7.3, §18.4** (chỉ phần không trái đặc tả/mockup).
- Chữ `thiet-ke/THUAT_NGU_DA_CHOT.md`: g3-028 `Nhắc`, g3-020 `Duyệt`, g3-031 `Nộp`, g3-032 `Lưu nháp`, g3-125 `+ Công việc`
  (không dùng "+ Việc mới"), g3-127, g3-128, g3-130, g4-012…016 (`Người phụ trách`, `Tôi`, `Tất cả trong phạm vi`, `Chọn giáo
  viên…`, `Loại việc: Mọi loại`), g4-018/019, g5-015/017/018 (`Hạn`, `Việc`, `Việc con`), g6-120…124 (trạng thái; **Tạm ngưng**,
  không "Tạm dừng"), g6-127…136, g7-027 `Lý do:`, g7-065 `Nối với việc:`, g7-066 `+ Chọn việc`, g8-002, g8-060.

Số dòng đo trên `main` @ `b28cbc4`. Mốc phép kiểm ghi ở Task 0 (gọi là **B**).

## Bảng Q — quyết định đã tự chốt

| Q | Câu hỏi | Chốt | Lý do |
|---|---|---|---|
| Q1 | "Tất cả trong phạm vi" gồm gì? | `myWork` hiện **không** có việc chấm điểm và tín hiệu chờ xác minh của **người khác**. Thêm chế độ `nguoi=tat-ca` (chỉ QL/QT): việc hiện có của QL **+** bài chưa chấm của GV khác trong phạm vi (gom lớp·bài·hạn·**người**) **+** tín hiệu chờ xác minh của người khác. Không đổi luật "Cập nhật kết quả / Xác định nguyên nhân: QL chỉ thấy khi quá hạn" | Mockup Tab 1 cho QL thấy dòng chấm điểm của GV khác kèm nút Nhắc; đổi luật quá hạn là đổi rulebook |
| Q2 | "Chọn giáo viên X" tính thế nào? | Máy chủ dựng việc **đúng như X nhìn thấy** (`myWork(loadPrincipal(X))`), rồi chỉ giữ dòng nằm trong phạm vi người xem. X phải có vai đang hoạt động ở chi nhánh trong phạm vi người xem, ngược lại 403 | "Lọc ở máy chủ" (Q6 kiểm kê); không phải đoán theo `ownerId` từng dòng |
| Q3 | Mặc định dropdown | **QL/QT: Tất cả trong phạm vi** (mockup). **GV: không có dropdown** — luôn là việc của mình. `/my-work` không tham số **giữ nguyên** hành vi cũ (Tổng quan GV, mọi phép kiểm cũ) | GV chỉ thấy việc của chính mình (giao việc); không vỡ Tổng quan |
| Q4 | "Tuần này" | Hạn từ **hôm nay đến Chủ nhật tuần này**, chưa quá hạn (gồm cả "Hôm nay"). Việc không có hạn không vào | Bốn ô là bốn góc nhìn, không phải phép chia; quá hạn đã có ô riêng |
| Q5 | Nhắc | Chỉ QL/QT, chỉ dòng có người phụ trách là **tài khoản khác** người xem. Máy chủ tìm lại đúng dòng trong việc của người đó (không tin dữ liệu gửi lên). **Một lần/dòng/ngày**: bấm lần hai trả "Đã nhắc lúc HH:mm", không gửi thêm. Thông báo `kind = 'nhac_viec'`, mở `/cong-viec` | Chặn spam; người nhận mở đúng danh sách có dòng đó |
| Q6 | Duyệt trên dòng | Dòng `decide` do GV **đề xuất** → nút **Duyệt** mở `ApprovalDialog` có sẵn (`CasePanel.tsx:940`, chỉ thêm `export`). Dòng GV **xin ý kiến** → giữ hành vi cũ (mở hồ sơ HV) | Không viết lại form duyệt; xin ý kiến cần đọc ngữ cảnh Case |
| Q7 | Bảng Vận hành cột 5 | **Việc con** (mockup) thay "Cập nhật gần nhất" (§18.4); cập nhật gần nhất xem trong panel chi tiết | Đặc tả §0: mockup thắng thiết kế cũ |
| Q8 | Chờ người khác · Cần quyết định | **Chờ người khác** = Tạm ngưng, **chưa** tới ngày xem lại. **Cần quyết định** = Tạm ngưng **đã tới/qua** ngày xem lại **hoặc** việc cha đã khép hết việc con mà chưa hoàn thành. **Vừa hoàn thành** = `completed_at` trong 7 ngày gần nhất (tính cả hôm nay). **Quá hạn** = chưa khép, hạn < hôm nay | THUAT_NGU g6-127/128/129; hai ô đầu không chồng nhau, chồng với "quá hạn" có chủ ý |
| Q9 | Dời hạn | Chỉ QL. Đổi hạn **đang có** sang ngày khác bắt buộc lý do (2–200 ký tự), ghi `task_history(field='due_date', old, new, reason)`. Đặt hạn lần đầu (NULL → ngày) không cần lý do. **Quá hạn tính theo hạn hiện tại** (giữ SLA cũ, §7.2 "không ép đổi luật SLA"); cột Hạn hiện thêm "đã dời từ {hạn gốc đầu tiên}" + lý do gần nhất | Giữ hạn cũ + lý do mà không đổi luật đếm |
| Q10 | Tạm ngưng | Bắt buộc **lý do + người cần hỗ trợ + ngày xem lại (≥ ngày cập nhật)**. Người cần hỗ trợ: tài khoản (`help_user_id`, nhóm `nhan_vien`) **hoặc** "Người ngoài (gõ tên)" (`help_name`, ví dụ "Tổ chuyên môn"). Rời Tạm ngưng thì xoá hai cột | Mockup "cần: Đỗ Vũ Tuấn Phong"; tổ chuyên môn không phải một tài khoản |
| Q11 | Việc cha còn việc con mở | **Hoàn thành** (đã chặn, `mgmttasks.ts:382-389`) **và Dừng hẳn** đều bị chặn, câu báo nêu tên việc con còn mở (tối đa 2 + "và n việc khác") | Dừng cha mà con còn mở → con treo mãi ở Việc cần làm của GV |
| Q12 | Nộp theo ô hay theo đơn vị? | **Theo ô** (một hạng mục). Trạng thái hàng đơn vị: mọi ô đã nộp → **Đã nộp**; không ô nào có gì → **Chưa báo cáo**; còn lại → **Nháp · chưa nộp** (phụ: "đã nộp 2/3") | Khớp dữ liệu (`unit_reports` một dòng/ô) và panel mockup có nút Nộp ngay trong ô |
| Q13 | Lưu nháp / Nộp và cửa sổ | Nháp: được cho tuần **đã bắt đầu** (tuần tương lai vẫn từ chối — phép kiểm cũ giữ), kể cả khi cửa sổ đóng. Nộp: phải có **mức**, cửa sổ phải mở (hoặc QTHT đã mở lại). Sửa ô **đã nộp**: trong cửa sổ → thành nháp, phải Nộp lại; ngoài cửa sổ → từ chối (không được "rút" báo cáo đã nộp) | D04 + không để báo cáo đã nộp bị lùi về nháp sau hạn |
| Q14 | Liên kết báo cáo ↔ việc (R6) | Bảng nối `unit_report_task_links` (nhiều–nhiều). Bỏ gợi ý "cùng nhóm + CN, LIMIT 6" (`meeting.ts:103-111`). Chọn việc: việc Vận hành chưa khép của chi nhánh đơn vị (đơn vị Tutor: việc "Toàn hệ thống"), việc cùng nhóm lên đầu. "+ Tạo việc từ mục này" tạo xong **tự nối** | Liên kết thật, không đoán |
| Q15 | Bằng chứng báo cáo | `attachments.owner_type = 'unit_report'` (không cần cột mới). Ô chưa có dòng → dòng chữ "Lưu nháp để đính kèm bằng chứng" (lưu trước, đính kèm sau — 4.8) | Cùng một khối `BangChung` (G-9) |
| Q16 | "Việc đã giao", "Việc đang tồn", "Tổng hợp theo tuần" ở tab Báo cáo | Ma trận lên đầu. "Việc đã giao" + nút Giao việc và "Việc đang tồn" chuyển xuống **hai khối thu gọn** dưới ma trận (luôn có số). **Bỏ** link "Tổng hợp theo tuần" (`/tong-hop-tuan` đã bỏ ở §3.3) | §7.3 thiết kế: phần tồn thu gọn dưới cùng; không xoá tính năng giao việc GV |
| Q17 | Số trên tab (mockup "Hỗ trợ học viên 14 · Vận hành 5") | **Không làm** | Mỗi số thêm một lượt gọi API mỗi lần mở khu Công việc; không trong §3.4 |
| Q18 | Kỳ tháng ở Báo cáo | Giữ (chỉ đọc). Panel ở kỳ tháng chỉ đọc | Tính năng cũ, không trái mockup |

## Cấu trúc file

| File | Việc |
|---|---|
| `server/src/schema.sql`, `server/src/migrate.ts` | Cột/bảng mới (Task 1) |
| `server/src/seed/seed.ts` | Dữ liệu demo cho từng trạng thái mới |
| `shared/domain/congViec.ts` (tạo) + `index.ts` | Luật thuần: lọc nhanh, facet Vận hành, hàng số, trạng thái ô/đơn vị báo cáo, dòng hạn đã dời |
| `shared/domain/display.ts` | Loại hạn `viec-van-hanh` |
| `server/src/worklist/mywork.ts` | Chế độ `nguoi`, việc người khác, `duyet`, `nhac`, link việc Vận hành |
| `server/src/worklist/nhacViec.ts` (tạo) | `nhacViec(p, key, ownerId)` |
| `server/src/platform/timNguoi.ts` | Tham số `trongPhamVi` |
| `server/src/worklist/mgmttasks.ts` | Danh sách gộp truy vấn + facet + hàng số; Tạm ngưng; dời hạn; kiểm ID; nối báo cáo |
| `server/src/worklist/meeting.ts` | Nháp/Nộp, bảng gộp truy vấn, nối việc |
| `server/src/worklist/signals.ts` | `report_due` đếm theo **đã nộp**; link `/cong-viec/bao-cao?periodId=` |
| `server/src/platform/attachments.ts` | Loại bản ghi `unit_report` |
| `server/src/routes/index.ts` | `/my-work` nhận `nguoi`, `POST /my-work/nhac`, `/ref/nguoi` nhận `trongPhamVi`, body mới các route mgmt/meeting, 2 route nối việc |
| `server/src/tests/congViec.tests.ts` (tạo) + `run.ts` · `tocDoDuong.ts` + `tocDo.run.ts` (`{gv}`) | Phép kiểm |
| `web/src/modules/worklist/NhomViec.tsx` (tạo) | Khối nhóm việc tách từ `ViecCuaToi.tsx` (dùng chung) |
| `web/src/modules/worklist/WorkList.tsx` | Giữ `DongViec` + kiểu; thêm nút Nhắc/Duyệt; **bỏ** hàm `WorkList` phẳng (chỉ `HoTroHocVienTab` dùng) |
| `web/src/modules/worklist/ViecCuaToi.tsx` | Dùng `NhomViec` (hành vi Tổng quan không đổi) |
| `web/src/modules/congViec/HoTroHocVienTab.tsx`, `CongViecPage.tsx`, `ChonPhuTrach.tsx` (tạo) | Tab 1 + nợ PR-O |
| `web/src/modules/worklist/MgmtTasksPage.tsx` | Tab 2; export `NganViecVanHanh` |
| `web/src/modules/worklist/MeetingPage.tsx`, `congViec/NganBaoCao.tsx` (tạo) | Tab 3 |
| `web/src/ui/BangChung.tsx`, `web/src/modules/cases/CasePanel.tsx` (`export`), `shared/domain/duongHoSo.ts` (sau Qb) | Nhỏ |
| `CODE_MAP.md` | Dòng Công việc |

---

## Task 0 · Worktree, nhánh, mốc

- [ ] `git fetch origin`; `git worktree add .claude/worktrees/pr-ra-cong-viec -b pr-ra-cong-viec origin/main`.
- [ ] Chép file kế hoạch này vào nhánh; `npm ci` nếu cần; `npm run check` → ghi mốc **B**.
- [ ] Commit `PR-Ra (0): kế hoạch + mốc {B} phép kiểm`.

## Task 1 · Migrate + schema + seed

**Files:** `schema.sql`, `migrate.ts`, `seed/seed.ts`, tạo `tests/congViec.tests.ts` (khung `runCongViecTests(kit)` chép
`dieuChinhPa.tests.ts:1-120`), khối gọi cuối `run.ts` (sau khối PR-Pb, dòng ~9490).

1. `schema.sql` — **cột mới đặt CUỐI định nghĩa bảng** (ALTER ADD nối vào cuối; phép kiểm so thứ tự cột):
   - `tasks` (1293-1336): `help_user_id INTEGER REFERENCES users(id)`, `help_name TEXT` — chú thích: người cần hỗ trợ khi
     Tạm ngưng, một trong hai.
   - `task_history` (1426-1434): `reason TEXT` — lý do (bắt buộc với `field = 'due_date'` khi đổi hạn đang có).
   - `unit_reports` (1260-1271): `submitted_at TEXT` (NULL = nháp), `submitted_by INTEGER REFERENCES users(id)`.
   - `unit_report_history` (1281-1291): `kind TEXT` — `'nhap' | 'nop'`, NULL với dòng cũ.
   - Bảng mới sau `unit_report_history`: `unit_report_task_links (unit_report_id INTEGER NOT NULL REFERENCES unit_reports(id),
     task_id INTEGER NOT NULL REFERENCES tasks(id), created_by INTEGER REFERENCES users(id), created_at TEXT NOT NULL,
     PRIMARY KEY (unit_report_id, task_id))` + `CREATE INDEX idx_urtl_task ON unit_report_task_links(task_id)`.
2. `migrate.ts`: `export function migrateCongViec(conn, applied)` theo mẫu `migrateDieuChinhPa` (3118-3157), gọi ngay sau
   dòng 446. **Luật dễ sai:** điền `submitted_at = updated_at, submitted_by = reporter_user_id` cho dòng `status IS NOT NULL`
   **chỉ trong đúng lần thêm cột `submitted_at`** (cùng nhánh `if (!cols.includes('submitted_at'))`) — chạy lại lần hai không
   được biến nháp mới thành đã nộp. `applied` một dòng `PR-Ra: thêm …`.
3. `seed.ts` (khối addTask 455-520, khối báo cáo 310-345): việc Tạm ngưng (dòng 463-472) có `help_name = 'Tổ chuyên môn'`
   hoặc một QL; thêm ≥ 1 việc đã **dời hạn** (một dòng `task_history` due_date + lý do); ≥ 1 việc cha có **việc con quá
   hạn**; ≥ 1 việc Tạm ngưng **đã tới ngày xem lại**; ≥ 1 việc hoàn thành trong 7 ngày; báo cáo kỳ trước: `submitted_at`
   = `reportedAt()`; kỳ hiện tại: ≥ 1 đơn vị **nháp chưa nộp** (có mức, `submitted_at` NULL), ≥ 1 ô đã nộp, ≥ 1 đơn vị trống;
   ≥ 1 dòng `unit_report_task_links`. Mọi ngày ≤ ngày demo (phép kiểm SEED_MAX `run.ts:7258`).

**Phép kiểm (≥ 5):** (1) DB từ schema có đủ cột/bảng; (2) DB cũ (DROP bảng + DROP COLUMN như `sosV3.tests.ts:190`) sau
`migrateCongViec` giống hệt schema (cột, kiểu, thứ tự, chỉ mục); dòng `status NOT NULL` được điền `submitted_at`, dòng chỉ có
ghi chú giữ NULL; (3) chạy lần hai: `applied` rỗng, **một dòng nháp tạo giữa hai lần vẫn là nháp**; DB mới không có gì để
nâng; (4) `migrate()` trọn chuỗi hai lần, lần hai không có dòng PR-Ra; (5) seed có đủ các trạng thái kể ở bước 3.

Commit `PR-Ra (1): migrate Công việc — người cần hỗ trợ, lý do dời hạn, nháp/nộp báo cáo, nối báo cáo ↔ việc`.

**Lệnh migrate lặp (ghi vào mô tả PR):** `npm run migrate` hai lần trên `data/` bản dev → lần hai in "không có gì".
Bản chính: nếu Turso đã dựng trước khi Ra merge → chạy `npm run migrate` với biến môi trường bản chính **TRƯỚC** khi deploy
mã Ra (cùng quy ước sau S2 ở §7 dòng Z2c).

## Task 2 · Luật thuần `shared/domain/congViec.ts`

Không truy vấn, không ngày máy — `homNay` truyền vào. Export qua `shared/domain/index.ts`.

- `LOC_NHANH = ['tat-ca','qua-han','hom-nay','tuan-nay']`, nhãn `Tất cả · Quá hạn · Hôm nay · Tuần này`.
  `khopLocNhanh(it: { urgency; due }, loc, homNay)` theo Q4 (Chủ nhật = `mondayOfDate(homNay)` + 6, `shared/domain/week.ts:22`).
- `demLocNhanh(items, loai, homNay)` → số cho 4 ô, **đã áp Loại việc, chưa áp lọc nhanh**; `demLoaiViec(items, loc, homNay)` →
  `Record<loai, n>` **đã áp lọc nhanh, chưa áp Loại việc** (facet không tự lọc chính nó).
- `NGUOI_PHU_TRACH`: `thamSoNguoi(s)` → `'toi' | 'tat-ca' | number | null` (chuỗi lạ → null).
- Vận hành: kiểu `DongVanHanh = { progress; due; reviewOn; completedAt; subOpen; subTotal; group; assigneeUserId }`.
  `hangSoVanHanh(rows, homNay)` → `{ quaHan, choNguoiKhac, canQuyetDinh, vuaXong }` theo Q8 (hai ô giữa không chồng nhau).
  `HANG_SO = ['qua-han','cho-nguoi-khac','can-quyet-dinh','vua-xong']`; `khopHang(r, hang, homNay)`.
  `TRANG_THAI_LOC`: `'mo'` (chưa khép — mặc định) · 5 trạng thái · `'tat-ca'`.
  `locVanHanh(rows, { group, progress, hang }, homNay)` và `facetVanHanh(rows, f, homNay)` → `{ group: Record, progress:
  Record, hang: {…} }` trong đó: số nhóm = áp progress + hang; số trạng thái = áp group + hang; hàng số = **chỉ áp group**
  (bỏ qua progress/hang, vì "vừa hoàn thành" là việc đã khép).
- `dongHanDaDoi({ hanGoc, lyDo }, homNay)` → `đã dời từ 05/09 · "chờ duyệt ngân sách"` cắt ≤ 60 ký tự (G-3, `ngay()`).
- `trangThaiO({ status, note, submittedAt })` → `'da-nop' | 'nhap' | 'chua'`; `trangThaiDonVi(o[])` theo Q12 → `{ ma, nhan,
  phu }` (`Đã nộp` · `Nháp · chưa nộp` + `đã nộp 2/3` · `Chưa báo cáo`).

**Phép kiểm (≥ 8):** Tuần này gồm hôm nay và Chủ nhật, không gồm thứ Hai tuần sau, không gồm quá hạn; `demLocNhanh` không
đổi khi đổi lọc nhanh; `demLoaiViec` không đổi khi đổi Loại việc; hàng số: Tạm ngưng trước/đúng/sau ngày xem lại; việc cha hết
con mở vào "cần quyết định"; vừa xong 7 ngày (ngày thứ 7 vào, thứ 8 không); facet trạng thái không đổi khi chọn trạng thái;
`dongHanDaDoi` ≤ 60 ký tự, không ISO; `trangThaiDonVi` ba trường hợp + "đã nộp 2/3".

Commit `PR-Ra (2): luật thuần Công việc — lọc nhanh, facet, hàng số Vận hành, trạng thái báo cáo`.

## Task 3 · Máy chủ: Hỗ trợ học viên — `nguoi`, Nhắc, Duyệt, link việc Vận hành

**Files:** `mywork.ts`, tạo `worklist/nhacViec.ts`, `timNguoi.ts`, `routes/index.ts` (`/my-work` dòng 349-352, `/ref/nguoi`
289-296), `tocDoDuong.ts`, `tocDo.run.ts` (`urlFor` 123-130 thêm `{gv}` = `USER.GVCN`).

`mywork.ts` — mọi chỗ sửa bọc chú thích `// PR-Ra:`:
- (a) `myWork(p, f: { branchId?; nguoi?: 'toi' | 'tat-ca' })` (dòng 253). Không có `nguoi` = **y hệt cũ**.
  `'toi'` = như cũ rồi giữ `mine`. `'tat-ca'` (Q1): `listAttempts(p, { branchId, scope: 'managed' })` (dòng 260 — một lần gọi,
  dùng cả `myPendingDetail` lẫn `pendingDetail`); `listSignals(p, { …, mine: false })` (dòng 271) — dòng của mình giữ nguyên
  như cũ, dòng người khác `mine: false`, `ownerId = ownerUserId`.
- (b) **Khoá dòng chấm điểm kèm người**: `key: score:${k}|u${ownerId ?? 0}` (dòng ~357) — để cùng một việc có cùng khoá dù
  nhìn từ QL hay từ chính GV (Nhắc dựa vào khoá). Tách phần gom 322-381 thành hàm `gomBaiChuaCham(dongs, today, ownerOf)` dùng
  cho cả phần của mình và phần người khác; người phụ trách môn lấy bằng **một** câu
  `SELECT class_id, skill, user_id FROM teacher_assignments WHERE class_id IN (…) AND status='active' AND skill IS NOT NULL
  ORDER BY id` (môn trùng người → người đầu). Bỏ môn mà người phụ trách là chính người xem (đã có ở phần của mình). Môn chưa
  phân công → `ownerId null`, `statusLabel 'Chưa phân công giáo viên'`.
- (c) Dòng duyệt (411-448): thêm `duyet: { interventionId, kind, description } | null` — chỉ khi **không** `asked_manager`.
- (d) Việc Vận hành (dòng 920): `href: /cong-viec?mo-viec=${t.id}`.
- (e) Hậu xử lý sau khối tên người (950-962): nếu người xem xem được người khác (`can(p, CASE_APPROVE, { anyScope: true })`)
  thì dòng có `ownerId` là **tài khoản khác** người xem được `nhac: { ownerId, daNhacLuc }` — `daNhacLuc` đọc bằng **một**
  câu `SELECT dedup_key, created_at FROM notifications WHERE kind='nhac_viec' AND dedup_key LIKE 'nhac:%:{hôm nay}'`.
- (f) Trả thêm `xemNguoiKhac: boolean` cho giao diện.

Route `/my-work`: `nguoi` qua `thamSoNguoi`. Số (Q2): 403 "Bạn chỉ xem được việc của mình." nếu người xem không có
`CASE_APPROVE` anyScope; 403 "Giáo viên này không thuộc chi nhánh bạn quản lý." nếu X ngoài phạm vi (so chi nhánh
`user_roles` của X với `scopeFor(người xem, ATTEMPT_VIEW)`); rồi `myWork(loadPrincipal(X), { branchId })`, **giữ dòng người
xem được** (`can(người xem, ATTEMPT_VIEW, { classId, studentId })`, dòng không lớp/HV — việc Vận hành — **bỏ**), đổi `owner`
"Bạn" → tên X, `mine = false`, gắn `nhac` như (e). `'tat-ca'` với GV → 403 câu đầu.

`nhacViec.ts`: `nhacViec(p, { key, ownerId })` — kiểm như trên; tìm lại dòng `key` trong `myWork(loadPrincipal(ownerId))`
(không thấy → 404 "Việc này không còn trong danh sách của {tên}."); dòng phải nằm trong phạm vi người xem; `dedup =
nhac:${key}:${homNay}` đã có → trả `{ daNhacLuc }` **không** ghi thêm; chưa có → `notify({ userId: ownerId, kind:
'nhac_viec', title: '{tên QL} nhắc: {actionLabel}', body: '{studentName} · {contextLabel} · {reason}' (≤ 200),
entityType: 'nhac_viec', entityId: null, dedupKey })` + `writeAudit('work.remind')`. Route `POST /my-work/nhac`.

`timNguoi.ts`: tham số `trongPhamVi?: boolean` → chỉ người có `user_roles` hoạt động ở chi nhánh thuộc
`scopeFor(p, ATTEMPT_VIEW)` (QT: không giới hạn). Route đọc `trongPhamVi=1`.

`tocDoDuong.ts` (trang "Công việc"): `/my-work` QL·QT; `/my-work?nguoi=tat-ca` QL·QT·GVCN (`maChuDich: { GVCN: 403 }`);
`/my-work?nguoi={gv}` QL. Trần theo TD Q6: `max(n + 10, ⌈n × 1.3⌉)`, ≤ 100.

**Phép kiểm (≥ 9):**
1. `myWork(gv)` và `myWork(QL)` không tham số: tập khoá **chỉ khác** ở phần đuôi `|u…` của dòng chấm điểm (so sánh sau khi bỏ
   đuôi) — hành vi cũ giữ nguyên.
2. `tat-ca` của QL MB chứa dòng chấm điểm của một GV MB đang nợ điểm (chọn bằng SQL như `run.ts:5487-5498`) với `ownerId` đúng.
3. Với GV X đó: mọi khoá nhóm `score`/`verify` của `nguoi=X` (qua HTTP, QL) nằm trong khoá của `tat-ca`.
4. `nguoi=X` không có dòng ngoài chi nhánh QL; X ở chi nhánh khác → 403; GV gọi `nguoi=tat-ca` → 403.
5. QT (`myWork(P.admin)`) không tham số vẫn **không** có dòng chấm điểm (giữ `run.ts:5474-5482`).
6. Nhắc: 200 + đúng một thông báo cho X; bấm lần hai cùng ngày → `daNhacLuc`, vẫn một thông báo; GV gọi → 403; khoá bịa → 404.
7. `tat-ca` sau khi nhắc: dòng đó có `nhac.daNhacLuc`.
8. Dòng duyệt đề xuất có `duyet.interventionId`; dòng xin ý kiến `duyet = null`.
9. Dòng `mgmt` có `href` `/cong-viec?mo-viec=`; `/ref/nguoi?trongPhamVi=1&q=…` của QL MB không trả GV chỉ thuộc CP.

Commit `PR-Ra (3): Hỗ trợ học viên — người phụ trách lọc ở máy chủ, Nhắc, Duyệt trên dòng`.

## Task 4 · Máy chủ: Vận hành

**Files:** `mgmttasks.ts`, `routes/index.ts` (1634-1672), `display.ts` (loại hạn), `tocDoDuong.ts`, `tests/run.ts` (sửa phép
kiểm cũ, **không xoá**).

- `listMgmtTasks` (55-197) viết lại theo **tải một lần, lọc bằng JS**: (1) một câu dòng gốc trong phạm vi (CN + người phụ
  trách, như `base` 70-86) kèm tên người, `help_*`, `completed_at`; (2) một câu việc con của các dòng đó; (3) một câu
  `task_updates` mới nhất (giữ 113-125); (4) một câu `task_history` `field='due_date'` của các dòng. Rồi `locVanHanh` +
  `facetVanHanh` + `hangSoVanHanh` (Task 2). Tham số mới: `progress` nhận `mo` và `tat-ca`; `hang`. **Hàm dịch vụ** không
  có `progress` = tất cả (phép kiểm cũ gọi `listMgmtTasks(P.admin, {})` giữ nghĩa); **route** không nhận `progress` thì
  gửi `mo` (mặc định giao diện "Đang mở"). Dòng trả thêm: `hanGoc`, `lyDoDoiHan`, `soLanDoiHan`, `helpName` (tên tài khoản hoặc `help_name`),
  `subOpen`, `subOverdueTitles: string[]` (tối đa 2) + `subOverdueCount`, `group`, `taskType`. `summary` thay bằng
  `hangSo`; `facets` gồm `group`, `progress`, `hang`.
- `updateMgmtTask` (350-417): **Tạm ngưng** (Q10) — thiếu người cần hỗ trợ → 400 "Tạm ngưng phải ghi cần ai hỗ trợ."; thiếu /
  sai ngày xem lại → 400 "Tạm ngưng phải có ngày xem lại (từ ngày cập nhật trở đi)."; `helpUserId` phải
  `laNguoiHopLe(id, 'nhan_vien')`; ghi `help_user_id`/`help_name` (một trong hai), rời Tạm ngưng thì NULL. **Dừng hẳn** việc
  cha còn con mở bị chặn như Hoàn thành (Q11); câu báo nêu tên (thay dòng 387).
- `editMgmtTask` (419-461): `due` đổi từ ngày có sẵn sang khác → cần `lyDoDoiHan` (2–200), ghi `task_history` (`reason`);
  NULL → ngày: ghi history không cần lý do. `assigneeUserId`/`watcherUserId` phải `laNguoiHopLe(…, 'nhan_vien')`, ghi
  history. `createMgmtTask` (278-327): kiểm ID tương tự; nhận `unitReportId` → dòng báo cáo phải tồn tại, cùng chi nhánh đơn vị
  (đơn vị Tutor: việc `branch_id NULL`) → `source_type='unit_report'`, `source_unit_report_id`, chèn `unit_report_task_links`.
- `mgmtTaskDetail` (200-271): thêm `helpName`, `helpUserId`, `dueHistory: { old, new, reason, by, at }[]`, `openSubTitles`.
- `display.ts:202-216`: loại hạn `viec-van-hanh` → `Hạn ${d}` (không bao giờ truyền `hanGoc` — Q9).
- `tocDoDuong.ts`: `/mgmt-tasks` và `/mgmt-tasks?hang=qua-han` QL·QT (GVCN `maChuDich` theo mã thật: `scopeEmpty` → 200).

**Sửa phép kiểm cũ:** `run.ts:6903-6918` (dòng tổng hợp) → kiểm `hangSo` cùng ý (chồng nhau có chủ ý; `quaHan` khớp số dòng
`overdue` khi không lọc trạng thái); `run.ts:6865-6901` (facet nhóm, facet trạng thái) và `run.ts:5386-5391` (thiếu lý do báo trước)
phải vẫn xanh không sửa.

**Phép kiểm (≥ 9):** Tạm ngưng thiếu người / thiếu ngày / ngày trước ngày cập nhật → 400; đủ → lưu `help_*`, rời Tạm ngưng thì
NULL; `helpUserId` là HV/tài khoản khoá → 400; dời hạn không lý do → 400, có lý do → `task_history` đúng old/new/reason và
dòng danh sách có `hanGoc` = hạn **đầu tiên**; quá hạn tính theo hạn mới (dời sang tương lai → hết quá hạn); Dừng hẳn việc
cha còn con mở → 400 có tên việc con; facet nhóm không đổi khi chọn nhóm, đổi khi chọn trạng thái; `progress` mặc định `mo`
không có việc đã khép, `hangSo.vuaXong` vẫn đếm việc hoàn thành; `subOverdueTitles` có đúng tên; `createMgmtTask` với
`unitReportId` khác chi nhánh → 400, đúng → có dòng nối; `assigneeUserId` không hợp lệ → 400.

Commit `PR-Ra (4): Vận hành — hàng số, facet đúng, Tạm ngưng đủ ba ý, dời hạn giữ hạn cũ, điều kiện việc cha`.

## Task 5 · Máy chủ: Báo cáo đơn vị

**Files:** `meeting.ts`, `worklist/signals.ts`, `attachments.ts`, `routes/index.ts` (1549-1591), `tocDoDuong.ts`,
`tests/run.ts:1674-1703` (sửa, **không xoá**).

- `saveUnitReport(p, unitId, periodId, key, { status?, note?, nop? })` (185-246), luật Q13:
  tuần chưa bắt đầu → giữ lỗi cũ (câu "chưa bắt đầu"); ô **đã nộp** + cửa sổ đóng → 400 "Báo cáo này đã nộp và tuần đã khoá —
  chỉ Quản trị hệ thống mở lại được."; `nop: true` → cửa sổ phải mở (câu `window.reason`) và phải có mức (400 "Chọn mức trước
  khi nộp."), đặt `submitted_at/by`; không `nop` → `submitted_at/by = NULL` (thành nháp). History ghi `kind`. Kiểm
  `reportEditWindow` **chỉ** ở nhánh nộp và nhánh "đã nộp".
- `meetingBoard` (58-183) **gộp truy vấn** (hiện mỗi ô 3 câu: việc 103-111, tên người 128, lịch sử 141-147): một câu báo cáo
  của mọi đơn vị trong kỳ, một câu lịch sử, một câu nối việc (JOIN `tasks`), một `countAttachments('unit_report', ids)`
  (`attachments.ts:114`), một câu tên người. Ô trả thêm `trangThai` (Task 2), `submittedAt`, `submittedBy`, `linkedTasks`
  (thay `tasks` gợi ý), `evidenceCount`; đơn vị trả `trangThai` (`trangThaiDonVi`); `totals` thêm `daNop`, `nhap`, `chua`
  (`ok/watch/problem` chỉ đếm ô **đã nộp**; giữ `status` thô cho phép kiểm `[18.2-14]` `run.ts:7210`). Kỳ tháng: "đã báo
  cáo" = đã nộp.
- Route mới: `POST /meeting/reports/:reportId/tasks { taskId }`, `DELETE /meeting/reports/:reportId/tasks/:taskId` — quyền
  `MEETING_EDIT` chi nhánh đơn vị; việc phải `branch_ops`, cùng chi nhánh (Tutor: `branch_id NULL`); audit.
- `attachments.ts:31, 55-67`: thêm `'unit_report'` — xem: `MEETING_VIEW` chi nhánh đơn vị; sửa: `MEETING_EDIT`.
- `worklist/signals.ts:128-141`: `r.status IS NOT NULL` → `r.submitted_at IS NOT NULL`; `href` → `/cong-viec/bao-cao?periodId=`.
- `tocDoDuong.ts`: `/meeting/board` QL·QT.

**Sửa phép kiểm cũ:** `run.ts:1695-1696` → Lưu nháp tuần đã khoá **chạy được**; `nop: true` tuần đã khoá → lỗi
`/quá hạn|Quản trị hệ thống/`; sau `setPeriodUnlocked` nộp được (giữ 1698-1702).

**Phép kiểm (≥ 9):** nháp khi cửa sổ đóng → lưu, `submitted_at NULL`; nộp ngoài cửa sổ → 400; nộp không mức → 400; nộp trong
cửa sổ → đã nộp, history `kind='nop'`; sửa ô đã nộp trong cửa sổ → thành nháp; sửa ô đã nộp ngoài cửa sổ → 400; tuần tương lai
→ 400 (giữ); `meetingBoard`: đơn vị đủ 3 ô nộp → `Đã nộp`, có nháp → `Nháp · chưa nộp` + `đã nộp n/3`, trống → `Chưa báo
cáo`; nối việc khác chi nhánh → 400, đúng → hiện ở `linkedTasks`; đính kèm `unit_report` bởi GV → 403; tín hiệu
`report_due` không đếm ô nháp là đã báo cáo; số câu SQL `/meeting/board` không tăng theo số đơn vị (thêm một đơn vị tạm → cùng số).

Commit `PR-Ra (5): Báo cáo đơn vị — nháp/nộp theo D04, nối việc thật, bằng chứng, gộp truy vấn`.

## Task 6 · Web: Hỗ trợ học viên + nợ PR-O

**Files:** tạo `worklist/NhomViec.tsx`, `congViec/ChonPhuTrach.tsx`; sửa `ViecCuaToi.tsx`, `WorkList.tsx`,
`HoTroHocVienTab.tsx`, `CongViecPage.tsx`, `CasePanel.tsx` (`export`), `duongHoSo.ts` (sau Qb).

1. **`NhomViec`** tách từ `ViecCuaToi.tsx:31-77`: props `{ nhom: NhomViecXem[], nhac, soHien, moHet, onOpen, nutPhu? }`.
   `ViecCuaToi` dùng lại với `soHien = 5` — Tổng quan **không đổi** (so ảnh trước/sau ở Task 9). Đầu nhóm thêm `· {n} chờ bạn
   duyệt` khi nhóm có dòng `decide` (mockup).
2. **`DongViec`** (`WorkList.tsx:46-95`): prop `nutPhu?: ReactNode` đứng cạnh nhãn việc. Kiểu `WorkItem` thêm `duyet`, `nhac`.
   Xoá hàm `WorkList` phẳng (115-249) và hằng `WHEN`.
3. **`HoTroHocVienTab`** (viết lại): trạng thái trên địa chỉ `?nguoi=&loc=&loai=&cn=` (link gửi đi vẫn đúng). Gọi
   `/my-work?nguoi=…&branchId=…` (QL mặc định `tat-ca`; GV không gửi `nguoi`). Hàng lọc (một hàng, xuống dòng ở 375px):
   4 nút lọc nhanh có số (`demLocNhanh`) · `Người phụ trách: {…} ▾` (chỉ khi `xemNguoiKhac`) · `Loại việc: Mọi loại ▾`
   (select, lựa chọn = `groups` máy chủ trả, kèm số `demLoaiViec`, ẩn loại 0 việc) · `BranchFilter`. Dưới là `NhomViec`
   (`soHien = 10`, `moHet` khi lọc nhanh ≠ Tất cả hoặc có Loại việc). Nhóm Ý thức & Phối hợp (nhắc mềm `useNhacYThuc`) chỉ
   hiện khi xem việc của mình. Rỗng: `Không có việc nào khớp bộ lọc`.
4. **`ChonPhuTrach`**: nút `Người phụ trách: Tất cả trong phạm vi ▾` mở menu `Tôi` · `Tất cả trong phạm vi` · `Chọn giáo
   viên…` → hiện `ChonNguoi` (`nhom="giao_vien"`, `choToi={false}`, `choNgoai={false}`) gọi `/ref/nguoi?trongPhamVi=1` (thêm
   prop `trongPhamVi` vào `useNguoiSearch`/`ChonNguoi` trong `PeoplePicker.tsx:147-165`, mặc định false). Đã chọn GV: nút ghi
   tên + `✕` về Tất cả. Tên GV lưu trên địa chỉ là **ID** (`nguoi=12`); tên hiện lấy từ dòng đầu hoặc một lượt `/ref/nguoi`.
5. **Nút trên dòng** (`nutPhu`): `it.nhac` → `Nhắc` (`btn btn-sm`) → `POST /my-work/nhac` → đổi thành chữ phụ `✓ Đã nhắc
   HH:mm` (G-1, giờ VN); `it.duyet` → `Duyệt` mở `ApprovalDialog` (CasePanel.tsx:940 thêm `export`); xong → `invalidate('/my-work')`.
6. **Nợ PR-O:** `CongViecPage.tsx:24` — khi tab không có quyền mà địa chỉ có `open` → `Navigate` tới `/cong-viec?mo-viec={open}`
   (giữ tham số), không mất `open`. `HoTroHocVienTab` thấy `mo-viec` → mở `NganViecVanHanh` (Task 7) ở panel phải; đóng →
   xoá tham số. Áp cho mọi vai (QL bấm dòng Vận hành ở tab này cũng mở tại chỗ).
7. **Sau Qb:** `duongThongBao` (`shared/domain/duongHoSo.ts`) thêm `case 'nhac_viec': return '/cong-viec';` + phép kiểm một
   dòng. Qb chưa merge → để Task này cuối cùng, rebase rồi làm.

**Phép kiểm máy chủ:** thêm vào `congViec.tests.ts` phép kiểm `duongThongBao({ entity_type: 'nhac_viec' })` (sau Qb). Phần
web không có bộ kiểm — kiểm ở Task 9.

Commit `PR-Ra (6): web Hỗ trợ học viên — gom nhóm, lọc nhanh, Người phụ trách, Nhắc, Duyệt; GV mở được việc Vận hành`.

## Task 7 · Web: Vận hành

**File:** `MgmtTasksPage.tsx` (viết lại phần lớn; tách panel chi tiết thành `export function NganViecVanHanh`).

1. **Đầu tab:** hàng số (mockup): `{n} quá hạn · {n} chờ người khác · {n} cần quyết định · {n} vừa hoàn thành (7 ngày)` —
   mỗi số là nút lọc (`hang`, G-10), đang chọn có `✕`; số 0 mờ, không bấm. Bên phải `+ Công việc` (g3-125). Bỏ câu "Bốn nhóm
   này chồng nhau…" (134) và mọi `SectionNote` (G-5) — ý cần giữ đưa vào `title`/`Th hint`.
2. **Hàng lọc:** `Nhóm: Mọi nhóm ▾` · `Trạng thái: Đang mở ▾` (Đang mở · 5 trạng thái · Mọi trạng thái; số facet trong
   option) · `Người phụ trách ▾` (`ChonNguoi nhom="nhan_vien" choNgoai={false}`, `Tôi` = mình) · `BranchFilter`. Thay hai dải
   nút 146-166 (§18.4: không quá 10 nút một hàng). Trạng thái trên địa chỉ.
3. **Bảng 5 cột** (`table-layout: fixed` + `colgroup`, G-2; cuộn ngang trong thẻ ở 375px, G-11):
   **Việc** (tên, tối đa 2 dòng + phụ `{Nhóm} · {Trong kỳ|Dài hạn}` và `· {CN}` khi đang xem nhiều chi nhánh) ·
   **Người phụ trách** (`chưa giao` mờ) · **Hạn** (`<Han loai="viec-van-hanh">` + phụ `dongHanDaDoi`) · **Trạng thái**
   (`Status` + **một** dòng phụ: Tạm ngưng → `{lý do} · cần: {người} · xem lại dd/mm` cắt 60 ký tự, đủ câu ở `title`; Dừng hẳn →
   lý do) · **Việc con** (`1/3 xong`; phụ đỏ `quá hạn: "{tên}"` + `và n việc khác`; không có → `—`).
4. **`NganViecVanHanh`** (từ `TaskDetail` 250-363): đầu panel trạng thái + hạn + người; khối "Hạn" có lịch sử dời
   (`dueHistory`: `05/09 → 12/09 · "lý do" · người · ngày`); nút `Cập nhật tiến độ` (người được giao, QL), `Sửa` + `+ Công
   việc con` (QL). Việc con: việc quá hạn tên đỏ. Case làm căn cứ: bỏ `SectionNote` 344-347 → `ⓘ` bằng `title`.
5. **`UpdateDialog`** (366-434): Tạm ngưng → ba ô bắt buộc `Lý do` · `Cần ai hỗ trợ` (`ChonNguoi nhom="nhan_vien"
   choToi={false}`, có "Người ngoài (gõ tên)") · `Ngày xem lại` (mặc định hôm nay + 7); nút Lưu mờ khi thiếu, dòng nói thiếu gì.
   `Đã hoàn thành` / `Dừng hẳn` của việc cha còn con mở: nút mờ + dòng phụ `Còn 2 việc con chưa khép: "A", "B"`
   (`openSubTitles`). Bỏ `SectionNote` 424-427.
6. **`SuaViec`** (mới, QL): tên, nhóm, người phụ trách / người theo dõi (`ChonNguoi nhan_vien`, lưu ID), hạn, ghi chú; đổi hạn
   đang có → hiện ô bắt buộc `Lý do dời hạn`. `PATCH /mgmt-tasks/:id`.
7. **`CreateTask`** (436-537): hai `select` người (475-490) → `ChonNguoi` (`choToi`, `choNgoai={false}`); đọc `?tao=1&nhom=&baoCao=`
   từ địa chỉ (57-62) và gửi `unitReportId`; tạo từ báo cáo xong → quay về `/cong-viec/bao-cao?periodId=…` (giữ tuần).

Commit `PR-Ra (7): web Vận hành — hàng số bấm được, bảng 5 cột, Tạm ngưng ba ý, dời hạn có lý do, chọn người bằng ID`.

## Task 8 · Web: Báo cáo đơn vị (phương án A)

**Files:** `MeetingPage.tsx` (viết lại `MeetingBoard`), tạo `congViec/NganBaoCao.tsx`, `BangChung.tsx` (thêm
`'unit_report'` vào kiểu `ownerType`, dòng 33).

1. **Tuần từ địa chỉ** (nợ PR-O): `periodId` khởi từ `?periodId=` (thay `useState(null)` dòng 38); đổi tuần → ghi lại vào
   địa chỉ (`replace`). Không có tham số → neo tuần hiện tại như cũ (53-62).
2. **Thứ tự (§7.3):** hàng chọn `Tuần W3 SEP ▾` (WeekPicker) · `Kỳ ▾` · một dòng `Nộp từ {thứ, dd/mm} đến hết {thứ, dd/mm}`
   (hoặc `Đã khoá · chỉ Quản trị hệ thống mở lại được`, `opensOn/closesOn` của `editWindow`) → hàng số `Đã nộp {n} · Nháp
   {n} · Chưa báo cáo {n}` (bấm lọc hàng đơn vị, G-10) → **ma trận** → hai khối thu gọn (`<details>`) `Việc đã giao ({n})`
   (giữ `ManagerTasks`/`ManagerTaskList`) và `Việc đang tồn ({n})` (`SignalList`) (Q16). Bỏ link `Tổng hợp theo tuần` (93) và
   `SectionNote` 100-114 (ý tháng → một dòng phụ dưới hàng chọn).
3. **Ma trận** (bảng, `table-layout: fixed`): cột **Đơn vị · Giáo viên · Học viên / Phụ huynh · Giáo trình · Trạng thái**. Ô:
   chữ mức (`Ổn` · `Cần theo dõi` · `Có vấn đề` theo `unitTone`, `—` khi trống); ô nháp: mức nhạt + chữ phụ `nháp`. Hàng
   Tutor: ba ô ghi `{nhãn ngắn}: {mức}` (hạng mục khác chi nhánh), tiêu đề cột có `title`. Cột Trạng thái: `Đã nộp` ·
   `Nháp · chưa nộp` (phụ `đã nộp 2/3`) · `Chưa báo cáo` (badge chữ, G-4). Kỳ tháng: ô ghi mức gần nhất + `(từng …)` như cũ
   (168-169). 375px: bảng cuộn ngang trong thẻ.
4. **`NganBaoCao`** (Drawer phải, G-8 — mở ô khác thì thay nội dung, không chồng): tiêu đề `{Đơn vị} · {Hạng mục}`, phụ
   `W3 SEP · nháp lưu HH:mm` / `đã nộp dd/mm HH:mm · {người}`; ba nút mức; ô nội dung (placeholder cũ 225); `Nối với việc:`
   chip việc (tên · trạng thái · hạn, bấm mở `/cong-viec/van-hanh?open=`, `✕` gỡ) + `+ Chọn việc` (menu có ô tìm, nguồn
   `/mgmt-tasks?branchId=…&progress=mo`, việc cùng nhóm lên đầu, dòng cuối `+ Tạo việc từ mục này` →
   `/cong-viec/van-hanh?tao=1&nhom=&baoCao={reportId}`); `Bằng chứng` = `<BangChung ownerType="unit_report" ownerId=
   {reportId}>` — chưa có `reportId` → chữ phụ `Lưu nháp để đính kèm bằng chứng`; `Lịch sử chỉnh sửa (n)` thu gọn (ghi
   `nháp`/`nộp`). Chân panel: `Lưu nháp` · `Nộp` (primary; ô đã nộp đang sửa → `Nộp lại`). Nút Nộp mờ khi cửa sổ đóng (dòng
   phụ nói vì sao) hoặc chưa chọn mức. Không quyền sửa / kỳ tháng → chỉ đọc. Lưu lỗi → giữ nội dung đang gõ.
5. Xoá `UnitRow`, `CellEditor` cũ (154-283).

Commit `PR-Ra (8): web Báo cáo đơn vị — ma trận đầu trang, panel nháp/nộp, nối việc thật, bằng chứng`.

## Task 9 · Bấm thử theo vai + 375px (một lần), CODE_MAP, PR

Máy chủ thử (ghi nhớ "máy chủ dev trong worktree"): trong worktree `npm run seed` → API `PORT=4317` (nền) → Vite **tạm** ở
gốc worktree (`port: 5517, strictPort`, proxy `/api` → `127.0.0.1:4317`, alias `@shared`); xoá file tạm sau khi thử. Đăng
nhập demo `fetch('/api/demo/session', …)` (kiểm ID vai bằng danh sách người demo; plan Form ghi GVCN 7, GVBM 9, QL 2).

Kịch bản (mỗi kịch bản ≥ 1 ảnh `thiet-ke/anh/pr-ra/NN-ten.png`):
1. **Tổng quan GV** trước/sau: khối Việc cần làm của tôi không đổi (so với ảnh `thiet-ke/anh/pr-pa/`).
2. **GV** · Công việc: không có hàng tab, không có dropdown Người phụ trách; lọc Quá hạn / Tuần này; bấm dòng "Công việc được
   giao" → panel việc Vận hành mở tại chỗ; Cập nhật tiến độ → Tạm ngưng thiếu người → nút mờ; đủ ba ý → lưu.
3. **QL** · Hỗ trợ học viên: mặc định Tất cả trong phạm vi, thấy dòng chấm điểm của GV khác; `Nhắc` → `✓ Đã nhắc HH:mm`;
   đăng nhập GV đó → chuông có thông báo → bấm về `/cong-viec`. `Chọn giáo viên…` gõ 3 chữ → chọn → danh sách của GV đó.
   `Duyệt` trên dòng đề xuất → hộp Trả lời đề xuất → dòng biến mất.
4. **QL** · Vận hành: bấm từng số hàng số → bảng lọc đúng, số facet không tự đổi; Dời hạn có lý do → cột Hạn "đã dời từ…";
   việc cha có con quá hạn thấy tên; Hoàn thành / Dừng hẳn việc cha còn con → mờ + tên việc con.
5. **QL** · Báo cáo đơn vị: ma trận ở đầu, không cuộn; bấm ô trống → Lưu nháp → hàng thành `Nháp · chưa nộp`; Ctrl+V ảnh vào
   Bằng chứng; `+ Chọn việc` → nối; `+ Tạo việc từ mục này` → tạo → quay về đúng tuần, việc đã nối. Tuần đã khoá: Lưu nháp
   được, Nộp mờ. Mở `/tien-trinh?periodId=<tuần cũ>` → đúng tuần đó.
6. **375px:** kịch bản 3, 4, 5 — trang không cuộn ngang, bảng cuộn trong thẻ, panel phải chiếm toàn màn, hàng lọc xuống dòng.

- [ ] `CODE_MAP.md`: dòng Công việc (3 tab, file, route mới, `migrateCongViec`).
- [ ] `npm run check` xanh lần cuối — số phép kiểm ≥ **B + 45**. Tắt tiến trình check còn treo.
- [ ] Push, mở PR `PR-Ra: Công việc — Hỗ trợ học viên, Vận hành, Báo cáo đơn vị (nháp/nộp)`. Mô tả: tóm tắt từng Task, bảng Q,
  danh sách ảnh, **khối MIGRATE** (lệnh lặp + phép kiểm + "Turso: chạy trước khi deploy mã"), mục "Chuyển cho". Báo planning.

---

## Mâu thuẫn nguồn ↔ mã thật (đã xử lý như trên)

1. Kiểm kê R3b "điều kiện hoàn tất việc cha" ❌ — máy chủ **đã chặn** Hoàn thành (`mgmttasks.ts:382-389`); thiếu là giao diện
   không nói trước + Dừng hẳn không bị chặn (Q11).
2. Kiểm kê R3 "dời hạn ghi đè không lưu `task_history`" — bảng `task_history` có sẵn nhưng không có cột lý do, và **không có
   giao diện sửa hạn nào** (`editMgmtTask` chỉ có API) → Task 4 + `SuaViec`.
3. Kiểm kê R3 ghi "Đủ 5 cột" — cột 5 hiện là "Cập nhật gần nhất" (MgmtTasksPage.tsx:181), mockup là **Việc con** (Q7).
4. Giao việc ghi "Tạm dừng"; THUAT_NGU g6-122 và mã dùng **Tạm ngưng** → giữ Tạm ngưng.
5. Thiết kế §18.4 lọc nhanh "Tất cả / Quá hạn / Đến hạn / Chờ duyệt" (mã hiện tại, `WorkList.tsx:31-36`) ↔ đặc tả §3.4
   "Tất cả / Quá hạn / Hôm nay / Tuần này" → đặc tả thắng.
6. Mockup Tab 1 cho QL thấy dòng chấm điểm của GV khác — `myWork` chưa bao giờ có (chỉ `myPendingDetail`, `mywork.ts:323`);
   QT không được tự thành người nợ điểm (`run.ts:5474`) → chế độ `tat-ca` riêng, mặc định cũ giữ nguyên (Q1, Q3).
7. Kiểm kê Q6 ghi `PeoplePicker` "chưa màn nào dùng" — nay Form đã có `ChonNguoi` + `/ref/nguoi`, nhưng `/ref/nguoi` **không
   giới hạn chi nhánh** → thêm `trongPhamVi`.
8. Đặc tả §7 ghi `mywork.ts:913` — thật là `href` ở **dòng 920**; đường `/tien-do-cong-viec?viec=` → `duongMoi`
   (`dieuHuong.ts:141-146`) đổi thành `/cong-viec/van-hanh?open=` → GV bị `CongViecPage.tsx:24` đẩy về tab 1.
9. Mockup Tab 3 ghi "hạn nộp thứ Bảy 20/09"; mã: cửa sổ mở 2 ngày cuối tuần, đóng hết thứ Tư tuần sau (`week.ts:191-225`)
   → hiện đúng cửa sổ thật.
10. `/my-work` của QL và `/meeting/board`, `/mgmt-tasks` **chưa có** trong `tocDoDuong.ts`; `meetingBoard` hiện 3 câu SQL
    mỗi ô (N+1) → gộp ở Task 5.
11. `report_due` (`worklist/signals.ts:134`) đếm "đã báo cáo" bằng `status IS NOT NULL` — với nháp sẽ sai → đổi sang
    `submitted_at`.

## Chuyển cho PR khác

| Việc | Giao | Ghi chú |
|---|---|---|
| "Cần quyết định trong cuộc họp" (§7.3 mục 4 thiết kế) ở Báo cáo đơn vị | sau deploy | Không có trong §3.4 |
| Số đếm trên hàng tab Công việc | sau deploy (Q17) | Cần một đường đếm nhẹ |
| `mgmt` chưa có loại hạn ở `LOAI_HAN_CUA_VIEC` (`tongQuan.ts:40`) → dòng Vận hành ở Việc cần làm hiện ngày trơn | S3 | Ra không chạm `tongQuan.ts` (LT) |

## Nhật ký

