# Lộ trình tổng hợp mọi việc chưa làm (03/10, sau deploy)

> Nguồn: kiểm kê mọi file trong `docs/superpowers/plans/`, các spec, `plan.md`, đối chiếu `git log` tới `3d0a25a` (#179); báo cáo rà PR #172–#176
> (F01–F04, U01, D01 — **cả 6 vẫn còn trên main**, đã kiểm lại 03/10); 9 yêu cầu 03/10 (`2026-10-03-pr-phien-lich-mt-dieu-huong-sua-lop.md`).
> Chủ sản phẩm 03/10: **đã deploy** → các việc ghi "sau deploy" được mở khoá. Gộp việc cùng màn/cùng file vào một PR.

## Quyết định 04/10
- **PR-QU làm đầu tiên:** GVCN phân công GV bộ môn lớp mình (không cần duyệt, báo QL); quyền **Tạo lớp** tách riêng, cấp được theo chi nhánh; **tạo lớp hàng loạt** (loại, lộ trình, số lớp, phân công; trộn nhiều chi nhánh được); màn quyền chia nhóm + bảng vai × quyền + ô tích cấp riêng + sửa quyền mặc định của vai; không cấp lẻ quyền Quản trị; **GVBM/GVCN đóng Case môn phụ trách**, báo QL.
- **Deploy sau mỗi đợt** (bảng Deploy bên dưới).
- Lớp thường cũng có **Target + Dự kiến thi** (ghi đè K2-41): Thêm HV, dán Excel, sửa thông tin → PR-NT. PR-SL và PR-DH (cột Dự kiến thi) áp cho cả lớp thường.
- Dán Excel **không bắt buộc hàng tiêu đề** → PR-NT (NT-3).
- Lớp thường lên lớp: **Target + Dự kiến thi mang sang lớp mới** → PR-NT (thêm vào NT-1/NT-4, sửa `luatLoTrinh.ts:265`).
- Cột Target + Dự kiến thi ở bảng hồ sơ lớp thường: làm ở **PR-DH** (không phải PR-NT).
- **"Vắng" ('-') thống nhất** giữa lưới cả lớp và màn từng kỹ năng, có **Hoàn tác** → PR-HK2 (cùng K4). (E8 kế hoạch 26/09 chốt.)
- **C02: giữ chặn** — GVCN không dạy môn đó không ghi bù Case môn đó. Không làm gì.
- **Điểm theo lớp** (nhập điểm hàng loạt theo từng lượt, cả bài đã qua, cả lớp thường theo lịch riêng của lớp) → **PR-DL**, mockup `thiet-ke/mockup-diem-theo-lop-2026-10-04.html`, kế hoạch `2026-10-04-pr-dl-diem-theo-lop.md`.

## Quyết định 03/10 (bổ sung)
- **F01 = D13:** chống gửi trùng bằng **mã idempotency mỗi lần mở form** (cột `idempotency_key`), bỏ chặn trùng 10 giây theo tiêu đề. Áp cho `/tasks`, việc Vận hành, PA, followup.
- **F02:** lưu **bản chụp nội dung lúc xác nhận** từ nay; việc đã làm trước đó ghi "Chưa lưu nội dung lúc báo — dưới đây là nội dung hiện tại". Không điền ngược.
- **U01:** "chờ chấm" màu **tím `wait`** ở mọi nơi.
- **Bị từ chối:** chip kiểu Cần làm ở mọi nơi (chủ sản phẩm 03/10).
- **Tách PR-GV** thành GVa (nghiệp vụ) / GVb (Chờ duyệt) theo báo cáo rà §8.4.
- **D01/Q-B:** làm (session planning chọn thời điểm): gộp vào PR Giao việc & Duyệt. Sửa kế hoạch UX 02/10 ghi Q-B **chưa làm** cho tới khi xong.

## Thứ tự PR

| # | PR | Gồm | Vì sao gộp / thứ tự | Cỡ |
|---|---|---|---|---|
| 1 | **PR-PH** (đang làm) | Báo đăng xuất giả (PH-1..3) | Lỗi người dùng thấy hằng ngày | S |
| 2a | **PR-GVa · Giao việc (dữ liệu + form)** | F01/D13 idempotency key · F03 chi nhánh form · F04 khoá gửi khi chưa có kỳ (máy chủ cũng chặn) | Báo cáo rà #172–#176 §8.4: tách sửa nghiệp vụ khỏi UX | M |
| 2b | **PR-GVb · Chờ duyệt** | D01/Q-B duyệt nhiều ở "Tất cả" + Chọn hết + Nhắc tất cả · J5 · J5b "Để QL biết" · U01 tím `wait` · chip "Bị từ chối" = kiểu **Cần làm** mọi nơi | Cùng `HopChoDuyet`, tone trạng thái | M |
| 3 | **PR-PHH · Báo PH lưu bản chụp** | F02 (cột snapshot + migrate, hiển thị "đã báo" vs "hiện tại") | Có migrate, tách riêng để dễ rà | M |
| 4 | **PR-LM · Lịch MT** | LM-1..5 · I5 chữ hồ sơ Mock ("Thi bù tuần này (lần 1)", ví dụ nhận xét) · I4 phần MockDetail/HopThaoTacMt Drawer→KhungPanel | Cùng `MockDetailPage`, `HopThaoTacMt` | L |
| 5 | **PR-DH · Học viên & Lớp + hồ sơ** | DH-1..5 · L1 popover "Thiếu n" · K1 (phần desktop: gộp "Tất cả" + Loại lớp = DH-5) · H6 chip "+1" bấm được · D1 badge chuyển lớp khớp số dòng · J6 "Target"(kiểm thuật ngữ) · J8 chữ bị cắt · J10 bỏ "chưa có dữ liệu" lặp ở hồ sơ HV | Cùng `StudentsPage`, `BangHocVienLop`, `MissingBadge`, hồ sơ | L |
| 6 | **PR-SL · Sửa cả lớp + panel** | SL-1..2 · I3 sửa panel Thêm HV · I1 luật "Đóng / Huỷ thay đổi" ở `KhungPanel`/`Drawer` · I2 form Tạo Case · I6 panel Ghi vi phạm · I4 phần còn lại (GvCham, ScoreEntry, NhanXet, DeleteViolationConfirm) · D11 lỗi dưới ô nối `aria-describedby` | Cùng khung panel/form; SL dùng chung lưới với Thêm HV | L |
| 7 | **PR-BC · Báo cáo đơn vị + Quản trị** | L2 thanh điều khiển · D8 "09/2026" · L3 lọc giáo viên · J10 ẩn cột "Quyền cấp riêng" rỗng | Cùng `MeetingPage`, `AccountsAdmin` | M |
| 8 | **PR-SO · Số liệu & dọn mã** | D2 một hàm chọn PA đại diện · D4 xoá `completeIntervention` · D5 · 12.18 đếm bằng chứng theo lô · 12.19 việc nhỏ máy chủ · 12.15/12.16 an toàn (giới hạn thử đăng nhập, `/auth/register` cần duyệt) · DEP-gỡ mã chuyển dữ liệu cũ (**chỉ khi** chủ sản phẩm xác nhận DB cũ đã xoá, TAY-7) | Máy chủ, không giao diện | M |
| 9 | **PR-HK2 · Badge & chữ (cuối cùng)** | H1/H2 ba họ chip · K6 chữ 12 px · K7 icon ⋯ · K2 Phân tích › Tổng hợp · K5 demo bar · J1–J4, J7, J9 chữ · K4 Hoàn tác "Vắng" điện thoại · **chụp lại toàn bộ ảnh sổ tay** | Đụng ~15+ file khắp web — làm sau cùng để không xung đột và chỉ chụp sổ tay một lần | L |

## Chủ sản phẩm 03/10 duyệt thứ tự trên; DB cũ ĐÃ XOÁ (gỡ mã cũ ở PR-SO); đưa vào lộ trình: D9 → PR-BC, D7 → PR-HK2, D3 → PR-SO, U12 → PR riêng **PR-U12** sau PR-SO.

## Còn chờ quyết
A12 tên PA "Điều chỉnh cách dạy" · K2-26 (mặc định bỏ).

## Hoãn có chủ ý (giữ nguyên)
UX-D7 bảng→thẻ điện thoại · Thêm HV dạng thẻ điện thoại · xu hướng Phân tích (chờ 2–3 tháng dữ liệu) · KPI tháng GV · D15 hiệu quả PA theo SOS lúc sinh · taxonomy vấn đề · kho ý tưởng §20.

## Đã chốt không làm
GV-C1 chấm đúng hạn lịch sử · góc Phân tích › Giáo viên cũ · mockup 26 bản 3–4 · Q12 em tạm dừng · ba ý tưởng §20.1 · B7 (giữ mã).

## Áp cho mọi PR (từ báo cáo rà #172–#176 §8)
- Lỗi: viết phép kiểm **thất bại trên DB test** trước, sửa theo nguyên nhân; không làm phép khớp chuỗi nguồn cho xanh khi kiểm được hành vi.
- Bấm thử trình duyệt 375 và 1440, sáng/tối, ít nhất 3 vai: toàn hệ thống, quản lý chi nhánh, GV.
- Mô tả PR báo từng ID: đã tái hiện / bác bỏ (lý do), file sửa, phép kiểm bảo vệ, ảnh, giới hạn còn lại.
- Danh sách bấm thử chưa kiểm chứng (#174 §6.2): panel Chuyển lớp đè demo bar → PR-DH; chữ "Khác" mơ hồ, trang lưu trữ thiếu trạng thái rỗng, hồ sơ cá nhân nhiều khoảng trống → PR-HK2. Xác nhận có thật rồi mới sửa.

## Trạng thái
- **PR-PH: XONG** (commit `55448f8`, `c5674cf`, `243f652` trên nhánh `claude/elegant-knuth-cjlz8n`, đi cùng PR kế hoạch này). Còn: bấm thử Step 6 + ảnh dải "Mất kết nối" — gom vào lượt audit của PR-HK2.

## Chạy song song theo đợt (mỗi PR một session riêng)

Mỗi session: nhánh mới **từ main mới nhất**; PR nào thêm migrate dùng **file migrate riêng** (`server/src/migrate/<tênPR>.ts`), chỉ xung đột nhẹ ở `schema.sql`/`run.ts` → merge main vào nhánh rồi chạy lại `npm run check` trước khi mở PR.

| Đợt | Chạy cùng lúc | Vì sao không đụng nhau | Phải chờ |
|---|---|---|---|
| **0** | **QU** (Quyền + Tạo lớp hàng loạt) · cùng lúc được: **GVa**, **LM** | QU: quyền (`people.ts`, `permissions.ts`, `nhomQuyen.ts`), tạo lớp (`intake.ts` phần tạo lớp, `ClassCreatePanel`), `TeacherAssignPanel`, `AccountsAdmin` (khối cấp quyền), đóng Case · GVa: Giao việc · LM: lịch MT — ba vùng tách nhau | — |
| **1** | **GVb** · **BC** · **NT** | GVb: Chờ duyệt · BC: Báo cáo đơn vị + bộ lọc Tài khoản · NT: Thêm HV lớp thường (`intake.ts` phần thêm HV) | Chờ QU (BC cùng `AccountsAdmin`; NT cùng `intake.ts`; GVb cùng danh mục quyền) |
| **2** | **PHH** · **DH** | PHH: `yThuc/phoiHop.ts` + migrate · DH: `StudentsPage`, `BangHocVienLop`, `MissingBadge`, `standing.ts` | PHH chờ GVa · DH chờ LM |
| **3** | **SL** · **SO** · **DL** | SL: panel/form · SO: máy chủ số liệu + gỡ migrate cũ · DL: Điểm theo lớp (chỉ thêm một mục menu ⋮ hồ sơ lớp) | SL, DL chờ DH · DL chờ LM · SO chờ GVa, PHH |
| **4** | **U12** | Bảng kết quả lớp thường | SO |
| **5** | **HK2** (một mình, cuối cùng) | Đụng ~15+ file khắp web, chụp lại toàn bộ sổ tay | Mọi PR trên đã merge |

## Deploy (chủ sản phẩm 04/10: deploy sau mỗi đợt)
| Mốc | Sau khi merge | Bấm thử trước khi deploy | Lưu ý |
|---|---|---|---|
| **D0** | QU + GVa + LM | Cấp/gỡ quyền riêng, sửa quyền vai (xem số người bị ảnh hưởng), GVCN đổi GV bộ môn, tạo 3 lớp một lần, GVBM đóng Case; giao việc 2 lần cùng tiêu đề; dời MT vượt + hộp xác nhận | **Có migrate** (GVa: `idempotency_key`). Sao lưu DB trước. Báo QL/GV: quyền mới, GVCN phân công được |
| **D1** | GVb + BC + NT | Duyệt nhiều ở "Tất cả", Báo cáo đơn vị, Thêm HV lớp thường dán Excel không tiêu đề | Không migrate |
| **D2** | PHH + DH | Báo PH đã làm giữ nội dung; bảng Học viên & Lớp cột mới, Trước/Sau | **Có migrate** (PHH) |
| **D3** | SL + SO + DL | Sửa cả lớp, Điểm theo lớp (FT + lớp thường, bài đã qua) | SO gỡ mã migrate cũ — chạy `npm run check` trên bản sao DB thật trước |
| **D4** | U12 | Bảng kết quả lớp thường | — |
| **D5** | HK2 | Toàn web 375/1440 sáng/tối; chụp lại sổ tay | Đổi giao diện rộng — báo GV trước |

## Prompt cho từng session (dán nguyên khối)

Đợt 1 đã có đủ kế hoạch chi tiết (GVa, GVb, BC, LM), mỗi file có mục **Skill bắt buộc** (superpowers · ponytail · impeccable).

Phần chung — mọi prompt đều ngầm gồm đoạn này (skill: superpowers writing-plans/brainstorming/subagent-driven-development/test-driven-development/verification-before-completion/requesting-code-review/finishing-a-development-branch; `/ponytail lite` hoặc full + `/ponytail-review`; `/impeccable critique|layout|clarify|harden` + `audit`):
```
Đọc trước: CLAUDE.md, docs/superpowers/plans/2026-10-03-lo-trinh-tong-hop-viec-chua-lam.md (mục Quyết định, "Áp cho mọi PR").
Nếu PR chưa có kế hoạch chi tiết: dùng skill writing-plans viết docs/superpowers/plans/2026-10-03-pr-<mã>-….md
(cùng cấu trúc với 2026-10-03-pr-phien-lich-mt-dieu-huong-sua-lop.md) — có điểm cần chủ sản phẩm quyết thì dùng brainstorming hỏi trước.
Sau đó thực hiện bằng subagent-driven-development (mỗi task một subagent + rà soát).
Phép kiểm trước (đỏ) → sửa → npm run check xanh → bấm thử 375/1440 sáng/tối, 3 vai → /impeccable audit (nếu có giao diện) → /ponytail-review.
Xong: đánh dấu [x] kế hoạch, thêm dòng mục 14 plan.md, cập nhật CODE_MAP.md nếu thêm/xoá file, mở PR (không tự merge),
mô tả PR báo từng ID (tái hiện/bác bỏ, file, phép kiểm, ảnh), liệt kê chú thích ponytail:, ảnh sổ tay bị lệch.
```

### Đợt 0
**PR-QU — Quyền + Tạo lớp hàng loạt** (làm đầu tiên; GVa, LM chạy cùng lúc được)
```
Làm PR-QU theo prompt cuối file docs/superpowers/plans/2026-10-04-pr-qu-quyen-tao-lop.md (QU-1 → QU-8, gồm mục "Chủ sản phẩm trả lời 04/10"). Nhánh pr-qu-quyen-tao-lop.
```

### Đợt 1
**PR-NT — Target + Dự kiến thi cho lớp thường, dán Excel không cần tiêu đề** (chủ sản phẩm 04/10, ưu tiên sớm)
```
Làm PR-NT theo prompt cuối file docs/superpowers/plans/2026-10-04-pr-nt-target-thi-lop-thuong.md (NT-1 → NT-5). Chủ sản phẩm 04/10: lên lớp thường thì MANG SANG Target + Dự kiến thi (luatLoTrinh.ts:265 hiện chỉ giữ FT→FT) — thêm task nhỏ có phép kiểm; cột ở bảng hồ sơ lớp thường để PR-DH. Nhánh pr-nt-target-thi-lop-thuong.
Không migrate; chạy song song với GVa/GVb/BC/LM được.
```
**PR-GVa — Giao việc: dữ liệu + form**
```
Làm PR-GVa theo prompt cuối file docs/superpowers/plans/2026-10-03-pr-gva-giao-viec.md (GVa-1 → GVa-4, đã có kế hoạch + mục Skill bắt buộc). Nhánh pr-gva-giao-viec.
Phạm vi: F01/D13, F03, F04 trong báo cáo rà #172–#176 (tóm tắt + tiêu chí nghiệm thu ở lộ trình tổng hợp).
- F01/D13: bỏ chặn trùng 10 giây theo tiêu đề (vuaGhi, server/src/db.ts ~319; mgmttasks.ts ~448–474; createTask ở meeting.ts; grep các chỗ khác dùng vuaGhi: PA, followup)
  → cột idempotency_key + unique index, mỗi lần MỞ form một mã (theo mẫu idempotencyKey của Thêm học viên). Retry cùng mã không nhân đôi;
  khác mã cùng tiêu đề = hai việc; group/note/watcher/report/case không mất; liên kết + audit đúng một lần; có phép gửi đồng thời.
- F03: MgmtTasksPage CreateTask (~630–690) mở form lấy lại chi nhánh/nhóm/việc cha theo ngữ cảnh hiện tại (đóng→mở), không ghi đè lựa chọn khi rerender.
- F04: tải kỳ lỗi/chưa xong/không có anchor → web khoá gửi + "Thử lại"; máy chủ không nhận teacher_task thiếu kỳ (hoặc tự xác định theo luật chung);
  thất bại không để lại task/Case/PA dở.
/ponytail lite (có sửa form).
```
**PR-LM — Lịch MT linh hoạt** (đã có kế hoạch)
```
/ponytail lite
Làm PR-LM theo mục "D. Prompt cho session code › PR-LM" trong docs/superpowers/plans/2026-10-03-pr-phien-lich-mt-dieu-huong-sua-lop.md
(Task LM-1 → LM-7, kế hoạch đã gồm I5 = LM-6, I4 lịch MT = LM-7). Nhánh pr-lm-lich-mt-linh-hoat. Tóm tắt: I5 (chữ hồ sơ Mock "Thi bù tuần này (lần 1)", placeholder nhận xét thành ví dụ,
fasttrack/NhanXet.tsx:109) và I4 phần MockDetailPage/HopThaoTacMt (Drawer → KhungPanel).
```
**PR-BC — Báo cáo đơn vị + Quản trị**
```
/ponytail lite
Làm PR-BC theo prompt cuối file docs/superpowers/plans/2026-10-03-pr-bc-bao-cao-quan-tri.md (BC-1 → BC-6, đã có kế hoạch + Skill bắt buộc; D9 chốt bằng brainstorming ở BC-2). Nhánh pr-bc-bao-cao-quan-tri. Tóm tắt phạm vi: L2 và L3 theo docs/superpowers/plans/2026-10-03-pr-l1-popover-bao-cao-loc-gv.md (KHÔNG làm L1 — L1 thuộc PR-DH),
cộng D8 (kỳ tháng "2026-09" → "09/2026", MeetingPage scope month), D9 bộ lọc chi nhánh Báo cáo đơn vị (chủ sản phẩm 03/10 đồng ý làm; L2 cũ ghi "không làm" — nay làm),
J10 phần Quản trị (ẩn cột "Quyền cấp riêng" khi rỗng). 
```
**PR-GVb — Chờ duyệt**
```
/ponytail lite
Làm PR-GVb theo prompt cuối file docs/superpowers/plans/2026-10-03-pr-gvb-cho-duyet.md (GVb-1 → GVb-9, đã có kế hoạch + mục Skill bắt buộc; giả định G1–G7 chủ sản phẩm duyệt khi đọc PR). Nhánh pr-gvb-cho-duyet.
- D01/Q-B: HopChoDuyet.tsx:70 (choHangLoat loại tab "Tất cả") → duyệt nhiều ở "Tất cả", "Chọn hết n", "Nhắc tất cả (n)"; đặc tả Q-B ở
  docs/superpowers/plans/2026-10-02-ux-sau-critique.md (~147–155): trần 50, cùng loại, đúng phạm vi quyền, không nhắc lặp trong ngày (worklist/nhacViec.ts),
  báo thành công một phần. Sửa kế hoạch UX 02/10: Q-B ghi CHƯA LÀM cho tới PR này.
- J5 dòng tóm tắt → hàng chip đếm; J5b tách "Để QL biết" khỏi Chờ duyệt, badge = số dòng có nút Duyệt (ux-sau-critique ~112–116).
- U01: "n bài chờ chấm" tone wait (tím) ở hocVienLop.ts:234; phép kiểm đối chiếu danh sách lớp với Lịch Test.
- Chip "Bị từ chối" = kiểu Cần làm ở mọi nơi.
```

### Đợt 2
**PR-PHH — Báo PH lưu bản chụp** (sau khi GVa merge)
```
Làm PR-PHH (nhánh pr-phh-bao-ph-ban-chup). Chưa có kế hoạch chi tiết → viết trước.
F02: server/src/yThuc/phoiHop.ts ~278–302 (turnsOf, noiDungCua) dựng nội dung bao_ph_tvv từ dữ liệu HIỆN TẠI. Lưu bản chụp 4 nội dung (+ dữ liệu liên quan)
lúc confirmCoordination; việc xác nhận trước khi có cột: hiện "Chưa lưu nội dung lúc báo — dưới đây là nội dung hiện tại", KHÔNG điền ngược.
Nghiệm thu: sửa điểm / nguyên nhân / đóng Case / thay PA sau xác nhận không đổi bản đã lưu; mở lại / xác nhận lại có quy tắc phiên bản + audit.
Có giao diện nhỏ → /ponytail lite.
```
**PR-DH — Học viên & Lớp + hồ sơ** (sau khi LM merge, đã có kế hoạch)
```
/ponytail lite
Làm PR-DH theo mục "D. Prompt cho session code › PR-DH" trong docs/superpowers/plans/2026-10-03-pr-phien-lich-mt-dieu-huong-sua-lop.md (DH-1 → DH-5).
Nhánh pr-dh-bang-dieu-huong. Thêm từ lộ trình: L1 popover "Thiếu n" (theo 2026-10-03-pr-l1-popover-bao-cao-loc-gv.md mục L1), H6 chip "+1" ở dòng lớp bấm mở được,
D1 badge "n HV chưa có lệnh chuyển lớp" khớp số dòng có cờ, J6 (kiểm thiet-ke/THUAT_NGU_DA_CHOT.md trước khi đổi "Target"), J8 chữ bị cắt, J10 phần hồ sơ HV
(bỏ "chưa có dữ liệu" lặp), bấm thử panel Chuyển lớp có đè demo bar không. Viết thêm task cho các mục này vào cuối kế hoạch.
```

### Đợt 3
**PR-SL — Sửa cả lớp + panel** (sau khi DH merge)
```
/ponytail lite
Làm PR-SL theo mục "D. Prompt cho session code › PR-SL" trong docs/superpowers/plans/2026-10-03-pr-phien-lich-mt-dieu-huong-sua-lop.md (SL-1, SL-2).
Nhánh pr-sl-sua-ca-lop. Thêm từ lộ trình (ux-sau-critique.md mục UX-I): I1 "Đóng"/"Huỷ thay đổi" ở KhungPanel/Drawer, I2 form Tạo Case, I3 panel Thêm HV,
I4 Drawer → KhungPanel phần còn lại (GvCham, ScoreEntry, NhanXet, DeleteViolationConfirm, StudentDetailPage), I6 panel Ghi vi phạm, D11 lỗi dưới ô nối
aria-describedby (ui/ui.tsx Field, ui/KhungPanel.tsx Truong). Viết thêm task vào cuối kế hoạch.
```
**PR-SO — Số liệu & dọn mã** (sau khi GVa, PHH merge)
```
Làm PR-SO (nhánh pr-so-so-lieu-don-ma). Chưa có kế hoạch chi tiết → viết trước. Không giao diện → ponytail full.
- D2: một hàm chọn PA đại diện nhóm Bổ trợ dùng chung cho metrics.ts:401-404 và mywork.ts:486-495 (dựng dữ liệu nhiều PA cùng nhóm, khác trạng thái/hạn/quyền).
- D3: một hàm chọn lộ trình (loTrinhTinhTuan) cho cycles.ts, profile.ts:773, transition.ts:66, luatLoTrinh.ts:366 (chủ sản phẩm 03/10 đồng ý).
- D4 xoá completeIntervention (viết lại 4 phép kiểm liên quan), D5 lopHocCua luật cũ, 12.18 đếm bằng chứng theo lô, 12.19 việc nhỏ máy chủ (plan.md ~1946–1957).
- An toàn (plan.md 12.15/12.16): giới hạn thử /auth/login, /auth/register cần duyệt — kiểm cái nào đã làm trước khi sửa.
- DEP-gỡ: DB cũ ĐÃ XOÁ (chủ sản phẩm 03/10) → gỡ mã chuyển dữ liệu cũ, lệnh chay-thu:*, kiem-lop-mo-coi, khối Lịch sử TRIEN_KHAI §11.1
  (docs/superpowers/plans/2026-10-02-pr-deploy-reset-ban-chinh.md ~19, 64, 370). Không gỡ migrate của PR mới (GVa, PHH).
```

### Đợt 3b
**PR-DL — Điểm theo lớp** (sau khi LM, DH merge)
```
Làm PR-DL theo prompt cuối file docs/superpowers/plans/2026-10-04-pr-dl-diem-theo-lop.md (DL-0 → DL-7). Nhánh pr-dl-diem-theo-lop.
Mockup đã duyệt: thiet-ke/mockup-diem-theo-lop-2026-10-04.html. DL-0 kiểm cách lưu lịch Test riêng của lớp thường — sai giả định G2 thì dừng hỏi chủ sản phẩm (brainstorming).
```

### Đợt 4
**PR-U12 — Kết quả kiểm tra lớp thường** (sau khi SO merge)
```
Làm PR-U12 (nhánh pr-u12-ket-qua-lop-thuong). Chưa có kế hoạch → dùng brainstorming với chủ sản phẩm trước (K4-33, nguồn:
docs/superpowers/plans/2026-10-02-pr-s3-chu-cuoi.md:88, 2026-10-01-pr-uxf-b-ma-tuan.md:171,436; Rulebook thiet-ke/PISA-Rulebook-2026-09-19.md mục K4-33),
rồi writing-plans, rồi làm. /ponytail lite.
```

### Đợt 5
**PR-HK2 — Badge & chữ, chụp lại sổ tay** (cuối cùng)
```
/ponytail lite
Làm PR-HK2 theo prompt "PR-HK2 — sau deploy" trong docs/superpowers/plans/2026-10-02-ux-sau-critique.md (H1, H2, K2, K5, K6, K7, K1 còn lại).
Nhánh pr-hk2-badge-chu. Thêm từ lộ trình: K4 Hoàn tác "Vắng" điện thoại, J1–J4, J7, J9 chữ, D7 thanh trên điện thoại theo mockup 23C (chủ sản phẩm đồng ý),
bấm thử chữ "Khác", trạng thái rỗng trang lưu trữ, khoảng trống hồ sơ cá nhân; dải "Mất kết nối" của PR-PH (nút "Đang thử…", role=status, ảnh).
Viết kế hoạch bổ sung cho các mục thêm trước khi làm. Chụp lại toàn bộ ảnh sổ tay docs/so-tay/ trong PR này.
```
