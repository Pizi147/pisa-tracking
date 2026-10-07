# PR-LC · Luồng cuối khoá lớp thường → lộ trình tiếp (mỗi quyết định nhập MỘT lần) — Kế hoạch (07/10)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (hoặc superpowers:executing-plans). Bước dùng `- [ ]`.

**Nguồn:** chủ sản phẩm 07/10 sau deploy: "những công việc chuyển giao lên lộ trình cần xem lại kỹ, hình như có các thao tác trùng nhau";
thấy Công việc còn "Chốt lên FT · CP FOU 23" quá hạn dù đã ghi Lộ trình tiếp theo và lớp đang "Bàn giao · GVCN đang bàn giao 0/11".
**Luật chủ sản phẩm nhắc lại 07/10:** em **Lên FT** → điểm đầu vào lộ trình FT mới = **MT0** (MT0 tự xếp); **Target giữ như đã ghi ban đầu**;
**không phải bấm từng học sinh**.
**Liên quan:** nhánh `fix-chot-len-ft` (agent khác, đang làm) sửa riêng phần ĐẾM của việc "Chốt lên FT" (`mt0.ts` `tinhLopChoChotLenFt`: em có lệnh
= đã có hướng; lớp có lệnh Cuối khoá = xong). PR-LC **không** sửa lại câu đếm đó; chạy SAU khi nhánh đó merge.
**Khảo sát:** đọc mã `origin/main` 09223024 + bấm thử thật (seed, API :4400, Vite :5400, Playwright `chrome`, QL id 2, GVCN id 7) trên lớp
`MB FOU 12` (7 em, ngày demo 14/09 = tuần Final): 4 em Lên FT, 1 Lên BE→QL đổi Lên FT, 1 Học lại, 1 Chưa quyết→QL cho Lên BE. Ảnh: `thiet-ke/anh/luong-chuyen-2026-10-07/`.

## 1. Luồng hiện tại (đúng mã main)

| # | Bước | Ai · ở đâu (TRANG › PHẦN) | Máy chủ ghi gì (file:dòng) | Tự sinh / tự xong |
|---|---|---|---|---|
| 1 | Lộ trình tiếp theo **một em** (hướng, lớp dự kiến, Target, tháng thi, ghi chú, ngày xem lại) | GVCN/QL · Học viên & Lớp › hồ sơ lớp › ⋯ dòng em › Lộ trình tiếp theo; hoặc hồ sơ HV › Kết luận khoá › Lộ trình tiếp theo | `lo_trinh_tiep_theo` upsert — `loTrinhTiep.ts:143-168` (`ghiCacDong`) | Lên FT (FOU/BE/ELE) → **MT0 tự tạo** tuần Final, Target = Target ghi ?? Target khoá (`mt0.ts:28-126`). Rời Lên FT → MT0 chưa điểm huỷ |
| 2 | Lộ trình tiếp theo **cả lớp** (chỉ hướng + ghi chú) | GVCN/QL · hồ sơ lớp › ⋮ › Ghi lộ trình tiếp theo cả lớp (`LoTrinhTiepCaLopPanel.tsx:32`) | như 1, giữ chi tiết cũ nếu hướng không đổi — `loTrinhTiep.ts:252-259` | như 1. **Không có ô lớp dự kiến, Target** |
| 3 | "Dự kiến lên FT" | = hướng Lên FT ở 1/2 (T5b) | — | MT0 ở Kế hoạch Test, Lịch Test, Nhập điểm tuần Final |
| 4 | Việc QL **"Chốt lên FT · lớp"** | QL · Công việc › Hỗ trợ học viên › Vận hành; Tổng quan › Cần xử lý. Nút "Ghi lộ trình" mở bảng 2 | `mt0.ts:240-270` đếm em `lo_trinh_tiep_theo` trống/Chưa quyết; `mywork.ts:586-595` | Hiện từ 13 ngày trước hạn (CN trước tuần Final) **tới hết tuần Final**; tự xong khi mọi em có hướng **ở bảng LTT** (lệnh chuyển không tính — lỗi, `fix-chot-len-ft`) |
| 5 | Final Test + MT0 chấm | GV · Test › Lịch Test / Nhập điểm tuần Final | `assessment_scores` | % Cuối khoá → "Hệ thống gợi ý" (`cuoiKhoa.ts:112`); MT0 hạn CN tuần sau |
| 6 | Việc QL **"Chuyển tiếp lớp · lớp · n HV"** | QL · Công việc › Vận hành (cùng chỗ 4) | `lenhChuyen.ts:637-653` (`lopChoLenhChuyen`), `mywork.ts:568-584` | Từ tuần Final; tự xong khi mọi em có **lệnh** |
| 7 | **Chuyển tiếp lớp** (ra lệnh: hướng, lớp chuyển đến, tuần, **Target** cho Lên FT, lý do nếu khác gợi ý) | QL · hồ sơ lớp › nút "Chuyển tiếp lớp…" (`TransitionPanel.tsx`) | `lenh_chuyen_lop` — `lenhChuyen.ts:68-205` (`raLenh`). **Không** ghi `lo_trinh_tiep_theo`, **không** gọi `dongBoMt0` | Điền sẵn từ LTT CHỈ khi có lớp dự kiến + Target (`TransitionPanel.tsx:96-102`) |
| 8 | Tạo lớp FT mới | QL · trong 7 › "+ Mở lớp mới" (điền sẵn FT LT1, số kế) | `transition.ts:148-154` → panel Tạo lớp | — |
| 9 | Bàn giao | GVBM (2 ngày) + GVCN (3 ngày) · Công việc › Bàn giao; hồ sơ lớp dải "Bàn giao · GVCN đang bàn giao 0/n" | `banGiao.ts`, `ban_giao_mon` | Việc tự sinh khi ra lệnh; quá hạn báo QL; không chặn chuyển |
| 10 | Thi hành lệnh đúng Thứ Hai | máy (cron + quét khi đọc) | `lenhChuyen.ts:420-465` → `thiHanhCuoiKhoa:540` → `applyTransition` (`transition.ts:225-387`) → `apDungCaLop` (`luatLoTrinh.ts:448-575`) | Đóng khoá cũ, mở khoá mới, MT lịch mặc định, **MT0 nối làm đầu vào** (`mt0.ts:146-186`, `luatLoTrinh.ts:571`), bản chụp PR-TK (`:573`), lớp cũ tự kết thúc khi hết em (`dongLopNeuHet`) |
| 11 | Kết thúc học (hướng Dừng học hẳn) | như 7 | `setStudentStatus(..., 'finished')` `transition.ts:330` | bản chụp TK |
| 12 | Kỳ vọng đầu ra (BE/ELE lên FT) | QL · Công việc (một dòng **mỗi em**) › hồ sơ HV › Kết luận khoá › Đạt/Không đạt | `cuoiKhoa.ts:505-566` (`ghiKetLuanFt`), `mywork.ts:1137-1157` | Không đạt + Trung tâm → Case Tutor FT |
| 13 | Tổng kết lộ trình (PR-TK) | hồ sơ HV › Các lộ trình; hồ sơ lớp đã kết thúc › Tổng kết | `banChup.ts` (tự), `thiThat.ts` (GVCN nhập kết quả thi thật) | bản chụp tự; "Cập nhật kết quả thi thật" tự sinh cho FT |
| 14 | Học lại (PR-LUI-b) | QL · hồ sơ HV đã kết thúc / Lưu trữ › Học lại | `students.ts:370` (`hocLai`) | Khác nghĩa với **hướng** "Học lại" ở 1/7 (học lại chương trình) — trùng tên |

## 2. Vấn đề (đã bấm thử, trừ chỗ ghi "đọc mã")

### Trùng — cùng một quyết định nhập 2+ nơi
- **T1 · Hướng nhập hai lần.** GVCN ghi hướng ở LTT (bảng cả lớp), QL lại chọn hướng từng em ở Chuyển tiếp lớp. Bấm thử: 7/7 em
  "Chưa chọn · GVCN đề xuất: Lên FT" (ảnh `02`). Lý do: điền sẵn đòi `lopDuKienId` + Target (`TransitionPanel.tsx:99-101`), mà bảng cả lớp
  không có hai ô đó → chỉ em ghi bằng panel một em mới được điền (ảnh `05`: 1/7). Hướng lưu ở **hai bảng** (`lo_trinh_tiep_theo`,
  `lenh_chuyen_lop`) không đồng bộ.
- **T2 · Target nhập lại.** Lên FT ở Chuyển tiếp bắt Target (`chuyenLop.ts:80` "Ghi Target (hoặc KCK)") dù khoá lớp thường đã có Target
  (PR-NT) và MT0 đã mang Target đó. Máy chủ thường→FT không giữ Target (`luatLoTrinh.ts:213-223` `giuTarget` sai cho thường→FT; `:537`).
  Ô Target hiện chữ mờ **"6.0" là placeholder** (`TransitionPanel.tsx:485`) — trông như đã điền, bấm Tiếp tục mới báo lỗi (ảnh `03`). Gõ 4 lần cho 4 em.
- **T3 · Hai việc QL cho một quyết định, cùng lúc.** Trong tuần Final QL thấy cả "Chốt lên FT · MB FOU 12" (quá hạn, đỏ) **và**
  "Chuyển tiếp lớp · MB FOU 12 · 7 HV" (Cần làm, chưa có hạn) — ảnh `04`. Hạn khác nhau cho cùng một việc.
- **T4 · QL làm việc của GVCN.** Nút "Ghi lộ trình" của việc Chốt lên FT mở bảng LTT cả lớp → QL ghi hướng một lần ở đó, rồi lại ghi ở Chuyển tiếp.

### Sai luật / lỗi
- **L1 · Lên FT chỉ quyết ở Chuyển tiếp → KHÔNG có MT0.** Bấm thử em Dương Ngọc Ánh (GVCN ghi Lên BE, QL ra lệnh Lên FT): không MT0,
  lộ trình FT mở ra `baseline_attempt_id = NULL`, lượt bắt đầu MT1. Vì `raLenh` không gọi `dongBoMt0` (`lenhChuyen.ts:68-205`). **Trái luật Lên FT → MT0.**
- **L2 · Target không "giữ như ghi ban đầu".** Như T2: máy lấy số QL gõ ở lệnh; QL gõ khác thì Target ban đầu mất, MT0 vẫn mang
  `target_at_attempt` cũ (chip SOS MT0 so Target khác lộ trình FT).
- **L3 · Thi hành lệnh xoá ghi chú GVCN.** `applyTransition` upsert `lo_trinh_tiep_theo` với `ghi_chu = luuY` (null) và `muc_tieu` của lệnh
  (`transition.ts:337-359`). Bấm thử: ghi chú "GVCN: mạnh Speaking" → `NULL` sau 21/09. Mất dữ liệu (không có bản trong `audit_logs`).
- **L4 · "Chốt lên FT" không tự xong khi đã có lệnh** (lỗi chủ sản phẩm thấy; seed: MB FOU 22, 23 đã có lệnh vẫn "quá hạn 1 ngày").
  → **nhánh `fix-chot-len-ft` đang sửa**, không làm ở đây. Ghi thêm cho nhánh đó: em LTT "Chưa quyết" mà lệnh hướng khác vẫn bị đếm (bấm thử: còn 1 em sau khi ra lệnh đủ 7).
- **L5 · Hai hướng nói hai điều** (đọc mã): lệnh Học lại mà LTT vẫn Lên FT → MT0 "chờ" tới Thứ Hai thi hành mới huỷ; Lịch Test/Nhập điểm vẫn
  bày MT0 cho GV chấm một bài sẽ bỏ.

### Bấm từng em
- **B1** Target từng em (T2). **B2** Lớp chuyển đến: thanh "Áp cho n em" có, nhưng em không điền sẵn phải tick lại từng em.
- **B3 · Kỳ vọng đầu ra BE/ELE**: một việc + một lần mở hồ sơ **mỗi em** (`mywork.ts:1137-1157`) — chưa đổi ở PR này (câu hỏi Q3).

### Đếm thao tác (lớp 7 em, 4 Lên FT — bấm thử)
| | GVCN | QL | Trong đó nhập lặp |
|---|---|---|---|
| Hiện tại (bảng cả lớp + Chuyển tiếp) | mở ⋮ + 7 chọn + Lưu = **9** | mở 1 + chọn hướng 7 + lớp 3 nhóm/7 em + Target 4 + Tiếp tục + Gửi ≈ **18–20** | **11** (7 hướng + 4 Target) |
| Hiện tại (panel một em để được điền sẵn) | ~6 × 7 = **~42** | ~6 | 0 |
| Đề xuất | **9** (như nay) | mở 1 + lớp theo nhóm hướng 3 + Tiếp tục + Gửi = **6** | **0** |

## 3. Luồng đề xuất (mỗi quyết định nhập MỘT lần)

1. **Hướng** chỉ có MỘT nguồn trước khi thi hành: `lo_trinh_tiep_theo`. GVCN (hoặc QL) ghi ở LTT một em / cả lớp như nay.
   Ra lệnh ở Chuyển tiếp với hướng khác ⇒ máy **ghi ngược** LTT cùng giao dịch (không mất ghi chú, lớp dự kiến) + `dongBoMt0` ⇒ Lên FT ở đâu cũng có MT0, rời Lên FT thì MT0 chưa điểm huỷ ngay.
2. **Target**: Lên FT không hỏi lại. Thứ tự lấy: Target ghi ở LTT → Target khoá lớp thường (kể cả KCK) → chỉ khi cả hai trống mới hỏi (một ô, đúng em đó).
   Máy chủ áp cùng thứ tự khi lệnh không gửi `mucTieu` (web cũ, API). Sửa Target ở Chuyển tiếp vẫn được (QL), sửa thì MT0 chưa điểm theo Target mới.
3. **Điểm đầu vào FT = MT0** (đã đúng khi có MT0; L1 hết nhờ bước 1).
4. **Chuyển tiếp lớp điền sẵn hướng + Target từ LTT** dù chưa có lớp dự kiến; QL chỉ chọn **lớp chuyển đến theo nhóm hướng** ("Lên FT · 4 em → [MB FT 103]") rồi Gửi.
   Em Chưa quyết / không có LTT để trống như nay.
5. **Một việc QL mỗi lớp mỗi lúc**: trước tuần Final "Chốt lên FT · lớp" (hạn CN trước Final); từ tuần Final chỉ "Chuyển tiếp lớp · lớp · n HV".
   Việc Chốt lên FT không hiện cùng lúc với Chuyển tiếp lớp của cùng lớp (đếm đúng là việc của `fix-chot-len-ft`).
6. **Thi hành** không ghi đè chi tiết LTT bằng null (chỉ đặt `da_ap_dung_luc`, hướng thật, Target thật).
7. Không đổi: Bàn giao, thi hành Thứ Hai, Tạo lớp FT, bản chụp TK, Kết thúc học, Học lại (LUI-b).

## 4. Thay đổi — chia 2 PR

### PR-LCa · máy chủ (M) — chạy sau `fix-chot-len-ft` merge. Không giao diện.
- [ ] **LCa-0 (đỏ trước)** `server/src/tests/prLc.tests.ts` (`runPrLcTests`, gọi cuối `run.ts`): dựng lớp FOU tuần Final 4 em, Target khoá 6.0.
  - (a) QL `raLenh` Lên FT cho em **không** có LTT → có MT0 `planned` tuần Final, `lo_trinh_tiep_theo.huong = 'fast_track'`. (đỏ: L1)
  - (b) `raLenh` Lên FT không `mucTieu`, khoá có Target 6.0 → ok, lệnh `muc_tieu = 6.0`; khoá KCK → `khong_cam_ket = 1`; không Target nào → lỗi "Ghi Target (hoặc KCK)". (đỏ: T2)
  - (c) LTT Target 6.5 (một em) → lệnh không gửi Target → 6.5. (đỏ)
  - (d) LTT Lên FT có MT0 → lệnh Học lại → MT0 chưa điểm `cancelled` ngay; lệnh huỷ / sửa lại Lên FT → MT0 mở lại (không dòng thứ hai). (đỏ: L5)
  - (e) LTT ghi chú "x", lớp dự kiến 23 → thi hành → ghi chú "x", lớp dự kiến còn nguyên; `da_ap_dung_luc` có. (đỏ: L3)
  - (f) Thi hành Lên FT → lộ trình FT `target_score` = Target lệnh, `baseline_source = 'mt0'`; MT0 `target_at_attempt` = Target lộ trình FT. (đỏ phần target_at_attempt khi QL sửa)
  - (g) `transitionPlan` trả `dienSan` cho em có LTT hướng chuyển lớp dù chưa lớp dự kiến: `{ huong, mucTieu (đã áp thứ tự), lopDichId|null }`. (đỏ)
  - (h) Tuần Final: `myWork` của QL có "Chuyển tiếp lớp · lớp" và **không** có "Chốt lên FT · lớp" cùng lớp. (đỏ: T3)
  - (i) Số câu SQL `raLenh` 30 em không tăng theo số em (trần `tocDoDuong.ts`).
- [ ] **LCa-1** `lenhChuyen.ts` `raLenh` (bối cảnh `cuoi-khoa`, lớp nguồn thường): sau `chenNhieuDong` lệnh, trong cùng `tx`, gọi một hàm mới
  `dongBoTuLenh(p, hang)` ở `loTrinhTiep.ts`: upsert `lo_trinh_tiep_theo` (huong, `lop_du_kien_id = lop_dich_id`, `muc_tieu`; **giữ** `ghi_chu`, `thang_thi`
  khi không gửi — `COALESCE(excluded.x, lo_trinh_tiep_theo.x)`), nhật ký Hành trình "QL quyết: …" chỉ khi hướng đổi, rồi `dongBoMt0`. Dùng lại `ghiCacDong`
  nếu được (một luật, theo lô) — không viết câu thứ hai. Huỷ lệnh (`huyLenh`, `huyNhieuLenh`): **không** đổi LTT (dự định GVCN vẫn đúng).
- [ ] **LCa-2** Target: hàm thuần `targetLenFt({ lt, khoa })` ở `shared/domain/chuyenLop.ts` (LTT → khoá → null, giữ KCK); `raLenh` dùng khi `mucTieu` trống
  và hướng Lên FT từ lớp thường, TRƯỚC `kiemDongLenh`. `kiemDongLenh` giữ nguyên (vẫn báo khi không có Target nào).
- [ ] **LCa-3** `transition.ts:337-359`: thôi ghi đè `ghi_chu`, `ly_do`, `ngay_xem_lai`, `muc_tieu` bằng null (`COALESCE`), chỉ đặt `huong`,
  `da_ap_dung_luc`, Target thật. Sau `noiMt0VaoFt`, `UPDATE assessment_attempts SET target_at_attempt = <target lộ trình FT>` cho MT0 vừa nối **chưa điểm** (một câu theo lô, `mt0.ts`).
- [ ] **LCa-4** `transitionPlan`: thêm `dienSan` mỗi em (hàm thuần `dienSanChuyenTiep(lt, khoa, candidates)`): hướng từ LTT, Target theo LCa-2,
  lớp chuyển đến = lớp dự kiến nếu hợp lệ, hoặc **lớp duy nhất** hợp lệ của hướng đó, còn lại null. Web cũ không đọc → vô hại.
- [ ] **LCa-5** `mt0.ts` `lopChoChotLenFt` (sau khi gộp `fix-chot-len-ft`): bỏ lớp đã tới tuần Final (`today >= finalWeekStart`) khỏi tập — từ tuần
  Final lớp chỉ có việc Chuyển tiếp lớp. Sửa `hint` `chot_len_ft` (`mywork.ts:211`) và mô tả chỉ số `lop-chua-chot-len-ft` (`shared/domain/metrics.ts:280`).
  **Hỏi planning nếu nhánh fix đã làm khác.**
- [ ] **LCa-6** Rulebook §20.6/§20.7 + `CODE_MAP.md` (dòng Lộ trình tiếp theo, Chuyển tiếp, MT0): "hướng một nguồn; Target lên FT giữ; Chốt lên FT trước tuần Final".
- [ ] Migrate `server/src/migrate/prLc.ts` (chạy lặp được, gọi cuối dãy): lệnh `cuoi-khoa` còn `cho` → đồng bộ LTT + `dongBoMt0` (xem mục 6).

### PR-LCb · giao diện (M) — **cần mockup** `thiet-ke/mockup-luong-chuyen-2026-10-xx.html` duyệt trước (375/1440, sáng/tối, đủ trạng thái). Sau LCa.
- [ ] **LCb-1** Chuyển tiếp lớp (`TransitionPanel.tsx`): dùng `dienSan` (bỏ `deXuatGvcn` tự suy ở web); dòng điền sẵn ghi "Theo Lộ trình tiếp theo"
  như nay; Target hiện **giá trị thật** (không placeholder "6.0" — `:485`), sửa được; ô Target chỉ đòi nhập khi không có Target nào.
- [ ] **LCb-2** Chọn lớp theo nhóm hướng: dưới thanh tuần chung, một hàng mỗi hướng có em ("Lên FT · 4 em [chọn lớp ▾]", "Lên BE · 1 em [▾]",
  "Học lại · 1 em [▾]"), chọn một lần áp mọi em nhóm đó chưa có lớp; từng em vẫn đổi được. Thay thao tác tick + "Áp cho n em" cho trường hợp thường gặp.
- [ ] **LCb-3** Bảng LTT cả lớp: cột Target **chỉ xem** (Target khoá / LTT) cạnh hướng Lên FT để GVCN thấy Target sẽ mang sang — không thêm ô nhập.
- [ ] **LCb-4** Chữ: việc Chốt lên FT "Ghi hướng trước Final"; Hành trình "QL quyết: Lên FT (GVCN: Lên BE)". Luật chữ ngắn, `TU_DIEN_VA_CHU.md`.
- Lệnh impeccable: `layout` (nhóm hướng), `clarify` (chữ), `harden` (em thiếu Target, lớp hết chỗ), `audit` trước PR. `/ponytail lite`.

## 5. Phép kiểm web (LCb, bấm thật)
Lớp FOU tuần Final, GVCN ghi bảng cả lớp 4 Lên FT + 1 Lên BE + 1 Học lại + 1 Chưa quyết; QL mở Chuyển tiếp: 6/7 em có hướng, 4 em Lên FT có Target
từ khoá, chọn lớp 3 lần, Gửi → lệnh đủ 6; Công việc QL chỉ còn "Chuyển tiếp lớp · … · 1 HV". Thi hành → 4 lộ trình FT `baseline = MT0`, Target = khoá.
Ảnh 375 + 1440, sáng + tối, vai QL (2), GVCN (7).

## 6. Rủi ro dữ liệu (lớp đang giữa chừng)
| Tình huống | Xử lý |
|---|---|
| Lệnh Cuối khoá còn `cho` (vd MB FOU 22/23 seed, CP FOU 23 bản chính) có em Lên FT mà không MT0 | Migrate `prLc`: đồng bộ LTT + `dongBoMt0` → MT0 tuần Final lớp nguồn (đã qua thì vẫn tuần Final — QL dời tới tuần 2 FT nếu cần; `kiemTuanMt0` cho phép). Chạy lặp: MT0 đã có không tạo lại (`UNIQUE cycle_id, attempt_no`) |
| Lệnh `cho` có hướng khác LTT | Migrate ghi LTT theo lệnh (lệnh là quyết định QL mới hơn); MT0 chưa điểm huỷ "Bỏ hướng Lên FT"; có điểm giữ ("không dùng") |
| Lệnh đã thi hành, lộ trình FT không có đầu vào (L1 cũ) | **Không** tự sửa (không biết MT0 có thật không). Liệt kê bằng câu kiểm trong `kiem-sau-init`/báo cáo PR; QL đặt điểm đầu vào tay ở hồ sơ HV |
| Ghi chú LTT đã mất ở lệnh đã thi hành (L3) | Không khôi phục được (không có bản lưu). Ghi trong mô tả PR |
| Lệnh `cho` thiếu Target (không có) | Không xảy ra: lệnh cũ đã bắt Target |
| Turso | Migrate theo lô (`theoLo`, ≤ 900 tham số), một giao dịch mỗi lớp; thử `npm run migrate` trên bản sao DB trước |

## 7. Câu hỏi chủ sản phẩm (đề xuất mặc định nếu không trả lời)
- **Q1.** QL chọn ở Chuyển tiếp lớp **khác** GVCN ghi (vd Lên BE → Lên FT): web tự sửa Lộ trình tiếp theo theo QL + tạo/huỷ MT0 ngay, Hành trình ghi
  "QL quyết". **Khuyến nghị: có** (bắt buộc để luật Lên FT → MT0 đúng mọi đường).
- **Q2.** Target khi Lên FT = Target GVCN ghi ở Lộ trình tiếp theo, không có thì Target khoá lớp thường (cả KCK); Chuyển tiếp chỉ hiện để sửa, chỉ hỏi
  em không có Target nào. **Khuyến nghị: đồng ý.**
- **Q3.** Kỳ vọng đầu ra BE/ELE (QL đánh dấu từng em): làm PR sau "Đánh dấu cả lớp một lần, web gợi ý Đạt/Không đạt theo band MT0 (BE 4.0, ELE 4.5)"?
  **Khuyến nghị: để sau PR-LC, cần mockup.**

## 8. Chồng file
`lenhChuyen.ts`, `loTrinhTiep.ts`, `transition.ts`, `mt0.ts`, `luatLoTrinh.ts`, `TransitionPanel.tsx`, `LoTrinhTiepCaLopPanel.tsx`, `mywork.ts`.
Chồng `fix-chot-len-ft` (`mt0.ts`, `run.ts`) → chạy sau. Chồng PR-EN (chữ `TransitionPanel`) → LCb trước EN-b hoặc gộp chữ vào từ điển EN.

## 9. PROMPT session code

**PR-LCa** — Model: **Opus 5.5 · XHigh** (B: **Opus 5.5 · High**) — cả hai chạy tiếp; Fable hoặc model khác thì dừng.
```
Làm PR-LCa theo docs/superpowers/plans/2026-10-07-pr-luong-chuyen-giao.md (mục 3, 4 PR-LCa, 6). Đọc CLAUDE.md, plan.md mục 1 và 9.0.
Điều kiện: nhánh fix-chot-len-ft đã merge vào main; chưa thì dừng, báo planning.
Worktree: git worktree add .claude/worktrees/pr-lca-luong-chuyen -b pr-lca-luong-chuyen origin/main (chỉ trong .claude/worktrees/).
Ponytail full (mặc định). Skill: superpowers:subagent-driven-development, superpowers:test-driven-development (LCa-0 đỏ trước, đúng
hành vi, không khớp chuỗi nguồn), superpowers:systematic-debugging khi lỗi lạ.
Luật: mọi ghi trong tx của thao tác gây ra; theo lô (theoLo, chenNhieuDong), số câu SQL không tăng theo số em; không DELETE lượt / điểm;
không bỏ kiểm dữ liệu nhập, quyền, chống mất dữ liệu; Target Lên FT: LTT → khoá → hỏi. Không gỡ cache câu lệnh db.ts (PR-BN).
Chạy thử: PORT=4400 WEB_PORT=5400 (cổng riêng), không preview_start, không taskkill hàng loạt, không chạm Turso/Netlify.
npm run check song song tối đa 3 lần trên máy; OOM / exit 127 thì chạy lại từng bước.
Trước PR: /ponytail-review, superpowers:verification-before-completion, superpowers:requesting-code-review; liệt kê chú thích ponytail:.
Mở PR vào main, KHÔNG merge; thêm một dòng plan.md mục 11. Commit kết "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>".
```

**PR-LCb** — Model: **Opus 5.5 · XHigh** (B: **Opus 5.5 · High**) — cả hai chạy tiếp; Fable hoặc model khác thì dừng.
```
Làm PR-LCb theo docs/superpowers/plans/2026-10-07-pr-luong-chuyen-giao.md (mục 4 PR-LCb, 5). Điều kiện: PR-LCa đã merge VÀ mockup
thiet-ke/mockup-luong-chuyen-2026-10-xx.html đã được chủ sản phẩm duyệt; chưa thì dừng (không tự chế giao diện).
Worktree: .claude/worktrees/pr-lcb-luong-chuyen từ origin/main. Gõ /ponytail lite đầu phiên.
impeccable: layout (nhóm hướng ở Chuyển tiếp lớp), clarify (chữ ngắn, TU_DIEN_VA_CHU), harden (em thiếu Target, lớp đầy), adapt (375);
audit trước khi mở PR. Không chạy init/document/hooks. Giữ phông Be Vietnam Pro, màu, bố cục; ô ngày = ONgay.
Bấm thử thật cổng riêng PORT=4400 WEB_PORT=5400, Playwright channel 'chrome', POST /api/demo/session {userId} 2 và 7; ảnh 375/1440 sáng/tối.
npm run check song song ≤ 3. /ponytail-review trước PR. PR vào main, KHÔNG merge; dòng plan.md mục 11; Co-Authored-By như trên.
```
