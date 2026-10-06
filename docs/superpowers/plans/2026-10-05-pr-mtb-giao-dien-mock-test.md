# PR-MTb · Giao diện Test / Mock Test (mockup bản 4, trừ MT0) — Kế hoạch (05/10)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vẽ lại các màn Mock Test theo mockup bản 4 (phần 1–4): panel "Xếp lịch Mock Test", hộp một đợt `HopKyNang` (Kế hoạch Test + hồ sơ HV › Lộ trình), MỘT component Ô MT dùng chung, popup dời vượt ở mọi cổng dời, ô lý do tuỳ chọn (T7), nhập band (T10, phần web), nút "Xin dời" của GVCN (T3), chữ "cũ" (T1).

**Architecture:** Luật vẫn ở `shared/domain` + máy chủ (PR-MTa, khối "Interfaces chung" của `2026-10-05-pr-mta-luat-mock-test.md`); PR này thêm vài luật thuần nhỏ cho màn (`oMt`, `nhanSeXep`/`demSeXep`, `chuDoiVuot`, `menuHopKyNang`) và 3 thay đổi máy chủ nhỏ mà PR-MTa không có trong phạm vi (panel: "MT mới", chọn đúng đợt, tick kỹ năng; `hanCham` trên `OKyNang`; vượt ở hàng loạt nếu MTa chưa làm). Web: component mới `web/src/ui/OMt.tsx`; viết lại `HopXacNhanHuyLich.tsx` thành popup mockup phần 4 (giữ tên file — MTa cũng sửa file này); sửa `NganXepLichMt`, `HopKyNang`, `HangLichMt`, `MockDetailPage`, `HopThaoTacMt`, `ScoreEntry`, `MenuDong`, `Nhan`.

**Tech Stack:** React + Tailwind (web/), Express + SQLite/Turso (server/), `shared/domain` thuần; phép kiểm `server/src/tests/prMtb.tests.ts` gọi ở cuối `run.ts`; `npm run check`.

**Spec:** `docs/superpowers/specs/2026-10-05-test-mock-test-design.md` (mục 2, T1–T4, T7, T10, T12, T13b) + mockup đã duyệt `thiet-ke/mockup-test-mt-2026-10-05.html` (bản 4 — chữ trên màn lấy đúng từ đây) + `plan.md` mục 2c.

**Thứ tự:** chạy **sau PR-MTa** và sau **PR-DL, PR-K26, PR-SL** đã merge (05/10: K26 đã merge #196/#197; SL còn mở `origin/pr-sl-sua-ca-lop`; DL đang làm, nhánh local `pr-dl-diem-theo-lop`). Chưa đủ thì dừng, báo planning. PR-MT0 merge **sau** PR này (kế hoạch MT0 đã dùng tên `OMt`, `OMtVao`, `NhanCu`, `menuHopKyNang` — giữ đúng tên).

## Chủ sản phẩm chốt 05/10 (sau khi soạn) — ĐÈ lên phần dưới nếu khác
- Q1: lưới FT ở Kế hoạch Test **đổi sang ô MT gọn** (component chung).
- Q2: panel nhiều em dời vượt MT có điểm → **một popup gộp**, mỗi em một dòng (máy chủ PR-MTa trả hệ quả cho hàng loạt).
- Q3: bỏ tick kỹ năng ở panel chỉ áp cho **đợt mới tạo**; đợt đã có giữ nguyên.
- "Đang chọn": theo **mockup đã duyệt** (nền sáng, chữ tối, ✓), không dùng token `chon-*` — ghi lại vào `thiet-ke/HE_GIAO_DIEN.md` §2 trong PR này.
- "Dời hạn chấm" khi chưa tới tuần thi: **giữ luật hiện tại** (mục mờ trong ⋯).
- T4 áp cả lớp thường (Quản lý xếp tuần đã qua): chip vàng "Tuần đã qua" ở Kế hoạch Test lớp thường nữa.
- Chữ trên màn **đúng mockup bản 4**, ngắn, không câu giải thích dưới nút/ô.

## Global Constraints
- Chữ trên màn **đúng mockup bản 4**, ngắn (nhãn 1–3 từ), **không** thêm câu giải thích dưới nút/ô; giải thích (nếu cần) đặt ở `title` (tooltip). Chữ không có trong mockup mà bắt buộc phải có → ≤ 3 từ, liệt kê trong mô tả PR.
- Thời gian trên màn: mã tuần `W1 OCT`; ngày chỉ trong khoảng tuần của bộ chọn tuần (`28/09 – 04/10`) và hạn cụ thể.
- Giữ Be Vietnam Pro (chữ số Inter), bảng màu, bố cục; màu chỉ qua token (`prSang` S1–S8 phải xanh). Không hex trong component.
- Chữ mockup cần dùng nguyên văn: "Xếp lịch Mock Test" · "Fast Track" / "Lớp thường" · "Đợt" · "MT mới" · "MT1"… · "Tuần và kỹ năng" · "L R W S" (ô tick) · "Lịch riêng ▸" · "Học viên" · "✓ Sẽ xếp {n}" · "! Cần xem {n}" · "✕ Không xếp được {n}" · "Tất cả" · "Lớp" · "Mock Test" · "Sẽ xếp" · "⇆ cuộn ngang" · "Đóng" · "Xếp lịch {a} em · {b} bài" · "Tuần chung" · "Huỷ thay đổi" · "Lưu" · "Đổi tuần" · "Dời hạn chấm" · "Báo vắng" · "Huỷ điểm" · "Nhật ký" · "trễ chấm" · ô MT: "chưa xếp" · "tuần này" · "chờ chấm {n}" · "trễ chấm {W}" · "vắng {S}" · "{S} huỷ" · "✓" · "✓ 3/4" · "cũ" · popup: "Dời MT{n} sang {tuần}?" · "MT{n} muộn hơn MT{a}, MT{b}." · "MT{a}: huỷ {x} điểm, đóng {y} Case" · "MT{b}: bỏ lịch" · "Lý do" · "Đóng" · "Dời và huỷ" · "Xin dời".
- Không làm MT0 (PR-MT0), Nhắc việc / chi nhánh mặc định / "Nợ tuần trước" (PR-NV).
- Không bao giờ bớt: kiểm quyền ở máy chủ (`PLAN_WEEK`) trước mọi ghi; lý do **bắt buộc** đúng 4 chỗ T7 (huỷ điểm, huỷ lượt, huỷ kết quả do dời vượt, từ chối đề nghị); không mất chữ đang gõ khi máy chủ báo lỗi (giữ hộp mở); 409 giữa chừng → mở lại popup với danh sách mới.
- Hàm mới `shared/domain/*` re-export qua `shared/domain/index.ts`. File kiểm mới `server/src/tests/prMtb.tests.ts`, gọi ở **cuối** `server/src/tests/run.ts` (sau khối PR cuối cùng, trước khối in tổng kết), kit `{ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX }` như `prDh.tests.ts`.
- File mới → `CODE_MAP.md` cùng commit: `shared/domain/oMt.ts`, `web/src/ui/OMt.tsx`, `server/src/tests/prMtb.tests.ts`.
- Lý do: dùng **đúng** hàm MTa (`canLyDo(t)`, `kiemLyDoThaoTac(t, s)`, `LY_DO_BAT_BUOC`); MTa đã bỏ `LY_DO_TOI_THIEU` và `kiemLyDo` — web không tự đếm ký tự.
- Nhánh `pr-mtb-giao-dien-mock-test` từ `origin/main` mới nhất. Mở PR vào `main`, **không merge**. Liệt kê chú thích `ponytail:`.

## Skill và model
| Lúc | Skill / lệnh |
|---|---|
| Đầu phiên | Model **Opus 5.5 · High** (B: Sonnet 5.5 · High). `superpowers:subagent-driven-development`. Gõ `/ponytail lite` |
| Task 0 | Đối chiếu PR-MTa (đọc kế hoạch + mã đã merge); lệch bảng "Phụ thuộc" → sửa Interfaces trong file này trước khi code |
| Mỗi task | `superpowers:test-driven-development` (đỏ trên DB test trước) · lỗi lạ → `superpowers:systematic-debugging` |
| Task 3, 4, 9 | `/impeccable layout` (panel, hộp, lưới) |
| Task 2, 3, 4, 5, 7 | `/impeccable clarify` (chữ đúng mockup, tooltip) |
| Task 5, 6, 7 | `/impeccable harden` (409 giữa chừng, lỗi máy chủ trong hộp, lý do bắt buộc) |
| Task 3, 4 | `/impeccable adapt` (375: bảng cuộn ngang, cột dính, hộp thành tấm đáy) |
| Cuối PR | `npm run check` (một lần một lúc) → bấm thử 375/1440 sáng/tối, vai **Quản trị (1), QL (2), GVCN (7), GVBM (9)** → `/impeccable audit` → `/ponytail-review` → `superpowers:requesting-code-review` → `superpowers:finishing-a-development-branch` |

## Phụ thuộc PR-MTa (tên lấy từ "Interfaces chung" của `2026-10-05-pr-mta-luat-mock-test.md` — Task 0 đối chiếu với mã đã merge)
| # | PR-MTb dùng | Tên ở PR-MTa | Dùng ở Task |
|---|---|---|---|
| A1 | Lượt bị vượt + hệ quả (T2) | `LuotSeHuyLich = { attemptId, nhan, tuan, soDiem, soCase }` · `dongHeQuaVuot(x)` ('MT2: huỷ 4 điểm, đóng 1 Case' · 'MT3: bỏ lịch') · `canLyDoVuot(ds)` (popup chỉ khi true) · `luotBiVuot` không còn `chan` vì có điểm · 409 `canXacNhanHuyLich` | 5, 6 |
| A2 | Lý do huỷ kết quả | `kiemLyDoThaoTac('huy-ket-qua', s)`. **Chưa ghi tên trường body** → đề xuất dùng `reason` sẵn có ở `/ke-hoach-test/dot`, `/attempts/:id/week`, `/attempts/:id/skills/:skill/week` (+ `lyDo` ở `hang-loat`); Task 0 xác nhận | 6 |
| A3 | Vượt ở hàng loạt | **MTa chưa ghi.** Cần `DongHangLoat.seHuyLich?: LuotSeHuyLich[]` (xem trước) + body `xacNhanHuyLich: true` cho `/ke-hoach-test/hang-loat` (hiện "Xếp hàng loạt giữ luật chặn cũ", `server/src/keHoach/keHoachTest.ts:423`). MTa không làm → Task 1 làm (bước 3b) | 1, 3 |
| A4 | T4 tuần đã qua | `kiemTuanXep({ ketThuc, homNay, quanLy })` → `{ cau, quaTuan, mtCu }` (`quaTuan` = web vẽ dòng vàng). Web biết QL qua `viewer.canPlanWeek`, `bang.coTheXep`, trang Kế hoạch Test | 3, 5, 7 |
| A5 | T1 "MT cũ" | `laMtCu(tuan, homNay)`; cờ vẫn tên `lichSu` / `lich_su` (chỉ chữ đổi); MTa đổi chữ "MT lịch sử" → "MT cũ" (nhãn chip "cũ") | 2 |
| A6 | T3 vắng lần 2 | `TrangThaiTT` thêm `'huy-vang'`; `trangThaiTT({…, huyVang})`; `thaoTacKyNang('huy-vang', q)` = `{ chinh: QL 'khoi-phuc' / GVCN 'xin-doi', menu: QL ['khong-mock-lai'] }`; `ThaoTac` thêm `'xin-doi' \| 'khong-mock-lai'`; mỗi kỹ năng có `huyVang` (`SkillScheduleView`, dữ liệu lưới); đường `POST /attempts/:id/skills/:skill/xin-doi`, `/khong-mock-lai` | 2, 5, 8 |
| A6b | T2 khôi phục | `KetQuaHuy` · `HangLichMt.luot.ketQuaHuy`, `attemptDetail(...).ketQuaHuy` · `POST /attempts/:id/khoi-phuc-ket-qua` | 8 |
| A7 | T7 | `LY_DO_BAT_BUOC = ['huy-diem','huy-luot','huy-ket-qua','tu-choi']` · `canLyDo(t)` (**chữ ký mới**, bỏ `tuanDaBatDau`) · `kiemLyDoThaoTac(t, s)` · `CHU_LY_DO`. **Bỏ** `LY_DO_TOI_THIEU`, `kiemLyDo` | 6, 7 |
| A8 | T10 | `docONhapLR(s)` → `{ raw } \| { band } \| { loi } \| null` · `kiemBand(v)` · `PUT /attempts/:id/scores/:skill` nhận `band`; gửi `band` cùng `criteria` có giá trị → 400 | 8 |

**MTa không có → PR-MTb tự làm** (Task 1): `attemptNo: 'moi'` + chọn đúng đợt + `kyNang` tick ở `/ke-hoach-test/hang-loat` (T13b, mục 2 đặc tả), `hanCham` trên `OKyNang`, A3 nếu MTa chưa làm. Task 0 thấy MTa đã làm → bỏ bước tương ứng.

## File chồng với PR khác
| File | PR khác | Ghi chú |
|---|---|---|
| `NganXepLichMt.tsx` (`BranchFilter :224`) | PR-NV (T9 chi nhánh mặc định) | MTb giữ khối Lọc; NV chỉ đổi giá trị mặc định — rebase giữ cả hai |
| `OMt.tsx`, `oMt.ts`, `LuoiKeHoach.tsx`, `HangLichMt.tsx`, `StudentDetailPage.tsx` | PR-MT0 | MT0 thêm `so = 0`, "MT0 · không dùng" — merge sau MTb |
| `MockDetailPage.tsx`, `HopThaoTacMt.tsx`, `KhungPanel.tsx`, `shared/domain/lichMt.ts` | PR-SL (**chưa merge**, `origin/pr-sl-sua-ca-lop`: `chan.daSua`, +15 dòng `lichMt.ts`) | Bắt đầu sau khi SL merge; dùng `daSua` của SL, không viết lại nút trái |
| `HopKyNang.tsx`, `HangLichMt.tsx`, `StudentPlanPanel.tsx`, `ODiemLon.tsx` | PR-LM (đã merge trong main) | Không đổi `TuanNho` popover, `DaiODiemLon` |
| `ScoreEntry.tsx`, `MotKyNang.tsx`, `LuoiFT.tsx`, `shared/domain/diemTheoLuot.ts` | PR-DL (đang làm; `DiemTheoLop.tsx` dùng lại các ô; chữ "MT lịch sử" trong DL → "MT cũ" do MTa) | MTb chỉ sửa trong `ScoreEntry.tsx`; DL thừa hưởng |
| `shared/domain/keHoachTest.ts`, `server/src/keHoach/keHoachTest.ts`, `thaoTacMt.ts`, `skillSchedule.ts`, `chamDiem.ts`, `HopXacNhanHuyLich.tsx`, `ScoreEntry.tsx` (bước web tối thiểu của MTa) | PR-MTa | MTb sửa sau MTa, chỉ thêm / vẽ lại |
| `StudentDetailPage.tsx`, `TransitionPanel.tsx`, `LoTrinhTiepPanel.tsx` | PR-K26 (đã merge #196/#197) | MTb chỉ chạm `NhanDot` / `IeltsAttempts` |
| `run.ts`, `CODE_MAP.md`, `index.ts` | mọi PR | Giữ cả hai, chỉ thêm dòng |

## Đã tự quyết (chủ sản phẩm duyệt khi đọc PR)
1. Panel **giữ khối "Lọc"** (chi nhánh · lớp · tìm) dù mockup không vẽ: cột "Lớp" của mockup có nhiều lớp nên phải chọn được lớp.
2. Panel bỏ: câu dưới "Đợt", hai nhóm "Đã chọn / Chưa chọn", dòng "Xem trước: …" ở chân, ô "Vẫn xếp bài có cảnh báo" (dòng vàng = vẫn lưu, `force: true`), khối "Lý do" (T7) — mockup không có.
3. Hộp một đợt bỏ ô lý do và dòng trạng thái trung tính ("S: W4 SEP → W1 OCT · không trùng đợt khác."); chỉ còn dòng đỏ (chặn) và vàng (cảnh báo / bỏ lịch lượt sau). Lý do tuỳ chọn còn ở hộp thao tác `HopThaoTacMt`.
4. Mục "Đổi tuần" trong ⋯: dòng thường → hiện bộ chọn tuần riêng ngay trên dòng; dòng vắng → "Xếp lại bài vắng" (đường cũ); dòng đã huỷ phần thi → "Khôi phục và đặt tuần" (đường cũ). Cùng chữ "Đổi tuần".
5. T4: QL chọn tuần đã qua → chip vàng **"Tuần đã qua"** cạnh ô tuần (panel, hộp, Dời cả đợt, hộp thao tác); câu đủ ở tooltip. GVCN/GV vẫn khoá từ tuần này.
6. Vượt lượt **chưa có điểm** (T2): không popup, chip vàng **"Bỏ lịch MT2"** (tooltip = `cauSeHuyLich`).
7. "Đang chọn" của ô MT = **màu đảo** (nền màu chữ chính, chữ màu nền, ✓): ở tối đúng mockup "nền sáng, chữ tối"; ở sáng thành nền tối — vẫn khác hẳn "Đang thi". Không dùng `chon-*` teal (lệch `HE_GIAO_DIEN.md` §2 "Đang chọn").
8. Panel ở 375: **một** bảng cuộn ngang, cột chọn + tên dính (bỏ chế độ 3 cột `hep` `NganXepLichMt.tsx:119`).
9. Ô MT trạng thái "chờ duyệt dời" → kiểu "Còn việc" (vàng) chữ "vắng S", tooltip "chờ Quản lý duyệt".
10. "Nhật ký" mở `NganLichSuBai` (đã có, `web/src/modules/cham/NganLichSuBai.tsx`) cho cả FT; điểm W lọc theo `writing1|writing2`.
11. Ô L/R đã lưu band (không có raw) hiện `6.5` / `6.0` (có dấu chấm → đọc lại là band, không lệch).
12. Nhãn "lịch sử" (`ChipLichSu`) → nhãn **"cũ"** mọi nơi (`NhanCu`), kể cả bảng Mock Test hồ sơ HV, `ClassRoster`.
13. Popup dời vượt vẽ lại **trong** `HopXacNhanHuyLich.tsx` (giữ tên file — MTa cũng sửa file này), không thêm file mới.
14. "Xin dời", "Không mock lại" (A6) và "Khôi phục kết quả" (A6b) đặt ở hồ sơ Mock (dòng kỹ năng / menu đầu trang) và ⋯ của hàng Lộ trình — không thêm vào 5 mục cố định của hộp một đợt (mockup phần 2).

## Câu hỏi cho chủ sản phẩm (chưa trả lời thì làm theo khuyến nghị, ghi rõ trong PR)
- **Q1 · Lưới Kế hoạch Test (FT):** mỗi ô đợt hiện nay là 1–2 chip kỹ năng (`L R W · W1 OCT` / `S · W2 OCT`, `ChipKyNang.tsx`). (A) đổi thành **một Ô MT** gọn như mockup phần 3 (chi tiết từng kỹ năng ở tooltip và ở hộp khi bấm) · (B) giữ chip kỹ năng, chỉ đổi màu/chữ theo bảng Ô MT. **Khuyến nghị A** — "một component, mọi nơi"; bấm vẫn mở hộp. Lớp thường giữ chip (không phải MT).
- **Q2 · Panel nhiều em, có em dời vượt MT đã có điểm:** (A) bấm "Xếp lịch …" → **một** popup phần 4 gộp: tiêu đề "Xếp lịch {n} em?", mỗi em một dòng "Tú · MT2: huỷ 4 điểm, đóng 1 Case", một ô Lý do, nút "Dời và huỷ" · (B) em đó thành dòng đỏ "không xếp được" (tooltip: dời ở hộp MT của em), không popup ở panel. **Khuyến nghị A** (đặc tả T14: mọi cổng cùng luật).
- **Q3 · Bỏ tick một kỹ năng ở panel:** (A) đợt **mới tạo**: kỹ năng bỏ tick = bỏ khỏi đợt (như "Bỏ kỹ năng"); đợt **đã có**: chỉ không xếp kỹ năng đó, lịch/điểm giữ nguyên · (B) cả đợt đã có cũng bỏ kỹ năng khỏi đợt. **Khuyến nghị A** (không đổi dữ liệu ngầm).

## Mâu thuẫn mockup / đặc tả ↔ mã (ghi để planning biết)
- Mockup panel không có khối Lọc; mã có (`NganXepLichMt.tsx:222-252`) → tự quyết 1.
- Mockup hộp không có ô lý do; mã bắt lý do ≥ 5 ký tự khi bỏ kỹ năng / dời tuần đã bắt đầu / sửa MT cũ (`HopKyNang.tsx:141-147,246-257`) → T7 + tự quyết 3.
- Mockup "Đang chọn" nền sáng chữ tối ↔ `HE_GIAO_DIEN.md` §2 token `chon-*` (nền teal tối) → tự quyết 7.
- Đặc tả "Chọn số = đúng đợt đó" ↔ `viecXepMt` tự sang đợt kế (`shared/domain/keHoachTest.ts:240-257`, `continue` ở `:244,:251`) → Task 1.
- Đặc tả "MT mới" + tick kỹ năng ↔ `xetMotEmFT` bắt đủ 4 tuần khi tạo (`server/src/keHoach/keHoachTest.ts` "cần chọn tuần cho cả 4 kỹ năng") → Task 1.
- `MenuDong` không vẽ nút khi không có mục (`web/src/ui/MenuDong.tsx:79`) ↔ "⋯ luôn hiện, mục chưa làm được thì mờ" → Task 5.
- Mockup phần 2: menu ⋯ của Speaking **chưa tới tuần thi** có "Dời hạn chấm" sáng ↔ `thaoTacKyNang('chua-toi-tuan')` (`shared/domain/thaoTacMt.ts:43`) không cho `doi-han`. Kế hoạch giữ luật máy chủ (mục mờ, tooltip "Chưa tới tuần thi") và ghi vào PR; muốn sáng thì MTa/MTb thêm `doi-han` cho QL ở `chua-toi-tuan` — chủ sản phẩm quyết khi duyệt PR.
- Mockup ghi tiêu đề "Bản 2" trong `<header>` nhưng là bản 4 (commit 036122fa) — không ảnh hưởng chữ trên web.

## Review Focus
1. **409 giữa chừng**: dữ liệu đổi giữa lúc kiểm và lúc lưu (người khác vừa nhập điểm MT2) → máy chủ trả 409 có `seHuyLich` mới → popup mở lại với số điểm mới, chữ Lý do đã gõ còn nguyên. Phép kiểm ở Task 6.
2. **Tick bỏ hết 4 kỹ năng** ở panel → nút chính mờ, không gửi (máy chủ trả 400 "Chưa chọn kỹ năng nào"). Phép kiểm ở Task 1 (máy chủ) + Task 3 (quét nguồn: `disabled` theo `kyChon.length`).
3. **Ô L/R gõ "6" / "6.0" / "b6" / "b6.3" / "10.5"**: "6" = raw; "6.0", "b6" = band 6; "b6.3", "10.5" = không hợp lệ, không gửi, tooltip lỗi. Phép kiểm ở Task 8.
4. **GVCN mở hộp/hồ sơ** khi chọn tuần đã qua: vẫn bị khoá (`toiThieu`), không thấy chip "Tuần đã qua"; GVBM không thấy "Xin dời". Phép kiểm ở Task 7, 8.
5. **"MT mới" với em đã đủ MT_TOI_DA** hoặc chưa có lộ trình → dòng đỏ, tự bỏ tick, không chặn em khác. Phép kiểm ở Task 1.

---

### Task 0: Đối chiếu PR-MTa (không code)
- [x] Đọc `docs/superpowers/plans/2026-10-05-pr-mta-luat-mock-test.md` (mục Interfaces) và mã MTa đã merge (#212, main `db820c02`). Với từng dòng A1–A8: tên thật là gì, đã có chưa.
- [x] Lệch tên → sửa tên trong mục Interfaces của các Task dưới (một commit `docs(mtb): khớp tên PR-MTa`). Thiếu hẳn một dòng A → dừng, báo planning (không tự làm luật máy chủ của MTa).

**Kết quả Task 0 (06/10, main `db820c02` — DL #206, SL #203, K26, MTa #212 đã merge). ĐÈ lên mọi chỗ khác trong file nếu mâu thuẫn:**

*A1–A8 đủ cả, tên khớp* (`laMtCu`, `kiemTuanXep`, `luotBiVuot`, `LuotSeHuyLich`, `dongHeQuaVuot`, `canLyDoVuot`, `KetQuaHuy`, `cauSeHuyLich` ở `shared/domain/lichMt.ts`; `docONhapLR`, `kiemBand` ở `chamDiem.ts`; `kiemLyDoThaoTac`, `canLyDo`, `CHU_LY_DO` ở `thaoTacMt.ts`; đường `xin-doi`, `khong-mock-lai`, `khoi-phuc-ket-qua`; `huyVang` trên `OKyNang`; `HangLichMt.luot.ketQuaHuy`). Lệch:
1. **A7 lệch luật:** `LY_DO_BAT_BUOC = ['huy-luot','huy-ket-qua','tu-choi']` — **3 chỗ, không còn `huy-diem`** (T22 + rà #212: huỷ điểm / xoá trắng ô không bắt lý do). Mọi chỗ file này ghi "đúng 4 chỗ T7" / "huỷ điểm bắt buộc" → **3 chỗ**. Task 7 phép đỏ "QL huỷ điểm không lý do → 400" đổi thành **200**. `HopThaoTacMt` `batBuoc = canLyDo(t)` chỉ còn đúng khi `huy-luot` (ở hồ sơ Mock `CancelDialog`) — `huy-diem` tuỳ chọn.
2. **A2 xác nhận:** trường lý do = `reason` ở `/ke-hoach-test/dot`, `/attempts/:id/week`, `/attempts/:id/skills/:skill/week`; `lyDo` ở `/ke-hoach-test/hang-loat`. Cờ `xacNhanHuyLich: true` ở cả bốn.
3. **A3 MTa ĐÃ LÀM** (`DongHangLoat.seHuyLich`, `xacNhanHuyLich` + `lyDo` ở route `hang-loat`, `keHoachTest.ts:963-975`) → **bỏ Task 1 bước 3b**. Web panel `NganXepLichMt.tsx` chưa nối (không có `seHuyLich`) → Task 3 / 6.
4. **T13b chưa có** (đúng như kế hoạch): `attemptNo: 'moi'`, `kyNang` tick, `viecXepMt` còn `continue` tự sang đợt kế (`shared/domain/keHoachTest.ts:248,255`), `OKyNang.hanCham` → Task 1 giữ nguyên.
5. **Web MTa đã làm — KHÔNG làm trùng:** `InlineScoreEditor` + `SuaDiemCoLyDo` (lý do tuỳ chọn, xoá trắng = huỷ điểm, T22) · `HopKyNang` (QL chọn tuần đã qua, dòng đã điểm / đã thi dời được — T20, ô lý do **tuỳ chọn** `Lý do dời`) · ô khoá khi chưa tới tuần thi (T19, `cell.chuaToiTuan`) · "-" MT cũ = Không dự thi (T23, `cell.noShow`, cột `no_show_cu`) · `HopXacNhanHuyLich` đã có Lý do bắt buộc + "Dời và huỷ" (props cũ `ds / onQuayLai / onXacNhan`, tiêu đề "Dời và huỷ kết quả?") — Task 6 chỉ **vẽ lại theo mockup** (đổi props như Interfaces) · `HopThaoTacMt` / `WeekModal` / `DeadlineModal` đã gọi `kiemLyDoThaoTac` · chữ "cũ" đã hiện (`ChipLichSu` trả "cũ") — Task 2 chỉ **đổi tên** thành `NhanCu` (MT0 dùng tên đó).
6. **Phạm vi thêm (plan.md 2c T20, chủ sản phẩm 06/10 khi giao việc):**
   (a) Nút **"Dời lịch"** cho kỹ năng **đã có điểm** ở hồ sơ Mock: máy chủ đã cho QL / Quản trị (`setSkillWeek` `quanLy`), nhưng `thaoTacKyNang('co-diem')` (`shared/domain/thaoTacMt.ts:50`) chỉ trả `huy-diem` → thêm `'doi-lich'` cho `quanLy` (QL / Quản trị) vào menu `co-diem`; `MockDetailPage.tsx:445` (`ownsSchedule`) giữ. Hệ quả cho `menuHopKyNang` (Task 5): `co-diem` → **`doi-tuan` sáng** cho QL (không còn mờ "Đã có điểm"); phép đỏ Task 5 (b) sửa theo.
   (b) **Dòng đỏ hộp kỹ năng** `cauSeHuyLich` ("Lưu sẽ huỷ lịch … về Chưa xếp lịch.") **không hiện khi MT bị vượt có điểm** (`canLyDoVuot`) — popup nói hệ quả; chỉ hiện chip vàng `Bỏ lịch MT3` khi vượt không điểm (tự quyết 6). Áp ở `HopKyNang.tsx` và `WeekModal` (`MockDetailPage.tsx:674`).
   (c) **Gộp hai ô lý do (hộp + popup) thành một:** hộp một đợt bỏ ô lý do (tự quyết 3); ở `WeekModal` / `HopThaoTacMt` (còn ô lý do tuỳ chọn) — khi `canPopup` thì **ẩn** ô lý do của hộp, popup mang ô Lý do duy nhất; chữ đã gõ ở hộp đi theo vào popup qua prop `lyDoDau?: string`.
7. Rulebook / thiet-ke: ghi "Đang chọn" của ô MT (mockup đã duyệt: nền sáng chữ tối ✓) vào `thiet-ke/HE_GIAO_DIEN.md` §2 (Task 2 / 10).

### Task 1: Máy chủ + luật panel — "MT mới", đúng đợt, tick kỹ năng, hạn chấm
Skill: test-driven-development

**Files:**
- Modify: `shared/domain/keHoachTest.ts:230-257` (`KnXep`, `viecXepMt`), `:110-115` (`OKyNang`), thêm `nhanSeXep`, `demSeXep` cạnh `chuSeXep :265`
- Modify: `server/src/keHoach/keHoachTest.ts:206-224` (`oKyNangCua`), `:891-958` (`xetMotEmFT`), `:961-1060` (`xepHangLoat`)
- Modify: `server/src/routes/index.ts:485-498` (route `hang-loat`)
- Create: `server/src/tests/prMtb.tests.ts`; Modify: cuối `server/src/tests/run.ts`

**Interfaces:**
- Produces:
```ts
// shared/domain/keHoachTest.ts
export type KnXep = { skill: KyNangKH; batBuoc: boolean; coDiem: boolean; daThi: boolean; huyPhan: boolean; choDuyet: boolean; coTuan: boolean };
/** Không tự sang đợt khác (T13b). Đợt đủ → ep ? 'da-du' : chan `MT{n} đã xong.`; MT cũ → chan `MT{n} là MT cũ — nhập điểm bù.` */
export function viecXepMt(ds: LuotXep[], chon: number, so: LuotSo[], ep?: boolean): ViecXep;
/** "MT mới": đợt nhỏ nhất chưa huỷ mà mọi kỹ năng bắt buộc chưa có tuần; không có → số kế tiếp (`kiemSoMtMoi`). */
export function dotMtMoi(ds: LuotXep[], so: LuotSo[]): number;
export type OKyNang = { /* như cũ */ hanCham: string | null };   // null: không yêu cầu, MT cũ, đã huỷ
export type ToneSeXep = 'ok' | 'soon' | 'bad';
/** Chữ MỘT dòng cột "Sẽ xếp" (mockup phần 1) + tone + tooltip (= chuSeXep cũ + câu cảnh báo). */
export function nhanSeXep(d: DongHangLoat, ct: string | null): { tone: ToneSeXep; chu: string; phu: string | null; title: string };
export function demSeXep(dong: DongHangLoat[]): Record<ToneSeXep, number>;
```
  Route `hang-loat` nhận thêm `attemptNo: 'moi'` và `kyNang: KyNangKH[]` (tick; thiếu = cả 4). `xepHangLoat` FT: `attemptNo === 'moi'` → mỗi em `dotMtMoi`; kỹ năng không tick: không xếp; đợt **tạo mới** thì gửi `bo` cho `xepMoi` (đã có `bo` ở `:640`) — theo Q3 phương án A.
- Consumes: A1 (`luotBiVuot`, `kiemVuot`), A4 (`kiemTuanXep` thay `kiemTuanDaQua` trong `xetMotEmFT`).
- Produces (A3, nếu MTa chưa làm): `DongHangLoat.seHuyLich?: LuotSeHuyLich[]` (xem trước) · body `xacNhanHuyLich: boolean` + `lyDo` · lưu: em có lượt bị vượt có điểm mà chưa xác nhận → dòng `loi` "Cần xác nhận huỷ kết quả." (em khác vẫn lưu, R9b).

- [x] **Step 1: Phép đỏ (luật thuần)** trong `prMtb.tests.ts` (`runPrMtbTests(t)`, mẫu `prLm.tests.ts:1-15`):
```ts
check('MTb (1) · viecXepMt không tự sang đợt khác', () => {
  const kn = (o = {}) => ['listening','reading','writing','speaking'].map((skill) => ({ skill, batBuoc: true, coDiem: true, daThi: true, huyPhan: false, choDuyet: false, coTuan: true, ...o }));
  const ds = [{ no: 1, huy: false, lichSu: false, kn: kn() }, { no: 2, huy: false, lichSu: false, kn: kn({ coDiem: false, daThi: false }) }];
  assert(d.viecXepMt(ds, 1, so).loai === 'chan' && /MT1 đã xong/.test((d.viecXepMt(ds, 1, so) as any).cau));
  assert(d.viecXepMt(ds, 1, so, true).loai === 'da-du');
  assert(d.viecXepMt(ds, 2, so).loai === 'doi');
});
check('MTb (1) · dotMtMoi: đợt nhỏ nhất chưa có lịch, không có thì số kế', () => {
  // MT1 xong, MT2 có lịch, MT3 chưa có tuần → 3; không có MT3 → 3 (tạo); MT1 chưa có tuần → 1
});
check('MTb (1) · nhanSeXep một dòng 3 màu + demSeXep', () => {
  // tao MT3 W1 OCT → { tone:'ok', chu:'MT3 · W1 OCT' }; xep-not S → { tone:'soon', chu:'MT2 · S · W1 OCT' };
  // canh-bao trùng MT2 → { tone:'soon', chu:'MT3 · W1 OCT', phu:'· trùng MT2' }; loi → { tone:'bad', chu:'Không xếp được' }, title = câu lỗi;
  // dòng có seHuyLich → tone 'soon'; demSeXep đếm đúng 3 nhóm
});
```
  Ghi đủ assert theo chú thích (giá trị lấy đúng mockup phần 1).
- [x] **Step 2: Phép đỏ (DB)**: lớp FT seed (helper như `keHoachTest.tests.ts:429-470`), `P.mbManager`:
  - `xepHangLoat(..., { attemptNo: 'moi', tuan, xemTruoc: true })`: em có MT1 xong + MT2 chưa có tuần → `attemptNo 2`; em MT1 xong, không MT2 → `attemptNo 2, hanhDong 'tao'`.
  - `attemptNo: 1` cho em MT1 đã xong → `hanhDong 'loi'`, câu "MT1 đã xong.", em khác không bị ảnh hưởng.
  - `kyNang: ['listening','reading','writing']` + tạo mới → lưu xong `attempt_skills.required = 0` cho speaking; đợt có sẵn → speaking không đổi.
  - `kyNang: []` → 400 "Chưa chọn kỹ năng nào." · `attemptNo: 'x'` → 400.
  - `luoiFT` trả `hanCham` = thứ Tư tuần kế của tuần thi (T6), `null` khi `lichSu`.
- [x] **Step 3: Sửa** — `viecXepMt`: bỏ `continue` ở `:244,:251` theo Interfaces; `xetMotEmFT` truyền `coTuan`; route: `attemptNo` = `'moi'` hoặc `toInt` (khác → 400), `kyNang` lọc qua `KY_NANG_KE_HOACH`; `oKyNangCua` thêm tham số `attemptOverride` và gọi `effectiveSkillDeadline` (`server/src/fasttrack/skillSchedule.ts:288-293`) — `lichSu`/không bắt buộc/huỷ → `null`. Nhãn audit `entityLabel`: `'MT mới'` khi `'moi'`.
- [x] **Step 3b (A3 — BỎ: MTa đã làm, Task 0):** `xetMotEmFT` nhánh `doi`/`xep-not` gọi `kiemDotNoi` với `choHuyLich: true` (bỏ "Xếp hàng loạt giữ luật chặn cũ" `server/src/keHoach/keHoachTest.ts:423`), đưa `seHuyLich` lên dòng; `xepHangLoat` lưu truyền `xacNhanHuyLich` + `reason: lyDo` xuống `luuDot`. Phép đỏ: hai em, em A vượt MT2 có điểm → xem trước có `seHuyLich[0].soDiem > 0`; lưu không xác nhận → A `loi`, B lưu; lưu có xác nhận + lý do → cả hai lưu, điểm MT2 của A vào `ket_qua_huy` (luật MTa).
- [x] **Step 4:** `npm run check` → xanh; mọi phép cũ `keHoachTest.tests.ts` (PR-Rc2, PR-XLMT) xanh. Phép cũ nào dựa vào "tự sang đợt kế" → sửa phép đó theo T13b, ghi tên vào mô tả PR.
- [x] **Step 5: Commit** `feat(mtb): panel MT mới, đúng đợt, tick kỹ năng; hạn chấm trên ô kỹ năng`.

### Task 2: Luật + component Ô MT, nhãn "cũ"
Skill: test-driven-development

**Files:**
- Create: `shared/domain/oMt.ts` (+ `index.ts`), `web/src/ui/OMt.tsx`
- Modify: `web/src/ui/Nhan.tsx:40-51` (`ChipLichSu` → `NhanCu`), mọi nơi gọi: `StudentDetailPage.tsx:30,432`, `ClassRoster.tsx:2,139,233`, `MockDetailPage.tsx:8,225`, `ChipKyNang.tsx:4,69,90`, `NganXepLichMt.tsx:10,383`
- Modify: `web/src/modules/students/HangLichMt.tsx:76-79` (cột Lượt: `OMt` thay chữ `MT{n}`), `MockDetailPage.tsx:225` (đầu trang `· MT2` → `OMt` không bấm)
- Test: `prMtb.tests.ts`

**Interfaces:**
```ts
// shared/domain/oMt.ts
export type KieuOMt = 'chua-co-dot' | 'chua-lich' | 'co-lich' | 'dang-thi' | 'cho-cham' | 'tre-cham' | 'con-viec' | 'xong';
export type OMtVao = { so: number; attemptId: number | null; kn: Partial<Record<KyNangKH, OKyNang>>; cu: boolean };
export function oMt(v: OMtVao, homNay: string, ct?: string | null): { kieu: KieuOMt; chu: string; cu: boolean; title: string };
```
Thứ tự (không đảo): không có lượt → `chua-co-dot` (chu `''`) · mọi kỹ năng bắt buộc `xong` → `xong` (`✓`; có kỹ năng `khong-yeu-cau` → `✓ {xong}/4`) · có kỹ năng tuần đã hết, chưa điểm, `homNay > hanCham` → `tre-cham` (`trễ chấm W`) · có `vang`/`cho-duyet` → `con-viec` (`vắng S`) · có `da-huy` (gồm vắng 2 lần `huyVang`, A6) → `con-viec` (`S huỷ`) · có tuần đã hết, chưa điểm (trong hạn, hoặc `hanCham` null) → `cho-cham` (`chờ chấm {n}`) · có kỹ năng chưa xong ở tuần này → `dang-thi` (`tuần này`) · có tuần → `co-lich` (`tuanLich` tuần sớm nhất của kỹ năng chưa xong) · còn lại `chua-lich` (`chưa xếp`). Tên kỹ năng qua `tenMonNgan(ct, k)`, nhiều kỹ năng nối bằng dấu cách. `title`: mỗi kỹ năng một dòng `Listening: W3 SEP · xong` (+ `· cũ` / "chờ Quản lý duyệt").
```tsx
// web/src/ui/OMt.tsx
export function OMt(p: { v: OMtVao; homNay: string; ct?: string | null; chon?: boolean; chuChon?: string;
  onClick?: (el: HTMLElement) => void; href?: string; id?: string }): JSX.Element;
export function NhanCu(): JSX.Element;   // "cũ", viền currentColor, 10px đậm (mockup `.old`)
```
Màu theo mockup phần 3, chỉ token: `chua-co-dot` viền đứt `border-muted-line text-muted` · `chua-lich` `bg-muted-bg text-muted` · `co-lich` viền `border-doing-line text-doing` · `dang-thi` `bg-doing-bg text-doing` + chấm 7px trước số · `cho-cham` `bg-wait-bg text-wait` · `tre-cham` `bg-bad-bg text-bad` · `con-viec` `bg-soon-bg text-soon` · `xong` `bg-done-bg text-done` · `chon` = màu đảo (nền `var(--text)`, chữ `var(--bg)`, viền 2px cùng nền, `✓` sau chữ; tự quyết 7). Số đợt đậm, chữ số Inter (`tabular-nums`), cao 26px, `whitespace-nowrap`; điện thoại vùng bấm 44px bằng `after:` như `ChipKyNang`. `href` → `<Link>`; `onClick` → `<button>`; còn lại `<span>`.

- [x] **Step 1: Phép đỏ** `oMt`: một ca cho **mỗi** dòng mockup phần 3 (13 dòng trừ "Đang chọn" và MT0) với `homNay = '2026-10-05'`: kiểm `kieu` + `chu` (`'chưa xếp'`, `'W2 OCT'`, `'tuần này'`, `'chờ chấm 2'`, `'trễ chấm W'`, `'vắng S'`, `'✓'`, `'✓ 3/4'`, `'S huỷ'`, `cu: true`). Thêm: trễ đứng trước vắng; `hanCham` null + tuần đã hết → `cho-cham` không bao giờ `tre-cham`.
- [x] **Step 2: Phép đỏ quét nguồn**: không file `web/src` nào còn `ChipLichSu` hay chữ `>lịch sử<`; `OMt.tsx` không có `#` hex; `HangLichMt.tsx`, `MockDetailPage.tsx` import `OMt`.
- [x] **Step 3:** Viết `oMt.ts`, `OMt.tsx`, `NhanCu`; thay các nơi gọi. Cột Lượt `HangLichMt` dựng `OMtVao` từ `h.luot` (`kn` đã là `OKyNang`), `cu = l.lichSu`, `attemptId = l?.attemptId ?? null`; `h.luot` null → `chua-co-dot`.
- [x] **Step 4:** `npm run check` xanh (gồm `prSang`). `/impeccable clarify` cho tooltip.
- [x] **Step 5: Commit** `feat(mtb): Ô MT dùng chung, nhãn "cũ"`.

### Task 3: Panel "Xếp lịch Mock Test" theo mockup phần 1
Skill: test-driven-development · `/impeccable layout` · `clarify` · `adapt`

**Files:** Modify `web/src/modules/test/keHoach/NganXepLichMt.tsx` (cả file; `HangEm :343-394`, `DauMt :35-40` xoá). Test: `prMtb.tests.ts` (quét nguồn).

**Interfaces:**
- Consumes: Task 1 (`attemptNo: 'moi'`, `kyNang`, `nhanSeXep`, `demSeXep`), Task 2 (`OMt`), Task 6 (`HopXacNhanHuyLich` mới + `chuDoiVuot`; nhiều em nếu Q2 = A).

Bố cục (từ trên xuống, chữ đúng mockup):
1. Đầu: `KhungPanel tieuDe="Xếp lịch Mock Test"` + `KhungXepLich` (giữ). Khối "Lọc" giữ (tự quyết 1).
2. `Khoi tieuDe` có số tròn **1 "Đợt"**: `NutChon` "MT mới" (đầu, mặc định) rồi `MT1…MT{soCot}`. `dot: 'moi' | number` (state, mặc định `'moi'`); bỏ `dotMacDinh :86-95`.
3. **2 "Tuần và kỹ năng"**: một hàng `TuanNho` (tuần chung, mặc định `tuanMacDinhDotMoi`) · 4 ô tick `✓ L` `✓ R` `✓ W` `✓ S` (`<label>` + checkbox, mặc định tick đủ; bỏ tick → gạch ngang, `aria-pressed`) · nút ghost "Lịch riêng ▸" (bấm mở các hàng tuần riêng `:269-281`, chỉ cho kỹ năng đang tick; nút đổi thành "Lịch riêng ▾"). `tuanGui` chỉ gồm kỹ năng tick; gửi `kyNang`.
4. **3 "Học viên"**: hàng 3 chip đếm `✓ Sẽ xếp {ok}` · `! Cần xem {soon}` · `✕ Không xếp được {bad}` (`demSeXep`; bấm chip = lọc chỉ nhóm đó, bấm lại bỏ lọc; `aria-pressed`). Bảng `min-width: 960px` trong `overflow-x-auto`, cột 1 (checkbox "Tất cả" ở đầu cột, `aria-label="Chọn tất cả"`, trạng thái nửa = `indeterminate`) và cột 2 "Học viên" `sticky` (`left: 0` / `left: 70px`, nền `--surface`). Cột: "Lớp" · "Mock Test" (mọi đợt của em bằng `OMt`, đợt sẽ xếp `chon` + `chuChon = tuần sẽ xếp` khi `hanhDong` tạo/dời; bấm ô = đợt riêng cho em → `dotTheoEm`, như `onDot :308`) · "Sẽ xếp" (`nhanSeXep`: dấu `✓ ! ✕` màu tone + chữ + `phu` mờ; `title` = tooltip). Một danh sách (bỏ hai nhóm `:301-313`), thứ tự lớp rồi tên. Dưới bảng chữ nhỏ "⇆ cuộn ngang".
5. Tick: mặc định tick mọi dòng `ok`/`soon`; dòng `bad` **tự bỏ tick và không tick được** (checkbox `disabled`, tooltip câu lỗi); "Tất cả" chỉ tick/bỏ các dòng không `bad`. Giữ R9b (`giuLoi`).
6. Chân: "Đóng" trái; "Xếp lịch {soEm} em · {soBai} bài" phải (`tomTatXepMt` của dòng đã tick); `disabled` khi `busy || !soEm || !kyChon.length`. Lưu luôn `force: true`. Có dòng tick mang `seHuyLich` mà `canLyDoVuot` → mở `HopXacNhanHuyLich` (Task 6) trước khi gửi (Q2 = A: một hộp, tiêu đề "Xếp lịch {n} em?", mỗi em một dòng `{tên} · {dongHeQuaVuot}`); vượt không điểm → chữ phụ vàng "· bỏ lịch MT2" ở cột Sẽ xếp.
7. Bỏ: `:258` câu dưới Đợt, `:205` + `phu`/`dongTren` xem trước, `:319-327` khối Lý do, `:329-334` ô force, `hep :119` (tự quyết 2, 8). `HopThiLai :397-432` giữ, chỉ khi em có `dotTheoEm` và `viec === 'da-du'`.
8. T4 (A4): `TuanNho` không `toiThieu` (trang của QL); tuần chung < tuần này → chip `Nhan tone="soon"` "Tuần đã qua" cạnh ô tuần, `title` "MT chưa thi xếp về tuần đã qua — tuần cách ≥ 2 tuần thì là MT cũ.".

- [x] **Step 1: Phép đỏ quét nguồn** `NganXepLichMt.tsx`: có `'MT mới'`, `'Lịch riêng ▸'`, `'Tuần và kỹ năng'`, `'Sẽ xếp '`, `'Cần xem '`, `'Không xếp được '`, `'⇆ cuộn ngang'`, `'Chọn tất cả'`, `kyNang`, `attemptNo: dot`, `<OMt`; **không** có `'Xem trước: '`, `'luôn ở trên'`, `'Vẫn xếp bài có cảnh báo'`, `LY_DO_TOI_THIEU`, `DauMt`, `innerWidth < 640`.
- [x] **Step 2:** Viết lại theo bố cục. Chú thích khối đầu file cập nhật (mockup phần 1, T13b).
- [x] **Step 3:** `npm run check` xanh. Bấm thử QL (2): 1440 + 375, sáng + tối — chọn 2 lớp, đổi "MT mới" → "MT2", bỏ tick S, lọc chip "Cần xem", cuộn ngang thấy cột tên đứng yên, lưu → R9b còn em lỗi. Chụp ảnh.
- [x] **Step 4: Commit** `feat(mtb): panel Xếp lịch Mock Test theo mockup bản 4`.

### Task 4: `MenuDong` có mục mờ
Skill: test-driven-development

**Files:** Modify `web/src/ui/MenuDong.tsx:5-11,79,97-105`. Test: `prMtb.tests.ts` (quét nguồn) + `shared/domain` không đổi.

**Interfaces:**
```ts
export type MucMenu = { key: string; nhan: string; onChon: () => void; keTruoc?: boolean; nguyHiem?: boolean;
  /** Mục chưa làm được: vẫn hiện, mờ, không bấm được; `title` nói vì sao (mockup phần 2 "mục chưa làm được thì mờ"). */
  tat?: boolean; title?: string };
export function MenuDong(p: { muc: MucMenu[]; nhan?: string; bieuTuong?: string; luonHien?: boolean }): JSX.Element | null;
```
`luonHien` → vẽ nút kể cả khi mọi mục `tat`. Mục `tat`: `aria-disabled="true"`, chữ `text-slate-500`, `onClick` không gọi `onChon`, vẫn nhận focus phím ↑/↓ (đọc được tooltip), Enter không làm gì.

- [x] **Step 1: Phép đỏ quét nguồn**: `MenuDong.tsx` có `aria-disabled`, `luonHien`; dòng `if (!muc.length) return null` đổi thành điều kiện có `luonHien`.
- [x] **Step 2:** Sửa. Nơi gọi cũ không truyền `tat`/`luonHien` → hành vi cũ.
- [x] **Step 3:** `npm run check`. **Commit** `feat(mtb): MenuDong mục mờ, nút luôn hiện`.

### Task 5: Hộp một đợt `HopKyNang` theo mockup phần 2 (Kế hoạch Test + hồ sơ HV › Lộ trình)
Skill: test-driven-development · `/impeccable layout` · `clarify` · `harden`

**Files:** Modify `web/src/modules/test/keHoach/HopKyNang.tsx` (`:48-197` trạng thái + lưu, `:228-285` khung, `DongKyNangHop :287-326`). Không đổi chữ ký props (Lộ trình `HangLichMt.tsx:121-125`, `StudentPlanPanel.tsx:183-187`, `LuoiKeHoach.tsx:266-271` gọi như cũ). Test: `prMtb.tests.ts`.

**Interfaces:**
- Consumes: Task 4 (`MucMenu.tat`, `luonHien`), Task 6 (`HopXacNhanHuyLich`, `chuDoiVuot`), Task 2 (`OKyNang.hanCham` qua `oMt` cho chip trạng thái dòng), A6/A7.
- Produces (luật thuần, `shared/domain/thaoTacMt.ts`):
```ts
export type MucHop = 'doi-tuan' | 'doi-han' | 'bao-vang' | 'huy-diem' | 'nhat-ky';
export const CHU_MUC_HOP: Record<MucHop, string>;   // 'Đổi tuần' · 'Dời hạn chấm' · 'Báo vắng' · 'Huỷ điểm' · 'Nhật ký'
/** Năm mục CỐ ĐỊNH, thứ tự cố định; `duoc` từ `thaoTacKyNang` (một nguồn). `thay` = thao tác thật khi bấm "Đổi tuần" ở dòng vắng / đã huỷ. */
export function menuHopKyNang(tt: TrangThaiTT, q: QuyenTT, moi: boolean):
  Array<{ muc: MucHop; duoc: boolean; thay?: 'xep-lai' | 'khoi-phuc'; viSao: string | null }>;
```
`duoc`: `doi-tuan` khi chưa có điểm và (`chua-xep`/`chua-toi-tuan`/`dang-thi`/`vang`(→`xep-lai`)/`da-huy` hoặc `huy-vang`(→`khoi-phuc`, chỉ QL)); "Xin dời", "Không mock lại" không vào 5 mục (ở hồ sơ Mock, Task 8); `doi-han` khi menu có `'doi-han'`; `bao-vang` khi có `'bao-vang'`; `huy-diem` khi có `'huy-diem'`; `nhat-ky` khi `!moi`. `viSao` (tooltip mục mờ) ≤ 6 từ: "Chưa tới tuần thi" · "Chưa có điểm" · "Đã có điểm" · "Đợt chưa tạo".

Bố cục (chữ đúng mockup):
- Đầu: `{tên em} · MT{n}` + nút ✕ (giữ `:232-235`).
- Hàng "Tuần chung" + `TuanNho`: giá trị đầu = `tuanDaSo` (`shared/domain/keHoachTest.ts:45`) của các kỹ năng **đã tick, chưa có điểm, không khoá** (đợt mới: `tuanMacDinhDotMoi`). Đổi tuần chung → đặt cho mọi dòng đó trừ dòng đã "Đổi tuần" riêng. Lớp thường: cùng hàng (không có ô tick).
- Mỗi dòng: `ô tick` (FT; dòng có điểm: tick sẵn, `disabled`) · `L Listening` (W giữ ⓘ "W = chấm cả W1 và W2") · trạng thái: có điểm → `W3 SEP · 6.5` (band đậm; lớp thường: `x/y`); chưa điểm → chip tuần (`co-lich`) + chip trạng thái nếu có (`trễ chấm`, `chờ chấm`, `vắng`, `huỷ`) lấy từ `oMt` một kỹ năng; dòng đang đổi tuần riêng → `TuanNho` ngay trên dòng · `⋯` **luôn hiện** (`MenuDong luonHien` với 5 mục `menuHopKyNang`, mục không `duoc` → `tat` + `title`).
- Chân: trái "Đóng" / "Huỷ thay đổi" (đã sửa), phải "Lưu" (cảnh báo → "Vẫn xếp vào tuần này" giữ `:227`).
- Dòng dưới các hàng: chỉ **đỏ** "Chặn: …" và **vàng** (cảnh báo; "Bỏ lịch MT2" khi vượt lượt chưa có điểm — tự quyết 6; "Tuần đã qua" T4). Bỏ ô lý do `:246-257` và câu trung tính `:133-138` (tự quyết 3). `lyDoBo`/`reason` gửi `null`.
- "Nhật ký" → `NganLichSuBai` (`attemptId`, `skill`, `ct`, `tenHv`); trong `NganLichSuBai.tsx:14-22` lọc điểm `skill === 'writing' ? s.skill.startsWith('writing') : s.skill === skill` (tự quyết 10).
- Lưu: `chuDoiVuot(...).canPopup` → mở `HopXacNhanHuyLich` (Task 6); chỉ lượt chưa có điểm → lưu thẳng `xacNhanHuyLich: true`. 409 có `seHuyLich` → mở lại với danh sách mới (giữ `:191-193`).
- T4: `toiThieu` của `TuanNho` = `null` (hộp chỉ QL dùng: Kế hoạch Test và Lộ trình `bang.coTheXep`); tuần đã chọn < tuần này và kỹ năng chưa thi → vàng "Tuần đã qua".

- [x] **Step 1: Phép đỏ (luật thuần)** `menuHopKyNang`: (a) `chua-toi-tuan`, QL → `doi-tuan` + `doi-han`? (đúng theo `thaoTacKyNang :43`: `chua-toi-tuan` không có `doi-han`) → kiểm mảng `duoc` = `[true,false,false,false,true]` khớp mockup "Menu ⋯ của Speaking (chưa tới tuần thi)" (Báo vắng, Huỷ điểm mờ; **Dời hạn chấm sáng** trong mockup → nếu `thaoTacKyNang` không cho, ghi vào PR là lệch mockup, giữ luật máy chủ); (b) `co-diem` → `huy-diem` sáng, `doi-tuan` mờ "Đã có điểm"; (c) `vang` → `doi-tuan` `thay: 'xep-lai'`; (d) `moi` → chỉ `doi-tuan` sáng; luôn 5 phần tử đúng thứ tự.
- [x] **Step 2: Phép đỏ quét nguồn** `HopKyNang.tsx`: có `'Tuần chung'`, `luonHien`, `menuHopKyNang`, `NganLichSuBai`, `chuDoiVuot`; không có `LY_DO_TOI_THIEU`, `'Lý do bỏ'`, `'không trùng đợt khác'`.
- [x] **Step 3:** Viết. Giữ: neo cạnh chip / tấm đáy < 640px (`:199-225`), Esc, `onHienDien`, kiểm `/ke-hoach-test/dot/kiem` mỗi lần đổi tuần (`:94-123`), đợt mới xem trước qua `hang-loat` một em (gửi `kyNang` tick).
- [x] **Step 4:** `npm run check`. Bấm thử QL: Kế hoạch Test bấm ô MT3 (L R có điểm, W trễ chấm, S có lịch) → đúng mockup phần 2; mở ⋯ Speaking chưa tới tuần → 3 mục mờ có tooltip; hồ sơ HV › Lộ trình "Dời lịch" mở cùng hộp. 375: tấm đáy, ⋯ ≥ 44px. Ảnh.
- [x] **Step 5: Commit** `feat(mtb): hộp một đợt — tuần chung, ⋯ luôn hiện, mục mờ`.

### Task 6: Popup dời vượt ở mọi cổng dời (mockup phần 4)
Skill: test-driven-development · `/impeccable harden`

**Files:**
- Modify (vẽ lại, giữ tên file — MTa cũng sửa): `web/src/modules/test/keHoach/HopXacNhanHuyLich.tsx` (cả file, 29 dòng)
- Modify (cổng): `HopKyNang.tsx` (Task 5), `web/src/modules/fasttrack/HopThaoTacMt.tsx:5,67,130-140,200`, `web/src/modules/fasttrack/MockDetailPage.tsx:37,618-697` (`WeekModal` "Dời lịch thi cả đợt"), `NganXepLichMt.tsx` (Q2); hồ sơ HV › Lộ trình đi qua `HopKyNang` (`HangLichMt.tsx:121-125`, "+ Thêm MT" `StudentPlanPanel.tsx:183-187`)
- Add: `shared/domain/lichMt.ts` hàm `chuDoiVuot` (cạnh `cauSeHuyLich :152` và `dongHeQuaVuot` của MTa)
- Test: `prMtb.tests.ts`

**Interfaces:**
- Consumes A1 (`LuotSeHuyLich { soDiem, soCase }`, `dongHeQuaVuot`, `canLyDoVuot`), A2, A7 (`kiemLyDoThaoTac('huy-ket-qua', s)`).
```ts
// shared/domain/lichMt.ts
/** Mockup phần 4. `canPopup = canLyDoVuot(ds)` (T2: lượt bị vượt chưa có điểm → không popup, chỉ chip vàng). */
export function chuDoiVuot(i: { nhan: string; tuanMoi: string; ds: readonly LuotSeHuyLich[] }, homNay?: string | null):
  { canPopup: boolean; tieuDe: string; cau: string; dong: string[]; chip: string };
// tieuDe 'Dời MT1 sang W2 NOV?' · cau 'MT1 muộn hơn MT2, MT3.' · dong = ds.map(dongHeQuaVuot) · chip 'Bỏ lịch MT2, MT3'
```
```tsx
// HopXacNhanHuyLich.tsx — ConfirmDialog (Drawer.tsx) danger, z-[80]; chữ đúng mockup phần 4
export function HopXacNhanHuyLich(p: { tieuDe: string; cau: string; dong: string[]; busy: boolean; loiMay?: string | null;
  onDong: () => void; onXacNhan: (lyDo: string) => void }): JSX.Element;
// Thân: <p>{cau}</p> + <ul>{dong}</ul> + ô "Lý do" (textarea, bắt buộc: kiemLyDoThaoTac('huy-ket-qua', lyDo)); nút trái "Đóng",
// nút đỏ "Dời và huỷ" mờ khi thiếu lý do (title = câu lỗi). `loiMay` dưới ô Lý do; chữ đã gõ giữ khi lỗi / khi 409 mở lại.
```
Mỗi cổng: `chuDoiVuot(...).canPopup` → mở hộp; xác nhận → gửi lại `xacNhanHuyLich: true` + lý do (trường theo A2, đề xuất `reason`). Không `canPopup` mà có `seHuyLich` → chip vàng `chip` (title `cauSeHuyLich`), lưu thẳng `xacNhanHuyLich: true`. 409 có `details.seHuyLich` → mở lại với danh sách mới (giữ `HopKyNang.tsx:191-193`, `MockDetailPage.tsx:656-658`).

- [x] **Step 1: Phép đỏ (luật thuần)** `chuDoiVuot`: ví dụ mockup phần 4 (MT1 → W2 NOV; MT2 `soDiem 4, soCase 1`; MT3 `soDiem 0`) → `tieuDe 'Dời MT1 sang W2 NOV?'`, `cau 'MT1 muộn hơn MT2, MT3.'`, `dong ['MT2: huỷ 4 điểm, đóng 1 Case','MT3: bỏ lịch']`, `canPopup true`; chỉ MT3 → `canPopup false`, `chip 'Bỏ lịch MT3'`.
- [x] **Step 2: Phép đỏ (DB, khoá tên trường web dùng)**: QL dời MT1 qua MT2 có điểm ở **mỗi** cổng — `POST /ke-hoach-test/dot`, `/attempts/:id/week`, `/attempts/:id/skills/:skill/week`, `/ke-hoach-test/hang-loat` (A3) — không xác nhận → 409, `details.seHuyLich[0].soDiem === 4`; xác nhận thiếu lý do → 400; đủ → 200. Phép hành vi đầy đủ là của MTa; ở đây chỉ assert tên trường và mã lỗi.
- [x] **Step 3: Phép đỏ quét nguồn**: `HopXacNhanHuyLich.tsx` có `'Dời và huỷ'`, `'Lý do'`, `'Đóng'`, `kiemLyDoThaoTac`, không còn `'Huỷ lịch và lưu'`, `'Quay lại'`; 4 cổng có `chuDoiVuot`.
- [x] **Step 4:** Vẽ lại + nối 4 cổng. Toast sau lưu: `Đã lưu lịch · huỷ kết quả MT2` / `· bỏ lịch MT3`.
- [x] **Step 5:** `npm run check`. Bấm thử QL ở 4 cổng; giả 409 giữa chừng (tab 2 nhập thêm điểm MT2, tab 1 bấm "Dời và huỷ") → hộp mở lại số mới, Lý do còn nguyên. Ảnh.
- [x] **Step 6: Commit** `feat(mtb): popup dời vượt ở mọi cổng dời`.

### Task 7: Lý do tuỳ chọn (T7) + tuần đã qua cho QL (T4) ở web
Skill: test-driven-development · `/impeccable harden`

**Files:**
- `web/src/modules/fasttrack/HopThaoTacMt.tsx:72-81,186-197` — `batBuoc = canLyDo(t)` (chữ ký mới, chỉ `huy-diem`); kiểm tuần đã qua `:81` chỉ khi **không** QL (prop mới `quanLy: boolean`; nơi gọi truyền `d.viewer.canPlanWeek` ở hồ sơ Mock, `true` từ `HopKyNang`); QL + tuần đã qua → chip "Tuần đã qua"
- `MockDetailPage.tsx`: `WeekModal :620-624,673-691` (lý do tuỳ chọn; `toiThieu` = `canPlanWeek ? undefined : tuanNay`; bỏ `SectionNote :687-691` — câu chuyển vào `title`), `DeadlineModal :709,744` tuỳ chọn, `CancelDialog :760` (huỷ lượt) **bắt buộc** `kiemLyDoThaoTac('huy-luot', …)`, `TraLoiDeNghiModal :921` từ chối **bắt buộc** `'tu-choi'`, đồng ý tuỳ chọn, `AbsenceMoveModal :807` tuỳ chọn
- `HangLichMt.tsx:133-166` "Huỷ lịch" (`bo-tuan`) tuỳ chọn
- `ScoreEntry.tsx`: `InlineScoreEditor :657-663`, `SuaDiemCoLyDo :786-788` — lý do sửa điểm **tuỳ chọn** (ô vẫn hiện, không chặn Lưu); xoá trắng ô đã có điểm = huỷ điểm → **bắt buộc** (MTa: "huỷ điểm gồm xoá trắng một ô đã có điểm"); tooltip `RawScoreInput :394` / `CriteriaButton` bỏ "sửa thì phải ghi lý do"
- Test: `prMtb.tests.ts`

**Interfaces:** Consumes A7, A4 (`kiemTuanXep(...).quaTuan` cho chip vàng — web gọi với `quanLy: true`). Ô tuỳ chọn: `Truong tuyChon` (đã có), bỏ `dem`.

- [ ] **Step 1: Phép đỏ quét nguồn**: `web/src` không còn `LY_DO_TOI_THIEU`, `kiemLyDo(` (trừ `DeXuatSuaPanel.tsx` — hằng riêng 15 ký tự, ngoài phạm vi), không còn `dem={{ co: lyDo` / `dem={{ co: reason` ở ô tuỳ chọn; `HopThaoTacMt.tsx` chỉ chặn tuần đã qua trong nhánh `!quanLy`.
- [ ] **Step 2: Phép đỏ (DB, khoá A7/A4)**: GVCN báo vắng không lý do → 200; QL dời hạn không lý do → 200; QL huỷ điểm không lý do → 400; GVCN `/attempts/:id/skills/:skill/week` tuần đã qua → 400; QL cùng tuần (MT chưa thi) → 200.
- [ ] **Step 3:** Sửa các file trên.
- [ ] **Step 4:** `npm run check`. Bấm thử: GVCN (7) hồ sơ Mock "Báo vắng" không lý do lưu được; QL "Dời lịch thi cả đợt" chọn tuần đã qua → chip "Tuần đã qua", lưu được; GVCN không lùi được qua tuần này. Ảnh.
- [ ] **Step 5: Commit** `feat(mtb): lý do tuỳ chọn trừ 4 chỗ bắt buộc; QL xếp tuần đã qua`.

### Task 8: Nhập band (T10) · Xin dời / Không mock lại (T3) · Khôi phục kết quả (T2)
Skill: test-driven-development · `/impeccable clarify`

**Files:**
- `shared/domain/chamDiem.ts`: nhận `rawPatchFrom`, `criteriaPatchFrom` (chuyển từ `ScoreEntry.tsx:99-129` để phép kiểm gọi được; `ScoreEntry.tsx` re-export cho nơi gọi cũ)
- `web/src/modules/fasttrack/ScoreEntry.tsx`: `SavePatch :57` thêm `band?: number | null`; `LOI_SO_CAU :98`, `RawScoreInput :306-438` (`shown` hiện `fmtBand(band)` khi không raw, `inputMode="decimal"`, ô chỉ đọc `:372` hiện band), `CriteriaModal :537-635`, sửa tiêu chí `:501-535`, `InlineScoreEditor :641-727` (ô "Band" sau 4 tiêu chí)
- `MockDetailPage.tsx` `SkillWorkTable :432-530` (nút chính `xin-doi` / `khoi-phuc`, menu QL `khong-mock-lai` theo `thaoTacKyNang('huy-vang')`); menu đầu trang `:171-190` thêm mục QL "Khôi phục kết quả" khi `d.ketQuaHuy` (A6b)
- `HopThaoTacMt.tsx`: `THAO_TAC_CO_HOP :15` thêm `'xin-doi'`, `'khong-mock-lai'`; `goi :87-127` hai nhánh (`/xin-doi`, `/khong-mock-lai`, lý do tuỳ chọn, không ô tuần); toast `bao-vang` lần 2 → `{S} huỷ`; `cauHeQua :28-30` bỏ vế "từ lần 2 Quản lý duyệt" (sai luật mới)
- `HangLichMt.tsx`: `luot.ketQuaHuy` → mục ⋯ QL "Khôi phục kết quả" (`ConfirmDialog`, lý do tuỳ chọn)
- Test: `prMtb.tests.ts`

**Interfaces:**
- Consumes A8 (`docONhapLR`, `kiemBand`, `band` ở PUT), A6, A6b.
- `rawPatchFrom(text, cell)`: `'-'` / `''` như cũ; còn lại `docONhapLR` → `{ raw }` → `{ rawScore }`; `{ band }` → `{ band }`; `{ loi }` / null → `null` (không gửi, tooltip = `loi`).
- `criteriaPatchFrom(vals, cell, bandText = '')`: `bandText` trống → như cũ; có, `kiemBand` hợp lệ **và** 4 tiêu chí trống → `{ band }`, `preview = band`; band **và** tiêu chí cùng có giá trị → `patch: null`, lỗi "Điền band hoặc tiêu chí" (MTa trả 400 trường hợp này).
- Ô "Band" (`w-14`, `inputMode="decimal"`, nhãn `Band`) ở `InlineScoreEditor`, `CriteriaModal`, sửa tiêu chí. `LOI_SO_CAU` / `LOI_TIEU_CHI` (tooltip) thêm "hoặc band 6.5 / b6".
- Chữ ngoài mockup (≤ 3 từ, ghi vào PR): "Không mock lại" (= chữ của MTa), "Khôi phục kết quả". "Xin dời" đúng mockup phần 3.

- [ ] **Step 1: Phép đỏ (luật thuần)**: `rawPatchFrom('6.5', cell)` → `{ band: 6.5 }`; `'b6'` → `{ band: 6 }`; `'32'` → `{ rawScore: 32 }`; `'b6.3'`, `'10.5'`, `'6,5'` → `null`; `criteriaPatchFrom(['','','',''], cell, '6.5')` → `patch.band === 6.5 && preview === 6.5`; `criteriaPatchFrom(['6','6','',''], cell, '6.5')` → `patch === null`.
- [ ] **Step 2: Phép đỏ (DB, khoá tên A6/A6b/A8)**: GVBM L `PUT … { band: 6.5 }` → `band 6.5`, `raw_score` null; GVCN `xin-doi` kỹ năng `huyVang` → một `skill_move_requests` `pending`; GVBM gọi `xin-doi` → 403; `GET /attempts/:id` của lượt bị vượt có `ketQuaHuy`.
- [ ] **Step 3: Phép đỏ quét nguồn**: `ScoreEntry.tsx` có `'Band'` ở 3 hộp tiêu chí; `HopThaoTacMt.tsx` có `'xin-doi'`, `'khong-mock-lai'`; `MockDetailPage.tsx` có `'Khôi phục kết quả'`; không còn `'từ lần 2 Quản lý duyệt'`.
- [ ] **Step 4:** Sửa. Lưới `LuoiFT.tsx:275,305`, `MotKyNang.tsx:198-200`, `ODiemLon.tsx:186` thừa hưởng (không sửa).
- [ ] **Step 5:** `npm run check`. Bấm thử GVBM (9): L gõ `6.5` → ô hiện `6.5`; W1 chỉ điền Band → lưu. GVCN (7): kỹ năng `S huỷ` → "Xin dời" → thẻ ở Chờ duyệt của QL. QL (2): "Không mock lại" → đợt thành `✓ 3/4`; MT bị vượt → "Khôi phục kết quả". Ảnh.
- [ ] **Step 6: Commit** `feat(mtb): nhập band, Xin dời / Không mock lại, Khôi phục kết quả`.

### Task 9: Lưới Kế hoạch Test FT dùng Ô MT (theo Q1 — mặc định A)
Skill: test-driven-development · `/impeccable layout` · `adapt`

**Files:** Modify `web/src/modules/test/keHoach/LuoiKeHoach.tsx:196,246-256` (FT: ô = `OMt` + `onClick` mở `HopKyNang` với `kyNangDau: null`; ô `chuaToiLuot` = `chua-co-dot` không bấm, title "Xếp MT trước rồi mới tới MT{n}"; ô trống tới lượt = `chua-co-dot` bấm được), `rongDot` FT 176 → 120. `ChipKyNang.tsx` chỉ còn nhánh lớp thường (xoá nhánh FT `:31-41`, `lichSu`, `dangDo` nếu không còn ai dùng). Test: quét nguồn.

- [ ] **Step 1: Phép đỏ quét nguồn**: `LuoiKeHoach.tsx` có `<OMt` cho `loai === 'ft'`; `ChipKyNang` không còn chữ `'+ xếp'`.
- [ ] **Step 2:** Sửa. Q1 = B → bỏ Task này, chỉ thay `ChipLichSu` (Task 2 đã làm).
- [ ] **Step 3:** `npm run check`. Bấm thử QL 1440/375: lớp FT 6 đợt, cuộn ngang tới đợt đang tới (giữ `:202-206`), ô "Đang thi" khác hẳn "Có lịch". Ảnh. **Commit** `feat(mtb): lưới Kế hoạch Test FT dùng Ô MT`.

### Task 10: Rà toàn bộ, tài liệu, PR
- [ ] Rà mọi nơi hiện trạng thái MT (`grep -rn "MT\${" web/src`): đã dùng `OMt` ở panel, hộp (tiêu đề giữ chữ), Kế hoạch Test FT, Lộ trình, đầu trang hồ sơ Mock. **Không** đổi (chỉ là chữ MT trong câu/số liệu, không phải ô trạng thái): `HanhTrinh.tsx:480`, `Highlights.tsx:56`, `LuoiFT.tsx:248`, `MotKyNang.tsx:185`, `StudentManagePanel.tsx:280`, `cases/*`, `yThuc/*`; `IeltsAttempts` (`StudentDetailPage.tsx:458`) giữ liên kết `MT{n}` + `NhanDot` (cột Kết quả đã nói trạng thái) — ghi danh sách vào mô tả PR.
- [ ] `CODE_MAP.md`: thêm 4 file mới, gỡ `HopXacNhanHuyLich.tsx`. `plan.md` mục 11 một dòng; `[x]` trong file này.
- [ ] `npm run check` (một lần). Bấm thử 375/1440 sáng/tối, vai Quản trị (1), QL (2), GVCN (7), GVBM (9): panel · hộp (Kế hoạch Test + Lộ trình) · popup ở 4 cổng · hồ sơ Mock (Xin dời, lý do tuỳ chọn) · Nhập điểm band. Ảnh thật vào PR.
- [ ] `/impeccable audit` các màn trên → sửa lỗi P0/P1 trong phạm vi.
- [ ] `/ponytail-review`; `superpowers:requesting-code-review`; `superpowers:finishing-a-development-branch` (PR vào `main`, không merge). Mô tả PR: từng mục (panel, hộp, Ô MT, popup, T7, T4, T10, T3, "cũ"), câu trả lời Q1–Q3 đã dùng, 12 tự quyết, chữ ngoài mockup đã thêm ("Tuần đã qua", "Bỏ lịch MT2", "Lịch riêng ▾", toast), phép kiểm cũ đã sửa theo T13b, chú thích `ponytail:`, ảnh sổ tay `docs/so-tay/` bị lệch (panel Xếp lịch MT, hộp kỹ năng, hồ sơ Mock).

## Nghiệm thu
- Panel, hộp, Ô MT, popup **đúng chữ mockup bản 4**; không câu giải thích dưới nút/ô.
- Ô MT: 13 trạng thái phần 3 (trừ MT0) phân biệt được khi chuyển ảnh sang xám (có chữ); "Đang chọn" khác hẳn "Đang thi".
- Dời vượt MT có điểm ở 4 cổng đều qua popup có Lý do bắt buộc; không điểm → không popup, chip vàng.
- Lý do bắt buộc chỉ 4 chỗ T7; QL xếp được tuần đã qua, GVCN/GV không.
- L/R nhận band `6.5`/`b6`; W/S có ô Band.
- `npm run check` xanh; `prMtb.tests.ts` gọi cuối `run.ts`.
